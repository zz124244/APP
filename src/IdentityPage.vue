<script setup lang="ts">
import BrandMotto from './BrandMotto.vue'
import {computed,ref,onMounted,onUnmounted} from 'vue'
import UiIcon from './UiIcon.vue'
import {sourceText} from './source-text'
import {identityText} from './identity-text'
import {depositText} from './deposit-i18n'
import type {Locale} from './i18n'
import {ApiError,type createApi} from './api'
import {commandKey,clearMatchingDraft} from './deposit'
import {executeIdentitySubmission,readIdentityDraft,identityRecoveryDecision,executeIdentityRestart,type IdentityState,type IdentityDraft} from './identity-flow'
const props=defineProps<{service:ReturnType<typeof createApi>;locale:Locale;userUid:string}>(),emit=defineEmits<{back:[];unauthorized:[]}>()
const i=(key:Parameters<typeof identityText>[1])=>identityText(props.locale,key),d=(key:Parameters<typeof depositText>[1])=>depositText(props.locale,key)
const state=ref<IdentityState>({status:'not_submitted',application_id:'0',version:'0',name_masked:'',number_masked:'',front_file_id:null,back_file_id:null,reject_reason:null}),name=ref(''),idValue=ref(''),busy=ref(false),loaded=ref(false),error=ref(''),draft=ref<IdentityDraft|null>(null),recovery=ref(false),retryAllowed=ref(false)
let disposed=false;const storageKey='identity-draft:'+props.userUid
const locked=computed(()=>busy.value||state.value.status==='pending'||state.value.status==='approved'||recovery.value&&!retryAllowed.value)
function syncNumber(event:Event){if(!locked.value)idValue.value=(event.target as HTMLInputElement).value}
function stored<T>(work:()=>T):T{try{return work()}catch{throw new ApiError('storage_unavailable')}}
function failed(e:unknown){if(disposed)return;if(e instanceof ApiError&&e.status===401){emit('unauthorized');return}error.value=e instanceof ApiError?e.message:'request_failed'}
function errorText(){if(error.value==='identity_recovery_active')return i('recoveryActive');if(error.value==='identity_not_found')return i('notFound');if(error.value==='storage_unavailable')return d('storage');if(error.value==='image_invalid')return i('imageInvalid');if(error.value==='identity_number_invalid'||error.value==='identity_name_invalid'||error.value==='identity_files_invalid')return i('invalid');if(error.value==='identity_in_use')return i('inUse');if(['identity_pending','identity_already_approved','identity_changed','identity_closed','idempotency_conflict'].includes(error.value))return i('changed');return d('error')}
function clearLocalInputs(){name.value='';idValue.value=''}
function clearDraft(){if(draft.value)stored(()=>clearMatchingDraft(localStorage,storageKey,draft.value!.key));draft.value=null;recovery.value=false;retryAllowed.value=false}
async function current(){const apply=(data:IdentityState)=>{if(!disposed){state.value=data;if(data.status==='pending'||data.status==='approved')clearLocalInputs()}};const key=`user:${props.userUid}:identity.current`;const data=typeof props.service.requestCached==='function'?await props.service.requestCached<IdentityState>(key,'/identity/current',undefined,{},undefined,{persist:true,retries:1},apply):await props.service.request<IdentityState>('/identity/current',undefined,{},undefined,{retries:1});apply(data)}
async function recover():Promise<boolean>{if(!draft.value)return false;try{const result=await props.service.request<{status:string;retryable?:boolean}>('/business-results/identity.submit/'+draft.value.key);if(disposed)return true;const decision=identityRecoveryDecision(result);if(decision==='clear'){clearDraft();await current();return true}recovery.value=true;retryAllowed.value=decision==='retry';return !retryAllowed.value}catch(e){if(disposed)return true;if(e instanceof ApiError&&e.status===404){clearDraft();error.value='identity_not_found';return false}retryAllowed.value=true;recovery.value=true;throw e}}
async function load(){if(busy.value)return;busy.value=true;error.value='';try{draft.value=readIdentityDraft(stored(()=>localStorage.getItem(storageKey)));await current();if(disposed)return;loaded.value=true;if(state.value.status==='pending'||state.value.status==='approved'){clearDraft()}else if(draft.value){recovery.value=true;try{await recover()}catch(e){retryAllowed.value=true;failed(e)}}}catch(e){failed(e)}finally{busy.value=false}}
async function restart(){if(busy.value||!draft.value||!retryAllowed.value)return;busy.value=true;error.value='';try{await executeIdentityRestart({key:draft.value.key,active:()=>!disposed,post:key=>props.service.request('/identity/recovery/'+encodeURIComponent(key)+'/restart',{}),clear:key=>{if(draft.value?.key===key){clearDraft();clearLocalInputs()}}});if(!disposed)await current()}catch(e){failed(e);if(e instanceof ApiError&&e.status===409){try{await recover()}catch(e2){failed(e2)}}}finally{busy.value=false}}
async function submit(){if(locked.value||!loaded.value)return;error.value='';const n=name.value.trim(),id=idValue.value.trim().toUpperCase();if(!/^\p{Script=Han}{1,10}$/u.test(n)){error.value='identity_name_invalid';return}if(!/^\d{17}[0-9X]$/.test(id)){error.value='identity_number_invalid';return}busy.value=true;try{if(draft.value&&await recover())return;if(disposed)return;await executeIdentitySubmission({draft:draft.value,name:n,number:id,expectedId:state.value.application_id,expectedVersion:state.value.version,keyFactory:commandKey,active:()=>!disposed,persist:value=>{stored(()=>localStorage.setItem(storageKey,JSON.stringify(value)));draft.value=value},post:(body,key)=>props.service.request('/identity/applications',body,{'Idempotency-Key':key},undefined,{retries:1,timeoutMs:45000})});if(disposed)return;props.service.invalidateCached?.(`user:${props.userUid}:identity.current`);await recover();await current();if(state.value.status==='pending'||state.value.status==='approved'){clearDraft();name.value='';idValue.value=''}}catch(e){failed(e);if(e instanceof ApiError&&e.status>=400&&e.status<500){clearDraft()}if(draft.value){recovery.value=true;try{await recover()}catch(e2){retryAllowed.value=true;failed(e2)}}}finally{busy.value=false}}
onMounted(load);onUnmounted(()=>{disposed=true;name.value='';idValue.value=''})
</script>
<template>
<div class="reference-surface reference-identity"><header class="fixed top-0 inset-x-0 z-50 bg-surface/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] pt-safe"><div class="h-16 px-gutter-sm flex items-center justify-between"><div class="flex items-center gap-space-sm"><button :aria-label="d('back')" :disabled="busy" @click="emit('back')" class="w-11 h-11 flex items-center justify-center rounded-xl text-on-surface hover:bg-surface-container-high transition-colors" type="button"><UiIcon :size="24" class="material-symbols-outlined text-[24px]" name="arrow_back_ios_new"></UiIcon></button><h1 class="font-headline-sm text-headline-sm text-on-surface">{{i('title')}}</h1></div></div></header><main class="flex-1 flex flex-col relative w-full pt-16 bg-surface"><div class="flex flex-col w-full pb-safe">
<div class="px-5 pt-3 pb-8 flex flex-col gap-space-md"><div class="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col gap-space-sm" role="status" v-if="state.status!=='not_submitted'"><strong>{{state.status==='pending'?i('pending'):state.status==='approved'?i('approved'):state.reject_reason||i('rejected')}}</strong><p>{{i('old')}}</p><p>{{state.name_masked}} · {{state.number_masked}}</p></div><p class="error" role="alert" v-if="error">{{errorText()}}</p><p role="status" v-if="recovery">{{i('recover')}} <button :disabled="busy" @click="load" type="button">{{i('retryResult')}}</button> <button v-if="retryAllowed&&draft" :disabled="busy" type="button" @click="restart">{{i('restart')}}</button></p><button :disabled="busy" @click="load" class="plain" type="button" v-if="!recovery&&(error||!loaded||state.status==='pending'||state.status==='rejected')">{{d('retry')}}</button>
<div class="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col gap-space-md" v-if="state.status!=='pending'&&state.status!=='approved'">
<div class="flex flex-col gap-1.5">
<div class="flex items-center justify-between">
<label class="font-body-sm font-medium text-on-surface flex items-center gap-1" for="realName">
<span class="">{{i('name')}}</span>
<span class="text-error font-bold">*</span>
</label>
</div>
<div class="relative flex items-center">
<div class="absolute left-3 flex items-center pointer-events-none text-on-surface-variant">
<UiIcon :size="20" class="material-symbols-outlined text-[20px]" name="badge"></UiIcon>
</div>
<input :placeholder="i('nameHint')" :readonly="locked" autocomplete="off" class="w-full h-11 pl-10 pr-10 bg-surface-container-lowest text-on-surface placeholder:text-outline font-body-md rounded-lg shadow-sm focus:outline-none focus:bg-surface-bright transition-all" id="realName" maxlength="10" type="text" v-model="name"/>
</div>
</div>
<div class="flex flex-col gap-1.5">
<div class="flex items-center justify-between">
<label class="font-body-sm font-medium text-on-surface flex items-center gap-1" for="idNumber">
<span class="">{{i('number')}}</span>
<span class="text-error font-bold">*</span>
</label>
</div>
<div class="relative flex items-center">
<div class="absolute left-3 flex items-center pointer-events-none text-on-surface-variant">
<UiIcon :size="20" class="material-symbols-outlined text-[20px]" name="pin"></UiIcon>
</div>
<input :placeholder="i('numberHint')" :readonly="locked" autocomplete="off" class="w-full h-11 pl-10 pr-10 bg-surface-container-lowest text-on-surface placeholder:text-outline font-label-numeric-md tracking-wider rounded-lg shadow-sm focus:outline-none focus:bg-surface-bright transition-all" id="idNumber" type="text" :value="idValue" @input="syncNumber" @change="syncNumber"/>
</div>
</div>
</div>
<div class="pt-2" v-if="state.status!=='pending'&&state.status!=='approved'">
<button :disabled="locked||!loaded" @click="submit" class="w-full h-12 bg-primary hover:bg-primary-container active:scale-[0.99] text-on-primary font-body-lg font-semibold rounded-xl shadow-md flex items-center justify-center gap-2 transition-all duration-200" id="submitBtn" style="background-color: rgb(217, 119, 6);" type="button">
<UiIcon :size="20" class="material-symbols-outlined text-[20px]" name="enhanced_encryption_fill1"></UiIcon>
<span class="">{{busy?d('loading'):i('submit')}}</span>
</button>
</div>
<div class="mt-4 pt-4 flex flex-col items-center justify-center text-center gap-1">
<BrandMotto :locale="locale"/>
</div>
</div>
</div>
</main></div>
</template>
