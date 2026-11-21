<script setup lang="ts">
import {ref,reactive,toRefs,onMounted,onUnmounted} from 'vue'
import UiIcon from './UiIcon.vue'
import {ApiError,type createApi} from './api'
import type {Locale} from './i18n'
import {depositText} from './deposit-i18n'
import {teamText,type TeamTextKey} from './team-text'
import {loadInvitationData,copyInvitationAndMark,writeClipboardText,type Invitation} from './invitation-flow'
import {invitationQr} from './invitation-qr'
const props=defineProps<{service:ReturnType<typeof createApi>;locale:Locale}>()
const emit=defineEmits<{back:[];unauthorized:[]}>()
const w=(key:TeamTextKey)=>teamText(props.locale,key),d=(key:Parameters<typeof depositText>[1])=>depositText(props.locale,key)
const data=reactive<{invitation:Invitation|undefined;qr:string;qrError:boolean}>({invitation:undefined,qr:'',qrError:false}),{invitation,qr,qrError}=toRefs(data),busy=ref(false),error=ref(false),notice=ref(''),copyFeedback=reactive({copiedType:''});let disposed=false
async function load(){if(busy.value)return;busy.value=true;error.value=false;try{await loadInvitationData(data,()=>props.service.request('/invitations/mine'),invitationQr,()=>!disposed)}catch(e){if(!disposed){error.value=true;if(e instanceof ApiError&&e.status===401)emit('unauthorized')}}finally{if(!disposed)busy.value=false}}
async function copy(value:string|undefined,type:'code'|'link'){notice.value='';const copied=await copyInvitationAndMark(copyFeedback,type,value,text=>writeClipboardText(text));if(!disposed&&!copied)notice.value=w('copyFailed')}
onMounted(()=>load());onUnmounted(()=>{disposed=true})
</script>
<template><div class="reference-surface reference-invitation"><header class="fixed top-0 w-full z-50 pt-safe bg-surface/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]"><div class="h-14 px-gutter-sm flex items-center justify-between"><div class="flex items-center gap-space-xs"><button :aria-label="d('back')" @click="emit('back')" class="w-11 h-11 -ml-space-xs flex items-center justify-center text-on-surface active:bg-surface-container rounded-full transition-colors" type="button"><UiIcon :size="22" class="material-symbols-outlined text-[22px]" name="arrow_back"></UiIcon></button><h1 class="font-headline-sm text-headline-sm text-on-surface select-none truncate">{{w('invite')}}</h1></div><div class="flex items-center gap-space-xs"></div></div></header><main class="flex-1 flex flex-col relative w-full pt-14 pb-safe bg-surface"><div class="flex flex-col w-full px-space-md pb-space-xl gap-space-md">

<div class="relative overflow-hidden rounded-full bg-surface-container-lowest p-space-md shadow-sm">
<div class="absolute -right-10 -top-10 w-36 h-36 rounded-full bg-primary-fixed/20 blur-2xl pointer-events-none"></div>
<div class="absolute -left-10 -bottom-10 w-32 h-32 rounded-full bg-secondary-fixed/30 blur-2xl pointer-events-none"></div>
</div>

<div class="bg-surface-container-lowest rounded-full p-space-md shadow-sm flex flex-col gap-space-md">

<div class="flex flex-col gap-1.5">
<div class="flex items-center justify-between bg-surface-container-low rounded-xl px-space-md py-2.5">
<div class="flex flex-col">
<span class="font-label-numeric-lg text-label-numeric-lg font-bold tracking-widest text-on-surface select-all" id="invite-code">{{invitation?.invite_code??'—'}}</span>
</div>
<button :disabled="!invitation" @click="copy(invitation?.invite_code,'code')" class="flex items-center gap-1.5 bg-primary text-on-primary px-3.5 py-2 rounded-lg font-body-md text-body-md active:opacity-90 transition-opacity shadow-sm" style="background-color: rgb(217, 119, 6);" type="button">
<UiIcon :size="16" class="material-symbols-outlined text-[16px]" name="content_copy"></UiIcon>
<span class="">{{copyFeedback.copiedType==='code'?w('copied'):w('copy')}}</span>
</button>
</div>
</div>

<div class="flex flex-col gap-1.5">
<span class="font-label-caps text-label-caps text-on-surface-variant uppercase">{{w('exclusive')}}</span>
<div class="flex items-center justify-between bg-surface-container-low rounded-xl px-space-md py-2.5">
<span class="font-label-numeric-sm text-label-numeric-sm text-on-surface truncate pr-2 select-all" id="invite-link">{{invitation?.invite_url??'—'}}</span>
<button :disabled="!invitation" @click="copy(invitation?.invite_url,'link')" class="shrink-0 flex items-center gap-1.5 bg-surface-container-high text-on-surface px-3 py-2 rounded-lg font-body-md text-body-md active:bg-surface-container-highest transition-colors" type="button">
<UiIcon :size="16" class="material-symbols-outlined text-[16px]" name="link"></UiIcon>
<span class="">{{copyFeedback.copiedType==='link'?w('copied'):w('copyLink')}}</span>
</button>
</div>
</div>
</div>

<div v-if="false" class="bg-surface-container-lowest rounded-full p-space-md shadow-sm flex flex-col items-center text-center">

<div class="relative p-3.5 rounded-xl bg-surface-container-low shadow-inner flex items-center justify-center">
<div class="relative w-44 h-44 bg-surface-container-lowest rounded-lg p-2 flex items-center justify-center shadow-sm">

<span class="absolute top-1.5 left-1.5 w-3.5 h-3.5 border-t-2 border-l-2 border-primary"></span>
<span class="absolute top-1.5 right-1.5 w-3.5 h-3.5 border-t-2 border-r-2 border-primary"></span>
<span class="absolute bottom-1.5 left-1.5 w-3.5 h-3.5 border-b-2 border-l-2 border-primary"></span>
<span class="absolute bottom-1.5 right-1.5 w-3.5 h-3.5 border-b-2 border-r-2 border-primary"></span>

<svg :aria-label="w('link')" class="w-36 h-36" fill="none" role="img" v-if="qr" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><image :href="qr" :xlink:href="qr" height="100" width="100"/><circle cx="50" cy="50" fill="#ffffff" r="11"></circle><circle cx="50" cy="50" fill="#d97706" r="9"></circle><path d="M47 45L53 50L47 55" stroke="#ffffff" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path></svg>
</div>
</div>

<div class="flex items-center gap-space-sm w-full mt-space-md">
</div>
</div>



<div class="flex flex-col items-center justify-center text-center mt-space-sm gap-1">
<span class="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">{{w('custody')}}</span>
</div>


<p role="alert" v-if="error||qrError">{{w('error')}} <button @click="load">{{w('retry')}}</button></p><p role="status" v-if="notice">{{notice}}</p></div>
</main>
</div></template>
