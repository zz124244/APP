<script setup lang="ts">
import BrandMotto from './BrandMotto.vue'
import {ref,onMounted,onUnmounted} from 'vue'
import UiIcon from './UiIcon.vue'
import ProductCard from './ProductCard.vue'
import PaymentPin from './PaymentPin.vue'
import LanguagePicker from './LanguagePicker.vue'
import {sourceText,sourcePayout} from './source-text'
import {languages,translate,type Locale} from './i18n'
import {profileText} from './profile-text'
import {depositText} from './deposit-i18n'
import {investmentText,type InvestmentKey} from './investment-text'
import {executePurchase,readPurchaseDraft,recoveryDecision,beginProductZone,setupPaymentPassword,type PurchaseDraft,type Product,type InvestmentPreview,type InvestmentOrder} from './investment-flow'
import {commandKey,clearMatchingDraft,businessTime,normalizeAmount} from './deposit'
import {ApiError,type createApi} from './api'
const props=defineProps<{service:ReturnType<typeof createApi>;locale:Locale;userUid:string;available?:string}>()
const emit=defineEmits<{navigate:[string];back:[];orders:[orderNo:string];deposit:[];rollover:[];locale:[locale:Locale];unauthorized:[]}>()
type Overview={revision:string;equity_enabled:boolean;zone_rate_texts:Record<string,string>}
const category=ref(''),items=ref<Product[]>([]),overview=ref<Overview|null>(null),vip=ref(0),page=ref(1),more=ref(false),busy=ref(false),error=ref(''),notice=ref('')
const selected=ref<Product|null>(null),amount=ref(''),preview=ref<InvestmentPreview|null>(null),password=ref(''),confirmation=ref(''),stage=ref<'amount'|'confirm'|'pay'|'setup'|'recovery'|'success'>('amount'),result=ref<InvestmentOrder|null>(null),draft=ref<PurchaseDraft|null>(null)
let disposed=false;const storageKey='purchase-draft:'+props.userUid
const t=(key:InvestmentKey)=>investmentText(props.locale,key),d=(key:Parameters<typeof depositText>[1])=>depositText(props.locale,key),p=(key:Parameters<typeof profileText>[1])=>profileText(props.locale,key)
const payoutHintText=()=>category.value==='fixed'?t('maturity'):t('payoutHint')
function failure(problem:unknown){if(problem instanceof ApiError&&problem.status===401){emit('unauthorized');return}const key=problem instanceof ApiError?problem.message:'';error.value=['payment_invalid','payment_locked','insufficient_balance','product_full','novice_used','purchase_limit','level_not_allowed','vip_required'].includes(key)?t(key as InvestmentKey):problem instanceof ApiError&&[409,422].includes(problem.status)?t('changed'):d('error')}
function cachedValue<T>(key:string){return typeof props.service.getCached==='function'?props.service.getCached<T>(key):undefined}
async function refreshValue<T>(key:string,loader:()=>Promise<T>):Promise<{value:T;changed:boolean}>{return typeof props.service.refreshCached==='function'?props.service.refreshCached(key,loader):{value:await loader(),changed:true}}
async function load(append=false){if(busy.value)return;busy.value=true;error.value='';const nextPage=append?page.value+1:1;const key=`user:${props.userUid}:products:${category.value||'featured'}:${nextPage}`;const loader=()=>props.service.request<{items:Product[];has_more:boolean;overview:Overview;vip_level:number}>('/products?'+(category.value?'category='+category.value:'featured=1')+'&page='+nextPage);const apply=(data:{items:Product[];has_more:boolean;overview:Overview;vip_level:number})=>{if(disposed)return;items.value=append?[...items.value,...data.items]:data.items;page.value=nextPage;more.value=data.has_more;overview.value=data.overview;vip.value=data.vip_level};const cached=!append?cachedValue<{items:Product[];has_more:boolean;overview:Overview;vip_level:number}>(key):undefined;if(cached){apply(cached);busy.value=false;void refreshValue(key,loader).then(result=>{if(result.changed)apply(result.value)}).catch(problem=>{if(!disposed)failure(problem)});return}try{const result=await refreshValue(key,loader);apply(result.value)}catch(problem){if(!disposed)failure(problem)}finally{busy.value=false}}
async function zone(value:string){if(busy.value)return;if(value==='equity'&&!overview.value?.equity_enabled){notice.value=t('closed');return}const next=beginProductZone({category:category.value,items:items.value,more:more.value,page:page.value},value);category.value=next.category;items.value=next.items;more.value=next.more;page.value=next.page;await load()}
function clearDraft(){if(draft.value)clearMatchingDraft(sessionStorage,storageKey,draft.value.key);draft.value=null}
function start(product:Product){
  // Opening the purchase flow is a local UI action.  A background product
  // refresh must not silently swallow the user's tap, otherwise the button
  // appears dead even though the product card is still visible.
  error.value='';password.value='';confirmation.value='';
  if(draft.value){preview.value=draft.value.preview as InvestmentPreview;selected.value=preview.value.product;stage.value='recovery';return}
  selected.value=product;amount.value=product.minimum;preview.value=null;stage.value='amount'
}
function close(){if(busy.value)return;selected.value=null;password.value='';confirmation.value='';result.value=null;void load()}
async function makePreview(){if(!selected.value||busy.value)return;const requested=category.value==='novice'?selected.value.minimum:amount.value;if(category.value==='novice')amount.value=requested;const normalized=normalizeAmount(requested);if(!normalized){error.value=t('invalid');return}busy.value=true;error.value='';try{const data=await props.service.request<InvestmentPreview>('/investments/preview',{product_id:selected.value.id,amount:normalized}, {}, undefined, {retries: 1, timeoutMs: 25000});if(!disposed){preview.value=data;selected.value=data.product;amount.value=category.value==='novice'?data.amount:amount.value;stage.value='confirm'}}catch(problem){if(!disposed)failure(problem)}finally{busy.value=false}}
async function setup(){if(busy.value)return;if(!/^[0-9]{6}$/.test(password.value)||password.value!==confirmation.value){error.value=t('invalid');return}busy.value=true;error.value='';try{await setupPaymentPassword(props.service,props.userUid,password.value,confirmation.value,sessionStorage,commandKey);password.value='';confirmation.value='';busy.value=false;await makePreview()}catch(problem){failure(problem);if(problem instanceof ApiError&&problem.status===409){try{const state=await props.service.request<{state:string}>('/security/payment-password');if(state.state==='ready'){password.value='';confirmation.value='';busy.value=false;await makePreview()}}catch(readError){failure(readError)}}}finally{busy.value=false}}
function received(order:InvestmentOrder){if(disposed)return;props.service.invalidateCachedPrefix?.(`user:${props.userUid}:products:`);props.service.invalidateCached?.(`user:${props.userUid}:wallet.summary`,`user:${props.userUid}:investments.active`);clearDraft();result.value=order;stage.value='success';password.value='';confirmation.value='';error.value=''}
async function recover(){if(!draft.value||busy.value)return;busy.value=true;error.value='';try{const response=await props.service.request<{status:string;retryable:boolean;message_key:string;result:InvestmentOrder|null}>('/investment-results/'+draft.value.key);if(disposed)return;if(response.status==='succeeded'&&response.result)received(response.result);else if(recoveryDecision(response)==='closed'){clearDraft();stage.value='amount';preview.value=null;error.value=t('changed')}else if(recoveryDecision(response)==='retry'){stage.value='pay';error.value=d('retryOriginal')}else stage.value='recovery'}catch(problem){if(!disposed){if(problem instanceof ApiError&&problem.status===404)stage.value='pay';else failure(problem)}}finally{busy.value=false}}
async function pay(){if(!preview.value||busy.value)return;if(!/^[0-9]{6}$/.test(password.value)){error.value=t('invalid');return}busy.value=true;error.value='';try{if(!draft.value)draft.value={key:commandKey(),preview:preview.value};const response=await executePurchase({draft:draft.value,password:password.value,active:()=>!disposed,persist:value=>sessionStorage.setItem(storageKey,JSON.stringify(value)),post:(body,key)=>props.service.request<InvestmentOrder|{status:string}>('/investments',body,{'Idempotency-Key':key})});password.value='';if(response.status==='abandoned')return;if('order_no' in response.result)received(response.result as InvestmentOrder);else stage.value='recovery'}catch(problem){if(disposed)return;password.value='';failure(problem);if(problem instanceof ApiError&&problem.status>=400&&problem.status<500&&problem.status!==429){clearDraft();stage.value=problem.message==='payment_invalid'?'pay':'amount'}else stage.value='recovery'}finally{busy.value=false}}
onMounted(async()=>{try{const value=readPurchaseDraft(sessionStorage.getItem(storageKey));if(value&&typeof value.preview.product==='object'&&value.preview.product){draft.value=value;preview.value=value.preview as InvestmentPreview;selected.value=preview.value.product;amount.value=preview.value.amount;stage.value='recovery'}}catch{error.value=d('storage')}await load();if(draft.value)await recover()})
onUnmounted(()=>{disposed=true;password.value='';confirmation.value=''})
const badges=['','vip-1-silver.svg','vip-2-gold.svg','vip-3-platinum.svg','vip-4-diamond.svg','vip-5-king.svg'],ranks=['','silver','gold','platinum','diamond','king']
</script>
<template>
<div class="reference-surface" :class="'reference-'+(category==='equity'?'overview':category||'overview')"><template v-if="!category||category==='equity'"><header class="relative z-10 bg-transparent"><div class="pt-safe px-margin"><div class="h-14 flex items-center justify-between"><div class="w-10"></div><h1 class="font-headline-sm text-headline-sm text-slate-900 font-bold absolute left-1/2 -translate-x-1/2">{{profileText(locale,'invest')}}</h1><LanguagePicker :locale="locale" @change="emit('locale',$event)"></LanguagePicker></div></div></header><main class="flex flex-col relative w-full pb-24 bg-slate-50 min-h-screen overflow-y-auto no-scrollbar"><div class="flex flex-col w-full pb-8 px-4 gap-2 pt-2"><p class="error" role="alert" v-if="error&&!selected">{{error}} <button :disabled="busy" @click="load()" class="plain" type="button">{{d('retry')}}</button></p><p class="source-notice" role="status" v-if="notice">{{notice}}</p><section class="pt-0 pb-1 flex flex-col gap-2"><div class="flex items-center justify-between"><div class="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5"><button :class="category!=='equity'?['px-5', 'py-2.5', 'rounded-full', 'text-[15px]', 'whitespace-nowrap', 'flex', 'items-center', 'justify-center', 'transition-all', 'cursor-pointer', 'font-medium', 'shadow-sm']:['px-5', 'py-2.5', 'rounded-full', 'text-[15px]', 'whitespace-nowrap', 'flex', 'items-center', 'justify-center', 'transition-all', 'cursor-pointer', 'font-medium', 'border', 'border-slate-200/90']" :disabled="busy" :style="{backgroundColor:category!=='equity'?'#d97706':'#f1f5f9',color:category!=='equity'?'#fff':'#475569'}" @click="zone('')" id="tab-overview" type="button">{{t('overview')}}</button><button :class="category==='equity'?['px-5', 'py-2.5', 'rounded-full', 'text-[15px]', 'whitespace-nowrap', 'flex', 'items-center', 'justify-center', 'transition-all', 'cursor-pointer', 'font-medium', 'shadow-sm']:['px-5', 'py-2.5', 'rounded-full', 'text-[15px]', 'whitespace-nowrap', 'flex', 'items-center', 'justify-center', 'transition-all', 'cursor-pointer', 'font-medium', 'border', 'border-slate-200/90']" :disabled="busy" :style="{backgroundColor:category==='equity'?'#d97706':'#f1f5f9',color:category==='equity'?'#fff':'#475569'}" @click="zone('equity')" id="tab-equity" type="button">{{t('equity')}}</button></div></div></section><div class="flex flex-col gap-4" id="view-overview" v-if="category!=='equity'"><section v-if="vip>0"><div class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-50/70 via-surface-container-lowest to-surface-container-low p-4 shadow-sm border border-amber-100/60"><div class="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-secondary-fixed/25 blur-2xl pointer-events-none"></div><div class="flex items-center justify-between mb-3 relative z-10"><div class="flex items-center gap-2.5"><div class="w-8 h-8 rounded-xl bg-secondary-fixed/50 flex items-center justify-center text-secondary shadow-sm"><img :src="'/vip-badges/'+badges[vip]" alt="" height="32" width="32"/></div><div class="flex items-center gap-2"><span class="font-headline-sm text-[16px] font-bold text-on-surface">VIP{{vip}} {{t(ranks[vip] as InvestmentKey)}}</span></div></div></div><div class="grid grid-cols-3 gap-2 relative z-10"><div class="flex items-center gap-2 bg-surface-container-lowest/90 backdrop-blur-sm p-2 rounded-xl shadow-xs border border-slate-100"><UiIcon :size="18" class="material-symbols-outlined text-[18px] text-primary shrink-0" name="support_agent"></UiIcon><div class="flex flex-col min-w-0"><span class="font-body-sm text-[11px] font-semibold text-on-surface truncate">{{t('private')}}</span></div></div><div class="flex items-center gap-2 bg-surface-container-lowest/90 backdrop-blur-sm p-2 rounded-xl shadow-xs border border-slate-100"><UiIcon :size="18" class="material-symbols-outlined text-[18px] text-secondary shrink-0" name="bolt"></UiIcon><div class="flex flex-col min-w-0"><span class="font-body-sm text-[11px] font-semibold text-on-surface truncate">{{t('principal')}}</span></div></div><div class="flex items-center gap-2 bg-surface-container-lowest/90 backdrop-blur-sm p-2 rounded-xl shadow-xs border border-slate-100"><UiIcon :size="18" class="material-symbols-outlined text-[18px] text-primary-fixed-dim shrink-0" name="redeem"></UiIcon><div class="flex flex-col min-w-0"><span class="font-body-sm text-[11px] font-semibold text-on-surface truncate">{{t('referral')}}</span></div></div></div></div></section><section><div class="grid grid-cols-2 gap-3"><div :aria-disabled="busy" @click="zone('novice')" @keydown.enter.prevent="zone('novice')" @keydown.space.prevent="zone('novice')" class="bg-surface-container-lowest rounded-2xl p-3.5 shadow-sm border border-slate-100 flex flex-col justify-between active:bg-surface-container-low transition-colors" role="button" tabindex="0"><div class="flex items-center justify-between mb-1.5"><span class="font-label-caps text-[13px] font-bold text-on-surface">{{t('novice')}}</span></div><div class="flex items-baseline justify-between"><span class="font-label-numeric-lg text-[20px] font-bold text-primary">{{overview?.zone_rate_texts['novice']||'—'}}</span></div></div><div :aria-disabled="busy" @click="zone('fixed')" @keydown.enter.prevent="zone('fixed')" @keydown.space.prevent="zone('fixed')" class="bg-surface-container-lowest rounded-2xl p-3.5 shadow-sm border border-slate-100 flex flex-col justify-between active:bg-surface-container-low transition-colors" role="button" tabindex="0"><div class="flex items-center justify-between mb-1.5"><span class="font-label-caps text-[13px] font-bold text-on-surface">{{t('fixed')}}</span></div><div class="flex items-baseline justify-between"><span class="font-label-numeric-lg text-[18px] font-bold text-on-surface">{{overview?.zone_rate_texts['fixed']||'—'}}</span></div></div><div :aria-disabled="busy" @click="zone('vip')" @keydown.enter.prevent="zone('vip')" @keydown.space.prevent="zone('vip')" class="bg-surface-container-lowest rounded-2xl p-3.5 shadow-sm border border-slate-100 flex flex-col justify-between active:bg-surface-container-low transition-colors" role="button" tabindex="0"><div class="flex items-center justify-between mb-1.5"><span class="font-label-caps text-[13px] font-bold text-on-surface">{{t('vip')}}</span></div><div class="flex items-baseline justify-between"><span class="font-label-numeric-lg text-[18px] font-bold text-secondary">{{overview?.zone_rate_texts['vip']||'—'}}</span></div></div><div :aria-disabled="busy" @click="zone('benefit')" @keydown.enter.prevent="zone('benefit')" @keydown.space.prevent="zone('benefit')" class="bg-surface-container-lowest rounded-2xl p-3.5 shadow-sm border border-slate-100 flex flex-col justify-between active:bg-surface-container-low transition-colors" role="button" tabindex="0"><div class="flex items-center justify-between mb-1.5"><span class="font-label-caps text-[13px] font-bold text-on-surface">{{t('benefit')}}</span></div><div class="flex items-baseline justify-between"><span class="font-label-numeric-lg text-[20px] font-bold text-error">{{overview?.zone_rate_texts['benefit']||'—'}}</span></div></div></div></section><section class="flex flex-col gap-3"><div class="flex items-center justify-between pt-1"><div class="flex items-center gap-2"><span class="font-headline-lg-mobile text-[18px] font-bold text-on-surface">{{t('featured')}}</span><span class="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-label-caps text-[11px] font-semibold">{{t('popular')}}</span></div></div>
<p class="text-center text-outline py-8" v-if="!items.length&&!error">{{t('empty')}}</p><ProductCard :key="product.id" :locale="locale" :product="product" @buy="start" v-for="product in items" variant="overview"></ProductCard><button :disabled="busy" @click="load(true)" class="plain w-full" type="button" v-if="more">{{d('more')}}</button>
</section></div><div class="flex flex-col gap-3" id="view-equity" v-else=""><div class="flex items-center justify-between pt-1"><div class="flex items-center gap-2"><span class="font-headline-lg-mobile text-[18px] font-bold text-on-surface">{{sourceText(locale,'equityFeatured')}}</span></div></div><p class="text-center text-outline py-8" v-if="!items.length&&!error">{{t('empty')}}</p><ProductCard :key="product.id" :locale="locale" :product="product" @buy="start" v-for="product in items" variant="equity"></ProductCard><button :disabled="busy" @click="load(true)" class="plain w-full" type="button" v-if="more">{{d('more')}}</button></div><footer class="flex flex-col items-center text-center mt-2"><BrandMotto :locale="locale"/></footer></div></main><nav class="fixed bottom-0 inset-x-0 z-50 pb-safe bg-white/90 backdrop-blur-xl border-t border-slate-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]" data-active-classes="text-emerald-700 [&_.nav-dot]:opacity-100 [&_.nav-glow]:opacity-100"><div class="flex justify-around items-center h-16 px-space-xs max-w-md mx-auto"><button :disabled="false" @click="emit('navigate','home')" class="group flex flex-col items-center justify-center relative w-16 h-12 text-slate-500 transition-colors hover:text-slate-900" data-path="home" type="button"><UiIcon :size="24" class="material-symbols-outlined text-[24px] relative z-10" name="explore"></UiIcon><span class="font-label-caps text-label-caps mt-1 relative z-10 font-medium">{{p('home')}}</span><span class="nav-dot w-1 h-1 rounded-full bg-emerald-600 mt-0.5 opacity-0 transition-opacity"></span><span class="nav-glow absolute inset-0 rounded-xl bg-emerald-500/10 blur-sm opacity-0 transition-opacity pointer-events-none"></span></button><button :disabled="false" @click="zone('')" class="group flex flex-col items-center justify-center relative w-16 h-12 text-slate-500 transition-colors hover:text-slate-900" data-path="invest" type="button"><UiIcon :size="24" class="material-symbols-outlined text-[24px] relative z-10" name="trending_up"></UiIcon><span class="font-label-caps text-label-caps mt-1 relative z-10 font-bold" style="color: rgb(217, 119, 6);">{{p('invest')}}</span><span class="nav-dot w-1 h-1 rounded-full mt-0.5 opacity-100 transition-opacity" style="background-color: rgb(217, 119, 6);"></span><span class="nav-glow absolute inset-0 rounded-xl blur-sm opacity-100 transition-opacity pointer-events-none" style="background-color: rgba(217, 119, 6, 0.12);"></span></button><button :disabled="false" @click="emit('navigate','community')" class="group flex flex-col items-center justify-center relative w-16 h-12 text-slate-500 transition-colors hover:text-slate-900" data-path="community" type="button"><UiIcon :size="24" class="material-symbols-outlined text-[24px] relative z-10" name="groups"></UiIcon><span class="font-label-caps text-label-caps mt-1 relative z-10 font-medium">{{p('community')}}</span><span class="nav-dot w-1 h-1 rounded-full bg-emerald-600 mt-0.5 opacity-0 transition-opacity"></span><span class="nav-glow absolute inset-0 rounded-xl bg-emerald-500/10 blur-sm opacity-0 transition-opacity pointer-events-none"></span></button><button :disabled="busy" @click="emit('back')" class="group flex flex-col items-center justify-center relative w-16 h-12 text-slate-500 transition-colors hover:text-slate-900" data-path="portfolio" type="button"><UiIcon :size="24" class="material-symbols-outlined text-[24px] relative z-10" name="account_balance_wallet"></UiIcon><span class="font-label-caps text-label-caps mt-1 relative z-10 font-medium">{{p('mine')}}</span><span class="nav-dot w-1 h-1 rounded-full bg-emerald-600 mt-0.5 opacity-0 transition-opacity"></span><span class="nav-glow absolute inset-0 rounded-xl bg-emerald-500/10 blur-sm opacity-0 transition-opacity pointer-events-none"></span></button></div></nav></template>
<template v-else-if="category==='novice'"><header class="fixed top-0 w-full z-50 pt-safe bg-surface-container-lowest/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]"><div class="h-14 px-margin-sm flex items-center justify-between"><button :aria-label="d('back')" :disabled="busy" @click="zone('')"  class="w-11 h-11 flex items-center justify-center -ml-2 rounded-lg text-on-surface hover:bg-surface-container transition-colors" type="button"><UiIcon :size="22" class="material-symbols-outlined text-[22px]" name="arrow_back"></UiIcon></button><h1 class="text-headline-sm font-headline-sm text-on-surface text-center flex-1 mx-space-sm truncate">{{t('novice')}}</h1></div></header><main class="flex flex-col relative w-full pt-14 pb-safe bg-surface min-h-screen"><div class="flex flex-col w-full px-margin-sm space-y-space-md pb-space-xl"><p class="error" role="alert" v-if="error&&!selected">{{error}} <button :disabled="busy" @click="load()" class="plain" type="button">{{d('retry')}}</button></p><p class="source-notice" role="status" v-if="notice">{{notice}}</p>
<div class="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary via-primary-container to-primary text-on-primary p-space-md shadow-md">
<div class="absolute -right-6 -bottom-8 w-36 h-36 rounded-full bg-primary-fixed/15 blur-2xl pointer-events-none"></div>
<div class="absolute top-0 right-0 p-space-md opacity-20 pointer-events-none">
<UiIcon :size="96" class="material-symbols-outlined text-[96px] leading-none" name="account_balance"></UiIcon>
</div>
<div class="relative z-10 space-y-space-xs">
<div class="inline-flex items-center space-x-1 bg-surface-container-lowest/20 backdrop-blur-sm px-2 py-0.5 rounded text-[11px] font-label-caps text-primary-fixed">
<UiIcon :size="14" class="material-symbols-outlined text-[14px]" name="stars"></UiIcon>
<span class="">{{t('noviceBadge')}}</span>
</div>
<h2 class="font-headline-lg-mobile text-headline-lg-mobile tracking-tight text-surface-container-lowest">{{t('noviceHero')}} {{overview?.zone_rate_texts.novice||'—'}}</h2>
<div class="pt-space-xs flex items-center justify-between">
<div class="flex items-center space-x-2">
<div class="w-2 h-2 rounded-full bg-primary-fixed animate-pulse"></div>
</div>
</div>
</div>
</div>
<div class="flex items-center justify-between pt-1">
<div class="flex items-center space-x-1.5">
<div class="w-1 h-3.5 bg-primary rounded-full"></div>
<span class="font-headline-sm text-headline-sm text-on-surface">{{t('noviceList')}}</span>
</div>
<span class="font-body-sm text-body-sm text-tertiary">{{sourceText(locale,'maturitySettle')}}</span>
</div>
<p class="text-center text-outline py-8" v-if="!items.length&&!error">{{t('empty')}}</p><ProductCard :key="product.id" :locale="locale" :product="product" @buy="start" v-for="product in items" variant="novice"></ProductCard><button :disabled="busy" @click="load(true)" class="plain w-full" type="button" v-if="more">{{d('more')}}</button>
<div class="space-y-space-sm pt-2">
</div>
<div class="pt-space-md text-center space-y-space-xs">
<BrandMotto :locale="locale"/>
</div>
</div></main></template>
<template v-else-if="category==='fixed'"><header class="fixed top-0 w-full z-50 pt-safe bg-surface-container-lowest/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]"><div class="h-14 px-margin-sm flex items-center justify-between"><button :aria-label="d('back')" :disabled="busy" @click="zone('')"  class="w-11 h-11 flex items-center justify-center -ml-2 rounded-lg text-on-surface hover:bg-surface-container transition-colors" type="button"><UiIcon :size="22" class="material-symbols-outlined text-[22px]" name="arrow_back"></UiIcon></button><h1 class="text-headline-sm font-headline-sm text-on-surface text-center flex-1 mx-space-sm truncate">{{t('fixed')}}</h1></div></header><main class="flex flex-col relative w-full pt-14 pb-safe bg-surface min-h-screen"><div class="flex flex-col w-full pb-10"><p class="error" role="alert" v-if="error&&!selected">{{error}} <button :disabled="busy" @click="load()" class="plain" type="button">{{d('retry')}}</button></p><p class="source-notice" role="status" v-if="notice">{{notice}}</p>

<div class="px-margin-sm">
<div class="relative overflow-hidden rounded-xl bg-gradient-to-br from-emerald-700 via-emerald-600 to-emerald-800 text-white p-space-md shadow-md">
<div class="absolute -right-6 -bottom-8 w-36 h-36 rounded-full bg-white/10 blur-2xl pointer-events-none"></div>
<div class="absolute top-0 right-0 p-space-md opacity-20 pointer-events-none">
<UiIcon :size="96" class="material-symbols-outlined text-[96px] leading-none" name="calendar_month"></UiIcon>
</div>
<div class="relative z-10 space-y-space-xs">
<div class="inline-flex items-center space-x-1 bg-white/15 backdrop-blur-sm px-2 py-0.5 rounded text-[11px] font-label-caps">
<UiIcon :size="14" class="material-symbols-outlined text-[14px]" name="event_available_fill1"></UiIcon>
<span class="">{{t('fixedBadge')}}</span>
</div>
<h2 class="font-headline-lg-mobile text-headline-lg-mobile tracking-tight text-white">{{t('fixedHero')}} {{overview?.zone_rate_texts.fixed||'—'}}</h2>
</div>
</div>
<div class="flex items-center justify-between pt-3">
<div class="flex items-center space-x-1.5">
<div class="w-1 h-3.5 bg-primary rounded-full"></div>
<span class="font-headline-sm text-headline-sm text-on-surface">{{t('fixedList')}}</span>
</div>
<span class="font-body-sm text-body-sm text-tertiary">{{sourceText(locale,'maturitySettle')}}</span>
</div>
</div>
<div class="px-margin-sm flex flex-col gap-space-md">
<div class="flex flex-col gap-space-md" id="product-container">
<p class="text-center text-outline py-8" v-if="!items.length&&!error">{{t('empty')}}</p><ProductCard :key="product.id" :locale="locale" :product="product" @buy="start" v-for="product in items" variant="fixed"></ProductCard><button :disabled="busy" @click="load(true)" class="plain w-full" type="button" v-if="more">{{d('more')}}</button>
</div>
<div class="flex flex-col items-center justify-center py-space-md text-center gap-1">
<BrandMotto :locale="locale"/>
</div>
</div>
</div>
</main></template>
<template v-else-if="category==='vip'"><header class="fixed top-0 w-full z-50 pt-safe bg-surface-container-lowest/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]"><div class="h-14 px-margin-sm flex items-center justify-between"><button :aria-label="d('back')" :disabled="busy" @click="zone('')"  class="w-11 h-11 flex items-center justify-center -ml-2 rounded-lg text-on-surface hover:bg-surface-container transition-colors" type="button"><UiIcon :size="22" class="material-symbols-outlined text-[22px]" name="arrow_back"></UiIcon></button><h1 class="text-headline-sm font-headline-sm text-on-surface text-center flex-1 mx-space-sm truncate">{{t('vip')}}</h1></div></header><main class="flex flex-col relative w-full pt-14 pb-safe bg-surface min-h-screen"><div class="flex flex-col w-full pb-10"><p class="error" role="alert" v-if="error&&!selected">{{error}} <button :disabled="busy" @click="load()" class="plain" type="button">{{d('retry')}}</button></p><p class="source-notice" role="status" v-if="notice">{{notice}}</p>
<div class="px-margin-sm space-y-space-md">
<div class="relative overflow-hidden rounded-xl bg-inverse-surface text-inverse-on-surface shadow-xl p-space-md" v-if="vip>0">
<div class="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-secondary-container/20 blur-2xl pointer-events-none"></div>
<div class="absolute -left-12 -bottom-12 w-48 h-48 rounded-full bg-primary/20 blur-2xl pointer-events-none"></div>
<div class="relative z-10 flex items-start justify-between">
<div class="flex items-center gap-space-sm">
<div class="w-10 h-10 rounded-lg bg-surface-container-lowest/10 backdrop-blur-md flex items-center justify-center text-secondary-fixed shadow-sm">
<img :src="'/vip-badges/'+badges[vip]" alt="" height="40" width="40"/>
</div>
<div>
<div class="flex items-center gap-1.5">
<span class="font-headline-sm text-headline-sm text-surface-container-lowest tracking-tight">VIP {{vip}} {{t(ranks[vip] as InvestmentKey)}}</span>
</div>
<p class="font-label-numeric-sm text-label-numeric-sm text-secondary-fixed font-medium mt-0.5">{{sourceText(locale,'vipPool')}}</p>
</div>
</div>
</div>
<div class="relative z-10 grid grid-cols-2 gap-space-xs mt-space-sm">
<div class="flex items-center gap-1.5 p-1.5 rounded-lg bg-surface-container-lowest/5">
<UiIcon :size="16" class="material-symbols-outlined text-[16px] text-secondary-fixed" name="bolt"></UiIcon>
<span class="font-label-caps text-label-caps text-inverse-on-surface">{{t('principal')}}</span>
</div>
<div class="flex items-center gap-1.5 p-1.5 rounded-lg bg-surface-container-lowest/5">
<UiIcon :size="16" class="material-symbols-outlined text-[16px] text-secondary-fixed" name="trending_up"></UiIcon>
<span class="font-label-caps text-label-caps text-inverse-on-surface">{{sourceText(locale,'vipYield')}}</span>
</div>
</div>
</div>
<div class="flex items-center justify-between pt-space-xs">
<div class="flex items-center gap-2">
<div class="w-1.5 h-4 rounded-full bg-primary"></div>
<h2 class="font-headline-sm text-headline-sm text-on-surface">{{sourceText(locale,'vipProducts')}}</h2>
</div>
<span class="font-label-caps text-label-caps text-tertiary">{{t('progress')}}</span>
</div>
<p class="text-center text-outline py-8" v-if="!items.length&&!error">{{t('empty')}}</p><ProductCard :key="product.id" :locale="locale" :product="product" @buy="start" v-for="product in items" variant="vip"></ProductCard><button :disabled="busy" @click="load(true)" class="plain w-full" type="button" v-if="more">{{d('more')}}</button>
<div class="pt-space-md pb-space-sm flex flex-col items-center justify-center text-center">
<BrandMotto :locale="locale"/>
</div>
</div>
</div>
</main></template>
<template v-else-if="category==='benefit'"><header class="fixed top-0 w-full z-50 pt-safe bg-surface-container-lowest/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]"><div class="h-14 px-margin-sm flex items-center justify-between"><button :aria-label="d('back')" :disabled="busy" @click="zone('')"  class="w-11 h-11 flex items-center justify-center -ml-2 rounded-lg text-on-surface hover:bg-surface-container transition-colors" type="button"><UiIcon :size="22" class="material-symbols-outlined text-[22px]" name="arrow_back"></UiIcon></button><h1 class="text-headline-sm font-headline-sm text-on-surface text-center flex-1 mx-space-sm truncate">{{t('benefit')}}</h1></div></header><main class="flex flex-col relative w-full pt-14 pb-safe bg-surface min-h-screen"><div class="flex flex-col w-full px-margin-sm space-y-space-md pb-space-xl"><p class="error" role="alert" v-if="error&&!selected">{{error}} <button :disabled="busy" @click="load()" class="plain" type="button">{{d('retry')}}</button></p><p class="source-notice" role="status" v-if="notice">{{notice}}</p>

<div class="relative overflow-hidden rounded-xl bg-gradient-to-br from-amber-500 via-amber-600 to-orange-600 text-white p-space-md shadow-md">
<div class="absolute -right-6 -bottom-8 w-36 h-36 rounded-full bg-white/15 blur-2xl pointer-events-none"></div>
<div class="absolute top-0 right-0 p-space-md opacity-20 pointer-events-none">
<UiIcon :size="96" class="material-symbols-outlined text-[96px] leading-none" name="redeem"></UiIcon>
</div>
<div class="relative z-10 space-y-space-xs">
<div class="inline-flex items-center space-x-1 bg-white/15 backdrop-blur-sm px-2 py-0.5 rounded text-[11px] font-label-caps">
<UiIcon :size="14" class="material-symbols-outlined text-[14px]" name="stars"></UiIcon>
<span class="">{{t('benefitBadge')}}</span>
</div>
<h2 class="font-headline-lg-mobile text-headline-lg-mobile tracking-tight text-white">{{t('benefitHero')}} {{overview?.zone_rate_texts.benefit||'—'}}</h2>
</div>
</div>
<div class="flex items-center justify-between pt-3">
<div class="flex items-center space-x-1.5">
<div class="w-1 h-3.5 bg-primary rounded-full"></div>
<span class="font-headline-sm text-headline-sm text-on-surface">{{t('benefitList')}}</span>
</div>
</div>
<div class="flex flex-col space-y-space-sm">
<p class="text-center text-outline py-8" v-if="!items.length&&!error">{{t('empty')}}</p><ProductCard :key="product.id" :locale="locale" :product="product" @buy="start" v-for="product in items" variant="benefit"></ProductCard><button :disabled="busy" @click="load(true)" class="plain w-full" type="button" v-if="more">{{d('more')}}</button>
</div>
<div class="flex flex-col items-center justify-center pt-2 pb-space-sm space-y-1.5 text-center">
<BrandMotto :locale="locale"/>
</div>
</div>
</main></template>
<div :aria-label="t(stage==='success'?'success':stage==='pay'?'payment':stage==='setup'?'setup':'preview')" @click.self="close" aria-modal="true" class="fixed inset-0 z-[100] flex items-end sm:items-center justify-center px-0 sm:px-4 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300" id="purchase-flow-modal" role="dialog" v-if="selected&&(!category||category==='equity')"><div class="bg-white w-full max-w-sm rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-100 flex flex-col transform sm:translate-y-0 transition-all duration-300 relative max-h-[92vh] overflow-y-auto" id="purchase-flow-card" style="transform:none"><button :aria-label="t('close')" :disabled="busy" @click="close"  class="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors z-10" id="flow-modal-close" type="button"><UiIcon :size="20" class="material-symbols-outlined text-[20px]" name="close"></UiIcon></button><p class="error mt-8" role="alert" v-if="error&&stage!=='pay'">{{error}}</p><div class="flex flex-col" id="step-1" v-if="stage==='amount'||stage==='confirm'"><div class="text-left mb-4 pr-8"><div class="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 mb-1"><span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>{{sourceText(locale,'stepPlan')}}</div><h3 class="text-xl font-bold text-slate-900 tracking-tight" id="step1-title">{{selected.name}}</h3><p class="text-xs text-slate-500 mt-0.5">{{sourceText(locale,'confirmReview')}}</p></div><div class="bg-slate-50/90 rounded-2xl p-4 border border-slate-100 mb-4"><div class="flex justify-between items-center mb-1.5 text-xs text-slate-500"><span class="">{{t('amount')}}</span><span class="text-emerald-700 font-medium">{{t('available')}}: {{preview?.available??props.available??'—'}} USDT</span></div><div class="flex items-baseline justify-between py-1"><input :aria-label="t('amount')" :readonly="busy||category==='novice'" @keydown.enter.prevent="makePreview" autocomplete="off" class="text-2xl font-bold font-['JetBrains_Mono'] text-slate-900 source-amount-input" inputmode="decimal" maxlength="25" v-if="stage==='amount'" v-model="amount"/><span class="text-2xl font-bold font-['JetBrains_Mono'] text-slate-900" id="step1-amount-display" v-else="">{{preview?.amount}}</span><span class="text-xs font-bold text-slate-600 bg-white px-2 py-1 rounded-md border border-slate-200">USDT</span></div><div class="text-[11px] text-slate-400 flex items-center gap-1 mt-1"><UiIcon :size="13" class="material-symbols-outlined text-[13px] text-emerald-600" name="verified_user"></UiIcon>{{t('minimum')}} {{selected!.minimum}} U</div></div><div class="bg-slate-50/70 rounded-2xl p-3.5 flex flex-col gap-2.5 text-xs border border-slate-100 mb-5"><div class="flex justify-between items-center"><span class="text-slate-400">{{sourceText(locale,'projectedDailyRate')}}</span><span class="font-bold text-emerald-600 text-sm" id="step1-rate">{{selected.daily_percent}}%</span></div><div class="flex justify-between items-center"><span class="text-slate-400">{{t('term')}}</span><span class="font-semibold text-slate-800" id="step1-term">{{selected.term_days}}{{t('days')}}</span></div><div class="flex justify-between items-center"><span class="text-slate-400">{{sourceText(locale,'payoutMode')}}</span><span class="text-emerald-700 font-medium bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100/80">{{sourcePayout(locale,selected.payout_mode,'按日返息 到期返本',t(selected.payout_mode))}}</span></div><div class="h-px bg-slate-200/60 my-0.5"></div><div class="flex justify-between items-center"><span class="text-slate-500 font-medium">{{sourceText(locale,'fullInterest')}}</span><span class="font-bold text-[#d97706] text-sm" id="step1-profit">+{{preview?.expected_interest??selected.expected_interest}} U</span></div><div class="flex justify-between items-center" v-if="preview"><span class="text-slate-400">{{t('start')}}</span><span class="font-semibold text-slate-800">{{t('immediate')}}</span></div><div class="pt-1 text-[11px] leading-relaxed text-slate-400">{{payoutHintText()}}</div><div class="flex justify-between items-center" v-if="preview"><span class="text-slate-400">{{t('due')}}</span><span class="font-semibold text-slate-800">{{businessTime(preview!.matures_at)}}</span></div></div><div class="flex flex-col gap-2 w-full"><button :disabled="busy" @click="stage==='amount'?makePreview():stage=preview?.payment_setup_required?'setup':'pay'" class="w-full py-3.5 rounded-xl text-white text-sm font-semibold shadow-sm transition-all flex items-center justify-center gap-1.5 active:scale-[0.99] bg-[#d97706] hover:bg-amber-700" id="step1-next-btn" type="button"><span class="">{{busy?d('loading'):t('confirm')}}</span><UiIcon :size="18" class="material-symbols-outlined text-[18px]" name="arrow_forward"></UiIcon></button><button v-if="error===t('insufficient_balance')" :disabled="busy" @click="emit('deposit')" class="w-full py-2.5 rounded-xl text-slate-500 hover:text-slate-700 text-xs font-medium transition-colors" type="button">{{p('deposit')}}</button><button v-if="error===t('insufficient_balance')" :disabled="busy" @click="emit('rollover')" class="w-full py-2.5 rounded-xl text-slate-500 hover:text-slate-700 text-xs font-medium transition-colors" type="button">{{p('rollover')}}</button><button :disabled="busy" @click="close" class="w-full py-2.5 rounded-xl text-slate-500 hover:text-slate-700 text-xs font-medium transition-colors" id="step1-cancel-btn" type="button">{{t('close')}}</button></div></div><div class="flex flex-col items-center text-center" id="step-2" v-else-if="stage==='pay'"><div class="w-full flex items-center justify-between mb-2"><button :aria-label="d('back')" :disabled="busy" @click="stage='confirm';password=''" class="w-7 h-7 -ml-1 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100" id="step2-back-btn" type="button"><UiIcon :size="18" class="material-symbols-outlined text-[18px]" name="arrow_back"></UiIcon></button><span class="text-xs font-semibold text-emerald-700">{{sourceText(locale,'stepPay')}}</span><div class="w-7"></div></div><div class="text-xs text-slate-500">{{sourceText(locale,'paymentAuth')}}</div><div class="text-2xl font-bold font-['JetBrains_Mono'] text-slate-900 mt-1 mb-1" id="step2-amount">{{preview?.amount}} USDT</div><div class="text-[11px] text-slate-400 mb-4">{{sourceText(locale,'sixDigitPin')}}</div><PaymentPin :disabled="busy" :error="error" :label="t('payment')" :locale="locale" v-model="password"></PaymentPin><button :disabled="busy" @click="pay" class="source-confirm-payment" type="button">{{busy?d('loading'):t('submit')}}</button></div><div class="flex flex-col items-center text-center" id="step-3" v-else-if="stage==='success'&&result"><div class="relative w-16 h-16 rounded-full bg-emerald-50 border-4 border-emerald-100 flex items-center justify-center text-emerald-600 mb-3.5 shadow-[0_0_24px_rgba(5,150,105,0.22)]"><UiIcon :size="34" class="material-symbols-outlined text-[34px] font-bold" name="check"></UiIcon></div><h3 class="text-xl font-bold text-slate-900 tracking-tight mb-1">{{t('success')}}</h3><p class="text-xs text-slate-500 mb-4">{{sourceText(locale,'bookedHint')}}</p><div class="w-full bg-slate-50/80 rounded-2xl p-4 flex flex-col gap-2.5 text-xs border border-slate-100 mb-5 text-left"><div class="flex justify-between items-center"><span class="text-slate-400">{{sourceText(locale,'productLabel')}}</span><span class="font-semibold text-slate-800 text-right" id="step3-product-name">{{result!.product_name}}</span></div><div class="flex justify-between items-center"><span class="text-slate-400">{{t('amount')}}</span><span class="font-bold text-slate-900 font-['JetBrains_Mono']" id="step3-amount">{{result!.principal}} USDT</span></div><div class="flex justify-between items-center"><span class="text-slate-400">{{sourceText(locale,'rateTerm')}}</span><span class="font-medium text-emerald-600" id="step3-rate-term">{{result!.daily_percent}}% / {{result!.term_days}}{{t('days')}}</span></div><div class="flex justify-between items-center"><span class="text-slate-400">{{t('start')}}</span><span class="font-medium text-slate-700" id="step3-interest-date">{{t('immediate')}}</span></div><div class="pt-1 text-[11px] leading-relaxed text-slate-400">{{payoutHintText()}}</div><div class="flex justify-between items-center"><span class="text-slate-400">{{sourceText(locale,'orderStatus')}}</span><span class="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/70"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>{{t(result!.status)}}</span></div><div class="h-px bg-slate-200/60 my-0.5"></div><div class="flex justify-between items-center"><span class="text-slate-500 font-medium">{{sourceText(locale,'fullInterest')}}</span><span class="font-bold text-[#d97706] text-sm" id="step3-profit">+{{result!.expected_interest}} USDT</span></div></div><div class="flex flex-col w-full gap-2.5"><button @click="emit('orders',result!.order_no)" class="w-full py-3.5 rounded-xl text-white text-sm font-semibold shadow-sm transition-all flex items-center justify-center gap-1 active:scale-[0.99] bg-[#d97706] hover:bg-amber-700" id="step3-view-orders" type="button">{{t('viewOrders')}}</button><button @click="close" class="w-full py-2.5 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 text-xs font-medium transition-colors" id="step3-back-btn" type="button">{{t('close')}}</button></div></div><form @submit.prevent="setup" class="source-extra-state" v-else-if="stage==='setup'"><h2>{{t('setup')}}</h2><label>{{t('payment')}}<input :readonly="busy" autocomplete="off" inputmode="numeric" maxlength="6" type="password" v-model="password"/></label><label>{{t('repeat')}}<input :readonly="busy" autocomplete="off" inputmode="numeric" maxlength="6" type="password" v-model="confirmation"/></label><button :disabled="busy" class="source-confirm-payment" type="submit">{{busy?d('loading'):t('confirm')}}</button></form><div class="source-extra-state" v-else-if="stage==='recovery'"><h2>{{t('recover')}}</h2><p>{{t('recover')}}</p><button :disabled="busy" @click="recover" class="source-confirm-payment" type="button">{{busy?d('loading'):t('checkResult')}}</button></div></div></div>
<div :aria-label="t(stage==='success'?'success':stage==='pay'?'payment':stage==='setup'?'setup':'preview')" @click.self="close" aria-modal="true" class="fixed inset-0 z-[100] flex items-end sm:items-center justify-center px-0 sm:px-4 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300" id="purchase-flow-modal" role="dialog" v-if="selected&&category==='novice'">
<div class="bg-white w-full max-w-sm rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-100 flex flex-col transform sm:translate-y-0 transition-all duration-300 relative max-h-[92vh] overflow-y-auto" id="purchase-flow-card" style="transform:none">
<button :aria-label="t('close')" :disabled="busy" @click="close"  class="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors z-10" id="flow-modal-close" type="button">
<UiIcon :size="20" class="material-symbols-outlined text-[20px]" name="close"></UiIcon>
</button><p class="error mt-8" role="alert" v-if="error&&stage!=='pay'">{{error}}</p>
<div class="flex flex-col" id="step-1" v-if="stage==='amount'||stage==='confirm'">
<div class="text-left mb-4 pr-8">
<div class="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 mb-1">
<span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>{{sourceText(locale,'stepDetails')}}</div>
<h3 class="text-xl font-bold text-slate-900 tracking-tight" id="step1-title">{{selected.name}}</h3>
<p class="text-xs text-slate-500 mt-0.5">{{sourceText(locale,'confirmReview')}}</p>
</div>
<div class="bg-slate-50/90 rounded-2xl p-4 border border-slate-100 mb-4">
<div class="flex justify-between items-center mb-1.5 text-xs text-slate-500">
<span>{{t('amount')}}</span>
<span class="text-emerald-700 font-medium">{{t('available')}}: {{preview?.available??props.available??'—'}} USDT</span>
</div>
<div class="flex items-baseline justify-between py-1">
<input :aria-label="t('amount')" :readonly="busy||category==='novice'" @keydown.enter.prevent="makePreview" autocomplete="off" class="text-2xl font-bold font-['JetBrains_Mono'] text-slate-900 source-amount-input" inputmode="decimal" maxlength="25" v-if="stage==='amount'" v-model="amount"/><span class="text-2xl font-bold font-['JetBrains_Mono'] text-slate-900" id="step1-amount-display" v-else="">{{selected.minimum}}</span>
<span class="text-xs font-bold text-slate-600 bg-white px-2 py-1 rounded-md border border-slate-200">USDT</span>
</div>
<div class="text-[11px] text-slate-400 flex items-center gap-1 mt-1">
<UiIcon :size="13" class="material-symbols-outlined text-[13px] text-emerald-600" name="verified_user"></UiIcon>{{t('minimum')}} {{selected!.minimum}} U</div>
</div>
<div class="bg-slate-50/70 rounded-2xl p-3.5 flex flex-col gap-2.5 text-xs border border-slate-100 mb-5">
<div class="flex justify-between items-center">
<span class="text-slate-400">{{sourceText(locale,'projectedDailyRate')}}</span>
<span class="font-bold text-emerald-600 text-sm" id="step1-rate">{{selected.daily_percent}}%</span>
</div>
<div class="flex justify-between items-center">
<span class="text-slate-400">{{t('term')}}</span>
<span class="font-semibold text-slate-800" id="step1-term">{{selected.term_days}}{{t('days')}}</span>
</div>
<div class="flex justify-between items-center">
<span class="text-slate-400">{{sourceText(locale,'payoutMode')}}</span>
<span class="text-emerald-700 font-medium bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100/80">{{sourcePayout(locale,selected.payout_mode,'按日返息 到期返本',t(selected.payout_mode))}}</span>
</div>
<div class="h-px bg-slate-200/60 my-0.5"></div>
<div class="flex justify-between items-center">
<span class="text-slate-500 font-medium">{{sourceText(locale,'fullInterest')}}</span>
<span class="font-bold text-[#904d00] text-sm" id="step1-profit">+{{preview?.expected_interest??selected.expected_interest}} U</span>
</div>
<div class="flex justify-between items-center" v-if="preview">
<span class="text-slate-400">{{t('start')}}</span>
<span class="font-semibold text-slate-800">{{t('immediate')}}</span>
</div><div class="pt-1 text-[11px] leading-relaxed text-slate-400">{{payoutHintText()}}</div><div class="flex justify-between items-center" v-if="preview">
<span class="text-slate-400">{{t('due')}}</span>
<span class="font-semibold text-slate-800">{{businessTime(preview!.matures_at)}}</span>
</div></div>
<div class="flex flex-col gap-2 w-full">
<button :disabled="busy" @click="stage==='amount'?makePreview():stage=preview?.payment_setup_required?'setup':'pay'" class="w-full py-3.5 rounded-xl text-white text-sm font-semibold shadow-sm transition-all flex items-center justify-center gap-1.5 active:scale-[0.99]" id="step1-next-btn" style="background-color: rgb(217, 119, 6);" type="button">
<span>{{busy?d('loading'):t('confirm')}}</span>
<UiIcon :size="18" class="material-symbols-outlined text-[18px]" name="arrow_forward"></UiIcon>
</button>
<button v-if="error===t('insufficient_balance')" :disabled="busy" @click="emit('deposit')" class="w-full py-2.5 rounded-xl text-slate-500 hover:text-slate-700 text-xs font-medium transition-colors" type="button">{{p('deposit')}}</button><button v-if="error===t('insufficient_balance')" :disabled="busy" @click="emit('rollover')" class="w-full py-2.5 rounded-xl text-slate-500 hover:text-slate-700 text-xs font-medium transition-colors" type="button">{{p('rollover')}}</button><button :disabled="busy" @click="close" class="w-full py-2.5 rounded-xl text-slate-500 hover:text-slate-700 text-xs font-medium transition-colors" id="step1-cancel-btn" type="button">{{t('close')}}</button>
</div>
</div>
<div class="flex flex-col items-center text-center" id="step-2" v-else-if="stage==='pay'">
<div class="w-full flex items-center justify-between mb-2">
<button :aria-label="d('back')" :disabled="busy" @click="stage='confirm';password=''" class="w-7 h-7 -ml-1 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100" id="step2-back-btn" type="button">
<UiIcon :size="18" class="material-symbols-outlined text-[18px]" name="arrow_back"></UiIcon>
</button>
<span class="text-xs font-semibold text-emerald-700">{{sourceText(locale,'stepPay')}}</span>
<div class="w-7"></div>
</div>
<div class="text-xs text-slate-500">{{sourceText(locale,'paymentAuth')}}</div>
<div class="text-2xl font-bold font-['JetBrains_Mono'] text-slate-900 mt-1 mb-1" id="step2-amount">{{selected.minimum}} USDT</div>
<div class="text-[11px] text-slate-400 mb-4">{{sourceText(locale,'sixDigitPin')}}</div>
<PaymentPin :disabled="busy" :error="error" :label="t('payment')" :locale="locale" v-model="password"></PaymentPin>
<button :disabled="busy" @click="pay" class="source-confirm-payment" type="button">{{busy?d('loading'):t('submit')}}</button></div>
<div class="flex flex-col items-center text-center" id="step-3" v-else-if="stage==='success'&&result">
<div class="relative w-16 h-16 rounded-full bg-emerald-50 border-4 border-emerald-100 flex items-center justify-center text-emerald-600 mb-3.5 shadow-[0_0_24px_rgba(5,150,105,0.22)]">
<UiIcon :size="34" class="material-symbols-outlined text-[34px] font-bold" name="check"></UiIcon>
</div>
<h3 class="text-xl font-bold text-slate-900 tracking-tight mb-1">{{t('success')}}</h3>
<p class="text-xs text-slate-500 mb-4">{{sourceText(locale,'bookedHint')}}</p>
<div class="w-full bg-slate-50/80 rounded-2xl p-4 flex flex-col gap-2.5 text-xs border border-slate-100 mb-5 text-left">
<div class="flex justify-between items-center">
<span class="text-slate-400">{{sourceText(locale,'productLabel')}}</span>
<span class="font-semibold text-slate-800 text-right" id="step3-product-name">{{result!.product_name}}</span>
</div>
<div class="flex justify-between items-center">
<span class="text-slate-400">{{t('amount')}}</span>
<span class="font-bold text-slate-900 font-['JetBrains_Mono']" id="step3-amount">{{result!.principal}} USDT</span>
</div>
<div class="flex justify-between items-center">
<span class="text-slate-400">{{sourceText(locale,'rateTerm')}}</span>
<span class="font-medium text-emerald-600" id="step3-rate-term">{{result!.daily_percent}}% / {{result!.term_days}}{{t('days')}}</span>
</div>
<div class="flex justify-between items-center">
<span class="text-slate-400">{{t('start')}}</span>
<span class="font-medium text-slate-700" id="step3-interest-date">{{t('immediate')}}</span>
</div><div class="pt-1 text-[11px] leading-relaxed text-slate-400">{{payoutHintText()}}</div>
<div class="flex justify-between items-center">
<span class="text-slate-400">{{sourceText(locale,'orderStatus')}}</span>
<span class="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/70">
<span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>{{t(result!.status)}}</span>
</div>
<div class="h-px bg-slate-200/60 my-0.5"></div>
<div class="flex justify-between items-center">
<span class="text-slate-500 font-medium">{{sourceText(locale,'fullInterest')}}</span>
<span class="font-bold text-[#904d00] text-sm" id="step3-profit">+{{result!.expected_interest}} USDT</span>
</div>
</div>
<div class="flex flex-col w-full gap-2.5">
<button @click="emit('orders',result!.order_no)" class="w-full py-3.5 rounded-xl text-white text-sm font-semibold shadow-sm transition-all flex items-center justify-center gap-1 active:scale-[0.99]" id="step3-view-orders" style="background-color: rgb(217, 119, 6);" type="button">{{t('viewOrders')}}</button>
<button @click="close" class="w-full py-2.5 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 text-xs font-medium transition-colors" id="step3-back-btn" type="button">{{t('close')}}</button>
</div>
</div><form @submit.prevent="setup" class="source-extra-state" v-else-if="stage==='setup'"><h2>{{t('setup')}}</h2><label>{{t('payment')}}<input :readonly="busy" autocomplete="off" inputmode="numeric" maxlength="6" type="password" v-model="password"/></label><label>{{t('repeat')}}<input :readonly="busy" autocomplete="off" inputmode="numeric" maxlength="6" type="password" v-model="confirmation"/></label><button :disabled="busy" class="source-confirm-payment" type="submit">{{busy?d('loading'):t('confirm')}}</button></form><div class="source-extra-state" v-else-if="stage==='recovery'"><h2>{{t('recover')}}</h2><p>{{t('recover')}}</p><button :disabled="busy" @click="recover" class="source-confirm-payment" type="button">{{busy?d('loading'):t('checkResult')}}</button></div>
</div>
</div>
<div :aria-label="t(stage==='success'?'success':stage==='pay'?'payment':stage==='setup'?'setup':'preview')" @click.self="close" aria-modal="true" class="fixed inset-0 z-[100] flex items-end sm:items-center justify-center px-0 sm:px-4 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300" id="purchase-flow-modal" role="dialog" v-if="selected&&category==='fixed'">
<div class="bg-white w-full max-w-sm rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-100 flex flex-col transform sm:translate-y-0 transition-all duration-300 relative max-h-[92vh] overflow-y-auto" id="purchase-flow-card" style="transform:none">
<button :aria-label="t('close')" :disabled="busy" @click="close"  class="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors z-10" id="flow-modal-close" type="button">
<UiIcon :size="20" class="material-symbols-outlined text-[20px]" name="close"></UiIcon>
</button><p class="error mt-8" role="alert" v-if="error&&stage!=='pay'">{{error}}</p>
<div class="flex flex-col" id="step-1" v-if="stage==='amount'||stage==='confirm'">
<div class="text-left mb-4 pr-8">
<div class="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 mb-1">
<span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>{{sourceText(locale,'stepPlan')}}</div>
<h3 class="text-xl font-bold text-slate-900 tracking-tight" id="step1-title">{{selected.name}}</h3>
<p class="text-xs text-slate-500 mt-0.5">{{sourceText(locale,'confirmReview')}}</p>
</div>
<div class="bg-slate-50/90 rounded-2xl p-4 border border-slate-100 mb-4">
<div class="flex justify-between items-center mb-1.5 text-xs text-slate-500">
<span>{{t('amount')}}</span>
<span class="text-emerald-700 font-medium">{{t('available')}}: {{preview?.available??props.available??'—'}} USDT</span>
</div>
<div class="flex items-baseline justify-between py-1">
<input :aria-label="t('amount')" :readonly="busy" @keydown.enter.prevent="makePreview" autocomplete="off" class="text-2xl font-bold font-['JetBrains_Mono'] text-slate-900 source-amount-input" inputmode="decimal" maxlength="25" v-if="stage==='amount'" v-model="amount"/><span class="text-2xl font-bold font-['JetBrains_Mono'] text-slate-900" id="step1-amount-display" v-else="">{{preview?.amount}}</span>
<span class="text-xs font-bold text-slate-600 bg-white px-2 py-1 rounded-md border border-slate-200">USDT</span>
</div>
<div class="text-[11px] text-slate-400 flex items-center gap-1 mt-1">
<UiIcon :size="13" class="material-symbols-outlined text-[13px] text-emerald-600" name="verified_user"></UiIcon>{{t('minimum')}} {{selected!.minimum}} U</div>
</div>
<div class="bg-slate-50/70 rounded-2xl p-3.5 flex flex-col gap-2.5 text-xs border border-slate-100 mb-5">
<div class="flex justify-between items-center">
<span class="text-slate-400">{{sourceText(locale,'projectedDailyRate')}}</span>
<span class="font-bold text-emerald-600 text-sm" id="step1-rate">{{selected.daily_percent}}%</span>
</div>
<div class="flex justify-between items-center">
<span class="text-slate-400">{{t('term')}}</span>
<span class="font-semibold text-slate-800" id="step1-term">{{selected.term_days}}{{t('days')}}</span>
</div>
<div class="flex justify-between items-center">
<span class="text-slate-400">{{sourceText(locale,'payoutMode')}}</span>
<span class="text-emerald-700 font-medium bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100/80">{{sourcePayout(locale,selected.payout_mode,'按日返息 到期返本',t(selected.payout_mode))}}</span>
</div>
<div class="h-px bg-slate-200/60 my-0.5"></div>
<div class="flex justify-between items-center">
<span class="text-slate-500 font-medium">{{sourceText(locale,'fullInterest')}}</span>
<span class="font-bold text-[#904d00] text-sm" id="step1-profit">+{{preview?.expected_interest??selected.expected_interest}} U</span>
</div>
<div class="flex justify-between items-center" v-if="preview">
<span class="text-slate-400">{{t('start')}}</span>
<span class="font-semibold text-slate-800">{{t('immediate')}}</span>
</div><div class="pt-1 text-[11px] leading-relaxed text-slate-400">{{payoutHintText()}}</div><div class="flex justify-between items-center" v-if="preview">
<span class="text-slate-400">{{t('due')}}</span>
<span class="font-semibold text-slate-800">{{businessTime(preview!.matures_at)}}</span>
</div></div>
<div class="flex flex-col gap-2 w-full">
<button :disabled="busy" @click="stage==='amount'?makePreview():stage=preview?.payment_setup_required?'setup':'pay'" class="w-full py-3.5 rounded-xl text-white text-sm font-medium shadow-sm transition-all flex items-center justify-center gap-1.5 active:scale-[0.99] font-semibold" id="step1-next-btn" style="background-color: rgb(217, 119, 6);" type="button">
<span>{{busy?d('loading'):t('confirm')}}</span>
<UiIcon :size="18" class="material-symbols-outlined text-[18px]" name="arrow_forward"></UiIcon>
</button>
<button v-if="error===t('insufficient_balance')" :disabled="busy" @click="emit('deposit')" class="w-full py-2.5 rounded-xl text-slate-500 hover:text-slate-700 text-xs font-medium transition-colors" type="button">{{p('deposit')}}</button><button v-if="error===t('insufficient_balance')" :disabled="busy" @click="emit('rollover')" class="w-full py-2.5 rounded-xl text-slate-500 hover:text-slate-700 text-xs font-medium transition-colors" type="button">{{p('rollover')}}</button><button :disabled="busy" @click="close" class="w-full py-2.5 rounded-xl text-slate-500 hover:text-slate-700 text-xs font-medium transition-colors" id="step1-cancel-btn" type="button">{{t('close')}}</button>
</div>
</div>
<div class="flex flex-col items-center text-center" id="step-2" v-else-if="stage==='pay'">
<div class="w-full flex items-center justify-between mb-2">
<button :aria-label="d('back')" :disabled="busy" @click="stage='confirm';password=''" class="w-7 h-7 -ml-1 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100" id="step2-back-btn" type="button">
<UiIcon :size="18" class="material-symbols-outlined text-[18px]" name="arrow_back"></UiIcon>
</button>
<span class="text-xs font-semibold text-emerald-700">{{sourceText(locale,'stepPay')}}</span>
<div class="w-7"></div>
</div>
<div class="text-xs text-slate-500">{{sourceText(locale,'paymentAuth')}}</div>
<div class="text-2xl font-bold font-['JetBrains_Mono'] text-slate-900 mt-1 mb-1" id="step2-amount">{{preview?.amount}} USDT</div>
<div class="text-[11px] text-slate-400 mb-4">{{sourceText(locale,'sixDigitPin')}}</div>
<PaymentPin :disabled="busy" :error="error" :label="t('payment')" :locale="locale" v-model="password"></PaymentPin>
<button :disabled="busy" @click="pay" class="source-confirm-payment" type="button">{{busy?d('loading'):t('submit')}}</button></div>
<div class="flex flex-col items-center text-center" id="step-3" v-else-if="stage==='success'&&result">
<div class="relative w-16 h-16 rounded-full bg-emerald-50 border-4 border-emerald-100 flex items-center justify-center text-emerald-600 mb-3.5 shadow-[0_0_24px_rgba(5,150,105,0.22)]">
<UiIcon :size="34" class="material-symbols-outlined text-[34px] font-bold" name="check"></UiIcon>
</div>
<h3 class="text-xl font-bold text-slate-900 tracking-tight mb-1">{{t('success')}}</h3>
<p class="text-xs text-slate-500 mb-4">{{sourceText(locale,'bookedHint')}}</p>
<div class="w-full bg-slate-50/80 rounded-2xl p-4 flex flex-col gap-2.5 text-xs border border-slate-100 mb-5 text-left">
<div class="flex justify-between items-center">
<span class="text-slate-400">{{sourceText(locale,'productLabel')}}</span>
<span class="font-semibold text-slate-800 text-right" id="step3-product-name">{{result!.product_name}}</span>
</div>
<div class="flex justify-between items-center">
<span class="text-slate-400">{{t('amount')}}</span>
<span class="font-bold text-slate-900 font-['JetBrains_Mono']" id="step3-amount">{{result!.principal}} USDT</span>
</div>
<div class="flex justify-between items-center">
<span class="text-slate-400">{{sourceText(locale,'rateTerm')}}</span>
<span class="font-medium text-emerald-600" id="step3-rate-term">{{result!.daily_percent}}% / {{result!.term_days}}{{t('days')}}</span>
</div>
<div class="flex justify-between items-center">
<span class="text-slate-400">{{t('start')}}</span>
<span class="font-medium text-slate-700" id="step3-interest-date">{{t('immediate')}}</span>
</div><div class="pt-1 text-[11px] leading-relaxed text-slate-400">{{payoutHintText()}}</div>
<div class="flex justify-between items-center">
<span class="text-slate-400">{{sourceText(locale,'orderStatus')}}</span>
<span class="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/70">
<span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>{{t(result!.status)}}</span>
</div>
<div class="h-px bg-slate-200/60 my-0.5"></div>
<div class="flex justify-between items-center">
<span class="text-slate-500 font-medium">{{sourceText(locale,'fullInterest')}}</span>
<span class="font-bold text-[#904d00] text-sm" id="step3-profit">+{{result!.expected_interest}} USDT</span>
</div>
</div>
<div class="flex flex-col w-full gap-2.5">
<button @click="emit('orders',result!.order_no)" class="w-full py-3.5 rounded-xl text-white text-sm font-semibold shadow-sm transition-all flex items-center justify-center gap-1 active:scale-[0.99]" id="step3-view-orders" style="background-color: rgb(217, 119, 6);" type="button">{{t('viewOrders')}}</button>
<button @click="close" class="w-full py-2.5 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 text-xs font-medium transition-colors" id="step3-back-btn" type="button">{{t('close')}}</button>
</div>
</div><form @submit.prevent="setup" class="source-extra-state" v-else-if="stage==='setup'"><h2>{{t('setup')}}</h2><label>{{t('payment')}}<input :readonly="busy" autocomplete="off" inputmode="numeric" maxlength="6" type="password" v-model="password"/></label><label>{{t('repeat')}}<input :readonly="busy" autocomplete="off" inputmode="numeric" maxlength="6" type="password" v-model="confirmation"/></label><button :disabled="busy" class="source-confirm-payment" type="submit">{{busy?d('loading'):t('confirm')}}</button></form><div class="source-extra-state" v-else-if="stage==='recovery'"><h2>{{t('recover')}}</h2><p>{{t('recover')}}</p><button :disabled="busy" @click="recover" class="source-confirm-payment" type="button">{{busy?d('loading'):t('checkResult')}}</button></div>
</div>
</div>
<div :aria-label="t(stage==='success'?'success':stage==='pay'?'payment':stage==='setup'?'setup':'preview')" @click.self="close" aria-modal="true" class="fixed inset-0 z-[100] flex items-end sm:items-center justify-center px-0 sm:px-4 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300 opacity-100" id="purchase-flow-modal" role="dialog" v-if="selected&&category==='vip'">
<div class="bg-white w-full max-w-sm rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-100 flex flex-col transform sm:translate-y-0 transition-all duration-300 relative max-h-[92vh] overflow-y-auto translate-y-0 sm:scale-100" id="purchase-flow-card" style="transform:none">
<button :aria-label="t('close')" :disabled="busy" @click="close"  class="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors z-10" id="flow-modal-close" type="button">
<UiIcon :size="20" class="material-symbols-outlined text-[20px]" name="close"></UiIcon>
</button><p class="error mt-8" role="alert" v-if="error&&stage!=='pay'">{{error}}</p>
<div class="flex flex-col" id="step-1" v-if="stage==='amount'||stage==='confirm'">
<div class="text-left mb-4 pr-8">
<div class="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 mb-1">
<span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>{{sourceText(locale,'stepPlan')}}</div>
<h3 class="text-xl font-bold text-slate-900 tracking-tight" id="step1-title">{{selected.name}}</h3>
<p class="text-xs text-slate-500 mt-0.5">{{sourceText(locale,'vipReview')}}</p>
</div>
<div class="bg-slate-50/90 rounded-2xl p-4 border border-slate-100 mb-4">
<div class="flex justify-between items-center mb-1.5 text-xs text-slate-500">
<span class="">{{t('amount')}}</span>
<span class="text-emerald-700 font-medium">{{t('available')}}: {{preview?.available??props.available??'—'}} USDT</span>
</div>
<div class="flex items-baseline justify-between py-1">
<input :aria-label="t('amount')" :readonly="busy" @keydown.enter.prevent="makePreview" autocomplete="off" class="text-2xl font-bold font-['JetBrains_Mono'] text-slate-900 source-amount-input" inputmode="decimal" maxlength="25" v-if="stage==='amount'" v-model="amount"/><span class="text-2xl font-bold font-['JetBrains_Mono'] text-slate-900" id="step1-amount-display" v-else="">{{preview?.amount}}</span>
<span class="text-xs font-bold text-slate-600 bg-white px-2 py-1 rounded-md border border-slate-200">USDT</span>
</div>
<div class="text-[11px] text-slate-400 flex items-center gap-1 mt-1">
<UiIcon :size="13" class="material-symbols-outlined text-[13px] text-emerald-600" name="verified_user"></UiIcon>{{t('minimum')}} {{selected!.minimum}} U</div>
</div>
<div class="bg-slate-50/70 rounded-2xl p-3.5 flex flex-col gap-2.5 text-xs border border-slate-100 mb-5">
<div class="flex justify-between items-center">
<span class="text-slate-400">{{sourceText(locale,'projectedDailyRate')}}</span>
<span class="font-bold text-emerald-600 text-sm" id="step1-rate">{{selected.daily_percent}}%</span>
</div>
<div class="flex justify-between items-center">
<span class="text-slate-400">{{t('term')}}</span>
<span class="font-semibold text-slate-800" id="step1-term">{{selected.term_days}}{{t('days')}}</span>
</div>
<div class="flex justify-between items-center">
<span class="text-slate-400">{{sourceText(locale,'payoutMode')}}</span>
<span class="text-emerald-700 font-medium bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100/80">{{sourcePayout(locale,selected.payout_mode,'按日返息 到期返本',t(selected.payout_mode))}}</span>
</div>
<div class="h-px bg-slate-200/60 my-0.5"></div>
<div class="flex justify-between items-center">
<span class="text-slate-500 font-medium">{{sourceText(locale,'fullInterest')}}</span>
<span class="font-bold text-[#904d00] text-sm" id="step1-profit">+{{preview?.expected_interest??selected.expected_interest}} U</span>
</div>
<div class="flex justify-between items-center" v-if="preview">
<span class="text-slate-400">{{t('start')}}</span>
<span class="font-semibold text-slate-800">{{t('immediate')}}</span>
</div><div class="pt-1 text-[11px] leading-relaxed text-slate-400">{{payoutHintText()}}</div><div class="flex justify-between items-center" v-if="preview">
<span class="text-slate-400">{{t('due')}}</span>
<span class="font-semibold text-slate-800">{{businessTime(preview!.matures_at)}}</span>
</div></div>
<div class="flex flex-col gap-2 w-full">
<button :disabled="busy" @click="stage==='amount'?makePreview():stage=preview?.payment_setup_required?'setup':'pay'" class="w-full py-3.5 rounded-xl text-white text-sm font-semibold shadow-sm transition-all flex items-center justify-center gap-1.5 active:scale-[0.99]" id="step1-next-btn" style="background-color: rgb(217, 119, 6);" type="button">
<span class="">{{busy?d('loading'):t('confirm')}}</span>
<UiIcon :size="18" class="material-symbols-outlined text-[18px]" name="arrow_forward"></UiIcon>
</button>
<button v-if="error===t('insufficient_balance')" :disabled="busy" @click="emit('deposit')" class="w-full py-2.5 rounded-xl text-slate-500 hover:text-slate-700 text-xs font-medium transition-colors" type="button">{{p('deposit')}}</button><button v-if="error===t('insufficient_balance')" :disabled="busy" @click="emit('rollover')" class="w-full py-2.5 rounded-xl text-slate-500 hover:text-slate-700 text-xs font-medium transition-colors" type="button">{{p('rollover')}}</button><button :disabled="busy" @click="close" class="w-full py-2.5 rounded-xl text-slate-500 hover:text-slate-700 text-xs font-medium transition-colors" id="step1-cancel-btn" type="button">{{t('close')}}</button>
</div>
</div>
<div class="flex flex-col items-center text-center" id="step-2" v-else-if="stage==='pay'">
<div class="w-full flex items-center justify-between mb-2">
<button :aria-label="d('back')" :disabled="busy" @click="stage='confirm';password=''" class="w-7 h-7 -ml-1 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100" id="step2-back-btn" type="button">
<UiIcon :size="18" class="material-symbols-outlined text-[18px]" name="arrow_back"></UiIcon>
</button>
<span class="text-xs font-semibold text-emerald-700">{{sourceText(locale,'stepPay')}}</span>
<div class="w-7"></div>
</div>
<div class="text-xs text-slate-500">{{sourceText(locale,'vipPaymentAuth')}}</div>
<div class="text-2xl font-bold font-['JetBrains_Mono'] text-slate-900 mt-1 mb-1" id="step2-amount">{{preview?.amount}} USDT</div>
<div class="text-[11px] text-slate-400 mb-4">{{sourceText(locale,'sixDigitPin')}}</div>
<PaymentPin :disabled="busy" :error="error" :label="t('payment')" :locale="locale" v-model="password"></PaymentPin>
<button :disabled="busy" @click="pay" class="source-confirm-payment" type="button">{{busy?d('loading'):t('submit')}}</button></div>
<div class="flex flex-col items-center text-center" id="step-3" v-else-if="stage==='success'&&result">
<div class="relative w-16 h-16 rounded-full bg-emerald-50 border-4 border-emerald-100 flex items-center justify-center text-emerald-600 mb-3.5 shadow-[0_0_24px_rgba(5,150,105,0.22)]">
<UiIcon :size="34" class="material-symbols-outlined text-[34px] font-bold" name="check"></UiIcon>
</div>
<h3 class="text-xl font-bold text-slate-900 tracking-tight mb-1">{{t('success')}}</h3>
<p class="text-xs text-slate-500 mb-4">{{t(result!.status)}}</p>
<div class="w-full bg-slate-50/80 rounded-2xl p-4 flex flex-col gap-2.5 text-xs border border-slate-100 mb-5 text-left">
<div class="flex justify-between items-center">
<span class="text-slate-400">{{sourceText(locale,'productTarget')}}</span>
<span class="font-semibold text-slate-800 text-right truncate max-w-[200px]" id="step3-product-name">{{result!.product_name}}</span>
</div>
<div class="flex justify-between items-center">
<span class="text-slate-400">{{t('amount')}}</span>
<span class="font-bold text-slate-900 font-['JetBrains_Mono']" id="step3-amount">{{result!.principal}} USDT</span>
</div>
<div class="flex justify-between items-center">
<span class="text-slate-400">{{sourceText(locale,'rateTerm')}}</span>
<span class="font-medium text-emerald-600" id="step3-rate-term">{{result!.daily_percent}}% / {{result!.term_days}}{{t('days')}}</span>
</div>
<div class="flex justify-between items-center">
<span class="text-slate-400">{{t('start')}}</span>
<span class="font-medium text-slate-700" id="step3-interest-date">{{t('immediate')}}</span>
</div><div class="pt-1 text-[11px] leading-relaxed text-slate-400">{{payoutHintText()}}</div>
<div class="flex justify-between items-center">
<span class="text-slate-400">{{sourceText(locale,'orderStatus')}}</span>
<span class="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/70">
<span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>{{t(result!.status)}}</span>
</div>
<div class="h-px bg-slate-200/60 my-0.5"></div>
<div class="flex justify-between items-center">
<span class="text-slate-500 font-medium">{{sourceText(locale,'fullInterest')}}</span>
<span class="font-bold text-[#904d00] text-sm" id="step3-profit">+{{result!.expected_interest}} USDT</span>
</div>
</div>
<div class="flex flex-col w-full gap-2.5">
<button @click="emit('orders',result!.order_no)" class="w-full py-3.5 rounded-xl text-white text-sm font-semibold shadow-sm transition-all flex items-center justify-center gap-1 active:scale-[0.99]" id="step3-view-orders" style="background-color: rgb(217, 119, 6);" type="button">{{t('viewOrders')}}</button>
<button @click="close" class="w-full py-2.5 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 text-xs font-medium transition-colors" id="step3-back-btn" type="button">{{t('close')}}</button>
</div>
</div><form @submit.prevent="setup" class="source-extra-state" v-else-if="stage==='setup'"><h2>{{t('setup')}}</h2><label>{{t('payment')}}<input :readonly="busy" autocomplete="off" inputmode="numeric" maxlength="6" type="password" v-model="password"/></label><label>{{t('repeat')}}<input :readonly="busy" autocomplete="off" inputmode="numeric" maxlength="6" type="password" v-model="confirmation"/></label><button :disabled="busy" class="source-confirm-payment" type="submit">{{busy?d('loading'):t('confirm')}}</button></form><div class="source-extra-state" v-else-if="stage==='recovery'"><h2>{{t('recover')}}</h2><p>{{t('recover')}}</p><button :disabled="busy" @click="recover" class="source-confirm-payment" type="button">{{busy?d('loading'):t('checkResult')}}</button></div>
</div>
</div>
<div :aria-label="t(stage==='success'?'success':stage==='pay'?'payment':stage==='setup'?'setup':'preview')" @click.self="close" aria-modal="true" class="fixed inset-0 z-[100] flex items-end sm:items-center justify-center px-0 sm:px-4 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300" id="purchase-flow-modal" role="dialog" v-if="selected&&category==='benefit'">
<div class="bg-white w-full max-w-sm rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-100 flex flex-col transform sm:translate-y-0 transition-all duration-300 relative max-h-[92vh] overflow-y-auto" id="purchase-flow-card" style="transform:none">
<button :aria-label="t('close')" :disabled="busy" @click="close"  class="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors z-10" id="flow-modal-close" type="button">
<UiIcon :size="20" class="material-symbols-outlined text-[20px]" name="close"></UiIcon>
</button><p class="error mt-8" role="alert" v-if="error&&stage!=='pay'">{{error}}</p>
<div class="flex flex-col" id="step-1" v-if="stage==='amount'||stage==='confirm'">
<div class="text-left mb-4 pr-8">
<div class="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 mb-1">
<span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>{{sourceText(locale,'stepPlan')}}</div>
<h3 class="text-xl font-bold text-slate-900 tracking-tight" id="step1-title">{{selected.name}}</h3>
<p class="text-xs text-slate-500 mt-0.5">{{sourceText(locale,'confirmReview')}}</p>
</div>
<div class="bg-slate-50/90 rounded-2xl p-4 border border-slate-100 mb-4">
<div class="flex justify-between items-center mb-1.5 text-xs text-slate-500">
<span>{{t('amount')}}</span>
<span class="text-emerald-700 font-medium">{{t('available')}}: {{preview?.available??props.available??'—'}} USDT</span>
</div>
<div class="flex items-baseline justify-between py-1">
<input :aria-label="t('amount')" :readonly="busy" @keydown.enter.prevent="makePreview" autocomplete="off" class="text-2xl font-bold font-['JetBrains_Mono'] text-slate-900 source-amount-input" inputmode="decimal" maxlength="25" v-if="stage==='amount'" v-model="amount"/><span class="text-2xl font-bold font-['JetBrains_Mono'] text-slate-900" id="step1-amount-display" v-else="">{{preview?.amount}}</span>
<span class="text-xs font-bold text-slate-600 bg-white px-2 py-1 rounded-md border border-slate-200">USDT</span>
</div>
<div class="text-[11px] text-slate-400 flex items-center gap-1 mt-1">
<UiIcon :size="13" class="material-symbols-outlined text-[13px] text-emerald-600" name="verified_user"></UiIcon>{{t('minimum')}} {{selected!.minimum}} U</div>
</div>
<div class="bg-slate-50/70 rounded-2xl p-3.5 flex flex-col gap-2.5 text-xs border border-slate-100 mb-5">
<div class="flex justify-between items-center">
<span class="text-slate-400">{{sourceText(locale,'projectedDailyRate')}}</span>
<span class="font-bold text-emerald-600 text-sm" id="step1-rate">{{selected.daily_percent}}%</span>
</div>
<div class="flex justify-between items-center">
<span class="text-slate-400">{{t('term')}}</span>
<span class="font-semibold text-slate-800" id="step1-term">{{selected.term_days}}{{t('days')}}</span>
</div>
<div class="flex justify-between items-center">
<span class="text-slate-400">{{sourceText(locale,'payoutMode')}}</span>
<span class="text-emerald-700 font-medium bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100/80" id="step1-tag">{{sourcePayout(locale,selected.payout_mode,'按日返息 到期返本',t(selected.payout_mode))}}</span>
</div>
<div class="h-px bg-slate-200/60 my-0.5"></div>
<div class="flex justify-between items-center">
<span class="text-slate-500 font-medium">{{sourceText(locale,'fullInterest')}}</span>
<span class="font-bold text-emerald-600 text-sm font-display" id="step1-profit">+{{preview?.expected_interest??selected.expected_interest}} U</span>
</div>
<div class="flex justify-between items-center" v-if="preview">
<span class="text-slate-400">{{t('start')}}</span>
<span class="font-semibold text-slate-800">{{t('immediate')}}</span>
</div><div class="pt-1 text-[11px] leading-relaxed text-slate-400">{{payoutHintText()}}</div><div class="flex justify-between items-center" v-if="preview">
<span class="text-slate-400">{{t('due')}}</span>
<span class="font-semibold text-slate-800">{{businessTime(preview!.matures_at)}}</span>
</div></div>
<div class="flex flex-col gap-2 w-full">
<button :disabled="busy" @click="stage==='amount'?makePreview():stage=preview?.payment_setup_required?'setup':'pay'" class="w-full py-3.5 rounded-xl text-white text-sm font-medium shadow-sm transition-all flex items-center justify-center gap-1.5 active:scale-[0.99] font-semibold" id="step1-next-btn" style="background-color: rgb(217, 119, 6);" type="button">
<span>{{busy?d('loading'):t('confirm')}}</span>
<UiIcon :size="18" class="material-symbols-outlined text-[18px]" name="arrow_forward"></UiIcon>
</button>
<button v-if="error===t('insufficient_balance')" :disabled="busy" @click="emit('deposit')" class="w-full py-2.5 rounded-xl text-slate-500 hover:text-slate-700 text-xs font-medium transition-colors" type="button">{{p('deposit')}}</button><button v-if="error===t('insufficient_balance')" :disabled="busy" @click="emit('rollover')" class="w-full py-2.5 rounded-xl text-slate-500 hover:text-slate-700 text-xs font-medium transition-colors" type="button">{{p('rollover')}}</button><button :disabled="busy" @click="close" class="w-full py-2.5 rounded-xl text-slate-500 hover:text-slate-700 text-xs font-medium transition-colors" id="step1-cancel-btn" type="button">{{t('close')}}</button>
</div>
</div>
<div class="flex flex-col items-center text-center" id="step-2" v-else-if="stage==='pay'">
<div class="w-full flex items-center justify-between mb-2">
<button :aria-label="d('back')" :disabled="busy" @click="stage='confirm';password=''" class="w-7 h-7 -ml-1 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100" id="step2-back-btn" type="button">
<UiIcon :size="18" class="material-symbols-outlined text-[18px]" name="arrow_back"></UiIcon>
</button>
<span class="text-xs font-semibold text-emerald-700">{{sourceText(locale,'stepPay')}}</span>
<div class="w-7"></div>
</div>
<div class="text-xs text-slate-500">{{sourceText(locale,'paymentAuth')}}</div>
<div class="text-2xl font-bold font-['JetBrains_Mono'] text-slate-900 mt-1 mb-1" id="step2-amount">{{preview?.amount}} USDT</div>
<div class="text-[11px] text-slate-400 mb-4">{{sourceText(locale,'sixDigitPin')}}</div>
<PaymentPin :disabled="busy" :error="error" :label="t('payment')" :locale="locale" v-model="password"></PaymentPin>
<button :disabled="busy" @click="pay" class="source-confirm-payment" type="button">{{busy?d('loading'):t('submit')}}</button></div>
<div class="flex flex-col items-center text-center" id="step-3" v-else-if="stage==='success'&&result">
<div class="relative w-16 h-16 rounded-full bg-emerald-50 border-4 border-emerald-100 flex items-center justify-center text-emerald-600 mb-3.5 shadow-[0_0_24px_rgba(5,150,105,0.22)]">
<UiIcon :size="34" class="material-symbols-outlined text-[34px] font-bold" name="check"></UiIcon>
</div>
<h3 class="text-xl font-bold text-slate-900 tracking-tight mb-1">{{t('success')}}</h3>
<p class="text-xs text-slate-500 mb-4">{{sourceText(locale,'bookedHint')}}</p>
<div class="w-full bg-slate-50/80 rounded-2xl p-4 flex flex-col gap-2.5 text-xs border border-slate-100 mb-5 text-left">
<div class="flex justify-between items-center">
<span class="text-slate-400">{{sourceText(locale,'productLabel')}}</span>
<span class="font-semibold text-slate-800 text-right" id="step3-product-name">{{result!.product_name}}</span>
</div>
<div class="flex justify-between items-center">
<span class="text-slate-400">{{t('amount')}}</span>
<span class="font-bold text-slate-900 font-['JetBrains_Mono']" id="step3-amount">{{result!.principal}} USDT</span>
</div>
<div class="flex justify-between items-center">
<span class="text-slate-400">{{sourceText(locale,'rateTerm')}}</span>
<span class="font-medium text-emerald-600" id="step3-rate-term">{{result!.daily_percent}}% / {{result!.term_days}}{{t('days')}}</span>
</div>
<div class="flex justify-between items-center">
<span class="text-slate-400">{{t('start')}}</span>
<span class="font-medium text-slate-700" id="step3-interest-date">{{t('immediate')}}</span>
</div><div class="pt-1 text-[11px] leading-relaxed text-slate-400">{{payoutHintText()}}</div>
<div class="flex justify-between items-center">
<span class="text-slate-400">{{sourceText(locale,'orderStatus')}}</span>
<span class="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/70">
<span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>{{t(result!.status)}}</span>
</div>
<div class="h-px bg-slate-200/60 my-0.5"></div>
<div class="flex justify-between items-center">
<span class="text-slate-500 font-medium">{{sourceText(locale,'fullInterest')}}</span>
<span class="font-bold text-emerald-600 text-sm font-display" id="step3-profit">+{{result!.expected_interest}} USDT</span>
</div>
</div>
<div class="flex flex-col w-full gap-2.5">
<button @click="emit('orders',result!.order_no)" class="w-full py-3.5 rounded-xl text-white text-sm font-semibold shadow-sm transition-all flex items-center justify-center gap-1 active:scale-[0.99]" id="step3-view-orders" style="background-color: rgb(217, 119, 6);" type="button">{{t('viewOrders')}}</button>
<button @click="close" class="w-full py-2.5 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 text-xs font-medium transition-colors" id="step3-back-btn" type="button">{{t('close')}}</button>
</div>
</div><form @submit.prevent="setup" class="source-extra-state" v-else-if="stage==='setup'"><h2>{{t('setup')}}</h2><label>{{t('payment')}}<input :readonly="busy" autocomplete="off" inputmode="numeric" maxlength="6" type="password" v-model="password"/></label><label>{{t('repeat')}}<input :readonly="busy" autocomplete="off" inputmode="numeric" maxlength="6" type="password" v-model="confirmation"/></label><button :disabled="busy" class="source-confirm-payment" type="submit">{{busy?d('loading'):t('confirm')}}</button></form><div class="source-extra-state" v-else-if="stage==='recovery'"><h2>{{t('recover')}}</h2><p>{{t('recover')}}</p><button :disabled="busy" @click="recover" class="source-confirm-payment" type="button">{{busy?d('loading'):t('checkResult')}}</button></div>
</div>
</div></div>
</template>

