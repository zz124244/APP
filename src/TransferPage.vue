<script setup lang="ts">
import BrandMotto from './BrandMotto.vue'
import {ref,onMounted,onUnmounted,watch} from 'vue'
import {ApiError,type createApi} from './api'
import type {Locale} from './i18n'
import UiIcon from './UiIcon.vue'
import {depositText} from './deposit-i18n'
import {investmentText} from './investment-text'
import {transferText,type TransferTextKey} from './transfer-text'
import {cachedRead} from './cached-read'
import {normalizeAmount,amountAtLeast,commandKey,businessTime} from './deposit'
import {editPaymentPin,normalizePaymentPin} from './payment-pin'
import {readTransferDraft,executeTransfer,recoveryDecision,type TransferDraft} from './transfer-flow'
const props=defineProps<{service:ReturnType<typeof createApi>;locale:Locale;userUid:string}>()
const emit=defineEmits<{back:[];unauthorized:[];'setup-password':[]}>()
const w=(k:TransferTextKey)=>transferText(props.locale,k),d=(k:Parameters<typeof depositText>[1])=>depositText(props.locale,k),t=(k:Parameters<typeof investmentText>[1])=>investmentText(props.locale,k)
type Preview={recipient_phone:string;recipient_uid:string;recipient_name_masked:string;amount:string;preview_token:string}
type RecordRow={operation_no:string;transfer_no:string;status:string;direction:'in'|'out';amount:string;fee:string;counterparty_uid:string;counterparty_phone_masked:string;completed_at:string}
const phone=ref(''),uid=ref(''),amount=ref(''),balance=ref(''),hidden=ref(false),pin=ref(''),state=ref(''),busy=ref(false),loaded=ref(false),modal=ref(false),error=ref(''),preview=ref<Preview|null>(null),draft=ref<TransferDraft|null>(null),success=ref<RecordRow|null>(null),records=ref<RecordRow[]>([]),cursor=ref<string|null>(null),showHistory=ref(false)
const storageKey='wallet-transfer:'+props.userUid
let disposed=false
function failure(e:unknown){if(e instanceof ApiError&&e.status===401){emit('unauthorized');return}const key=e instanceof Error?e.message:'';error.value=key==='payment_invalid'||key==='payment_locked'?t(key):key==='identity_required'||key==='transfer_recipient_identity'?w('identity'):key==='transfer_cooldown'?w('cooldown'):key==='insufficient_balance'?w('funds'):key==='payment_setup_required'?t('setup'):key==='transfer_minimum'||key==='transfer_recipient_invalid'?w('invalid'):key==='storage'?w('storage'):['preview_expired','preview_changed','idempotency_conflict','payment_changed'].includes(key)?w('failed'):d('error')}
function persist(value:TransferDraft){try{localStorage.setItem(storageKey,JSON.stringify(value));draft.value=value}catch{throw Error('storage')}}
function clear(){try{if(readTransferDraft(localStorage.getItem(storageKey))?.key===draft.value?.key)localStorage.removeItem(storageKey)}catch{throw Error('storage')}draft.value=null}
async function cachedRequest<T>(key:string,path:string,onChange?:(value:T)=>void):Promise<T>{if(typeof props.service.requestCached==='function')return props.service.requestCached<T>(key,path,undefined,{},undefined,{},value=>{if(!disposed)onChange?.(value)});return props.service.request<T>(path)}
async function refresh(){const wallet=await cachedRequest<{withdrawable:string}>(`user:${props.userUid}:wallet.summary`,'/wallet/summary',value=>{balance.value=value.withdrawable});if(!disposed)balance.value=wallet.withdrawable}
async function recover():Promise<'retry'|'wait'|'done'>{if(!draft.value)return 'retry';try{const r=await props.service.request<{status:string;retryable?:boolean;message_key?:string;result?:RecordRow}>('/business-results/wallet.transfer/'+draft.value.key);if(disposed)return 'wait';const action=recoveryDecision(r);if(action==='success'&&r.result){success.value=r.result;modal.value=false;return 'done'}if(action==='failed'){clear();preview.value=null;modal.value=false;if(r.message_key)failure(new ApiError(r.message_key));else if(!error.value)error.value=w('failed');await refresh();return 'done'}return action==='retry'?'retry':'wait'}catch(e){if(e instanceof ApiError&&e.status===404)return 'retry';throw e}}
async function loadRecords(more=false){try{const key=`user:${props.userUid}:wallet.transfers:1`;const apply=(result:{items:RecordRow[];next_cursor:string|null})=>{if(!disposed&&!more){records.value=result.items;cursor.value=result.next_cursor}};const result=more?await props.service.request<{items:RecordRow[];next_cursor:string|null}>('/wallet/transfers'+(cursor.value?'?cursor='+cursor.value:'')):await cachedRead(props.service,key,'/wallet/transfers',apply);if(disposed)return;records.value=more?[...records.value,...result.items]:result.items;cursor.value=result.next_cursor}catch(e){if(!disposed)failure(e)}}
async function load(){busy.value=true;try{const raw=localStorage.getItem(storageKey);draft.value=readTransferDraft(raw);if(raw&&!draft.value)throw Error('storage');if(draft.value){phone.value=draft.value.recipient_phone;uid.value=draft.value.recipient_uid;amount.value=draft.value.amount}const security=await cachedRequest<{state:string}>(`user:${props.userUid}:payment-password`,'/security/payment-password',value=>{state.value=value.state});if(disposed)return;state.value=security.state;await refresh();if(draft.value)await recover();if(!disposed)loaded.value=true}catch(e){if(!disposed)failure(e)}finally{busy.value=false}}
async function check(){if(busy.value)return;busy.value=true;try{await recover()}catch(e){if(!disposed)failure(e)}finally{busy.value=false}}
function closeModal(){if(busy.value)return;modal.value=false;pin.value=''}
async function open(){if(busy.value||success.value)return;error.value='';pin.value='';busy.value=true;try{if(draft.value){if(await recover()==='retry'&&!disposed)modal.value=true;return}if(state.value==='never_set'){error.value=t('setup');return}const normalPhone=/^1[3-9][0-9]{9}$/.test(phone.value)?'+86'+phone.value:phone.value;const a=normalizeAmount(amount.value);if(!/^\+861[3-9][0-9]{9}$/.test(normalPhone)||!/^[1-9][0-9]{0,19}$/.test(uid.value)||!a||!amountAtLeast(a,'100.00')){error.value=w('invalid');return}const p=await props.service.request<Preview>('/wallet/transfers/preview',{recipient_phone:normalPhone,recipient_uid:uid.value,amount:a});if(disposed)return;preview.value=p;modal.value=true}catch(e){if(!disposed)failure(e)}finally{busy.value=false}}
function pinInput(e:Event){const n=e.target as HTMLInputElement;n.value=busy.value?pin.value:normalizePaymentPin(n.value);if(!busy.value)pin.value=n.value}
function digit(key:string){if(!busy.value)pin.value=editPaymentPin(pin.value,key)}
async function submit(){if(busy.value||pin.value.length!==6)return;busy.value=true;error.value='';try{if(draft.value){const result=await recover();if(result!=='retry')return}const p=preview.value;const v=draft.value||(p?{key:commandKey(),recipient_phone:p.recipient_phone,recipient_uid:p.recipient_uid,amount:p.amount,recipient_name_masked:p.recipient_name_masked,preview_token:p.preview_token}:null);if(!v)throw Error('preview_changed');const result=await executeTransfer({draft:v,pin:pin.value,active:()=>!disposed,persist,post:(body,key)=>props.service.request<RecordRow>('/wallet/transfers',body,{'Idempotency-Key':key})});if(disposed)return;if(result?.status==='completed'){success.value=result;modal.value=false}else await recover()}catch(e){if(!disposed){failure(e);if(draft.value){try{await recover()}catch(problem){failure(problem)}}}}finally{pin.value='';busy.value=false}}
async function closeSuccess(){if(busy.value)return;busy.value=true;try{clear();success.value=null;phone.value='';uid.value='';amount.value='';preview.value=null;await refresh();if(showHistory.value)await loadRecords()}catch(e){failure(e)}finally{busy.value=false}}
watch(pin,v=>{if(v.length===6&&!busy.value)void submit()})
onMounted(load);onUnmounted(()=>{disposed=true;pin.value=''})
</script>

<template>
<div class="reference-surface reference-transfer"><header class="fixed top-0 w-full z-50 pt-safe bg-surface-container-lowest/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]"><div class="h-14 px-margin-sm flex items-center justify-between relative"><button :aria-label="d('back')" :disabled="busy" @click="emit('back')"  class="w-11 h-11 flex items-center justify-center text-on-surface hover:text-primary transition-colors -ml-space-xs"><UiIcon :size="24" class="material-symbols-outlined text-[24px]" name="arrow_back"></UiIcon></button><div class="absolute inset-0 flex items-center justify-center pointer-events-none"><h1 class="font-headline-sm text-headline-sm text-on-surface tracking-tight truncate max-w-[50vw]">{{w('title')}}</h1></div></div></header><main class="flex flex-col relative w-full pt-14 pb-safe bg-surface min-h-screen"><div v-if="!success" class="flex flex-col w-full px-margin-sm pb-space-xl gap-space-md">

<section class="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden mt-space-sm">
<div class="p-space-md flex flex-col gap-space-sm bg-gradient-to-br from-primary-fixed/20 via-surface-container-lowest to-surface-container-lowest">
<div class="flex items-center justify-between">
<div class="flex items-center gap-space-xs">
<UiIcon :size="18" class="material-symbols-outlined text-primary text-[18px]" name="account_balance_wallet"></UiIcon>
<span class="font-body-sm text-body-sm text-on-surface-variant font-medium">{{w('balance')}}</span>
</div>
<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed font-label-caps text-label-caps font-semibold">
<span class="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>{{w('instant')}}</span>
</div>
<div class="flex items-baseline justify-between pt-1">
<div class="flex items-baseline gap-1.5">
<span class="font-headline-lg-mobile text-headline-lg-mobile font-semibold text-on-surface tracking-tight" id="balanceDisplay">{{hidden?'••••••':balance||'—'}}</span>
<span class="font-label-numeric-md text-label-numeric-md text-primary font-bold" style="color: rgb(217, 119, 6);">USDT</span>
</div>
<button :aria-label="w('visibility')" @click="hidden=!hidden"  class="text-tertiary hover:text-on-surface transition-colors p-1" id="balanceVisibilityBtn" type="button">
<UiIcon :name="hidden?'eyeOff':'eye'"></UiIcon></button>
</div>
<div class="flex items-center justify-between pt-space-xs text-on-surface-variant bg-surface-container-low px-3 py-2 rounded-lg">
<div class="flex items-center gap-2 min-w-0">
<div class="w-5 h-5 rounded-full bg-primary-container text-on-primary flex items-center justify-center shrink-0">
<UiIcon :size="13" class="material-symbols-outlined text-[13px]" name="swap_horiz"></UiIcon>
</div>
<span class="font-body-sm text-body-sm truncate text-on-surface font-medium">{{w('internal')}}</span>
</div>
<span class="font-label-caps text-label-caps text-primary font-semibold shrink-0">{{w('gas')}}</span>
</div>
</div>
</section>

<section class="bg-surface-container-lowest rounded-xl shadow-sm p-space-md flex flex-col gap-space-md">
<div class="flex items-center justify-between">
<div class="flex items-center gap-1.5">
<UiIcon :size="20" class="material-symbols-outlined text-primary text-[20px]" name="person_pin"></UiIcon>
<h2 class="font-headline-sm text-headline-sm text-on-surface">{{w('recipient')}}</h2>
</div>
</div>


<div class="flex flex-col gap-1.5">
<div class="relative flex items-center bg-surface-container-low rounded-xl px-3 py-2 transition-all focus-within:bg-surface-container-lowest focus-within:shadow-[0_0_0_2px_rgba(0,105,72,0.18)]"><div class="flex items-center gap-1 shrink-0 mr-2 py-1 px-2.5 rounded-lg bg-surface-container-lowest shadow-sm text-on-surface font-body-sm text-body-sm font-medium"><UiIcon :size="16" class="material-symbols-outlined text-[16px] text-primary" name="smartphone"></UiIcon><span class="">{{w('phone')}}</span></div>
<input :aria-label="w('phone')" :placeholder="w('phone')" :readonly="busy||!!draft" autocomplete="off" class="w-full bg-transparent text-on-surface placeholder:text-outline font-label-numeric-md text-label-numeric-md focus:outline-none px-2 tracking-wide" id="recipientInput" inputmode="tel" maxlength="20"  type="tel" v-model="phone"/>
<div class="absolute right-2 flex items-center gap-1">
</div>
</div>
</div>

<div class="relative flex items-center bg-surface-container-low rounded-xl px-3 py-2 transition-all focus-within:bg-surface-container-lowest focus-within:shadow-[0_0_0_2px_rgba(0,105,72,0.18)]" id="verifiedCard"><div class="flex items-center gap-1 shrink-0 mr-2 py-1 px-2.5 rounded-lg bg-surface-container-lowest shadow-sm text-on-surface font-body-sm text-body-sm font-medium"><UiIcon :size="16" class="material-symbols-outlined text-[16px] text-primary" name="badge"></UiIcon><span class="">{{w('uid')}}</span></div><input :aria-label="w('uid')" :placeholder="w('uid')" :readonly="busy||!!draft" autocomplete="off" class="w-full bg-transparent text-on-surface placeholder:text-outline font-label-numeric-md text-label-numeric-md focus:outline-none px-2 tracking-wide" id="uidInput" inputmode="numeric" maxlength="20"  type="text" v-model="uid"/><div class="flex items-center gap-1 shrink-0 pl-1"></div></div>
</section>

<section class="bg-surface-container-lowest rounded-xl shadow-sm p-space-md flex flex-col gap-space-sm">
<div class="flex items-center justify-between">
<label class="font-body-md text-body-md text-on-surface font-semibold flex items-center gap-1.5" for="amountInput">
<UiIcon :size="18" class="material-symbols-outlined text-primary text-[18px]" name="toll"></UiIcon>{{w('amount')}}</label>
<div class="flex items-center gap-1.5">
<span class="font-body-sm text-body-sm text-on-surface-variant">{{w('available')}}</span>
<span class="font-label-numeric-sm text-label-numeric-sm font-medium text-on-surface">{{hidden?'••••••':balance||'—'}}</span>
<button :disabled="busy||!!draft||!balance" @click="amount=balance" class="font-body-sm text-body-sm font-semibold text-primary hover:text-primary-container transition-colors ml-0.5" id="quickMaxInline" type="button">{{w('all')}}</button>
</div>
</div>

<div class="bg-surface-container-low rounded-xl px-4 py-3 flex items-center justify-between focus-within:bg-surface-container-lowest focus-within:shadow-[0_0_0_2px_rgba(0,105,72,0.18)] transition-all">
<div class="flex items-baseline gap-2 w-full min-w-0">
<input :aria-label="w('amount')" :placeholder="w('amount')" :readonly="busy||!!draft" autocomplete="off" class="w-full bg-transparent text-on-surface font-headline-lg-mobile text-headline-lg-mobile font-bold tracking-tight placeholder:text-outline focus:outline-none" id="amountInput" inputmode="decimal" maxlength="25"  type="text" v-model="amount"/>
</div>
<div class="flex items-center gap-1.5 shrink-0 pl-2">
<span class="font-label-numeric-md text-label-numeric-md font-bold text-on-surface">USDT</span>
<button :aria-label="w('clear')" :disabled="busy||!!draft" @click="amount=''"  class="text-tertiary hover:text-on-surface text-[18px] flex items-center justify-center p-0.5" id="clearAmountBtn" type="button">
</button>
</div>
</div>


<div class="flex items-start gap-1.5 pt-1 text-on-surface-variant font-body-sm text-body-sm leading-tight">
<UiIcon :size="16" class="material-symbols-outlined text-[16px] text-tertiary shrink-0 mt-0.5" name="info"></UiIcon>
<span class="">{{w('minimum').split('100')[0]}}<strong class="font-label-numeric-sm text-on-surface">100 USDT</strong>{{w('minimum').split('USDT')[1]}}</span>
</div>
</section>


<p class="error" role="alert" v-if="error">{{error}} <button v-if="state==='never_set'" type="button" class="underline" @click="emit('setup-password')">{{t('setup')}}</button></p><p class="font-body-sm text-body-sm" role="status" v-if="draft&&!success">{{w('recover')}} <button :disabled="busy" @click="check" type="button">{{w('check')}}</button></p><button :disabled="busy" @click="showHistory=!showHistory;loadRecords()" class="text-primary font-body-md text-body-md" type="button">{{w('history')}}</button><button :disabled="busy||!loaded" @click="open" class="w-full h-12 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-headline-sm text-headline-sm font-medium shadow-md active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer" id="submitTransferBtn" style="background-color: rgb(217, 119, 6);" type="button">
<UiIcon :size="20" class="material-symbols-outlined text-[20px]" name="lock"></UiIcon>
<span class="">{{w('confirm')}}</span>
<UiIcon :size="18" class="material-symbols-outlined text-[18px]" name="arrow_forward"></UiIcon>
</button><div :aria-label="w('payment')" aria-modal="true" class="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-inverse-surface/60 backdrop-blur-sm transition-all duration-300 opacity-100" id="pinModalOverlay" role="dialog" v-if="modal">
<div class="w-full sm:max-w-md bg-surface-container-lowest rounded-t-2xl sm:rounded-2xl shadow-xl flex flex-col overflow-hidden transition-all duration-300 sm:translate-y-0 pb-safe translate-y-0 sm:scale-100" id="pinModalContent">

<div class="flex items-center justify-between px-4 py-3.5 border-b border-surface-container">
<button :aria-label="w('close')" :disabled="busy" @click="closeModal" class="w-9 h-9 flex items-center justify-center text-tertiary hover:text-on-surface rounded-full transition-colors" id="closePinModalBtn" type="button">
<UiIcon :size="22" class="material-symbols-outlined text-[22px]" name="close"></UiIcon>
</button>
<h3 class="font-headline-sm text-[17px] font-semibold text-on-surface tracking-tight" >{{w('payment')}}</h3>
<div class="w-9 h-9"></div>
</div>

<div v-if="state!=='never_set'" class="flex flex-col items-center justify-center pt-5 pb-3 px-4">
<span class="text-body-sm text-on-surface-variant font-medium">{{w('debit')}}</span>
<div class="flex items-baseline gap-1 mt-1">
<span class="font-headline-lg-mobile text-[32px] font-bold text-on-surface tracking-tight font-label-numeric-lg" id="modalAmountDisplay">{{draft?.amount||preview?.amount||'—'}}</span>
<span class="font-label-numeric-md text-label-numeric-md font-bold" style="color: rgb(217, 119, 6);">USDT</span>
</div>
<div class="mt-2 px-2.5 py-0.5 rounded-full bg-surface-container-low text-on-surface-variant text-[12px] flex items-center gap-1 font-body-sm">
<UiIcon :size="14" class="material-symbols-outlined text-[14px] text-primary" name="verified_user"></UiIcon>
<span class="">{{w('instant')}}</span>
</div>
<p class="text-body-sm text-on-surface-variant">{{draft?.recipient_name_masked||preview?.recipient_name_masked||'***'}} · UID {{draft?.recipient_uid||preview?.recipient_uid}}</p></div>

<div class="px-6 py-3 flex justify-center source-pin-container">
<div class="grid grid-cols-6 gap-2.5 w-full max-w-[320px]" id="pinBoxesContainer"><div class="pin-box h-12 rounded-xl flex items-center justify-center border-2 border-red-500 shadow-sm transition-all" :style="{borderColor:pin.length===0?'rgba(217, 119, 6, 0.4)':'transparent'}"><span :class="pin.length>=1?'opacity-100 scale-100':'opacity-0 scale-50'" class="w-3.5 h-3.5 rounded-full bg-red-500 transition-all duration-150"></span></div><div class="pin-box h-12 rounded-xl flex items-center justify-center border-2 border-red-500 shadow-sm transition-all" :style="{borderColor:pin.length===1?'rgba(217, 119, 6, 0.4)':'transparent'}"><span :class="pin.length>=2?'opacity-100 scale-100':'opacity-0 scale-50'" class="w-3.5 h-3.5 rounded-full bg-red-500 transition-all duration-150"></span></div><div class="pin-box h-12 rounded-xl flex items-center justify-center border-2 border-red-500 shadow-sm transition-all" :style="{borderColor:pin.length===2?'rgba(217, 119, 6, 0.4)':'transparent'}"><span :class="pin.length>=3?'opacity-100 scale-100':'opacity-0 scale-50'" class="w-3.5 h-3.5 rounded-full bg-red-500 transition-all duration-150"></span></div><div class="pin-box h-12 rounded-xl flex items-center justify-center border-2 border-red-500 shadow-sm transition-all" :style="{borderColor:pin.length===3?'rgba(217, 119, 6, 0.4)':'transparent'}"><span :class="pin.length>=4?'opacity-100 scale-100':'opacity-0 scale-50'" class="w-3.5 h-3.5 rounded-full bg-red-500 transition-all duration-150"></span></div><div class="pin-box h-12 rounded-xl flex items-center justify-center border-2 border-red-500 shadow-sm transition-all" :style="{borderColor:pin.length===4?'rgba(217, 119, 6, 0.4)':'transparent'}"><span :class="pin.length>=5?'opacity-100 scale-100':'opacity-0 scale-50'" class="w-3.5 h-3.5 rounded-full bg-red-500 transition-all duration-150"></span></div><div class="pin-box h-12 rounded-xl flex items-center justify-center border-2 border-red-500 shadow-sm transition-all" :style="{borderColor:pin.length===5?'rgba(217, 119, 6, 0.4)':'transparent'}"><span :class="pin.length>=6?'opacity-100 scale-100':'opacity-0 scale-50'" class="w-3.5 h-3.5 rounded-full bg-red-500 transition-all duration-150"></span></div></div>
<input :aria-label="w('payment')" :readonly="busy" :value="pin" @input="pinInput" autocomplete="off" class="source-pin-input" inputmode="none" maxlength="6" type="password"/></div>
<div class="mx-6 mb-2"><div class="text-center mt-1 pb-1"></div></div>

<div class="bg-surface-container-low/90 grid grid-cols-3 gap-[1px] pt-1.5 pb-2 px-1 select-none">
<button :disabled="busy" @click="digit('1')" class="keypad-num h-14 bg-surface-container-lowest text-on-surface text-[22px] font-label-numeric-lg font-semibold flex items-center justify-center rounded-lg active:bg-surface-container transition-colors" data-key="1" type="button">1</button>
<button :disabled="busy" @click="digit('2')" class="keypad-num h-14 bg-surface-container-lowest text-on-surface text-[22px] font-label-numeric-lg font-semibold flex items-center justify-center rounded-lg active:bg-surface-container transition-colors" data-key="2" type="button">2</button>
<button :disabled="busy" @click="digit('3')" class="keypad-num h-14 bg-surface-container-lowest text-on-surface text-[22px] font-label-numeric-lg font-semibold flex items-center justify-center rounded-lg active:bg-surface-container transition-colors" data-key="3" type="button">3</button>
<button :disabled="busy" @click="digit('4')" class="keypad-num h-14 bg-surface-container-lowest text-on-surface text-[22px] font-label-numeric-lg font-semibold flex items-center justify-center rounded-lg active:bg-surface-container transition-colors" data-key="4" type="button">4</button>
<button :disabled="busy" @click="digit('5')" class="keypad-num h-14 bg-surface-container-lowest text-on-surface text-[22px] font-label-numeric-lg font-semibold flex items-center justify-center rounded-lg active:bg-surface-container transition-colors" data-key="5" type="button">5</button>
<button :disabled="busy" @click="digit('6')" class="keypad-num h-14 bg-surface-container-lowest text-on-surface text-[22px] font-label-numeric-lg font-semibold flex items-center justify-center rounded-lg active:bg-surface-container transition-colors" data-key="6" type="button">6</button>
<button :disabled="busy" @click="digit('7')" class="keypad-num h-14 bg-surface-container-lowest text-on-surface text-[22px] font-label-numeric-lg font-semibold flex items-center justify-center rounded-lg active:bg-surface-container transition-colors" data-key="7" type="button">7</button>
<button :disabled="busy" @click="digit('8')" class="keypad-num h-14 bg-surface-container-lowest text-on-surface text-[22px] font-label-numeric-lg font-semibold flex items-center justify-center rounded-lg active:bg-surface-container transition-colors" data-key="8" type="button">8</button>
<button :disabled="busy" @click="digit('9')" class="keypad-num h-14 bg-surface-container-lowest text-on-surface text-[22px] font-label-numeric-lg font-semibold flex items-center justify-center rounded-lg active:bg-surface-container transition-colors" data-key="9" type="button">9</button>
<div class="h-14 bg-surface-container-low/50 rounded-lg flex items-center justify-center text-tertiary">
<UiIcon :size="20" class="material-symbols-outlined text-[20px] opacity-40" name="lock"></UiIcon>
</div>
<button :disabled="busy" @click="digit('0')" class="keypad-num h-14 bg-surface-container-lowest text-on-surface text-[22px] font-label-numeric-lg font-semibold flex items-center justify-center rounded-lg active:bg-surface-container transition-colors" data-key="0" type="button">0</button>
<button :aria-label="w('clear')" :disabled="busy" @click="digit('backspace')" class="h-14 bg-surface-container-low text-on-surface text-[20px] flex items-center justify-center rounded-lg active:bg-surface-container transition-colors" id="keypadBackspaceBtn" type="button">
<UiIcon :size="24" class="material-symbols-outlined text-[24px]" name="backspace"></UiIcon>
</button>
</div>
<p class="error" role="alert" v-if="error">{{error}}</p></div>
</div><section class="bg-surface-container-low/60 rounded-xl p-space-md flex flex-col gap-space-sm">
<div class="flex items-center gap-2 text-primary font-body-md text-body-md font-semibold">
<UiIcon :size="20" class="material-symbols-outlined text-[20px]" name="shield_fill1" style='font-variation-settings: "FILL" 1;'></UiIcon>
<span class="">{{w('protocol')}}</span>
</div>
<ul class="flex flex-col gap-2 font-body-sm text-body-sm text-on-surface-variant leading-relaxed pl-1">
<li class="flex items-start gap-2">
<span class="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0"></span>
<span class="">{{w('rule1')}}</span>
</li>
<li class="flex items-start gap-2">
<span class="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0"></span>
<span class="">{{w('rule2')}}</span>
</li>
<li class="flex items-start gap-2">
<span class="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0"></span>
<span class="">{{w('rule3')}}</span>
</li>
</ul>
</section>

<div class="flex flex-col gap-space-sm pt-2">

<div class="flex flex-col items-center justify-center text-center gap-0.5 py-1">
<BrandMotto :locale="locale"/>
</div>
</div>


</div>
<section v-if="showHistory" class="flex flex-col gap-space-sm"><h2>{{w('history')}}</h2><div :key="row.operation_no" class="tx-card bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col gap-space-xs hover:bg-surface-container-low/50 transition-all cursor-pointer" data-category="transfer" data-original-transfer-record="" v-for="row in records">
<div class="flex items-start justify-between">
<div class="flex items-start gap-space-sm min-w-0">
<div class="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center flex-shrink-0 text-on-surface mt-0.5">
<UiIcon :size="20" class="material-symbols-outlined text-[20px]" name="send_fill1" style='font-variation-settings: "FILL" 1;'></UiIcon>
</div>
<div class="flex flex-col min-w-0">
<div class="flex items-center gap-1.5">
<span class="font-label-caps text-label-caps px-1.5 py-0.5 rounded bg-surface-container-highest text-on-surface-variant">{{row.direction==='out'?'−':'+'}} UID {{row.counterparty_uid}} · {{row.counterparty_phone_masked}}</span>
</div>
<div class="font-label-numeric-sm text-label-numeric-sm text-on-surface-variant mt-1">{{businessTime(row.completed_at)}}</div>
</div>
</div>
<div class="flex flex-col items-end flex-shrink-0 pl-space-xs">
<span class="font-label-numeric-lg text-label-numeric-lg font-bold text-on-surface">{{row.direction==='out'?'−':'+'}}{{row.amount}}</span>
<span class="font-label-caps text-label-caps text-on-surface-variant">USDT</span>
</div>
</div>
</div><p v-if="!records.length">{{w('empty')}}</p><button v-if="cursor" type="button" :disabled="busy" @click="loadRecords(true)">{{w('more')}}</button></section><div class="flex-col items-center text-center flex bg-surface-container-lowest rounded-xl p-5 shadow-sm" id="step-3" v-if="success"><div class="relative w-16 h-16 rounded-full bg-emerald-50 border-4 border-emerald-100 flex items-center justify-center text-emerald-600 mb-3.5 shadow-[0_0_24px_rgba(5,150,105,0.22)]"><UiIcon :size="34" class="material-symbols-outlined text-[34px] font-bold" name="check"></UiIcon></div><h3 class="text-xl font-bold text-slate-900 tracking-tight mb-1">{{w('success')}}</h3><p class="text-xs text-slate-500 mb-4">{{w('instant')}}</p><div class="w-full bg-slate-50/80 rounded-2xl p-4 flex flex-col gap-2.5 text-xs border border-slate-100 mb-5 text-left"><div class="flex justify-between items-center"><span class="text-slate-400">{{w('amount')}}</span><span class="font-bold text-slate-900 font-['JetBrains_Mono']" id="step3-amount">{{success?.amount}} USDT</span></div></div><div class="flex flex-col w-full gap-2.5"><button @click="closeSuccess()" class="w-full py-2.5 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 text-xs font-medium transition-colors" id="step3-back-btn" type="button">{{w('close')}}</button></div></div></main></div>
</template>
