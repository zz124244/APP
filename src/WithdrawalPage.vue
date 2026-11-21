<script setup lang="ts">
import BrandMotto from './BrandMotto.vue'
import {ref,computed,onMounted,onUnmounted,watch} from 'vue'
import UiIcon from './UiIcon.vue'
import PaymentPin from './PaymentPin.vue'
import type {Locale} from './i18n'
import {ApiError,type createApi} from './api'
import {depositText} from './deposit-i18n'
import {investmentText} from './investment-text'
import {sourceText} from './source-text'
import {commandKey,normalizeAmount,businessTime,clearMatchingDraft} from './deposit'
import {recoveryDecision} from './investment-flow'
import {withdrawalText,readWithdrawalDraft,executeWithdrawal,safeWithdrawalPreview,withdrawalAuthorizationAction,type WithdrawalTextKey,type WithdrawalRules,type WithdrawalPreview,type WithdrawalDraft,type WithdrawalRecord} from './withdrawal-flow'
import {emptyBook,entriesFor,readBook,shortAddress,type AddressBook} from './withdrawal-address-flow'
import {withdrawalAddressText,type WithdrawalAddressTextKey} from './withdrawal-address-text'
const props=defineProps<{service:ReturnType<typeof createApi>;locale:Locale;userUid:string;history?:boolean}>()
const emit=defineEmits<{back:[];unauthorized:[];history:[];setupPassword:[]}>()
const d=(key:Parameters<typeof depositText>[1])=>depositText(props.locale,key),t=(key:Parameters<typeof investmentText>[1])=>investmentText(props.locale,key),w=(key:WithdrawalTextKey)=>withdrawalText(props.locale,key)
const network=ref<'TRC20'|'BEP20'>('TRC20')
const wa=(key:WithdrawalAddressTextKey)=>withdrawalAddressText(props.locale,key)
const book=ref<AddressBook>(emptyBook())
const savedAddresses=computed(()=>entriesFor(book.value,network.value))
const balance=ref(''),rules=ref<WithdrawalRules|null>(null),verified=ref(false),paymentState=ref(''),amount=ref(''),address=ref(''),password=ref(''),busy=ref(false),loaded=ref(false),errorKey=ref(''),accepted=ref(false),pinPrompt=ref(false),preview=ref<WithdrawalPreview|null>(null),draft=ref<WithdrawalDraft|null>(null),recovering=ref(false),records=ref<WithdrawalRecord[]>([]),cursor=ref<string|null>(null)
const storageKey='withdrawal-draft:'+props.userUid;let disposed=false,timer:ReturnType<typeof setTimeout>|undefined
function errorText(key:string){if(key==='storage_unavailable')return d('storage');if(['identity_required','withdrawal_cooldown','withdrawal_address_invalid','withdrawal_limit','withdrawal_daily_limit','insufficient_balance'].includes(key))return w(key as WithdrawalTextKey);if(['preview_expired','preview_changed'].includes(key))return w('preview_changed');if(['payment_invalid','payment_locked','payment_setup_required','preview_expired','preview_changed'].includes(key))return t((({preview_expired:'changed',preview_changed:'changed',payment_setup_required:'setup'} as Record<string,string>)[key]||key) as 'changed'|'payment_invalid'|'payment_locked'|'insufficient_balance'|'setup');return key==='pasteFailed'?w('pasteFailed'):d('error')}
function failed(e:unknown){if(disposed)return;if(e instanceof ApiError&&e.status===401){emit('unauthorized');return}errorKey.value=e instanceof ApiError?e.message:'request_failed'}
function invalidate(){if(!draft.value){preview.value=null;password.value='';pinPrompt.value=false;errorKey.value=''}}
function stored<T>(work:()=>T):T{try{return work()}catch{throw new ApiError('storage_unavailable')}}
function clearDraft(){if(draft.value)stored(()=>clearMatchingDraft(localStorage,storageKey,draft.value!.key));draft.value=null;recovering.value=false}
async function cachedRequest<T>(key:string,path:string,onChange?:(value:T)=>void):Promise<T>{if(typeof props.service.requestCached==='function')return props.service.requestCached<T>(key,path,undefined,{},undefined,{},value=>{if(!disposed)onChange?.(value)});return props.service.request<T>(path)}
async function wallet(){const data=await cachedRequest<{withdrawable:string}>(`user:${props.userUid}:wallet.summary`,'/wallet/summary',value=>{balance.value=value.withdrawable});if(!disposed)balance.value=data.withdrawable}
function complete(){if(disposed)return;clearDraft();preview.value=null;password.value='';pinPrompt.value=false;accepted.value=true;errorKey.value='';timer=setTimeout(()=>{if(disposed)return;accepted.value=false;amount.value='';address.value='';void wallet().catch(failed)},1000)}
async function loadRecords(more=false){if(busy.value)return;busy.value=true;errorKey.value='';try{const data=await props.service.request<{items:WithdrawalRecord[];next_cursor:string|null}>('/withdrawals'+(more&&cursor.value?'?cursor='+encodeURIComponent(cursor.value):''));if(disposed)return;records.value=more?[...records.value,...data.items]:data.items;cursor.value=data.next_cursor;loaded.value=true}catch(e){failed(e)}finally{busy.value=false}}
async function recover():Promise<'wait'|'retry'|'closed'|'success'|'missing'>{
  if(!draft.value)return 'missing';try{const result=await props.service.request<{status:string;retryable?:boolean;message_key?:string}>('/withdrawal-results/'+draft.value.key);if(disposed)return 'wait';const decision=recoveryDecision(result);if(decision==='success'){complete();return 'success'}if(decision==='closed'){clearDraft();preview.value=null;errorKey.value=result.message_key||'preview_changed';return 'closed'}recovering.value=true;return decision}catch(e){if(e instanceof ApiError&&e.status===404)return 'missing';throw e}
}
async function check():Promise<'wait'|'retry'|'closed'|'success'|'missing'|null>{if(busy.value)return null;busy.value=true;errorKey.value='';try{return await recover()}catch(e){failed(e);return null}finally{busy.value=false}}
async function load(){if(props.history){await loadRecords();return}busy.value=true;try{
  const [config,payment]=await Promise.all([cachedRequest<{rules:WithdrawalRules;verified:boolean}>(`user:${props.userUid}:withdrawal-config`,'/withdrawal-config',value=>{rules.value=value.rules;verified.value=value.verified}),cachedRequest<{state:string}>(`user:${props.userUid}:payment-password`,'/security/payment-password',value=>{paymentState.value=value.state}),wallet()]);if(disposed)return;rules.value=config.rules;verified.value=config.verified;paymentState.value=payment.state;void loadSavedAddresses();
  draft.value=readWithdrawalDraft(stored(()=>localStorage.getItem(storageKey)));loaded.value=true;if(draft.value){preview.value=draft.value.preview;amount.value=draft.value.preview.amount;address.value=draft.value.preview.address;network.value=(draft.value.preview.network==='BEP20'?'BEP20':'TRC20');recovering.value=true;await recover()}
}catch(e){failed(e)}finally{busy.value=false}}
async function paste(){if(busy.value||draft.value)return;try{address.value=await navigator.clipboard.readText();invalidate()}catch{errorKey.value='pasteFailed'}}
async function loadSavedAddresses(){try{const data=await props.service.request<AddressBook>('/withdrawal-addresses');if(!disposed)book.value=readBook(data)}catch{/* 地址簿读取失败不影响提现 */}}
function pickAddress(event:Event){const value=(event.target as HTMLSelectElement).value;if(!value||draft.value)return;address.value=value;invalidate()}
async function review(){if(busy.value||accepted.value||draft.value)return;errorKey.value='';const normalized=normalizeAmount(amount.value);if(!normalized){errorKey.value='withdrawal_limit';return}busy.value=true;try{const data=await props.service.request<WithdrawalPreview>('/withdrawals/preview',{amount:normalized,address:address.value,network:network.value});if(disposed)return;preview.value=safeWithdrawalPreview(data);amount.value=data.amount;address.value=data.address;password.value='';pinPrompt.value=false}catch(e){failed(e)}finally{busy.value=false}}
function closePinPrompt(){if(busy.value)return;pinPrompt.value=false;password.value='';if(['payment_invalid','payment_locked'].includes(errorKey.value))errorKey.value=''}
async function requestSubmission(){if(busy.value||accepted.value||!preview.value)return;errorKey.value='';const action=withdrawalAuthorizationAction(paymentState.value,!!draft.value);if(action==='setup'){emit('setupPassword');return}if(action==='unavailable'){errorKey.value='payment_setup_required';return}if(action==='recover'){const status=await check();if(status==='wait'||status==='closed'||status==='success'||status===null)return;if(withdrawalAuthorizationAction(paymentState.value,false)==='pin')pinPrompt.value=true;else emit('setupPassword');return}password.value='';pinPrompt.value=true}
async function submit(){if(busy.value||accepted.value||!preview.value||!pinPrompt.value)return;if(!/^[0-9]{6}$/.test(password.value)){errorKey.value='payment_invalid';return}busy.value=true;errorKey.value='';try{
  if(draft.value){const status=await recover();if(['wait','closed','success'].includes(status))return}
  if(disposed)return;const value=draft.value||{key:commandKey(),preview:preview.value};
  const result=await executeWithdrawal<{status:string}>({draft:value,password:password.value,active:()=>!disposed,persist:d=>{stored(()=>localStorage.setItem(storageKey,JSON.stringify(d)));draft.value=d;recovering.value=true},post:(body,key)=>props.service.request('/withdrawals',body,{'Idempotency-Key':key})});
  if(disposed||!result)return;if(result.status==='pending_review')complete();else{pinPrompt.value=false;recovering.value=true}
}catch(e){if(e instanceof ApiError&&e.message==='payment_setup_required'){pinPrompt.value=false;password.value='';emit('setupPassword')}else failed(e);if(disposed)return;if(draft.value){try{const state=await recover();if(state==='missing'&&e instanceof ApiError&&e.status>=400&&e.status<500&&e.status!==429){clearDraft();preview.value=null}}catch(e2){failed(e2);recovering.value=true}}}finally{password.value='';busy.value=false}}
function recordStatus(record:WithdrawalRecord){if(record.pause_reason)return w('paused');if(record.status==='rejected')return record.reject_reason||w('rejected');return w(record.status as WithdrawalTextKey)}
onMounted(load);watch(()=>props.history,()=>{records.value=[];cursor.value=null;loaded.value=false;void load()});onUnmounted(()=>{disposed=true;clearTimeout(timer);password.value='';pinPrompt.value=false})
</script>
<template>
<div class="template-root">
<div v-if="!history" class="reference-surface reference-withdrawal"><header class="fixed top-0 w-full z-50 bg-surface-container-lowest/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] pt-safe"><div class="h-14 px-margin-sm flex items-center justify-between"><div class="flex items-center gap-space-xs"><button :aria-label="d('back')" :disabled="busy" @click="emit('back')" class="w-11 h-11 flex items-center justify-center text-on-surface hover:text-primary transition-colors" type="button"><UiIcon :size="24" class="material-symbols-outlined text-[24px]" name="arrow_back"></UiIcon></button></div><div class="absolute left-1/2 -translate-x-1/2 flex items-center pointer-events-none"><h1 class="font-headline-sm text-headline-sm text-on-surface tracking-tight truncate max-w-[200px] text-center">{{w('title')}}</h1></div></div></header><main class="flex-1 w-full pt-14 pb-safe bg-surface flex flex-col"><div class="flex flex-col w-full pb-8">
<div class="px-4 pt-3 flex flex-col gap-3"><p class="error" role="alert" v-if="errorKey&&!pinPrompt">{{errorText(errorKey)}}</p><p class="font-body-sm text-body-sm text-error" role="status" v-if="loaded&&!verified">{{w('identity_required')}}</p><div class="bg-surface-container-lowest rounded-xl p-4 shadow-sm flex flex-col gap-2.5" data-source-component="withdrawal-password" v-if="paymentState==='never_set'||paymentState==='reset_required'"><p class="text-body-md text-on-surface-variant" role="status">{{w('withdrawalSetupRequired')}}</p><button type="button" class="text-primary font-medium" @click="emit('setupPassword')">{{t('setup')}}</button></div><button @click="load" class="plain" type="button" v-if="!loaded&&!busy">{{d('retry')}}</button><p role="status" v-if="recovering">{{w('recover')}} <button :disabled="busy" @click="check" type="button">{{t('checkResult')}}</button></p>
<div class="bg-surface-container-lowest rounded-xl p-4 shadow-sm flex flex-col gap-3" v-if="preview"><div class="flex justify-between"><span>{{w('amount')}}</span><span>{{preview.amount}} USDT</span></div><div class="flex justify-between"><span>{{w('fee')}}</span><span>{{preview.fee}} USDT</span></div><div class="flex justify-between"><span>{{w('net')}}</span><span>{{preview.net_amount}} USDT</span></div><p class="break-all">{{preview.address}}</p><button :disabled="busy" @click="invalidate" type="button" v-if="!draft">{{w('edit')}}</button></div>
<div class="bg-surface-container-lowest rounded-xl p-4 shadow-sm flex flex-col gap-3">
<div :aria-label="w('title')" class="grid grid-cols-2 gap-2.5" role="radiogroup"><button type="button" :disabled="busy||!!preview" @click="network='TRC20'" :class="network==='TRC20'?'ring-2 ring-primary':''" class="p-3 rounded-lg bg-primary/5 text-left">TRC20 (Tron)</button><button type="button" :disabled="busy||!!preview" @click="network='BEP20'" :class="network==='BEP20'?'ring-2 ring-primary':''" class="p-3 rounded-lg bg-primary/5 text-left">BEP20 (BSC)</button></div></div>
<div class="bg-surface-container-lowest rounded-xl p-4 shadow-sm flex flex-col gap-2.5">
<div class="flex items-center justify-between">
<label class="text-body-md font-body-md font-semibold text-on-surface flex items-center gap-1.5" for="address-input">
<span class="">{{w('address')}}</span>
<span class="text-body-sm font-label-numeric-sm text-primary font-medium" id="current-net-tag" style="color: rgb(217, 119, 6);">({{network}})</span>
</label>
<div class="flex items-center gap-1">
<button :disabled="busy||accepted||!!preview" @click="paste" class="px-2 py-1 rounded bg-surface-container-low text-primary text-body-sm font-body-sm hover:bg-primary/10 transition-colors flex items-center gap-0.5" id="btn-paste" type="button">
<UiIcon :size="15" class="material-symbols-outlined text-[15px]" name="content_paste"></UiIcon>
<span class="">{{w('paste')}}</span>
</button>
<select v-if="savedAddresses.length" :aria-label="wa('choose')" :disabled="busy||accepted||!!preview" @change="pickAddress($event)" class="px-2 py-1 rounded bg-surface-container-low text-primary text-body-sm font-body-sm max-w-[132px]" id="btn-choose-address">
<option value="">{{wa('choose')}}</option>
<option v-for="item in savedAddresses" :key="item.id" :value="item.address">{{shortAddress(item.address)}}</option>
</select>
<button v-else :aria-label="wa('choose')" :disabled="true" class="px-2 py-1 rounded bg-surface-container-low text-outline/50 text-body-sm font-body-sm cursor-not-allowed opacity-60 flex items-center gap-0.5" id="btn-choose-address" type="button">
<UiIcon :size="15" class="material-symbols-outlined text-[15px]" name="expand_more"></UiIcon>
<span class="">{{wa('choose')}}</span>
</button>
</div>
</div>
<div class="relative flex items-center">
<input :aria-label="w('address')" :readonly="busy||accepted||!!preview" @input="invalidate" autocomplete="off" class="w-full h-12 pl-3.5 pr-11 bg-surface-container-low rounded-lg text-body-md font-label-numeric-md text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:bg-surface-container-lowest focus:shadow-[0_0_0_2px_rgba(0,105,72,0.2)] transition-all" id="address-input" maxlength="44" type="text" v-model="address"/>
</div>
</div>
<div class="bg-surface-container-lowest rounded-xl p-4 shadow-sm flex flex-col gap-3.5">
<div class="flex items-center justify-between">
<span class="text-body-md font-body-md font-semibold text-on-surface">{{w('amount')}}</span>
<div class="flex items-center gap-1 font-label-numeric-sm text-[11px] text-on-surface-variant">
<span class="">{{w('balance')}}: {{balance||'—'}}</span>
<button :disabled="busy||accepted||!!preview||!balance" @click="amount=balance;invalidate()" class="text-primary font-semibold hover:underline" id="btn-input-max" type="button">{{w('all')}}</button>
</div>
</div>
<div class="relative flex items-center bg-surface-container-low rounded-lg px-3.5 py-2">
<input :aria-label="w('amount')" :readonly="busy||accepted||!!preview" @input="invalidate" autocomplete="off" class="w-full h-9 bg-transparent font-label-numeric-lg text-[22px] text-on-surface font-semibold placeholder:text-on-surface-variant/40 focus:outline-none" id="amount-input" inputmode="decimal" maxlength="25" placeholder="0.00" type="text" v-model="amount"/>
<div class="flex items-center gap-1 shrink-0 ml-2">
<span class="font-label-numeric-sm text-body-sm text-on-surface-variant font-medium">USDT</span>
</div>
</div>
<div class="flex flex-col gap-2 pt-1">
<div class="flex items-center justify-between text-body-sm font-body-sm">
<span class="text-on-surface-variant">{{w('minimum')}}</span>
<span class="text-on-surface font-label-numeric-sm font-medium">{{rules?.minimum||'—'}} USDT</span>
</div>
</div>
</div>
<div class="bg-surface-container-lowest rounded-xl p-4 shadow-sm flex flex-col gap-3">
<div class="flex items-center gap-2 text-secondary">
<UiIcon :size="20" class="material-symbols-outlined text-[20px]" name="shield"></UiIcon>
<span class="font-headline-sm text-[15px] font-semibold text-on-surface">{{w('safety')}}</span>
</div>
<div class="flex flex-col gap-2.5 text-body-sm font-body-sm leading-relaxed text-on-surface-variant">
<div class="flex items-start gap-2">
<span class="w-1.5 h-1.5 rounded-full bg-secondary shrink-0 mt-2"></span>
<p class="">{{w('notice1')}}</p>
</div>
<div class="flex items-start gap-2">
<span class="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-2"></span>
<p class="">{{w('notice2')}}</p>
</div>
<div class="flex items-start gap-2">
<span class="w-1.5 h-1.5 rounded-full bg-tertiary shrink-0 mt-2"></span>
<p class="">{{w('notice3')}}</p>
</div><div class="flex items-start gap-2"><span class="w-1.5 h-1.5 rounded-full bg-secondary shrink-0 mt-2"></span><p class="">{{w('notice4')}}</p>
</div>
</div>
</div>
<div class="flex flex-col gap-2.5 pt-2">
<button :disabled="busy||accepted||!loaded||!verified||(['never_set','reset_required'].includes(paymentState))" @click="preview?requestSubmission():review()" class="w-full h-12 rounded-lg hover:bg-primary-container text-white font-body-lg font-medium shadow-md flex items-center justify-center gap-2 active:scale-[0.99] transition-all bg-primary-container" id="btn-submit-withdrawal" style="background-color: rgb(217, 119, 6);" type="button"><UiIcon :size="20" class="material-symbols-outlined text-[20px]" name="check_circle"></UiIcon><span>{{accepted?w('pending_review'):draft?t('checkResult'):preview?w('submit'):w('review')}}</span></button>
</div>
<button :disabled="busy" @click="emit('history')" class="text-primary font-body-md text-body-md py-3" type="button">{{w('history')}}</button><div @click.self="closePinPrompt" :aria-label="t('payment')" aria-modal="true" class="fixed inset-0 z-[100] flex items-end sm:items-center justify-center px-0 sm:px-4 pb-safe bg-slate-900/60 backdrop-blur-sm" role="dialog" v-if="pinPrompt"><section aria-labelledby="withdrawal-pin-title" class="bg-white w-full max-w-sm max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-100 flex flex-col gap-3"><div class="flex items-center justify-between"><h2 class="text-lg font-semibold text-slate-900" id="withdrawal-pin-title">{{t('payment')}}</h2><button :aria-label="t('close')" :disabled="busy" @click="closePinPrompt" class="w-11 h-11 flex items-center justify-center rounded-full text-slate-500 hover:bg-slate-100" type="button"><UiIcon :size="20" class="material-symbols-outlined text-[20px]" name="close"></UiIcon></button></div><p class="text-sm text-slate-600">{{w('amount')}} {{preview?.amount}} USDT · {{w('net')}} {{preview?.net_amount}} USDT</p><PaymentPin :disabled="busy" :error="errorKey?errorText(errorKey):''" :label="t('payment')" :locale="locale" v-if="pinPrompt" v-model="password"></PaymentPin><div class="grid grid-cols-2 gap-2"><button :disabled="busy" @click="closePinPrompt" class="h-11 rounded-lg bg-slate-100 text-slate-700 font-medium" type="button">{{t('close')}}</button><button :disabled="busy||password.length!==6" @click="submit" class="h-11 rounded-lg bg-primary text-white font-medium" type="button">{{busy?d('loading'):w('submit')}}</button></div></section></div></div>
</div>
</main></div><div v-else class="reference-surface reference-withdrawal-history"><header class="fixed top-0 w-full z-50 pt-safe bg-surface-container-lowest/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]"><div class="h-14 px-margin-sm flex items-center justify-between"><div class="flex items-center gap-space-xs"><button :aria-label="d('back')" :disabled="busy" @click="emit('back')" class="w-11 h-11 -ml-space-xs flex items-center justify-center rounded-xl text-on-surface hover:bg-surface-container-low transition-colors" type="button"><UiIcon :size="24" class="material-symbols-outlined text-[24px]" name="arrow_back"></UiIcon></button><h1 class="font-headline-sm text-headline-sm text-on-surface tracking-tight select-none">{{w('history')}}</h1></div><div class="flex items-center gap-space-xs"></div></div></header><main class="flex flex-col relative w-full pt-14 pb-safe bg-surface min-h-screen"><div class="flex flex-col w-full px-margin-sm py-space-md">
<div class="flex items-center justify-between mb-space-md px-space-xs">
<span class="font-headline-sm text-headline-sm text-on-surface tracking-tight">{{w('details')}}</span>
</div>
<p class="error" role="alert" v-if="errorKey">{{errorText(errorKey)}}</p><p role="status" v-if="loaded&&!records.length&&!errorKey">{{w('empty')}}</p><button :disabled="busy" @click="loadRecords(false)" class="plain" type="button">{{d('retry')}}</button><div class="flex flex-col gap-3" id="withdrawal-records"><div :key="record.id" class="w-full bg-surface-container-lowest rounded-xl p-4 shadow-sm flex items-center justify-between" data-original-withdrawal="record" v-for="record in records">
<div class="flex items-center gap-3">
<div class="w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center text-primary">
<UiIcon :size="20" class="material-symbols-outlined text-[20px]" name="arrow_outward"></UiIcon>
</div>
<div class="flex flex-col">
<span class="font-body-lg text-body-lg font-medium text-on-surface">{{w('title')}}</span>
<span class="font-label-numeric-sm text-label-numeric-sm text-tertiary">{{businessTime(record.created_at)}}</span>
<div class="flex items-center gap-1.5 mt-0.5"><span class="text-[10px] px-1 py-0.5 rounded bg-surface-container-low text-primary font-medium tracking-tight">{{record.network}}</span><span class="font-label-numeric-sm text-tertiary select-all">{{record.address}}</span></div><span class="font-body-sm text-body-sm text-tertiary source-withdrawal-status">{{recordStatus(record)}}</span></div>
</div>
<div class="flex flex-col items-end">
<span class="font-label-numeric-lg text-label-numeric-lg text-on-surface font-semibold tracking-tight">-{{record.amount}}</span>
<span class="font-label-numeric-sm text-label-numeric-sm text-tertiary">USDT</span>
</div>
</div></div><button :disabled="busy" @click="loadRecords(true)" class="plain" type="button" v-if="cursor">{{d('more')}}</button>
<div class="w-full mt-12 mb-6 flex flex-col items-center justify-center gap-1.5 opacity-60">
<BrandMotto :locale="locale"/>
<p class="font-label-caps text-label-caps text-tertiary tracking-wider select-none">JIUHE PROTOCOL</p>
</div>
</div></main></div>
</div>
</template>
