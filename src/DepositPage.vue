<script setup lang="ts">
import BrandMotto from './BrandMotto.vue'
import {sourceText} from './source-text'
import UiIcon from './UiIcon.vue'
import {profileText} from './profile-text'
import { onMounted, onUnmounted, ref } from 'vue'
import type { Locale } from './i18n'
import { depositText, type DepositText } from './deposit-i18n'
import { createApi, ApiError } from './api'
import { amountAtLeast, normalizeAmount, executeDepositSubmission, clearMatchingDraft, businessTime, readDraft, type DepositDraft } from './deposit'
const props = defineProps<{ service: ReturnType<typeof createApi>; locale: Locale; userUid: string; history?: boolean }>()
const emit = defineEmits<{ back: []; support: []; unauthorized: [] }>()
const networks:Record<Locale,string>={'zh-CN':'Tron 网络',en:'Tron network',ja:'Tronネットワーク',ko:'Tron 네트워크',fr:'Réseau Tron',de:'Tron-Netzwerk','zh-TW':'Tron 網路'}
const bscNetworks:Record<Locale,string>={'zh-CN':'BSC 网络',en:'BSC network',ja:'BSCネットワーク',ko:'BSC 네트워크',fr:'Réseau BSC',de:'BSC-Netzwerk','zh-TW':'BSC 網路'}
const t = (key: DepositText) => depositText(props.locale,key)
const storageKey = 'deposit-draft:' + props.userUid
const config = ref<{minimum_deposit: string; arrival_text: string} | null>(null)
const network = ref<'TRC20'|'BEP20'>('TRC20')
const amount = ref(''), file = ref<File | null>(null), preview = ref(''), busy = ref(false), status = ref(''), error = ref<DepositText | null>(null)
const original = ref<DepositDraft | null>(null), input = ref<HTMLInputElement | null>(null)
type Item = { report_no: string; amount: string; submitted_at: string }
const items = ref<Item[]>([]), cursor = ref<string | null>(null)
let disposed=false
let feedbackTimer: ReturnType<typeof setTimeout> | undefined
onUnmounted(()=>{ disposed=true;clearTimeout(feedbackTimer); if(preview.value) URL.revokeObjectURL(preview.value) })
function failed(problem: unknown) { if(problem instanceof ApiError && problem.status===401) emit('unauthorized'); error.value = problem instanceof ApiError && problem.message==='deposit_below_minimum' ? 'invalidAmount' : 'error' }
async function load(more=false) {
  if(busy.value) return
  busy.value=true; error.value=null
  try {
    if(props.history) {const result=await props.service.request<{items: Item[]; next_cursor: string|null}>('/deposits'+(more&&cursor.value?'?cursor='+cursor.value:''));items.value=more?[...items.value,...result.items]:result.items;cursor.value=result.next_cursor}
    else {config.value=await props.service.request('/deposit-config');if(original.value) await recover()}
  } catch(problem) {failed(problem)} finally {busy.value=false}
}
onMounted(()=>{try {original.value=readDraft(sessionStorage.getItem(storageKey));if(original.value){amount.value=original.value.amount;network.value=original.value.network||'TRC20'}} catch {error.value='storage'};void load()})
function choose(event: Event) {
  error.value=null
  const selected=(event.target as HTMLInputElement).files?.[0]
  if(!selected) return
  if(selected.size>10485760){error.value='tooLarge';return}
  if(selected.type!==''&&!['image/jpeg','image/png'].includes(selected.type)){error.value='invalidFile';return}
  file.value=selected;if(preview.value)URL.revokeObjectURL(preview.value);preview.value=URL.createObjectURL(selected)
}
function clearDraft() {const key=original.value?.key;if(key){try{clearMatchingDraft(sessionStorage,storageKey,key)}catch{error.value='storage'}}original.value=null }
function acknowledge() {
  if(disposed)return
  clearDraft();status.value='pending';error.value=null
  feedbackTimer=setTimeout(()=>{amount.value='';file.value=null;if(input.value)input.value.value='';if(preview.value)URL.revokeObjectURL(preview.value);preview.value='';status.value=''},1000)
}
async function recover(): Promise<boolean> {
  if(!original.value)return true
  status.value='recovery'
  try {
    const result=await props.service.request<{status:string;result?:unknown;retryable?:boolean}>('/business-results/deposit.submit/'+original.value.key)
    if(disposed)return true
    if(result.status==='succeeded'){acknowledge();return true}
    if(result.status==='failed'&&!result.retryable){clearDraft();status.value='';error.value='error';return true}
    return false
  }catch(problem){if(problem instanceof ApiError && problem.status===404)return false;failed(problem);return false}
}
async function submit() {
  if(busy.value||status.value==='pending')return
  error.value=null
  if(!config.value)return
  if(!original.value){const normalized=normalizeAmount(amount.value);if(!normalized||!amountAtLeast(normalized,config.value.minimum_deposit)){error.value='invalidAmount';return}if(!file.value){error.value='chooseFile';return}}
  busy.value=true
  try {
    if(original.value && await recover())return
    const selected=file.value,normalized=normalizeAmount(amount.value)!
    const result=await executeDepositSubmission({draft:original.value,amount:normalized,network:original.value?.network??network.value,active:()=>!disposed,
      upload:async()=>{const fields=new FormData();fields.set('purpose','deposit');fields.set('file',selected!);return (await props.service.request<{file_id:string}>('/uploads',fields)).file_id},
      persist:draft=>{sessionStorage.setItem(storageKey,JSON.stringify(draft));original.value=draft},
      post:draft=>props.service.request('/deposits',{amount:draft.amount,screenshot_file_id:draft.fileId,network:draft.network??network.value},{'Idempotency-Key':draft.key})})
    if(result.status==='abandoned')return
    if(result.status==='submitted')acknowledge();else status.value='recovery'
  }catch(problem){if(disposed)return;failed(problem);if(original.value){status.value='recovery';if(problem instanceof ApiError && problem.status>=400&&problem.status<500&&problem.status!==429){await recover()}}}finally{busy.value=false}
}
</script>
<template>
<div class="template-root">
<div v-if="!history" class="reference-surface reference-deposit"><header class="fixed top-0 w-full z-50 pt-safe bg-surface-container-lowest/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]"><div class="h-14 px-margin-sm flex items-center justify-between"><div class="flex items-center gap-space-xs"><button :aria-label="t('back')" :disabled="busy||status==='pending'" @click="emit('back')"  class="w-11 h-11 flex items-center justify-center text-on-surface rounded-full hover:bg-surface-container-low transition-colors" type="button"><UiIcon :size="22" class="material-symbols-outlined text-[22px]" name="arrow_back"></UiIcon></button><h1 class="font-headline-sm text-headline-sm text-on-surface tracking-tight select-none">{{t('deposit')}}</h1></div></div></header><main class="flex flex-col relative w-full pt-14 bg-surface min-h-screen"><div class="flex flex-col w-full pb-safe">
<div class="px-space-md py-space-sm flex flex-col gap-space-md"><p class="error" role="alert" v-if="error">{{t(error)}} <button :disabled="busy" @click="load()" class="plain" type="button" v-if="!original">{{t('retry')}}</button></p>
<div class="bg-surface-container-lowest rounded-xl p-space-md shadow-sm">
<div class="flex items-center justify-between pb-space-md">
<div class="flex items-center gap-space-sm">
<div class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
<svg aria-label="USDT" class="w-6 h-6" fill="none" viewBox="0 0 32 32" role="img"><circle cx="16" cy="16" r="15" fill="#50AF95"/><path d="M8.2 9.2h15.6v3H18v10.6h-4V12.2H8.2v-3Zm3.2 5.2c1.3.6 2.9.9 4.6.9s3.3-.3 4.6-.9v2.2c-1.3.5-2.8.8-4.6.8s-3.3-.3-4.6-.8v-2.2Z" fill="white"/></svg>
</div>
<div>
<div class="flex items-center gap-space-xs">
<span class="font-headline-sm text-headline-sm text-on-surface">USDT</span>

</div>

</div>
</div>
<div class="text-right">
</div>
</div>
<div class="pt-space-xs">
<div class="mb-space-sm flex flex-col gap-2"><div class="flex items-center justify-between"><span class="font-body-sm text-body-sm text-on-surface font-medium">{{t('network')}}</span><button :disabled="busy||status==='pending'" @click="emit('support')" class="flex items-center gap-1.5 bg-primary hover:bg-primary-container text-on-primary font-body-sm text-body-sm font-medium px-3 py-1.5 rounded-full shadow-sm active:scale-[0.99] transition-all" style="background-color: rgb(217, 119, 6);" type="button"><UiIcon :size="18" class="material-symbols-outlined text-[18px]" name="support_agent"></UiIcon><span class="">{{t('contact')}}</span></button></div><div class="bg-surface-container-low border border-secondary/20 rounded-lg p-space-sm flex items-start gap-space-xs"><UiIcon :size="18" class="material-symbols-outlined text-[18px] text-secondary shrink-0 mt-0.5" name="warning"></UiIcon><p class="font-body-sm text-[12px] text-secondary leading-snug font-medium">{{t('warning')}}</p></div></div>
<div class="grid grid-cols-2 gap-space-xs" id="network-selector">
<button type="button" :disabled="busy||status==='pending'||!!original" @click="network='TRC20'" :class="network==='TRC20'?'ring-2 ring-primary':''" class="network-pill text-left p-space-sm rounded-lg transition-all relative overflow-hidden bg-surface-container-lowest"><span class="font-headline-sm text-headline-sm text-on-surface">TRC20</span><span class="font-body-sm text-body-sm text-on-surface-variant block">{{networks[locale]}}</span></button>
<button type="button" :disabled="busy||status==='pending'||!!original" @click="network='BEP20'" :class="network==='BEP20'?'ring-2 ring-primary':''" class="network-pill text-left p-space-sm rounded-lg transition-all relative overflow-hidden bg-surface-container-lowest"><span class="font-headline-sm text-headline-sm text-on-surface">BEP20</span><span class="font-body-sm text-body-sm text-on-surface-variant block">{{bscNetworks[locale]}}</span></button>
</div>

</div>

<div class="bg-surface-container-lowest rounded-xl p-space-md shadow-sm">
<div class="bg-surface-container-low rounded-lg p-space-sm flex flex-col gap-space-xs">
<div class="flex items-center justify-between">
<span class="font-body-sm text-body-sm text-on-surface-variant">{{t('minimum')}}</span>
<span class="font-label-numeric-md text-label-numeric-md text-on-surface font-semibold">{{config?.minimum_deposit??'—'}} USDT</span>
</div>
<div class="flex items-center justify-between">
<span class="font-body-sm text-body-sm text-on-surface-variant">{{t('arrival')}}</span>
<span class="font-label-numeric-sm text-label-numeric-sm text-primary font-medium flex items-center gap-1">{{config?.arrival_text||'—'}}</span>
</div>
</div>
</div><form @submit.prevent="submit" class="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col gap-space-sm"><div class="flex items-center justify-between pb-1 border-b border-surface-container-low"><div class="flex items-center gap-space-xs"><div class="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0"><UiIcon :size="16" class="material-symbols-outlined text-[16px] text-primary" name="assignment_turned_in"></UiIcon></div><h2 class="font-headline-sm text-headline-sm text-on-surface">{{t('quick')}}</h2></div></div><p class="font-body-sm text-body-sm text-on-surface-variant">{{t('explanation')}}</p><div class="flex flex-col gap-1.5 mt-1"><label class="font-body-sm text-body-sm text-on-surface font-medium flex items-center justify-between" for="deposit-amount"><span class="">{{t('amount')}}</span><span class="font-label-caps text-label-caps text-on-surface-variant font-normal">USDT</span></label><div class="relative flex items-center"><input :readonly="busy||!!original||status==='pending'" autocomplete="off" class="w-full h-11 bg-surface-container-low rounded-lg px-space-sm pr-16 text-body-md font-label-numeric-md text-on-surface placeholder:text-outline-variant focus:outline-none focus:ring-1 focus:ring-primary" id="deposit-amount" inputmode="decimal" maxlength="25" placeholder="1000.00" type="text" v-model="amount"/><span class="absolute right-3 font-label-numeric-md text-body-sm text-on-surface-variant font-medium">USDT</span></div></div><div class="flex flex-col gap-1.5 mt-1"><label class="font-body-sm text-body-sm text-on-surface font-medium" for="deposit-proof">{{t('upload')}}</label><div :aria-label="t('upload')" class="border-2 border-dashed border-outline-variant/60 hover:border-primary/60 bg-surface-container-low/50 hover:bg-surface-container-low rounded-xl p-space-md flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-colors text-center source-upload" role="group"><img :alt="t('image')" :src="preview" class="source-proof-preview" v-if="preview"/><div class="w-10 h-10 rounded-full bg-surface-container-lowest shadow-sm flex items-center justify-center text-primary" v-if="!preview"><UiIcon :size="22" class="material-symbols-outlined text-[22px]" name="add_photo_alternate"></UiIcon></div><div class="font-body-sm text-body-sm font-medium text-on-surface" v-if="!preview">{{t('uploadHint')}}</div><div class="font-body-sm text-[11px] text-on-surface-variant" v-if="!preview">{{t('formats')}}</div><input :disabled="busy||!!original||status==='pending'" @change="choose" accept="image/jpeg,image/png" class="source-upload-input" id="deposit-proof" ref="input" type="file"/></div></div><p class="source-feedback" role="status" v-if="status">{{t(status as DepositText)}}</p><button :disabled="busy||!config||status==='pending'" class="w-full h-11 mt-1 bg-primary hover:bg-primary-container text-on-primary font-headline-sm text-body-md rounded-lg flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.99] transition-all" style="background-color: rgb(217, 119, 6);" type="submit"><UiIcon :size="18" class="material-symbols-outlined text-[18px]" name="send"></UiIcon>{{t(busy?'loading':original?'retryOriginal':'submit')}}</button></form>
<div class="mt-space-xs flex flex-col gap-space-sm pb-space-lg">
</div>
</div>
</div>
</div></main></div><div v-else class="reference-surface reference-history"><header class="fixed top-0 w-full z-50 pt-safe bg-surface/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]"><div class="h-14 px-margin-sm flex items-center justify-between"><div class="flex items-center gap-space-sm"><button :aria-label="t('back')" :disabled="busy" @click="emit('back')" class="w-11 h-11 -ml-space-xs flex items-center justify-center text-on-surface hover:text-primary transition-colors active:scale-95" type="button"><UiIcon :size="24" class="material-symbols-outlined text-[24px]" name="arrow_back"></UiIcon></button><h1 class="font-headline-sm text-headline-sm text-on-surface tracking-tight select-none">{{t('records')}}</h1></div><div class="flex items-center gap-space-sm"></div></div></header><main class="flex-1 flex flex-col relative w-full pt-14 pb-safe bg-surface"><div class="flex flex-col w-full">
<div class="px-margin-sm py-space-sm space-y-space-md">
<div class="flex items-center justify-between px-space-xs pt-space-xs">
<div class="flex items-center gap-space-xs">
<span class="font-headline-sm text-headline-sm text-on-surface">{{profileText(locale,'depositDetails')}}</span>
</div>
<button :aria-label="t('retry')" :disabled="busy" @click="load()" class="flex items-center gap-0.5 text-outline hover:text-primary transition-colors text-body-sm font-body-sm active:rotate-180" id="refresh-btn" type="button">
</button>
</div>
<p class="error" role="alert" v-if="error">{{t(error)}} <button :disabled="busy" @click="load()" class="plain" type="button">{{t('retry')}}</button></p><p class="text-center text-outline" v-else-if="!items.length&&!error">{{t('empty')}}</p><div class="space-y-space-sm" id="records-container"><div :key="item.report_no" class="bg-surface-container-lowest rounded-xl p-space-md shadow-sm transition-transform active:scale-[0.99] flex flex-col gap-space-sm" v-for="item in items">
<div class="flex items-start justify-between">
<div class="flex items-center gap-space-sm">
<div class="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
<UiIcon :size="20" class="material-symbols-outlined text-[20px]" name="arrow_downward"></UiIcon>
</div>
<div class="flex flex-col">
<div class="flex items-center gap-space-xs">
<span class="font-headline-sm text-headline-sm text-on-surface font-semibold">{{t('deposit')}}</span>
</div>
<span class="font-label-numeric-sm text-label-numeric-sm text-outline mt-0.5">{{businessTime(item.submitted_at)}}</span>
</div>
</div>
<div class="flex flex-col items-end">
<span class="font-label-numeric-md text-label-numeric-md text-primary font-bold">+{{item.amount}}</span>
<span class="font-body-sm text-body-sm text-outline mt-0.5">USDT</span>
</div>
</div>
</div></div><button :disabled="busy" @click="load(true)" class="plain w-full" type="button" v-if="cursor">{{t('more')}}</button>
<div class="pt-space-sm pb-space-lg flex flex-col items-center justify-center text-center space-y-1">
<BrandMotto :locale="locale"/>
</div>
</div>
<div class="fixed bottom-12 left-1/2 -translate-x-1/2 bg-inverse-surface text-inverse-on-surface px-space-md py-2 rounded-full font-body-sm text-body-sm shadow-xl pointer-events-none transition-opacity duration-300 z-50 flex items-center gap-2 opacity-0" id="toast">
<UiIcon :size="18" class="material-symbols-outlined text-primary text-[18px]" name="check_circle"></UiIcon>
<span class="" id="toast-text">{{t('records')}}</span>
</div>
</div>
</main></div>
</div>
</template>
