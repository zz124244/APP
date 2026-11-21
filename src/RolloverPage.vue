<script setup lang="ts">
import {ref,onMounted,onUnmounted} from 'vue'
import {setupPaymentPassword,recoveryDecision} from './investment-flow'
import UiIcon from './UiIcon.vue'
import {profileText} from './profile-text'
import {investmentText} from './investment-text'
import {depositText} from './deposit-i18n'
import type {Locale} from './i18n'
import {ApiError,type createApi} from './api'
import {commandKey,normalizeAmount,amountAtLeast,clearMatchingDraft} from './deposit'
const props=defineProps<{service:ReturnType<typeof createApi>;locale:Locale;userUid:string}>()
const emit=defineEmits<{back:[];unauthorized:[]}>()
const text={minimum:['最小转入金额','Minimum transfer','最低振替額','최소 전환 금액','Transfert minimum','Mindestumbuchung','最小轉入金額'],hint:['转入后只能购买产品，到期后才能再次提现。最低1 USDT，无手续费。','Moved funds must be invested and reach maturity before withdrawal. Minimum 1 USDT; no fee.','振替後は商品を購入し、満期後に出金可能となります。最低1USDT、手数料無料。','전환 후 상품 구매 및 만기 후 출금할 수 있습니다. 최소 1USDT, 수수료 없음.','Après transfert, investissez et attendez l’échéance pour retirer. Minimum 1 USDT, sans frais.','Nach Umbuchung erst nach Anlage und Fälligkeit auszahlbar. Mindestens 1 USDT, gebührenfrei.','轉入後只能購買產品，到期後才能再次提現。最低1 USDT，無手續費。'],all:['全部','All','全額','전액','Tout','Alles','全部'],success:['转入成功','Funds moved','振替完了','전환 완료','Transfert effectué','Umbuchung erfolgreich','轉入成功']}
const localeIndex:Record<Locale,number>={'zh-CN':0,en:1,ja:2,ko:3,fr:4,de:5,'zh-TW':6}
const p=(key:Parameters<typeof profileText>[1])=>profileText(props.locale,key),t=(key:Parameters<typeof investmentText>[1])=>investmentText(props.locale,key),d=(key:Parameters<typeof depositText>[1])=>depositText(props.locale,key),label=(key:keyof typeof text)=>text[key][localeIndex[props.locale]]
const amount=ref(''),balance=ref(''),password=ref(''),confirmation=ref(''),state=ref(''),busy=ref(true),error=ref(''),success=ref(''),recovery=ref(false),original=ref<{key:string;amount:string}|null>(null)
const storageKey='rollover-draft:'+props.userUid;let disposed=false
function failed(e:unknown){if(e instanceof ApiError&&e.status===401){emit('unauthorized');return}error.value=e instanceof ApiError&&['payment_invalid','payment_locked','insufficient_balance'].includes(e.message)?t(e.message as 'payment_invalid'):e instanceof ApiError&&e.status===422?t('invalid'):d('error')}
function clear(){if(original.value)clearMatchingDraft(sessionStorage,storageKey,original.value.key);original.value=null}
function complete(value:string){clear();success.value=value;recovery.value=false;error.value=''}
async function load(){busy.value=true;try{const [wallet,payment]=await Promise.all([props.service.request<{withdrawable:string}>('/wallet/summary'),props.service.request<{state:string}>('/security/payment-password')]);if(disposed)return;balance.value=wallet.withdrawable;state.value=payment.state;const saved=JSON.parse(sessionStorage.getItem(storageKey)||'null');if(saved&&Object.keys(saved).length===2&&/^[a-f0-9]{32}$/.test(saved.key)&&normalizeAmount(saved.amount)&&amountAtLeast(saved.amount,'1.00')){original.value=saved;amount.value=saved.amount;recovery.value=true}}catch(e){failed(e)}finally{busy.value=false}}
async function recover():Promise<boolean>{if(!original.value)return false;try{const data=await props.service.request<{status:string;retryable:boolean;result?:{amount:string}}>('/business-results/wallet.rollover/'+original.value.key);if(disposed)return true;if(data.status==='succeeded'&&data.result){complete(data.result.amount);return true}if(data.status==='processing'){recovery.value=true;return recoveryDecision(data)==='wait'}if(data.status==='failed'&&!data.retryable){clear();recovery.value=false;error.value=t('changed');return true}return false}catch(e){if(e instanceof ApiError&&e.status===404)return false;throw e}}
async function check(){if(busy.value)return;busy.value=true;try{await recover()}catch(e){failed(e)}finally{busy.value=false}}
async function submit(){if(busy.value||success.value)return;error.value='';if(state.value==='never_set'){if(!/^[0-9]{6}$/.test(password.value)||password.value!==confirmation.value){error.value=t('invalid');return}busy.value=true;try{await setupPaymentPassword(props.service,props.userUid,password.value,confirmation.value,sessionStorage,commandKey);state.value='ready'}catch(e){failed(e);try{state.value=(await props.service.request<{state:string}>('/security/payment-password')).state}catch{}}finally{password.value='';confirmation.value='';busy.value=false}return}
if(!/^[0-9]{6}$/.test(password.value)){error.value=t('invalid');return}const normalized=original.value?.amount||normalizeAmount(amount.value);if(!normalized||!amountAtLeast(normalized,'1.00')){error.value=t('invalid');return}busy.value=true;try{if(original.value&&await recover())return;const value=original.value||{key:commandKey(),amount:normalized};sessionStorage.setItem(storageKey,JSON.stringify(value));original.value=value;const data=await props.service.request<{status:string;amount?:string}>('/wallet/rollovers',{amount:value.amount,payment_password:password.value},{'Idempotency-Key':value.key});if(disposed)return;if(data.status==='completed'&&data.amount)complete(data.amount);else recovery.value=true}catch(e){if(disposed)return;failed(e);if(e instanceof ApiError&&e.status>=400&&e.status<500&&e.status!==429){clear();recovery.value=false}else recovery.value=true}finally{password.value='';busy.value=false}}
onMounted(load);onUnmounted(()=>{disposed=true;password.value='';confirmation.value=''})
</script>
<template>
<div class="reference-surface reference-rollover"><header class="fixed top-0 w-full z-50 bg-surface-container-lowest/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] pt-safe"><div class="h-14 px-margin-sm flex items-center justify-between"><div class="flex items-center gap-space-xs"><button :aria-label="d('back')" :disabled="busy" @click="emit('back')"  class="w-11 h-11 flex items-center justify-center text-on-surface hover:text-primary transition-colors" type="button"><UiIcon :size="24" class="material-symbols-outlined text-[24px]" name="arrow_back"></UiIcon></button></div><div class="absolute left-1/2 -translate-x-1/2 flex items-center pointer-events-none"><h1 class="font-headline-sm text-headline-sm text-on-surface tracking-tight truncate max-w-[200px] text-center">{{p('rollover')}}</h1></div></div></header><main class="flex-1 w-full pt-14 pb-safe bg-surface flex flex-col"><div class="flex flex-col w-full pb-8">
<div class="px-4 pt-3 flex flex-col gap-3"><form @submit.prevent="submit" class="flex flex-col gap-3" v-if="!success"><div class="bg-surface-container-lowest rounded-xl p-4 shadow-sm flex flex-col gap-3.5" data-source-component="rollover-amount">
<div class="flex items-center justify-between">
<span class="text-body-md font-body-md font-semibold text-on-surface">{{p('rollover')}}</span>
<div class="flex items-center gap-1 font-label-numeric-sm text-[11px] text-on-surface-variant">
<span class="">{{p('withdrawable')}}: {{balance||'—'}}</span>
<button :disabled="busy||!!original||!balance" @click="amount=balance" class="text-primary font-semibold hover:underline" id="btn-input-max" type="button">{{label('all')}}</button>
</div>
</div>
<div class="relative flex items-center bg-surface-container-low rounded-lg px-3.5 py-2">
<input :aria-label="p('rollover')" :readonly="busy||!!original" autocomplete="off" class="w-full h-9 bg-transparent font-label-numeric-lg text-[22px] text-on-surface font-semibold placeholder:text-on-surface-variant/40 focus:outline-none" id="amount-input" inputmode="decimal" maxlength="25" placeholder="1.00" type="text" v-model="amount"/>
<div class="flex items-center gap-1 shrink-0 ml-2">
<span class="font-label-numeric-sm text-body-sm text-on-surface-variant font-medium">USDT</span>
</div>
</div>
<div class="flex flex-col gap-2 pt-1">
<div class="flex items-center justify-between text-body-sm font-body-sm">
<span class="text-on-surface-variant">{{label('minimum')}}</span>
<span class="text-on-surface font-label-numeric-sm font-medium">1.00 USDT</span>
</div>
</div>
</div><p class="error" role="alert" v-if="error">{{error}}</p><p class="font-body-sm text-body-sm text-outline" role="status" v-if="recovery">{{t('recover')}} <button :disabled="busy" @click="check" class="plain" type="button">{{t('checkResult')}}</button></p><p class="font-body-sm text-body-sm" v-if="state==='never_set'">{{t('setup')}}</p><div class="bg-surface-container-lowest rounded-xl p-4 shadow-sm flex flex-col gap-2.5" data-source-component="rollover-payment" v-if="true">
<div class="flex items-center justify-between">
<label class="text-body-md font-body-md font-semibold text-on-surface flex items-center gap-1.5" for="rollover-password">{{t('payment')}}</label>
</div>
<div class="relative flex items-center">
<input :readonly="busy" autocomplete="off" class="w-full h-12 pl-3.5 pr-11 bg-surface-container-low rounded-lg text-body-md font-label-numeric-md text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:bg-surface-container-lowest focus:shadow-[0_0_0_2px_rgba(0,105,72,0.2)] transition-all" id="rollover-password" inputmode="numeric" maxlength="6" type="password" v-model="password"/>
</div>
</div><div class="bg-surface-container-lowest rounded-xl p-4 shadow-sm flex flex-col gap-2.5" data-source-component="rollover-payment" v-if="state==='never_set'">
<div class="flex items-center justify-between">
<label class="text-body-md font-body-md font-semibold text-on-surface flex items-center gap-1.5" for="rollover-confirmation">{{t('repeat')}}</label>
</div>
<div class="relative flex items-center">
<input :readonly="busy" autocomplete="off" class="w-full h-12 pl-3.5 pr-11 bg-surface-container-low rounded-lg text-body-md font-label-numeric-md text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:bg-surface-container-lowest focus:shadow-[0_0_0_2px_rgba(0,105,72,0.2)] transition-all" id="rollover-confirmation" inputmode="numeric" maxlength="6" type="password" v-model="confirmation"/>
</div>
</div><div class="bg-surface-container-lowest rounded-xl p-4 shadow-sm flex flex-col gap-3">
<div class="flex items-center gap-2 text-secondary">
<UiIcon :size="20" class="material-symbols-outlined text-[20px]" name="shield"></UiIcon>
<span class="font-headline-sm text-[15px] font-semibold text-on-surface">{{p('rollover')}}</span>
</div>
<div class="flex flex-col gap-2.5 text-body-sm font-body-sm leading-relaxed text-on-surface-variant"><div class="flex items-start gap-2">
<span class="w-1.5 h-1.5 rounded-full bg-secondary shrink-0 mt-2"></span>
<p class="">{{label('hint')}}</p>
</div></div>
</div><button :disabled="busy||!balance" class="w-full h-12 rounded-lg hover:bg-primary-container text-white font-body-lg font-medium shadow-md flex items-center justify-center gap-2 active:scale-[0.99] transition-all bg-primary-container" id="btn-submit-rollover" data-source-id="btn-submit-withdrawal" style="background-color: rgb(217, 119, 6);" type="submit"><UiIcon :size="20" class="material-symbols-outlined text-[20px]" name="check_circle"></UiIcon><span>{{busy?d('loading'):t('confirm')}}</span></button></form><div class="flex-col items-center text-center flex bg-surface-container-lowest rounded-xl p-5 shadow-sm" id="step-3" v-else=""><div class="relative w-16 h-16 rounded-full bg-emerald-50 border-4 border-emerald-100 flex items-center justify-center text-emerald-600 mb-3.5 shadow-[0_0_24px_rgba(5,150,105,0.22)]"><UiIcon :size="34" class="material-symbols-outlined text-[34px] font-bold" name="check"></UiIcon></div><h3 class="text-xl font-bold text-slate-900 tracking-tight mb-1">{{label('success')}}</h3><p class="text-xs text-slate-500 mb-4">{{label('hint')}}</p><div class="w-full bg-slate-50/80 rounded-2xl p-4 flex flex-col gap-2.5 text-xs border border-slate-100 mb-5 text-left"><div class="flex justify-between items-center"><span class="text-slate-400">{{p('rollover')}}</span><span class="font-bold text-slate-900 font-['JetBrains_Mono']" id="step3-amount">{{success}} USDT</span></div></div><div class="flex flex-col w-full gap-2.5"><button @click="emit('back')" class="w-full py-2.5 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 text-xs font-medium transition-colors" id="step3-back-btn" type="button">{{d('back')}}</button></div></div></div>
</div>
</main></div>
</template>
