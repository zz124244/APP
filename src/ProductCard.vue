<script setup lang="ts">
import {sourcePayout} from './source-text'
import UiIcon from './UiIcon.vue'
import type {Locale} from './i18n'
import type {Product} from './investment-flow'
import {investmentText,type InvestmentKey} from './investment-text'
const props=defineProps<{product:Product;locale:Locale;variant?:string}>()
defineEmits<{buy:[product:Product]}>()
const t=(key:InvestmentKey)=>investmentText(props.locale,key)
function reason(){return props.product.blocked_reason==='vip_required'?t('vip_required')+' (VIP'+props.product.minimum_vip_level+')':props.product.blocked_reason==='identity_required'?t('unavailable'):t((props.product.blocked_reason==='equity_closed'?'closed':props.product.blocked_reason||'buy') as InvestmentKey)}
</script>
<template>
<template v-if="variant==='vip'"><div class="vip-product-card relative rounded-xl bg-surface-container-lowest shadow-sm border border-outline-variant/30 p-space-md overflow-hidden hover:shadow-md transition-shadow" data-original-card="vip">
<div class="flex items-start justify-between gap-space-sm">
<div>
<div class="flex items-center gap-1.5 flex-wrap"><span class="px-2 py-0.5 rounded font-label-caps text-label-caps bg-secondary-fixed text-on-secondary-fixed font-semibold">VIP {{product.minimum_vip_level}}+</span></div>
<h3 class="font-headline-sm text-headline-sm text-on-surface font-semibold mt-1.5 product-title">{{product.name}}</h3>
</div>
<div class="inline-flex items-center px-2 py-0.5 rounded-full bg-primary/20 text-primary font-label-caps text-label-caps font-medium shrink-0">{{sourcePayout(locale,product.payout_mode,'按日返息 到期返本',t(product.payout_mode))}}</div>
</div>
<div class="mt-space-md grid grid-cols-3 gap-2 py-space-sm px-space-xs rounded-lg bg-surface-container-low/70 border border-surface-container-high/40">
<div>
<span class="font-label-caps text-label-caps text-tertiary block">{{t('dailyRate')}}</span>
<div class="mt-1"><span class="font-headline-md text-headline-md text-primary font-bold tracking-tight product-rate">{{product.daily_percent}}%</span></div>
</div>
<div class="text-center border-x border-outline-variant/30 px-1">
<span class="font-label-caps text-label-caps text-tertiary block">{{t('term')}}</span>
<div class="mt-1 flex items-center justify-center gap-1"><span class="px-1.5 py-0.5 rounded bg-surface-container-lowest text-on-surface font-label-numeric-sm text-label-numeric-sm font-semibold shadow-xs product-term">{{product.term_days}}{{t('days')}}</span></div>
</div>
<div class="text-right">
<span class="font-label-caps text-label-caps text-tertiary block">{{t('minimum')}}</span>
<div class="mt-1"><span class="font-label-numeric-md text-label-numeric-md text-on-surface font-semibold product-amount">{{product.minimum}}</span><span class="font-label-caps text-label-caps text-tertiary ml-0.5">USDT</span></div>
</div>
</div>
<div class="mt-space-sm flex items-center justify-between px-2 py-1 rounded bg-secondary-fixed/20 border border-secondary-fixed/30">
<div class="flex items-center gap-1">
<UiIcon :size="16" class="material-symbols-outlined text-[16px] text-secondary" name="trending_up"></UiIcon>
<span class="font-label-caps text-label-caps text-secondary font-medium">{{t('expected')}}</span>
</div>
<span class="font-label-numeric-sm text-label-numeric-sm text-secondary font-bold product-profit">+{{product.expected_interest}} USDT</span>
</div>
<p class="font-body-sm text-body-sm text-on-surface-variant whitespace-pre-wrap break-words" v-if="product.description">{{product.description}}</p><div class="mt-space-sm space-y-1.5">
<div class="flex items-center justify-between text-body-sm font-body-sm"><span class="text-on-surface-variant">{{t('progress')}} ({{product.progress}}%)</span></div>
<div :aria-label="t('progress')" :aria-valuenow="Number(product.progress)" aria-valuemax="100" aria-valuemin="0" class="w-full h-1.5 rounded-full bg-surface-container overflow-hidden" role="progressbar"><div :style="{width:product.progress+'%'}" class="h-full rounded-full bg-primary transition-all"></div></div>
</div>
<button :disabled="!!product.blocked_reason" @click="$emit('buy',product)" class="buy-action-btn mt-space-md w-full h-11 rounded-lg text-white font-body-md text-body-md font-semibold flex items-center justify-center gap-1.5 shadow-md active:scale-[0.99] transition-all" style="background-color: rgb(217, 119, 6);" type="button">
<span class="">{{reason()}}</span>
<UiIcon :size="16" class="material-symbols-outlined text-[16px]" name="arrow_forward"></UiIcon>
</button>
</div></template>
<template v-else-if="variant==='fixed'"><div class="product-item bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col gap-4 mb-4" data-original-card="fixed" data-term="30">
<div class="flex flex-col gap-1.5"><div class="flex items-center justify-between gap-2"><h3 class="text-lg font-bold text-slate-900 tracking-tight">{{product.name}}</h3><span class="text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-full shrink-0">{{sourcePayout(locale,product.payout_mode,'按日返息 到期返本',t(product.payout_mode))}}</span></div></div>
<div class="grid grid-cols-4 gap-1.5 py-3 px-3 bg-slate-50/70 rounded-xl items-center text-center"><div class="flex flex-col items-start text-left"><div class="text-lg font-bold text-emerald-600 tracking-tight">{{product.daily_percent}}%</div><span class="text-[11px] text-slate-400 mt-0.5">{{t('dailyRate')}}</span></div><div class="flex flex-col items-center border-l border-slate-200/60 px-1"><div class="text-xs font-semibold text-slate-800">{{product.term_days}} {{t('days')}}</div><span class="text-[11px] text-slate-400 mt-0.5">{{t('term')}}</span></div><div class="flex flex-col items-center border-l border-slate-200/60 px-1"><div class="text-xs font-semibold text-slate-800">{{product.minimum}} U</div><span class="text-[11px] text-slate-400 mt-0.5">{{t('minimum')}}</span></div><div class="flex flex-col items-end text-right border-l border-slate-200/60 pl-1"><div class="text-xs font-bold text-[#904d00] tracking-tight">+{{product.expected_interest}} U</div><span class="text-[11px] text-slate-400 mt-0.5">{{t('expected')}}</span></div></div>
<p class="font-body-sm text-body-sm text-on-surface-variant whitespace-pre-wrap break-words" v-if="product.description">{{product.description}}</p><div class="flex flex-col gap-1.5">
<div class="flex justify-between items-center text-xs text-slate-500">
<span class="flex items-center gap-1">{{t('progress')}} <span class="font-medium text-slate-800">{{product.progress}}%</span>
</span>
</div>
<div :aria-label="t('progress')" :aria-valuenow="Number(product.progress)" aria-valuemax="100" aria-valuemin="0" class="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden" role="progressbar">
<div :style="{width:product.progress+'%'}" class="h-full bg-emerald-600 rounded-full transition-all duration-500"></div>
</div>
</div>
<button :disabled="!!product.blocked_reason" @click="$emit('buy',product)" class="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white text-sm font-medium flex items-center justify-center gap-1 shadow-sm transition-all" style="background-color: rgb(217, 119, 6);" type="button">
<span class="">{{reason()}}</span>
<UiIcon :size="16" class="material-symbols-outlined text-[16px]" name="arrow_forward"></UiIcon>
</button>
</div></template>
<template v-else-if="variant==='novice'"><div class="product-item bg-white rounded-2xl shadow-sm border border-slate-100 p-5 mb-4 flex flex-col space-y-4" data-original-card="novice">
<div class="flex items-center justify-between">
<h2 class="text-base font-bold text-slate-900 tracking-tight" data-source-id="product-title-el">{{product.name}}</h2>
<span class="bg-emerald-50 text-emerald-700 text-xs px-2.5 py-0.5 rounded-full font-medium">{{sourcePayout(locale,product.payout_mode,'按日付息 到期返本',t(product.payout_mode))}}</span>
</div>
<div class="grid grid-cols-4 gap-2 py-1 items-baseline">
<div class="flex flex-col">
<div class="flex items-baseline space-x-0.5 text-emerald-600 font-bold">
<span class="text-lg font-bold leading-none font-display">{{product.daily_percent}}%</span>
</div>
<span class="text-[11px] text-slate-400 mt-1.5"><span class="" style="background-color: rgba(248, 250, 252, 0.7);">{{t('dailyRate')}}</span></span>
</div>
<div class="flex flex-col pl-2 border-l border-slate-100">
<div class="text-sm font-semibold text-slate-800 leading-none">
<span class="">{{product.term_days}}</span><span class="text-xs text-slate-500 ml-0.5 font-normal">{{t('days')}}</span>
</div>
<span class="text-[11px] text-slate-400 mt-1.5">{{t('term')}}</span>
</div>
<div class="flex flex-col pl-2 border-l border-slate-100">
<div class="text-sm font-semibold text-slate-800 leading-none truncate">
<span class="">{{product.minimum}}</span><span class="text-xs text-slate-500 ml-0.5 font-normal">U</span>
</div>
<span class="text-[11px] text-slate-400 mt-1.5">{{t('minimum')}}</span>
</div>
<div class="flex flex-col pl-2 border-l border-slate-100 text-right">
<div class="text-sm font-semibold text-emerald-600 leading-none truncate">
<span class="">+{{product.expected_interest}}</span><span class="text-xs ml-0.5 font-normal">U</span>
</div>
<span class="text-[11px] text-slate-400 mt-1.5">{{t('expected')}}</span>
</div>
</div>
<p class="font-body-sm text-body-sm text-on-surface-variant whitespace-pre-wrap break-words" v-if="product.description">{{product.description}}</p><div class="flex flex-col space-y-1.5 pt-0.5">
<div class="flex items-center justify-between text-xs text-slate-500">
<span class="text-[11px]">{{t('progress')}} <span class="font-medium text-slate-700">{{product.progress}}%</span></span>
</div>
<div :aria-label="t('progress')" :aria-valuenow="Number(product.progress)" aria-valuemax="100" aria-valuemin="0" class="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden" role="progressbar">
<div :style="{width:product.progress+'%'}" class="h-full bg-emerald-600 rounded-full transition-all"></div>
</div>
</div>
<button :disabled="!!product.blocked_reason" @click="$emit('buy',product)" class="w-full py-3 rounded-xl hover:bg-amber-700 active:scale-[0.99] text-white font-medium text-sm shadow-sm transition-all flex items-center justify-center space-x-1 mt-1 cursor-pointer bg-[#d97706]" data-source-id="btn-trigger-purchase" style="background-color: rgb(217, 119, 6);" type="button">
<span class="">{{reason()}}</span>
<UiIcon :size="16" class="material-symbols-outlined text-[16px]" name="arrow_forward"></UiIcon>
</button>
</div></template>
<template v-else-if="variant==='benefit'"><div class="product-item bg-white rounded-2xl shadow-sm border border-slate-100 p-5 mb-4 flex flex-col space-y-4" data-original-card="benefit">
<div class="flex items-center justify-between">
<h2 class="product-title text-base font-bold text-slate-900 tracking-tight">{{product.name}}</h2>
<span class="product-tag bg-emerald-50 text-emerald-700 text-[11px] font-medium px-2 py-0.5 rounded-full">{{sourcePayout(locale,product.payout_mode,'按日付息 到期返本',t(product.payout_mode))}}</span>
</div>
<div class="grid grid-cols-4 gap-2 text-center py-1 items-baseline">
<div class="flex flex-col items-center">
<span class="product-rate text-lg font-bold leading-none font-display text-emerald-600">{{product.daily_percent}}%</span>
<span class="text-[11px] text-slate-400 mt-1.5">{{t('dailyRate')}}</span>
</div>
<div class="flex flex-col items-center border-l border-slate-100">
<div class="text-base font-semibold text-slate-800 leading-none">
<span class="product-term-num">{{product.term_days}}</span><span class="text-xs text-slate-500 ml-0.5 font-normal">{{t('days')}}</span>
</div>
<span class="text-[11px] text-slate-400 mt-1.5">{{t('term')}}</span>
</div>
<div class="flex flex-col items-center border-l border-slate-100">
<div class="text-base font-semibold text-slate-800 leading-none truncate">
<span class="product-amount-num">{{product.minimum}}</span><span class="text-xs text-slate-500 ml-0.5 font-normal">U</span>
</div>
<span class="text-[11px] text-slate-400 mt-1.5">{{t('minimum')}}</span>
</div>
<div class="flex flex-col items-center border-l border-slate-100">
<div class="product-profit text-base font-semibold text-emerald-600 leading-none truncate font-display">
<span class="">+{{product.expected_interest}}</span><span class="text-xs text-slate-500 ml-0.5 font-normal">U</span>
</div>
<span class="text-[11px] text-slate-400 mt-1.5">{{t('expected')}}</span>
</div>
</div>
<p class="font-body-sm text-body-sm text-on-surface-variant whitespace-pre-wrap break-words" v-if="product.description">{{product.description}}</p><div class="flex flex-col space-y-1.5 pt-0.5">
<div class="flex items-center justify-between text-xs text-slate-500">
<span class="text-[11px]">{{t('progress')}} <span class="font-medium text-slate-700">{{product.progress}}%</span></span>
</div>
<div :aria-label="t('progress')" :aria-valuenow="Number(product.progress)" aria-valuemax="100" aria-valuemin="0" class="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden" role="progressbar">
<div :style="{width:product.progress+'%'}" class="h-full bg-emerald-600 rounded-full transition-all"></div>
</div>
</div>
<button :disabled="!!product.blocked_reason" @click="$emit('buy',product)" class="buy-trigger-btn w-full py-3 rounded-xl hover:bg-amber-700 active:scale-[0.99] text-white font-medium text-sm shadow-sm transition-all flex items-center justify-center space-x-1 mt-1 cursor-pointer bg-[#d97706]" style="background-color: rgb(217, 119, 6);" type="button">
<span class="">{{reason()}}</span>
<UiIcon :size="16" class="material-symbols-outlined text-[16px]" name="arrow_forward"></UiIcon>
</button>
</div></template>
<template v-else-if="variant==='equity'"><div class="bg-surface-container-lowest rounded-2xl shadow-sm border border-slate-100 p-5 flex flex-col space-y-4" data-original-card="equity"><div class="flex items-center justify-between"><h3 class="text-base font-bold text-slate-900 tracking-tight">{{product.name}}</h3><span class="bg-emerald-50 text-emerald-700 text-xs px-2.5 py-0.5 rounded-full font-medium">{{sourcePayout(locale,product.payout_mode,'按日返息 到期返本',t(product.payout_mode))}}</span></div><div class="grid grid-cols-4 gap-2 py-1 items-baseline"><div class="flex flex-col"><div class="flex items-baseline space-x-0.5 text-emerald-600 font-bold"><span class="text-lg font-bold leading-none font-headline-sm">{{product.daily_percent}}%</span></div><span class="text-[11px] text-slate-400 mt-1.5">{{t('dailyRate')}}</span></div><div class="flex flex-col pl-2 border-l border-slate-100"><div class="text-sm font-semibold text-slate-800 leading-none"><span class="">{{product.term_days}}</span><span class="text-xs text-slate-500 ml-0.5 font-normal">{{t('days')}}</span></div><span class="text-[11px] text-slate-400 mt-1.5">{{t('term')}}</span></div><div class="flex flex-col pl-2 border-l border-slate-100"><div class="text-sm font-semibold text-slate-800 leading-none truncate"><span class="">{{product.minimum}}</span><span class="text-xs text-slate-500 ml-0.5 font-normal">U</span></div><span class="text-[11px] text-slate-400 mt-1.5">{{t('minimum')}}</span></div><div class="flex flex-col pl-2 border-l border-slate-100 text-right"><div class="text-sm font-semibold text-emerald-600 leading-none truncate"><span class="">+{{product.expected_interest}}</span><span class="text-xs ml-0.5 font-normal">U</span></div><span class="text-[11px] text-slate-400 mt-1.5">{{t('expected')}}</span></div></div><p class="font-body-sm text-body-sm text-on-surface-variant whitespace-pre-wrap break-words" v-if="product.description">{{product.description}}</p><div class="flex flex-col space-y-1.5 pt-0.5"><div class="flex items-center justify-between text-xs text-slate-500"><span class="text-[11px]">{{t('progress')}} <span class="font-medium text-slate-700">{{product.progress}}%</span></span></div><div :aria-label="t('progress')" :aria-valuenow="Number(product.progress)" aria-valuemax="100" aria-valuemin="0" class="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden" role="progressbar"><div :style="{width:product.progress+'%'}" class="h-full bg-emerald-600 rounded-full transition-all"></div></div></div><button :disabled="!!product.blocked_reason" @click="$emit('buy',product)" class="w-full py-3 rounded-xl hover:bg-amber-700 active:scale-[0.99] text-white font-medium text-sm shadow-sm transition-all flex items-center justify-center space-x-1 mt-1 cursor-pointer bg-[#d97706]" style="background-color: rgb(217, 119, 6);" type="button"><span class="">{{reason()}}</span><UiIcon :size="16" class="material-symbols-outlined text-[16px]" name="arrow_forward"></UiIcon></button></div></template>
<template v-else><div class="bg-surface-container-lowest rounded-2xl shadow-sm border border-slate-100 p-5 flex flex-col space-y-4" data-original-card="overview">
<div class="flex items-center justify-between">
<h3 class="text-base font-bold text-slate-900 tracking-tight">{{product.name}}</h3>
<span class="bg-emerald-50 text-emerald-700 text-xs px-2.5 py-0.5 rounded-full font-medium">{{sourcePayout(locale,product.payout_mode,'按日返息 到期返本',t(product.payout_mode))}}</span>
</div>
<div class="grid grid-cols-4 gap-2 py-1 items-baseline">
<div class="flex flex-col">
<div class="flex items-baseline space-x-0.5 text-emerald-600 font-bold">
<span class="text-lg font-bold leading-none font-headline-sm">{{product.daily_percent}}%</span>
</div>
<span class="text-[11px] text-slate-400 mt-1.5"><span class="" style='font-family: "Hanken Grotesk"; background-color: rgba(248, 250, 252, 0.7);'>{{t('dailyRate')}}</span></span>
</div>
<div class="flex flex-col pl-2 border-l border-slate-100">
<div class="text-sm font-semibold text-slate-800 leading-none">
<span class="">{{product.term_days}}</span><span class="text-xs text-slate-500 ml-0.5 font-normal">{{t('days')}}</span>
</div>
<span class="text-[11px] text-slate-400 mt-1.5">{{t('term')}}</span>
</div>
<div class="flex flex-col pl-2 border-l border-slate-100">
<div class="text-sm font-semibold text-slate-800 leading-none truncate">
<span class="">{{product.minimum}}</span><span class="text-xs text-slate-500 ml-0.5 font-normal">U</span>
</div>
<span class="text-[11px] text-slate-400 mt-1.5">{{t('minimum')}}</span>
</div>
<div class="flex flex-col pl-2 border-l border-slate-100 text-right">
<div class="text-sm font-semibold text-emerald-600 leading-none truncate">
<span class="">+{{product.expected_interest}}</span><span class="text-xs ml-0.5 font-normal">U</span>
</div>
<span class="text-[11px] text-slate-400 mt-1.5">{{t('expected')}}</span>
</div>
</div>
<p class="font-body-sm text-body-sm text-on-surface-variant whitespace-pre-wrap break-words" v-if="product.description">{{product.description}}</p><div class="flex flex-col space-y-1.5 pt-0.5">
<div class="flex items-center justify-between text-xs text-slate-500">
<span class="text-[11px]">{{t('progress')}} <span class="font-medium text-slate-700">{{product.progress}}%</span></span>
</div>
<div :aria-label="t('progress')" :aria-valuenow="Number(product.progress)" aria-valuemax="100" aria-valuemin="0" class="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden" role="progressbar">
<div :style="{width:product.progress+'%'}" class="h-full bg-emerald-600 rounded-full transition-all"></div>
</div>
</div>
<button :disabled="!!product.blocked_reason" @click="$emit('buy',product)" class="w-full py-3 rounded-xl hover:bg-amber-700 active:scale-[0.99] text-white font-medium text-sm shadow-sm transition-all flex items-center justify-center space-x-1 mt-1 cursor-pointer bg-[#d97706]" style="background-color: rgb(217, 119, 6);" type="button">
<span class="">{{reason()}}</span>
<UiIcon :size="16" class="material-symbols-outlined text-[16px]" name="arrow_forward"></UiIcon>
</button>
</div></template>
</template>

<style scoped>
/* 不可申购时按钮必须看得出来：否则点了没反应，用户会以为是坏了 */
button:disabled { opacity: .55; cursor: not-allowed; }
button:disabled:active { transform: none; }
</style>
