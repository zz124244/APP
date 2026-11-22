<script setup lang="ts">
import {createSupportAvatarReader} from './support-avatar'
import UiIcon from "./UiIcon.vue"
import {credentialText} from './credential-text'
import {createRecoverySecretReader} from './recovery-flow'
import {recoveryText,type RecoveryTextKey} from './recovery-text'
import {profileText} from "./profile-text"
import { onMounted, onUnmounted, ref, nextTick, watch } from 'vue'
import type { Locale } from './i18n'
import { createApi, ApiError } from './api'
import { depositText, type DepositText } from './deposit-i18n'
import { commandKey, businessTime } from './deposit'
import { createPrivateImageCache } from './private-images'
const props=defineProps<{service:ReturnType<typeof createApi>;locale:Locale;recovery?:boolean;caseStatus?:string;writeClipboard?:(value:string)=>Promise<void>}>()
const emit=defineEmits<{back:[];unauthorized:[]}>()
const t=(key:DepositText)=>depositText(props.locale,key)
type Message={kind?:string;delivery_id?:string;id:string;sender_type:string;text:string;file_id:string|null;sent_at:string}
const rw=(key:RecoveryTextKey)=>recoveryText(props.locale,key)
const secrets=ref<Record<string,{value:string;expires_at:string}>>({}),secretError=ref<RecoveryTextKey|null>(null),secretBusy=ref(''),secretCopied=ref(false),secretVisible=ref<Record<string,boolean>>({})
const secretReader=createRecoverySecretReader({active:()=>!disposed,status:()=>props.caseStatus,now:()=>typeof performance==='object'?performance.now():Date.now(),read:id=>props.service.request('/recovery/delivery/'+id),commit:(id,value)=>{secrets.value[id]=value;secretVisible.value[id]=false},remove:id=>{delete secrets.value[id];delete secretVisible.value[id]},clear:()=>{secrets.value={};secretVisible.value={};secretCopied.value=false},failed:()=>{secretError.value='expired'},schedule:(run,ms)=>setTimeout(run,ms),cancel:timer=>clearTimeout(timer)})
watch(()=>props.caseStatus,value=>{if(value&&['completed','rejected','expired','superseded'].includes(value))secretReader.invalidate()})
async function reveal(id:string){if(!props.recovery||secretBusy.value||props.caseStatus!=='awaiting_user')return;secretBusy.value=id;secretError.value=null;secretCopied.value=false;await secretReader.read(id);if(!disposed)secretBusy.value=''}
async function copySecret(id:string){const value=secrets.value[id]?.value;if(!value)return;try{await (props.writeClipboard?props.writeClipboard(value):navigator.clipboard.writeText(value));if(!disposed)secretCopied.value=true}catch{if(!disposed)secretError.value='copyFailed'}}
function hideSecretPage(){secretReader.invalidate()}
function secretVisibility(){if(document.visibilityState==='hidden')hideSecretPage()}
onMounted(()=>{document.addEventListener('visibilitychange',secretVisibility);window.addEventListener('pagehide',hideSecretPage)})
onUnmounted(()=>{secretReader.invalidate();document.removeEventListener('visibilitychange',secretVisibility);window.removeEventListener('pagehide',hideSecretPage)})
const before=ref<string|null>(null),olderBusy=ref(false),messages=ref<Message[]>([]),text=ref(''),busy=ref(false),loading=ref(true),pollError=ref(false),sendError=ref(false),log=ref<HTMLElement|null>(null)
const profile=ref<{display_name:string;staffed_hours:boolean|null;avatar_id?:string|null}>({display_name:'九合客服',staffed_hours:null})
const images=ref<Record<string,string>>({}),failedImages=ref<string[]>([])
let timer:ReturnType<typeof setTimeout>|undefined,disposed=false,pending:{text:string;file_id?:string;client_message_id:string}|null=null,inflight:Promise<void>|null=null
let backoff=3000
function unauthorized(problem:unknown){if(problem instanceof ApiError&&problem.status===401)emit('unauthorized')}
const imageCache=createPrivateImageCache(id=>props.service.image('/uploads/'+id+'/content'),{create:blob=>URL.createObjectURL(blob),revoke:url=>URL.revokeObjectURL(url),changed:()=>{images.value={...imageCache.urls};failedImages.value=[...imageCache.failed]},failed:unauthorized})
const avatarUrl=ref<string|null>(null)
const avatarReader=createSupportAvatarReader({download:id=>props.service.image('/support/avatar/'+id),create:blob=>URL.createObjectURL(blob),revoke:url=>URL.revokeObjectURL(url),changed:url=>{avatarUrl.value=url},failed:unauthorized})
function loadImages(){void imageCache.retry(messages.value.map(message=>message.file_id).filter((id):id is string=>Boolean(id)))}
async function load(force=false):Promise<void>{
 if(inflight){await inflight;if(force&&!disposed)return load();return}
 clearTimeout(timer)
 inflight=(async()=>{
  try{const last=messages.value[messages.value.length-1]?.id;const data=await props.service.request<{items:Message[];profile:typeof profile.value;next_before:string|null}>('/support/messages'+(last?'?after='+last:''));if(disposed)return;profile.value=data.profile;void avatarReader.load(data.profile.avatar_id);if(!last)before.value=data.next_before;for(const item of data.items){if(!messages.value.some(existing=>existing.id===item.id))messages.value.push(item)}pollError.value=false;loadImages();backoff=3000;await nextTick();if(data.items.length&&log.value)log.value.scrollTop=log.value.scrollHeight}
  catch(problem){if(!disposed){pollError.value=true;unauthorized(problem);backoff=Math.min(backoff*2,30000)}}finally{loading.value=false;inflight=null;if(!disposed)timer=setTimeout(()=>void load(),backoff)}
 })()
 return inflight
}
onMounted(async()=>{try{await props.service.request('/support/conversation',{});if(!disposed)await load()}catch(problem){if(!disposed){pollError.value=true;unauthorized(problem);loading.value=false}}})
onUnmounted(()=>{disposed=true;clearTimeout(timer);imageCache.dispose();avatarReader.dispose()})
async function older(){if(!before.value||olderBusy.value)return;olderBusy.value=true;const previousHeight=log.value?.scrollHeight||0;try{const data=await props.service.request<{items:Message[];next_before:string|null}>('/support/messages?before='+before.value);if(disposed)return;messages.value=[...data.items.filter(item=>!messages.value.some(current=>current.id===item.id)),...messages.value];before.value=data.next_before;loadImages();await nextTick();if(log.value)log.value.scrollTop=log.value.scrollHeight-previousHeight}catch(problem){if(!disposed){pollError.value=true;unauthorized(problem)}}finally{olderBusy.value=false}}
async function send(){if(busy.value||(!text.value.trim()&&!pending))return;busy.value=true;sendError.value=false;if(!pending)pending={text:text.value,client_message_id:commandKey()};try{await props.service.request('/support/messages',pending);if(disposed)return;pending=null;text.value='';await load(true)}catch(problem){if(!disposed){sendError.value=true;unauthorized(problem)}}finally{busy.value=false}}
async function upload(event:Event){const file=(event.target as HTMLInputElement).files?.[0];if(!file||busy.value||pending)return;if(file.size>10485760||(file.type!==''&&!['image/jpeg','image/png'].includes(file.type))){sendError.value=true;return}busy.value=true;sendError.value=false;try{const fields=new FormData();fields.set('purpose','chat');fields.set('file',file);const result=await props.service.request<{file_id:string}>('/uploads',fields);if(disposed)return;pending={text:'',file_id:result.file_id,client_message_id:commandKey()}}catch(problem){if(!disposed){sendError.value=true;unauthorized(problem)}}finally{busy.value=false}if(pending&&!disposed)await send()}
function enter(event:KeyboardEvent){if(event.key==='Enter'&&!event.shiftKey&&!event.isComposing&&event.keyCode!==229){event.preventDefault();void send()}}
</script>
<template>
<div class="reference-surface reference-support"><header class="fixed top-0 w-full z-50 bg-surface-container-lowest/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] pt-safe"><div class="h-14 px-margin-sm flex items-center justify-between"><div class="flex items-center gap-space-xs"><button :aria-label="t('back')" :disabled="busy" @click="emit('back')"  class="w-11 h-11 flex items-center justify-center text-on-surface hover:text-primary transition-colors" type="button"><UiIcon :size="24" class="material-symbols-outlined text-[24px]" name="arrow_back"></UiIcon></button></div><div class="absolute left-1/2 -translate-x-1/2 flex items-center pointer-events-none"><h1 class="font-headline-sm text-headline-sm text-on-surface tracking-tight truncate max-w-[200px] text-center">{{profile.display_name}}</h1></div></div></header><main class="flex-1 w-full pt-14 pb-safe bg-surface flex flex-col overflow-hidden"><div class="flex flex-col w-full pb-6 h-full flex-1">
<div class="px-margin-sm pt-space-sm pb-space-sm">
<div class="bg-surface-container-lowest rounded-xl p-space-md shadow-sm">
<div class="flex items-center justify-between gap-space-sm">
<div class="flex items-center gap-space-md min-w-0">
<div class="relative w-12 h-12 shrink-0">
<img alt="" class="w-full h-full object-cover rounded-full" :src="avatarUrl||'/brand.png'" @error="avatarReader.reset()"/>
<span :style="{backgroundColor:profile.staffed_hours===true?'#85f8c4':'#94a3b8'}" class="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-primary-fixed ring-2 ring-surface-container-lowest"></span>
</div>
<div class="flex flex-col min-w-0">
<div class="flex items-center gap-space-xs flex-wrap">
<span class="font-headline-sm text-headline-sm text-on-surface truncate">{{profile.display_name}}</span>
</div>
</div>
</div>
<div class="flex flex-col items-end shrink-0 pl-space-xs">
<div class="flex items-center gap-1 text-secondary-container">
</div>
</div>
</div>
<div class="mt-space-md bg-surface-container-low rounded-lg p-space-sm flex items-center justify-between">
<div class="flex items-center gap-space-xs">
<span class="relative flex h-2 w-2">
<span v-if="profile.staffed_hours===true" class="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
<span :style="{backgroundColor:profile.staffed_hours===true?'#006948':'#94a3b8'}" class="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
</span>
<span class="font-body-sm text-body-sm text-primary font-medium">{{profile.staffed_hours===null?'':t(profile.staffed_hours?'supportHours':'supportOffline')}}</span>
</div>
<div class="flex items-center gap-1 font-label-numeric-sm text-label-numeric-sm text-on-surface-variant">
</div>
</div>
</div>
</div>
<div class="px-margin-sm py-space-xs">
</div>
<slot name="context"></slot><p class="error mx-4" role="alert" v-if="pollError||sendError">{{t('error')}}</p><div aria-live="polite" class="px-margin-sm py-space-sm space-y-space-md overflow-y-auto flex-1 source-chat-stream" id="chatStream" ref="log" role="log" style="-webkit-overflow-scrolling: touch; scroll-behavior: smooth;"><button :disabled="olderBusy" @click="older" class="plain w-full" type="button" v-if="before">{{t(olderBusy?'loading':'more')}}</button><p class="text-center text-outline" v-if="!loading&&!messages.length">{{t('supportWait')}}</p><div class="flex justify-center" v-if="messages.length">
<span class="bg-surface-container-high text-on-surface-variant font-label-numeric-sm text-label-numeric-sm px-2.5 py-1 rounded-full">{{businessTime(messages[0]!.sent_at).slice(0,10)}}</span>
</div><template :key="message.id" v-for="message in messages"><div class="flex items-start justify-end gap-space-sm" v-if="message.sender_type==='user'">
<div class="flex flex-col max-w-[80%] items-end source-message-content">
<span class="font-body-sm text-body-sm text-on-surface-variant mb-1">{{profileText(locale,'you')}}</span>
<div class="bg-primary text-on-primary p-space-md rounded-2xl rounded-tr-sm shadow-sm" style="background-color: rgb(217, 119, 6);">
<p class="font-body-md text-body-md leading-relaxed text-left whitespace-pre-wrap break-words">{{message.text}}</p>
<a :href="images[message.file_id]" rel="noopener" target="_blank" v-if="message.file_id&&images[message.file_id]"><img :alt="t('image')" :src="images[message.file_id]" class="max-w-full max-h-[250px] object-contain"/></a><button :disabled="!failedImages.includes(message.file_id)" @click="imageCache.load(message.file_id)" class="plain" type="button" v-else-if="message.file_id">{{t(failedImages.includes(message.file_id)?'retry':'loading')}}</button></div>
<div class="flex items-center gap-1 mt-1 font-label-numeric-sm text-[11px] text-on-surface-variant">
<span class="">{{businessTime(message.sent_at)}}</span>
<UiIcon name="check" :size="14" class="material-symbols-outlined text-[14px] text-primary"/>
</div>
</div>
<div class="w-9 h-9 rounded-full shrink-0 bg-primary-fixed flex items-center justify-center text-on-primary-fixed">
<UiIcon name="user" :size="20" class="material-symbols-outlined text-[20px]"/>
</div>
</div><div class="flex items-start gap-space-sm" v-else="">
<div class="w-9 h-9 rounded-full shrink-0 overflow-hidden bg-surface-container-high">
<img alt="" class="w-full h-full object-cover" :src="avatarUrl||'/brand.png'" @error="avatarReader.reset()"/>
</div>
<div class="flex flex-col max-w-[82%] items-start source-message-content">
<span class="font-body-sm text-body-sm text-on-surface-variant mb-1">{{profile.display_name}}</span>
<div class="bg-surface-container-lowest text-on-surface p-space-md rounded-2xl rounded-tl-sm shadow-sm space-y-2"><p class="text-outline text-[11px]" v-if="message.sender_type==='system'">{{t('systemWelcome')}}</p>
<div v-if="message.kind==='credential_delivery'&&recovery" class="flex flex-col gap-space-sm"><p>{{rw('secretHint')}}</p><button :disabled="!!secretBusy||caseStatus!=='awaiting_user'" @click="reveal(message.delivery_id!)" type="button">{{rw('showSecret')}}</button><template v-if="secrets[message.delivery_id!]"><label>{{rw('secret')}}<div class="relative flex items-center"><input readonly :type="secretVisible[message.delivery_id!]?'text':'password'" autocomplete="off" :value="secrets[message.delivery_id!]!.value" class="w-full h-11 bg-surface-container-low rounded-xl px-3.5 pr-11 text-on-surface font-label-numeric-md text-label-numeric-md"/><button @click="secretVisible[message.delivery_id!]=!secretVisible[message.delivery_id!]" :aria-label="credentialText(locale,secretVisible[message.delivery_id!]?'hide':'show')" :aria-pressed="!!secretVisible[message.delivery_id!]" class="absolute right-0 w-11 h-11 flex items-center justify-center" type="button"><UiIcon :name="secretVisible[message.delivery_id!]?'eye':'eyeOff'" :size="20"/></button></div></label><p>{{rw('expiry')}} {{businessTime(secrets[message.delivery_id!]!.expires_at)}}</p><button @click="copySecret(message.delivery_id!)" type="button">{{rw('copy')}}</button></template><p v-if="secretError" role="alert">{{rw(secretError)}}</p><p v-if="secretCopied" role="status">{{rw('copied')}}</p></div><p v-else class="font-body-md text-body-md leading-relaxed whitespace-pre-wrap break-words">{{message.text}}</p>
<a :href="images[message.file_id]" rel="noopener" target="_blank" v-if="message.file_id&&images[message.file_id]"><img :alt="t('image')" :src="images[message.file_id]" class="max-w-full max-h-[250px] object-contain"/></a><button :disabled="!failedImages.includes(message.file_id)" @click="imageCache.load(message.file_id)" class="plain" type="button" v-else-if="message.file_id">{{t(failedImages.includes(message.file_id)?'retry':'loading')}}</button></div>
<span class="font-label-numeric-sm text-[11px] text-on-surface-variant mt-1">{{businessTime(message.sent_at)}}</span></div>
</div></template></div>
<div class="px-margin-sm mt-space-sm mb-space-md text-center">
</div>
<div class="sticky bottom-0 w-full px-margin-sm pb-2 pt-2 bg-surface/90 backdrop-blur-md">
<form @submit.prevent="send" class="bg-surface-container-lowest rounded-2xl shadow-md p-2 flex items-end gap-2"><label :aria-label="t('image')"  class="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-surface-container-high transition-colors shrink-0 source-image-picker"><UiIcon :size="22" class="material-symbols-outlined text-[22px]" name="image"></UiIcon><span class="sr-only">{{t('image')}}</span><input :disabled="busy||!!pending" @change="upload" accept="image/jpeg,image/png" class="source-upload-input" type="file"/></label><div class="flex-1 min-w-0 py-2"><textarea :aria-label="t('message')" :placeholder="t('message')" :readonly="busy||!!pending" @keydown="enter" class="w-full bg-transparent resize-none outline-none text-on-surface font-body-md text-body-md placeholder:text-outline-variant max-h-24 overflow-y-auto block leading-relaxed py-1 px-1" id="messageInput" maxlength="4000" rows="1" style="box-sizing: border-box; min-height: 24px;" v-model="text"></textarea></div><button :aria-label="t(busy?'loading':pending?'retryOriginal':'send')" :class="{'source-send-label':busy||!!pending}" :disabled="busy||(!text.trim()&&!pending)"  class="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center shrink-0 shadow-sm active:scale-95 transition-transform source-send-button" id="sendBtn" style="background-color: rgb(217, 119, 6);" type="submit"><span v-if="busy||pending">{{t(busy?'loading':'retryOriginal')}}</span><UiIcon :size="20" class="material-symbols-outlined text-[20px]" name="send" v-else></UiIcon></button></form>
</div>
</div>
</main></div>
</template>
