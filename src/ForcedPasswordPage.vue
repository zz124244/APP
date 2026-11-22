<script setup lang="ts">
import {ref,computed,onUnmounted} from 'vue'
import UiIcon from './UiIcon.vue'
import {ApiError,type createApi} from './api'
import type {Locale} from './i18n'
import {commandKey} from './deposit'
import {credentialText,type CredentialTextKey} from './credential-text'
import {recoveryText,type RecoveryTextKey} from './recovery-text'
import {uncertainLoginChange,validCredentialForm} from './credential-flow'
const props=defineProps<{service:ReturnType<typeof createApi>;locale:Locale}>()
const emit=defineEmits<{finished:[uncertain:boolean];exit:[]}>()
const w=(key:CredentialTextKey)=>credentialText(props.locale,key),rw=(key:RecoveryTextKey)=>recoveryText(props.locale,key)
const password=ref(''),confirmation=ref(''),visible=ref<Record<string,boolean>>({}),busy=ref(false),notice=ref<'validation'|'samePassword'|'expired'|'error'|null>(null)
const error=computed(()=>notice.value?(notice.value==='validation'?w('validation'):rw(notice.value)):'')
const loaded=true
let disposed=false
function clearFields(){password.value='';confirmation.value='';visible.value={}}
async function logout(){if(busy.value)return;busy.value=true;try{await props.service.request('/auth/logout',{});if(!disposed)emit('exit')}catch{if(!disposed)notice.value='error'}finally{if(!disposed)busy.value=false}}
async function submit(){if(busy.value)return;notice.value=null;if(!validCredentialForm('login',password.value,password.value,confirmation.value)){notice.value='validation';return}const body={new_password:password.value,new_password_confirmation:confirmation.value};busy.value=true;clearFields();try{const result=await props.service.request<{credential_version?:string;requires_login?:boolean}>('/security/login-password/complete-reset',body,{'Idempotency-Key':commandKey()});if(!disposed)emit('finished',!(result.requires_login===true&&typeof result.credential_version==='string'&&/^[1-9][0-9]*$/.test(result.credential_version)))}catch(e){if(disposed)return;if(uncertainLoginChange(e instanceof ApiError?e.status:undefined,e instanceof ApiError?e.message:undefined)){emit('finished',true);return}notice.value=e instanceof ApiError&&e.message==='recovery_same_password'?'samePassword':e instanceof ApiError&&[401,403,410].includes(e.status)?'expired':'error'}finally{if(!disposed)busy.value=false}}
onUnmounted(()=>{disposed=true;clearFields()})
</script>
<template><div class="reference-surface reference-password"><header class="fixed top-0 w-full z-50 pt-safe bg-surface/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]"><div class="h-14 px-gutter-sm flex items-center justify-between"><div class="flex items-center gap-space-xs"><button :aria-label="w('back')" :disabled="busy" @click="logout" class="w-11 h-11 flex items-center justify-center rounded-xl text-on-surface hover:bg-surface-container transition-colors" type="button"><UiIcon :size="24" class="material-symbols-outlined text-[24px]" name="arrow_back_ios_new"></UiIcon></button><h1 class="font-headline-sm text-headline-sm text-on-surface truncate max-w-[200px]">{{rw('forceTitle')}}</h1></div><div class="flex items-center gap-space-sm"></div></div></header><main class="relative w-full min-h-screen pt-14 pb-safe bg-surface"><div class="flex flex-col w-full">
<div class="px-gutter-sm pt-space-md pb-space-xl flex flex-col gap-space-lg">

<div class="flex flex-col gap-space-md" id="pane-login">
<div class="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col gap-space-md">

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
<div class="bg-error-container text-on-error-container rounded-xl p-3 flex items-start gap-2.5 border border-error/20 shadow-sm transition-all" id="login-error-banner" role="alert" v-if="!!error">
<UiIcon :size="20" class="material-symbols-outlined text-[20px] text-error flex-shrink-0 mt-0.5" name="error"></UiIcon>
<div class="flex flex-col gap-0.5 flex-1">
<span class="font-body-md text-body-md font-medium text-error" id="login-error-title">{{error}}</span>
<span class="font-body-sm text-body-sm text-on-error-container/80" id="login-error-desc" v-if="false"></span>
</div>
</div><button :disabled="busy||!loaded" @click="submit" class="w-full h-12 bg-primary rounded-xl text-on-primary font-headline-sm text-headline-sm flex items-center justify-center gap-space-xs shadow-md active:opacity-90 transition-opacity" style="background-color: rgb(217, 119, 6);" type="button">
<UiIcon :size="20" class="material-symbols-outlined text-[20px]" name="check_circle"></UiIcon>
<span class="">{{busy?w('loading'):rw('forceTitle')}}</span>
</button>
</div>


<div class="pt-space-md pb-space-sm flex flex-col items-center justify-center gap-1.5 text-center">
<div class="flex items-center gap-2 text-outline">
<span class="w-4 h-px bg-surface-variant"></span>
<UiIcon :size="14" class="material-symbols-outlined text-[14px]" name="token"></UiIcon>
<span class="w-4 h-px bg-surface-variant"></span>
</div>
<p class="font-body-sm text-body-sm text-on-surface-variant tracking-wider font-medium">{{w('brand')}}</p>
</div>
</div>
</div></main>
</div></template>
