<script setup lang="ts">
import {ref,computed,onMounted,onUnmounted} from 'vue'
import UiIcon from './UiIcon.vue'
import {ApiError,type createApi} from './api'
import type {Locale} from './i18n'
import {businessTime,commandKey} from './deposit'
import {credentialText,type CredentialTextKey} from './credential-text'
import {validCredentialForm,uncertainLoginChange,loadCredentialContext,readCredentialDraft,credentialResult,credentialResultMatchesState,credentialOutcome,executeCredential,clearCredentialDraft,type CredentialDraft} from './credential-flow'
const props=defineProps<{service:ReturnType<typeof createApi>;locale:Locale;userUid:string;initialMode?:'login'|'pay'}>()
const emit=defineEmits<{back:[];support:[];unauthorized:[];loginChanged:[uncertain:boolean];paymentChanged:[]}>()
const w=(key:CredentialTextKey)=>credentialText(props.locale,key)
type Security={login_version:string;payment_version:string;payment_state:string;payment_reset_allowed?:boolean;payment_locked_until:string|null;payment_cooldown_until:string|null;server_time:string}
const mode=ref<'login'|'pay'>(props.initialMode??'login'),old=ref(''),password=ref(''),confirmation=ref(''),visible=ref<Record<string,boolean>>({}),busy=ref(false),storageBlocked=ref(false),loaded=ref(false),error=ref<CredentialTextKey|null>(null),success=ref(false),security=ref<Security>(),draft=ref<CredentialDraft|null>(null)
const storageKey='credential-command:'+props.userUid
let disposed=false
const isSetup=computed(()=>draft.value?draft.value.action==='payment.setup':(security.value?.payment_state==='never_set'||security.value?.payment_reset_allowed===true))
const paySupported=computed(()=>!storageBlocked.value&&(!!draft.value||(['ready','never_set'].includes(security.value?.payment_state??'')||security.value?.payment_reset_allowed===true)))
function clearFields(){old.value='';password.value='';confirmation.value='';visible.value={}}
function switchMode(target:'login'|'pay'){if(busy.value||target===mode.value)return;clearFields();mode.value=target;error.value=null;success.value=false}
function failure(e:unknown){if(e instanceof ApiError&&e.status===401){emit('unauthorized');return}const key=e instanceof Error?e.message:'';error.value=key==='storage'?'storage':key==='credential_invalid'?'oldInvalid':key==='payment_invalid'||key==='payment_locked'?key:key==='validation_failed'?'validation':['payment_changed','credential_changed','idempotency_conflict','operation_changed'].includes(key)?'changed':key==='payment_already_set'||key==='payment_setup_required'?'restricted':'error'}
async function readState(){const value=await props.service.request<Security>('/security/credentials');if(!disposed)security.value=value}
function persist(value:CredentialDraft){try{const raw=localStorage.getItem(storageKey),current=readCredentialDraft(raw,props.userUid);if(raw&&(!current||current.key!==value.key||current.action!==value.action))throw Error('storage');localStorage.setItem(storageKey,JSON.stringify(value));draft.value=value}catch{throw Error('storage')}}
function dropDraft(){if(!draft.value)return;try{if(localStorage.getItem(storageKey)!==null&&!clearCredentialDraft(localStorage,storageKey,draft.value))throw Error('storage');draft.value=null}catch{throw Error('storage')}}
async function finishPayment(result:unknown){success.value=false;error.value=null;clearFields();try{await readState();if(disposed)return;if(!security.value||!credentialResultMatchesState(result,security.value)){dropDraft();error.value='changed';return}dropDraft();success.value=true;emit('paymentChanged')}catch(e){if(!disposed)failure(e)}}
async function recover(){if(!draft.value)return;try{const result=await props.service.request<{status:string;retryable?:boolean;message_key?:string;result?:unknown}>('/business-results/'+draft.value.action+'/'+draft.value.key);if(disposed)return;const outcome=credentialOutcome(result);if(outcome==='success'){await finishPayment(result.result)}else if(outcome==='failed'){dropDraft();failure(new ApiError(result.message_key??'request_failed'));await readState()}else error.value='pending'}catch(e){if(disposed)return;if(e instanceof ApiError&&e.status===404)error.value='pending';else failure(e)}}
async function load(){if(busy.value)return;busy.value=true;error.value=null;try{const context=await loadCredentialContext({getItem:key=>localStorage.getItem(key)},storageKey,props.userUid,()=>props.service.request<Security>('/security/credentials'));if(disposed)return;security.value=context.security;draft.value=context.draft;storageBlocked.value=context.storageBlocked;loaded.value=true;if(context.storageBlocked)error.value='storage';if(draft.value)await recover()}catch(e){if(!disposed)failure(e)}finally{if(!disposed)busy.value=false}}
async function checkResult(){if(busy.value)return;busy.value=true;try{await recover()}finally{if(!disposed)busy.value=false}}
async function submit(){if(busy.value||!loaded.value||!security.value)return;error.value=null;success.value=false;const kind=mode.value==='login'?'login':isSetup.value?'setup':'payment';if(mode.value==='pay'&&!paySupported.value){error.value=storageBlocked.value?'storage':'restricted';return}if(!validCredentialForm(kind,old.value,password.value,confirmation.value)){error.value='validation';return}
 const body={...(kind==='setup'?{}:{old_password:old.value}),new_password:password.value,new_password_confirmation:confirmation.value},login=mode.value==='login';let sent=false
 busy.value=true
 try{const post=async()=>{sent=true;clearFields();return await props.service.request<Record<string,unknown>>('/security/'+(login?'login-password/change':kind==='setup'?'payment-password/set':'payment-password/change'),body,{'Idempotency-Key':login?commandKey():draft.value!.key})}
 const result=login?await post():await executeCredential({draft:draft.value??{uid:props.userUid,key:commandKey(),action:kind==='setup'?'payment.setup':'payment.change'},persist,active:()=>!disposed,post})
 if(disposed)return
 if(login){emit('loginChanged',!(result&&typeof result.credential_version==='string'&&/^[1-9][0-9]*$/.test(result.credential_version)&&result.requires_login===true));return}
 if(credentialResult(result))await finishPayment(result);else{error.value='pending';await recover()}
 }catch(e){if(disposed)return;if(login&&sent&&uncertainLoginChange(e instanceof ApiError?e.status:undefined,e instanceof ApiError?e.message:undefined)){emit('loginChanged',true);return}failure(e);if(!login&&draft.value&&!(e instanceof ApiError&&e.status===401))await recover();if(!disposed&&!login)try{await readState()}catch(e){failure(e)}}finally{if(!disposed)busy.value=false}}
onMounted(()=>load());onUnmounted(()=>{disposed=true;clearFields()})
</script>
<template><div class="reference-surface reference-password"><header class="fixed top-0 w-full z-50 pt-safe bg-surface/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]"><div class="h-14 px-gutter-sm flex items-center justify-between"><div class="flex items-center gap-space-xs"><button :aria-label="w('back')" :disabled="busy" @click="emit('back')" class="w-11 h-11 flex items-center justify-center rounded-xl text-on-surface hover:bg-surface-container transition-colors" type="button"><UiIcon :size="24" class="material-symbols-outlined text-[24px]" name="arrow_back_ios_new"></UiIcon></button><h1 class="font-headline-sm text-headline-sm text-on-surface truncate max-w-[200px]">{{w('title')}}</h1></div><div class="flex items-center gap-space-sm"></div></div></header><main class="relative w-full min-h-screen pt-14 pb-safe bg-surface"><div class="flex flex-col w-full">
<div class="px-gutter-sm pt-space-md pb-space-xl flex flex-col gap-space-lg">


<div class="bg-surface-container rounded-xl p-1 flex items-center shadow-sm">
<button :aria-pressed="mode==='login'" :class="mode==='login'?'bg-surface-container-lowest text-on-surface shadow-sm font-medium':'text-on-surface-variant'" :disabled="busy" @click="switchMode('login')" class="flex-1 py-2.5 rounded-xl font-body-md text-body-md text-center transition-all flex items-center justify-center gap-1.5" id="tab-login-btn" type="button">
<UiIcon :size="18" class="material-symbols-outlined text-[18px] text-primary" name="key" style="color: rgb(217, 119, 6);"></UiIcon>
<span class="">{{w('loginTab')}}</span>
</button>
<button :aria-pressed="mode==='pay'" :class="mode==='pay'?'bg-surface-container-lowest text-on-surface shadow-sm font-medium':'text-on-surface-variant'" :disabled="busy" @click="switchMode('pay')" class="flex-1 py-2.5 rounded-xl font-body-md text-body-md text-center transition-all flex items-center justify-center gap-1.5" id="tab-pay-btn" type="button">
<UiIcon :size="18" class="material-symbols-outlined text-[18px]" name="verified_user"></UiIcon>
<span class="">{{w('payTab')}}</span>
</button>
</div>

<div class="flex flex-col gap-space-md" id="pane-login" v-if="mode==='login'">

<div class="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col gap-space-md">

<div class="flex flex-col gap-1.5" id="login-old-pwd-field">
<div class="flex items-center justify-between">
<label class="font-body-sm text-body-sm text-on-surface-variant" for="login-old-pwd">{{w('oldLogin')}}</label>
<button class="font-body-sm text-body-sm text-primary flex items-center gap-0.5" type="button" v-if="false">
</button>
</div>
<div class="relative flex items-center" id="login-old-pwd-wrap">
<input :placeholder="w('loginHint')" :readonly="busy||!loaded" :type="visible['login-old-pwd']?'text':'password'" autocapitalize="none" autocomplete="current-password" class="w-full h-11 bg-surface-container-low rounded-xl px-3.5 pr-11 text-on-surface font-body-md text-body-md placeholder:text-outline outline-none transition-all" id="login-old-pwd" maxlength="16" spellcheck="false" v-model="old"/>
<button :aria-label="w(visible['login-old-pwd']?'hide':'show')" :aria-pressed="!!visible['login-old-pwd']" :disabled="busy" @click="visible['login-old-pwd']=!visible['login-old-pwd']" class="absolute right-3 text-outline hover:text-on-surface p-1 transition-colors" type="button">
<UiIcon :name="visible['login-old-pwd']?'eye':'eyeOff'" :size="20" class="material-symbols-outlined text-[20px]"></UiIcon>
</button>
</div>
<p class="font-body-sm text-body-sm text-error flex items-center gap-1 mt-0.5" id="login-old-pwd-err" v-if="error==='oldInvalid'">
<UiIcon :size="16" class="material-symbols-outlined text-[16px]" name="error"></UiIcon>
<span class="">{{w('oldInvalid')}}</span>
</p>
</div>

<div class="flex flex-col gap-1.5">
<label class="font-body-sm text-body-sm text-on-surface-variant" for="login-new-pwd">{{w('newLogin')}}</label>
<div class="relative flex items-center">
<input :placeholder="w('loginHint')" :readonly="busy||!loaded" :type="visible['login-new-pwd']?'text':'password'" autocapitalize="none" autocomplete="new-password" class="w-full h-11 bg-surface-container-low rounded-xl px-3.5 pr-11 text-on-surface font-body-md text-body-md placeholder:text-outline outline-none focus:bg-surface-container-lowest transition-all" id="login-new-pwd" maxlength="16" spellcheck="false" v-model="password"/>
<button :aria-label="w(visible['login-new-pwd']?'hide':'show')" :aria-pressed="!!visible['login-new-pwd']" :disabled="busy" @click="visible['login-new-pwd']=!visible['login-new-pwd']" class="absolute right-3 text-outline hover:text-on-surface p-1 transition-colors" type="button"><UiIcon :name="visible['login-new-pwd']?'eye':'eyeOff'" :size="20" class="material-symbols-outlined text-[20px]"></UiIcon></button>
</div>

</div>

<div class="flex flex-col gap-1.5">
<label class="font-body-sm text-body-sm text-on-surface-variant" for="login-confirm-pwd">{{w('confirmLogin')}}</label>
<div class="relative flex items-center">
<input :placeholder="w('loginHint')" :readonly="busy||!loaded" :type="visible['login-confirm-pwd']?'text':'password'" autocapitalize="none" autocomplete="new-password" class="w-full h-11 bg-surface-container-low rounded-xl px-3.5 pr-11 text-on-surface font-body-md text-body-md placeholder:text-outline outline-none focus:bg-surface-container-lowest transition-all" id="login-confirm-pwd" maxlength="16" spellcheck="false" v-model="confirmation"/>
<button :aria-label="w(visible['login-confirm-pwd']?'hide':'show')" :aria-pressed="!!visible['login-confirm-pwd']" :disabled="busy" @click="visible['login-confirm-pwd']=!visible['login-confirm-pwd']" class="absolute right-3 text-outline hover:text-on-surface p-1 transition-colors" type="button"><UiIcon :name="visible['login-confirm-pwd']?'eye':'eyeOff'" :size="20" class="material-symbols-outlined text-[20px]"></UiIcon></button>
</div>
</div>
</div>


<div class="bg-error-container text-on-error-container rounded-xl p-3 flex items-start gap-2.5 border border-error/20 shadow-sm transition-all" id="login-error-banner" role="alert" v-if="!!error&amp;&amp;mode==='login'">
<UiIcon :size="20" class="material-symbols-outlined text-[20px] text-error flex-shrink-0 mt-0.5" name="error"></UiIcon>
<div class="flex flex-col gap-0.5 flex-1">
<span class="font-body-md text-body-md font-medium text-error" id="login-error-title">{{error?w(error):''}}</span>
<span class="font-body-sm text-body-sm text-on-error-container/80" id="login-error-desc" v-if="false"></span>
</div>
</div><button :disabled="busy||!loaded" @click="submit" class="w-full h-12 bg-primary rounded-xl text-on-primary font-headline-sm text-headline-sm flex items-center justify-center gap-space-xs shadow-md active:opacity-90 transition-opacity" style="background-color: rgb(217, 119, 6);" type="button">
<UiIcon :size="20" class="material-symbols-outlined text-[20px]" name="check_circle"></UiIcon>
<span class="">{{w(busy?'loading':'submitLogin')}}</span>
</button>
</div>

<div class="flex flex-col gap-space-md" id="pane-pay" v-if="mode==='pay'"><p class="font-body-sm text-body-sm text-on-surface-variant" v-if="isSetup">{{w('setupHint')}}</p><p role="alert" v-if="!paySupported">{{w(storageBlocked?'storage':'restricted')}}</p>

<div class="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col gap-space-md">

<div class="flex flex-col gap-1.5" v-if="!isSetup">
<div class="flex items-center justify-between">
<label class="font-body-sm text-body-sm text-on-surface-variant" for="pay-old-pwd">{{w('oldPay')}}</label>
<span class="font-label-caps text-label-caps text-outline">{{w('pinLabel')}}</span>
</div>
<div class="relative flex items-center">
<input :placeholder="w('payHint')" :readonly="busy||!loaded" :type="visible['pay-old-pwd']?'text':'password'" autocapitalize="none" autocomplete="current-password" class="w-full h-11 bg-surface-container-low rounded-xl px-3.5 pr-11 text-on-surface font-label-numeric-md text-label-numeric-md placeholder:text-outline outline-none focus:bg-surface-container-lowest tracking-widest transition-all" id="pay-old-pwd" inputmode="numeric" maxlength="6" pattern="[0-9]*" spellcheck="false" v-model="old"/>
<button :aria-label="w(visible['pay-old-pwd']?'hide':'show')" :aria-pressed="!!visible['pay-old-pwd']" :disabled="busy" @click="visible['pay-old-pwd']=!visible['pay-old-pwd']" class="absolute right-3 text-outline hover:text-on-surface p-1 transition-colors" type="button">
<UiIcon :name="visible['pay-old-pwd']?'eye':'eyeOff'" :size="20" class="material-symbols-outlined text-[20px]"></UiIcon>
</button>
</div><p class="text-body-sm font-body-sm text-outline mt-0.5 leading-tight" v-if="false"></p>
</div>

<div class="flex flex-col gap-1.5">
<label class="font-body-sm text-body-sm text-on-surface-variant" for="pay-new-pwd">{{w('newPay')}}</label>
<div class="relative flex items-center">
<input :placeholder="w('payHint')" :readonly="busy||!loaded" :type="visible['pay-new-pwd']?'text':'password'" autocapitalize="none" autocomplete="new-password" class="w-full h-11 bg-surface-container-low rounded-xl px-3.5 pr-11 text-on-surface font-label-numeric-md text-label-numeric-md placeholder:text-outline outline-none focus:bg-surface-container-lowest tracking-widest transition-all" id="pay-new-pwd" inputmode="numeric" maxlength="6" pattern="[0-9]*" spellcheck="false" v-model="password"/>
<button :aria-label="w(visible['pay-new-pwd']?'hide':'show')" :aria-pressed="!!visible['pay-new-pwd']" :disabled="busy" @click="visible['pay-new-pwd']=!visible['pay-new-pwd']" class="absolute right-3 text-outline hover:text-on-surface p-1 transition-colors" type="button">
<UiIcon :name="visible['pay-new-pwd']?'eye':'eyeOff'" :size="20" class="material-symbols-outlined text-[20px]"></UiIcon>
</button>
</div>
<span class="font-body-sm text-body-sm text-outline">{{w('payPurpose')}}</span>
</div>

<div class="flex flex-col gap-1.5">
<label class="font-body-sm text-body-sm text-on-surface-variant" for="pay-confirm-pwd">{{w('confirmPay')}}</label>
<div class="relative flex items-center">
<input :placeholder="w('payHint')" :readonly="busy||!loaded" :type="visible['pay-confirm-pwd']?'text':'password'" autocapitalize="none" autocomplete="new-password" class="w-full h-11 bg-surface-container-low rounded-xl px-3.5 pr-11 text-on-surface font-label-numeric-md text-label-numeric-md placeholder:text-outline outline-none focus:bg-surface-container-lowest tracking-widest transition-all" id="pay-confirm-pwd" inputmode="numeric" maxlength="6" pattern="[0-9]*" spellcheck="false" v-model="confirmation"/>
<button :aria-label="w(visible['pay-confirm-pwd']?'hide':'show')" :aria-pressed="!!visible['pay-confirm-pwd']" :disabled="busy" @click="visible['pay-confirm-pwd']=!visible['pay-confirm-pwd']" class="absolute right-3 text-outline hover:text-on-surface p-1 transition-colors" type="button">
<UiIcon :name="visible['pay-confirm-pwd']?'eye':'eyeOff'" :size="20" class="material-symbols-outlined text-[20px]"></UiIcon>
</button>
</div>
</div>

</div>


<button :disabled="busy||!loaded||!paySupported" @click="submit" class="w-full h-12 bg-primary rounded-xl text-on-primary font-headline-sm text-headline-sm flex items-center justify-center gap-space-xs shadow-md active:opacity-90 transition-opacity" style="background-color: rgb(217, 119, 6);" type="button">
<UiIcon :size="20" class="material-symbols-outlined text-[20px]" name="lock_reset"></UiIcon>
<span class="">{{w(busy?'loading':isSetup?'setup':'submitPay')}}</span>
</button>
</div>



<div :role="error?'alert':'status'" class="transition-all duration-300 rounded-xl p-3 flex items-center gap-2 shadow-md" id="global-toast" v-if="success||(mode==='pay'&amp;&amp;!!error)">
<UiIcon :name="error?'error':'check_circle'" :size="20" class="material-symbols-outlined text-[20px]" id="toast-icon"></UiIcon>
<span class="font-body-sm text-body-sm font-medium" id="toast-msg">{{success?w('success'):''}} {{error?w(error):''}}</span>
</div>

<div class="pt-space-md pb-space-sm flex flex-col items-center justify-center gap-1.5 text-center">
<div class="flex items-center gap-2 text-outline">
<span class="w-4 h-px bg-surface-variant"></span>
<UiIcon :size="14" class="material-symbols-outlined text-[14px]" name="token"></UiIcon>
<span class="w-4 h-px bg-surface-variant"></span>
</div>
<p class="font-body-sm text-body-sm text-on-surface-variant tracking-wider font-medium">{{w('brand')}}</p>
</div><button @click="load" v-if="!loaded&amp;&amp;!busy">{{w('retry')}}</button><p class="font-body-sm text-body-sm text-outline" v-if="mode==='pay'&amp;&amp;security?.payment_locked_until">{{w('payment_locked')}} {{businessTime(security.payment_locked_until)}}</p><button :disabled="busy" @click="checkResult" v-if="draft">{{w('check')}}</button><button :disabled="busy" @click="emit('support')" v-if="mode==='pay'">{{w('forgot')}} {{w('support')}}</button>
</div>

</div></main>
</div></template>
