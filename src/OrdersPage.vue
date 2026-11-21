<script setup lang="ts">
import BrandMotto from './BrandMotto.vue'
import {sourceText,sourcePayout} from './source-text'
import {ref,onMounted,onUnmounted} from 'vue'
import UiIcon from './UiIcon.vue'
import {investmentText,type InvestmentKey} from './investment-text'
import {depositText} from './deposit-i18n'
import {businessTime} from './deposit'
import {ApiError,type createApi} from './api'
import type {Locale} from './i18n'
import type {InvestmentOrder} from './investment-flow'
const props=defineProps<{service:ReturnType<typeof createApi>;locale:Locale;orderNo?:string}>()
const emit=defineEmits<{back:[];unauthorized:[]}>()
const items=ref<InvestmentOrder[]>([]),selected=ref<InvestmentOrder|null>(null),history=ref(false),cursor=ref<string|null>(null),busy=ref(false),error=ref(false),notice=ref('')
let disposed=false
const t=(key:InvestmentKey)=>investmentText(props.locale,key),d=(key:Parameters<typeof depositText>[1])=>depositText(props.locale,key)
async function load(append=false){if(busy.value)return;busy.value=true;error.value=false;try{const data=await props.service.request<{items:InvestmentOrder[];next_cursor:string|null}>('/investments?'+(history.value?'history=1&':'')+(append&&cursor.value?'cursor='+cursor.value:''));if(!disposed){items.value=append?[...items.value,...data.items]:data.items;cursor.value=data.next_cursor}}catch(problem){if(!disposed){error.value=true;if(problem instanceof ApiError&&problem.status===401)emit('unauthorized')}}finally{busy.value=false}}
async function toggleHistory(){if(busy.value)return;history.value=!history.value;items.value=[];await load()}
function back(){if(busy.value)return;if(selected.value){selected.value=null;if(!items.value.length)void load()}else emit('back')}
onMounted(async()=>{if(props.orderNo){busy.value=true;try{selected.value=await props.service.request<InvestmentOrder>('/investments/'+encodeURIComponent(props.orderNo))}catch(problem){error.value=true;if(problem instanceof ApiError&&problem.status===401)emit('unauthorized')}finally{busy.value=false}}else await load()})
onUnmounted(()=>{disposed=true})
</script>
<template>
<div class="reference-surface reference-orders"><header class="fixed top-0 w-full z-50 pt-safe bg-surface-container-lowest/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]"><div class="h-14 px-margin-sm flex items-center justify-between"><button :aria-label="d('back')" :disabled="busy" @click="back"  class="w-11 h-11 flex items-center justify-center -ml-2 rounded-lg text-on-surface hover:bg-surface-container transition-colors" type="button"><UiIcon :size="22" class="material-symbols-outlined text-[22px]" name="arrow_back"></UiIcon></button><h1 class="text-headline-sm font-headline-sm text-on-surface text-center flex-1 mx-space-sm truncate">{{t('orders')}}</h1><button :disabled="busy" @click="toggleHistory" class="source-history-toggle" type="button" v-if="!selected">{{t(history?'active':'history')}}</button></div></header><main class="flex flex-col relative w-full pt-14 pb-safe bg-surface min-h-screen"><div class="flex flex-col w-full">
<div class="px-margin-sm py-space-md space-y-space-md">
<div class="flex items-center justify-between pt-1">
<div class="flex items-center space-x-2">
<div class="w-1.5 h-3.5 bg-primary rounded-full"></div>
<h2 class="text-headline-sm font-headline-sm text-on-surface">{{t(history?'history':'active')}}</h2>
</div>
</div><p class="error" role="alert" v-if="error">{{d('error')}} <button :disabled="busy" @click="load()" class="plain" type="button">{{d('retry')}}</button></p><p class="text-center text-outline" v-else-if="!selected&&!items.length&&!error">{{t('noOrders')}}</p>
<template :key="order.order_no" v-for="order in selected?[selected]:items"><div class="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-surface-container-high transition-all space-y-4" data-original-order="vip" v-if="order.category==='vip'">
<div>
<div class="flex items-start justify-between gap-2">
<div class="space-y-1.5 min-w-0">
<div class="flex items-center space-x-2">
<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-secondary-fixed text-on-secondary-fixed border border-secondary-fixed-dim/40">
<UiIcon :size="12" class="material-symbols-outlined text-[12px] mr-0.5 text-secondary" name="workspace_premium"></UiIcon>{{t('vip')}}</span>
</div>
<h3 class="text-body-lg font-bold text-on-surface">{{order.product_name}}</h3>
</div>
<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-surface-container-high text-primary border border-surface-container shrink-0 whitespace-nowrap mt-0.5">{{sourcePayout(locale,order.payout_mode,'按日返息 到期返本',t(order.payout_mode))}}</span>
</div>
</div>
<div class="grid grid-cols-3 gap-2 py-3.5 border-y border-surface-container/60">
<div>
<div class="flex items-baseline space-x-0.5">
<span class="text-2xl font-bold text-primary font-display">{{order.daily_percent}}</span>
<span class="text-sm font-semibold text-primary">%</span>
</div>
<div class="mt-0.5 flex flex-col items-start">
<span class="text-xs text-on-surface-variant">{{t('dailyRate')}}</span>
</div>
</div>
<div>
<div class="flex items-baseline space-x-0.5">
<span class="text-lg font-bold text-on-surface font-display">{{order.term_days}}</span>
<span class="text-xs text-on-surface-variant">{{t('days')}}</span>
</div>
<span class="text-xs text-on-surface-variant mt-0.5 block">({{t('remaining')}}{{order.remaining_days}}{{t('days')}})</span>
</div>
<div>
<div class="flex items-baseline space-x-0.5">
<span class="text-lg font-bold text-on-surface font-display">{{order.principal}}</span>
<span class="text-xs text-on-surface-variant">USDT</span>
</div>
<span class="text-xs text-on-surface-variant mt-0.5 block">{{t('amount')}}</span>
</div>
</div>
<div class="space-y-1">
<div class="flex items-center justify-between text-xs text-on-surface-variant">
<span class="">({{t('elapsed')}}{{order.elapsed_days}}{{t('days')}})</span>
<span class="text-primary font-medium">{{t('paid')}} +{{order.interest_paid}} USDT</span>
</div>
</div>
<button :aria-label="t(order.status)" class="w-full py-3 px-4 rounded-xl bg-surface-container-high text-on-surface-variant/80 font-semibold text-sm flex items-center justify-center space-x-1.5 cursor-not-allowed" :disabled="true" type="button">
<UiIcon :size="16" class="material-symbols-outlined text-[16px] text-primary" name="verified_user"></UiIcon>
<span class="">{{t(order.status)}}</span>
</button>
<dl class="source-order-detail" v-if="selected"><dt>{{order.order_no}}</dt><dd>{{businessTime(order.purchased_at)}}</dd><dt>{{t('start')}}</dt><dd>{{order.starts_at===order.purchased_at?t('immediate'):businessTime(order.starts_at)}}</dd><dt>{{t('due')}}</dt><dd>{{businessTime(order.matures_at)}}</dd><dt>{{t('expected')}}</dt><dd>{{order.expected_interest}} USDT</dd><p class="pt-2 text-[11px] leading-relaxed text-slate-400">{{t('payoutHint')}}</p></dl><div class="flex justify-between gap-2 pt-2"><button @click="selected=order" class="plain" type="button" v-if="!selected">{{t('viewOrders')}}</button></div></div><div class="bg-surface-container-lowest rounded-2xl p-5 shadow-sm border border-surface-container-high transition-all" data-original-order="maturity" v-else-if="order.payout_mode==='maturity'"><div class="mb-3"><div class="flex items-center justify-between"><div class="flex items-center space-x-2"><h3 class="text-body-lg font-bold text-on-surface">{{order.product_name}}</h3></div><span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-surface-container-high text-primary border border-surface-container shrink-0 whitespace-nowrap">{{sourcePayout(locale,order.payout_mode,'按日返息 到期返本',t(order.payout_mode))}}</span></div></div><div class="grid grid-cols-3 gap-2 py-3 border-y border-surface-container/60 mb-3"><div><div class="flex items-baseline space-x-0.5"><span class="text-2xl font-bold text-primary font-display">{{order.daily_percent}}</span><span class="text-sm font-semibold text-primary">%</span></div><div class="mt-0.5 flex flex-col items-start"><span class="text-xs text-on-surface-variant">{{t('dailyRate')}}</span></div></div><div><div class="flex items-baseline space-x-0.5"><span class="text-lg font-bold text-on-surface font-display">{{order.term_days}}</span><span class="text-xs text-on-surface-variant">{{t('days')}}</span></div><span class="text-xs text-on-surface-variant mt-0.5 block">({{t('remaining')}}{{order.remaining_days}}{{t('days')}})</span></div><div><div class="flex items-baseline space-x-0.5"><span class="text-lg font-bold text-on-surface font-display">{{order.principal}}</span><span class="text-xs text-on-surface-variant">USDT</span></div><span class="text-xs text-on-surface-variant mt-0.5 block">{{t('amount')}}</span></div></div><div class="space-y-1 mb-4"><div class="flex items-center justify-between text-xs text-on-surface-variant"><span class="">({{t('elapsed')}}{{order.elapsed_days}}{{t('days')}})</span></div></div><button :aria-label="t(order.status)" class="w-full py-3 px-4 rounded-xl bg-surface-container-high text-on-surface-variant/80 font-semibold text-sm flex items-center justify-center space-x-1.5 cursor-not-allowed" :disabled="true" type="button"><UiIcon :size="16" class="material-symbols-outlined text-[16px] text-primary" name="verified_user"></UiIcon><span class="">{{sourcePayout(locale,order.payout_mode,'按日返息 到期返本',t(order.payout_mode))}}</span></button><dl class="source-order-detail" v-if="selected"><dt>{{order.order_no}}</dt><dd>{{businessTime(order.purchased_at)}}</dd><dt>{{t('start')}}</dt><dd>{{businessTime(order.starts_at)}}</dd><dt>{{t('due')}}</dt><dd>{{businessTime(order.matures_at)}}</dd><dt>{{t('expected')}}</dt><dd>{{order.expected_interest}} USDT</dd></dl><div class="flex justify-between gap-2 pt-2"><button @click="selected=order" class="plain" type="button" v-if="!selected">{{t('viewOrders')}}</button></div></div><div class="bg-surface-container-lowest rounded-2xl p-5 shadow-sm border border-surface-container-high transition-all" data-original-order="standard" v-else=""><div class="mb-3"><div class="flex items-center justify-between"><div class="flex items-center space-x-2"><h3 class="text-body-lg font-bold text-on-surface">{{order.product_name}}</h3></div><span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-surface-container-high text-primary border border-surface-container shrink-0 whitespace-nowrap">{{sourcePayout(locale,order.payout_mode,'按日返息 到期返本',t(order.payout_mode))}}</span></div></div><div class="grid grid-cols-3 gap-2 py-3 border-y border-surface-container/60 mb-3"><div><div class="flex items-baseline space-x-0.5"><span class="text-2xl font-bold text-primary font-display">{{order.daily_percent}}</span><span class="text-sm font-semibold text-primary">%</span></div><div class="mt-0.5 flex flex-col items-start"><span class="text-xs text-on-surface-variant">{{t('dailyRate')}}</span></div></div><div><div class="flex items-baseline space-x-0.5"><span class="text-lg font-bold text-on-surface font-display">{{order.term_days}}</span><span class="text-xs text-on-surface-variant">{{t('days')}}</span></div><span class="text-xs text-on-surface-variant mt-0.5 block">({{t('remaining')}}{{order.remaining_days}}{{t('days')}})</span></div><div><div class="flex items-baseline space-x-0.5"><span class="text-lg font-bold text-on-surface font-display">{{order.principal}}</span><span class="text-xs text-on-surface-variant">USDT</span></div><span class="text-xs text-on-surface-variant mt-0.5 block">{{t('amount')}}</span></div></div><div class="space-y-1 mb-4"><div class="flex items-center justify-between text-xs text-on-surface-variant"><span class="">({{t('elapsed')}}{{order.elapsed_days}}{{t('days')}})</span><span class="text-primary font-medium">{{t('paid')}} +{{order.interest_paid}} USDT</span></div></div><button :aria-label="t(order.status)" class="w-full py-3 px-4 rounded-xl bg-surface-container-high text-on-surface-variant/80 font-semibold text-sm flex items-center justify-center space-x-1.5 cursor-not-allowed" :disabled="true" type="button"><UiIcon :size="16" class="material-symbols-outlined text-[16px] text-primary" name="verified_user"></UiIcon><span class="">{{t(order.status)}}</span></button><dl class="source-order-detail" v-if="selected"><dt>{{order.order_no}}</dt><dd>{{businessTime(order.purchased_at)}}</dd><dt>{{t('start')}}</dt><dd>{{businessTime(order.starts_at)}}</dd><dt>{{t('due')}}</dt><dd>{{businessTime(order.matures_at)}}</dd><dt>{{t('expected')}}</dt><dd>{{order.expected_interest}} USDT</dd></dl><div class="flex justify-between gap-2 pt-2"><button @click="selected=order" class="plain" type="button" v-if="!selected">{{t('viewOrders')}}</button></div></div></template><button :disabled="busy" @click="load(true)" class="plain w-full" type="button" v-if="cursor&&!selected">{{d('more')}}</button>
<div class="pt-space-sm pb-space-lg text-center space-y-1.5">
<div class="flex items-center justify-center space-x-2 text-on-surface-variant/70">
<span class="h-px w-8 bg-outline-variant/30"></span>
<span class="text-label-caps font-label-caps tracking-widest text-on-surface-variant uppercase">JIUHE PROTOCOL</span>
<span class="h-px w-8 bg-outline-variant/30"></span>
</div>
<BrandMotto :locale="locale"/>
</div>
</div>
</div><p class="source-notice" role="status" v-if="notice">{{notice}}</p></main></div>
</template>
