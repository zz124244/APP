<script setup lang="ts">
import BrandMotto from './BrandMotto.vue'
import {onMounted,onBeforeUnmount,ref} from 'vue'
import UiIcon from './UiIcon.vue'
import {commandKey} from './deposit'
import type {createApi} from './api'
import type {Locale} from './i18n'
import {mallText,type MallTextKey} from './mall-text'
import {publicMallImageUrl} from './media-url'
import {newMallDraft,readMallDraft,saveMallDraft,clearMallDraft,mallReceipt,type MallDraft,type MallReceipt} from './mall-flow'
const props=defineProps<{service:ReturnType<typeof createApi>;locale:Locale;userUid:string}>()
const emit=defineEmits<{back:[];unauthorized:[];support:[]}>()
type Product={id:string;version:string;name:string;image_url:string|null;points_price:string;available:boolean;blocked_reason:string|null}
const products=ref<Product[]>([]),points=ref('—'),busy=ref(false),notice=ref<MallTextKey|null>(null),errorCode=ref<string|null>(null),success=ref<MallReceipt|null>(null),draft=ref<MallDraft|null>(null),confirmProduct=ref<Product|null>(null),storageBlocked=ref(false),terminal=ref(false)
const initialLoading=ref(true),nextPage=ref<number|null>(null)
const storageKey='mall.redeem:'+props.userUid
let disposed=false
const t=(key:MallTextKey)=>mallText(props.locale,key)
const reason=(p:Product)=>p.blocked_reason==='sold_out'?t('soldOut'):p.blocked_reason==='limit_reached'?t('limitReached'):p.blocked_reason==='identity_required'?t('identity'):t('insufficient')
function trace(code:string,status?:unknown){try{console.info('[MALL]',code,status===undefined?'':{status})}catch{}}
function failed(e:any,stage='GEN'){if(disposed)return;const status=typeof e?.status==='number'?String(e.status):'NETWORK';errorCode.value=`MALL-${stage}-${status}`;trace(`MALL-${stage}-ERROR`,e?.status);if(e?.status===401)emit('unauthorized');else notice.value=e?.message==='identity_required'?'identity':'error'}
async function load(page=1){trace('MALL-PRODUCTS-START');const key=`user:${props.userUid}:mall.products:${page}`;const apply=(data:{points:string;products:Product[];next_page:number|null})=>{if(disposed)return;points.value=data.points;products.value=page===1?data.products:[...products.value,...data.products.filter(p=>!products.value.some(old=>old.id===p.id))];nextPage.value=data.next_page??null};try{const path='/mall/products'+(page===1?'':'?page='+page);let data;if(typeof props.service.requestCached==='function')data=await props.service.requestCached<{points:string;products:Product[];next_page:number|null}>(key,path,undefined,{},undefined,{},next=>{trace('MALL-PRODUCTS-RESPONSE',200);apply(next)});else data=await props.service.request<{points:string;products:Product[];next_page:number|null}>(path);trace('MALL-PRODUCTS-RESPONSE',200);apply(data)}catch(e){failed(e,'PRODUCTS')}finally{if(!disposed)initialLoading.value=false}}
async function more(){if(busy.value||nextPage.value===null)return;busy.value=true;await load(nextPage.value);if(!disposed)busy.value=false}
async function reconcile(){const d=draft.value;if(!d||busy.value)return;busy.value=true;notice.value=null;errorCode.value=null;trace('MALL-POST-START');try{const response=await props.service.request('/mall/redemptions',{product_id:d.productId,expected_version:d.version},{'Idempotency-Key':d.key},undefined,{retries:1});trace('MALL-POST-RESPONSE',201);const receipt=mallReceipt(response,d);if(receipt){trace('MALL-SUCCESS');props.service.invalidateCached?.(`user:${props.userUid}:mall.products:1`);props.service.invalidateCached?.(`user:${props.userUid}:wallet.summary`);success.value=receipt;confirmProduct.value=null;await load()}else{notice.value='pending';errorCode.value='MALL-POST-PENDING'}}catch(e:any){trace('MALL-POST-ERROR',e?.status);if(e?.status===401){errorCode.value='MALL-POST-401';emit('unauthorized')}else if(typeof e?.status==='number'&&e.status>=400&&e.status<500){terminal.value=true;errorCode.value=`MALL-POST-${e.status}`;notice.value='rejected'}else{errorCode.value=`MALL-POST-${typeof e?.status==='number'?e.status:'NETWORK'}`;notice.value='error'}}finally{if(!disposed)busy.value=false}}
async function redeem(p:Product){if(busy.value||!p.available||draft.value||storageBlocked.value)return;trace('MALL-CONFIRM-CLICK');notice.value=null;errorCode.value=null;terminal.value=false;try{const d=newMallDraft(props.userUid,p.id,p.version,commandKey());saveMallDraft(localStorage,storageKey,d);draft.value=d}catch{trace('MALL-STORAGE-ERROR');errorCode.value='MALL-STORAGE';storageBlocked.value=true;notice.value='storage';return}await reconcile()}
function clearScope(){if(!draft.value)return true;try{if(!clearMallDraft(localStorage,storageKey,draft.value.key))throw Error('storage');draft.value=null;terminal.value=false;errorCode.value=null;return true}catch{trace('MALL-STORAGE-CLEAR-ERROR');errorCode.value='MALL-STORAGE';storageBlocked.value=true;notice.value='storage';return false}}
async function closeModal(){if(busy.value)return;if(success.value){if(!clearScope())return;success.value=null;confirmProduct.value=null;return}if(draft.value&&terminal.value){if(!clearScope())return}confirmProduct.value=null}
async function retry(){if(busy.value)return;if(terminal.value){if(clearScope()){notice.value=null;await load()}}else if(draft.value)await reconcile();else{busy.value=true;notice.value=null;await load();if(!disposed)busy.value=false}}
onMounted(async()=>{try{const raw=localStorage.getItem(storageKey);draft.value=readMallDraft(raw,props.userUid);if(raw&&!draft.value){trace('MALL-DRAFT-INVALID');errorCode.value='MALL-DRAFT';storageBlocked.value=true;notice.value='storage'}else if(draft.value){trace('MALL-DRAFT-RESTORED')}}catch{trace('MALL-STORAGE-READ-ERROR');errorCode.value='MALL-STORAGE';storageBlocked.value=true;notice.value='storage'}await load();if(!disposed&&draft.value)await reconcile()})
onBeforeUnmount(()=>{disposed=true})
</script>
<template><div class="reference-surface reference-mall"><header class="fixed top-0 w-full z-50 pt-safe bg-surface-container-lowest/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]"><div class="h-14 px-margin-sm flex items-center justify-between"><button :aria-label="t('back')" class="w-11 h-11 flex items-center justify-center -ml-2 rounded-lg text-on-surface hover:bg-surface-container transition-colors" type="button" @click="emit('back')"><UiIcon name="arrow_back" :size="22"/></button><h1 class="text-headline-sm font-headline-sm text-on-surface text-center flex-1 mx-space-sm truncate">{{t('title')}}</h1></div></header><main class="flex flex-col relative w-full pt-14 pb-safe bg-surface min-h-screen"><div class="flex flex-col w-full pb-10">
<!-- 用户积分资产概览卡片 -->
<section class="px-margin-sm pt-space-sm pb-space-xs">
<div class="relative overflow-hidden rounded-xl bg-surface-container-lowest p-space-md shadow-sm">
<div class="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-primary-fixed/20 blur-2xl pointer-events-none"></div>
<div class="absolute -left-6 -bottom-6 w-24 h-24 rounded-full bg-secondary-fixed/20 blur-xl pointer-events-none"></div>
<div class="relative flex items-start justify-between">
<div class="flex flex-col">
<div class="flex items-center gap-1.5">
<span class="text-body-sm font-body-sm text-on-surface-variant">{{t('points')}}</span>
<span class="flex items-center justify-center text-primary">
<UiIcon name="verified" :size="15"/>
</span>
</div>
<div class="flex items-baseline gap-1 mt-1">
<span class="text-headline-lg font-headline-lg text-primary tracking-tight" id="user-points-display">{{points}}</span>
<span class="text-label-caps font-label-caps text-on-surface-variant font-bold">PTS</span>
</div>
<div class="flex items-center gap-1.5 mt-2">

</div>
</div>
<div class="flex flex-col items-end gap-2">


</div>
</div>

</div>
</section>
<section class="px-margin-sm" aria-live="polite"><p v-if="errorCode" role="alert" class="text-xs text-error">[{{errorCode}}]</p><p v-if="notice|| (draft&&!success)" :role="notice==='error'||notice==='storage'?'alert':'status'">{{notice?t(notice):(busy?t('loading'):t('pending'))}}</p><button v-if="draft&&!success&&!busy&&!storageBlocked" type="button" @click="terminal?retry():reconcile()">{{t('retry')}}</button><button v-else-if="notice&&!storageBlocked&&!draft&&!busy" type="button" @click="retry">{{t('retry')}}</button></section><section class="px-margin-sm mt-4"><div class="flex items-center justify-between mb-2.5"><h2 class="text-headline-sm font-headline-sm text-on-surface">{{t('gifts')}}</h2></div><p v-if="!products.length&&!busy&&!initialLoading&&!notice">{{t('empty')}}</p><div class="grid grid-cols-2 gap-2.5" id="goods-grid"><div class="goods-card group rounded-xl bg-surface-container-lowest p-3 flex flex-col justify-between shadow-sm relative" v-for="p in products" :key="p.id">
<div class="relative w-full aspect-square rounded-lg bg-surface-container-low flex flex-col items-center justify-center mb-2 overflow-hidden">

<img v-if="publicMallImageUrl(p.image_url)" :src="publicMallImageUrl(p.image_url)" :alt="p.name" class="w-full h-full object-cover" loading="lazy"/>
</div>
<div class="flex flex-col flex-1">
<h4 class="text-body-md font-body-md font-semibold text-on-surface line-clamp-1">{{p.name}}</h4>

<div class="mt-2.5 flex items-baseline gap-1">
<span class="text-headline-sm font-headline-sm text-on-surface font-bold">{{p.points_price}}</span>
<span class="text-label-caps font-label-caps text-on-surface-variant">PTS</span>
</div>
<div class="flex items-center justify-between text-body-sm font-body-sm text-outline mt-0.5">


</div>
<button class="exchange-action-btn w-full mt-2.5 py-1.5 rounded-xl bg-primary text-on-primary text-body-sm font-body-sm font-medium shadow-sm active:scale-95 transition-all text-center" type="button" :disabled="!p.available||busy||!!draft||storageBlocked" @click="confirmProduct=p" :style="p.available ? {backgroundColor: 'rgb(217, 119, 6)'} : {}">
            {{p.available?t('redeem'):reason(p)}}
          </button>
</div>
</div>
</div><button v-if="nextPage!==null" type="button" :disabled="busy" @click="more">{{t('more')}}</button></section><footer class="mt-8 text-center px-margin-sm">
<div class="flex items-center justify-center gap-2 text-outline">
<span class="w-8 h-px bg-outline-variant"></span>
<span class="text-label-caps font-label-caps tracking-widest text-outline">JIUHE PROTOCOL</span>
<span class="w-8 h-px bg-outline-variant"></span>
</div>
<BrandMotto :locale="locale"/>

</footer>
</div></main><div v-if="success||confirmProduct" id="exchangeSuccessModal" role="dialog" aria-modal="true" :aria-label="success?t('success'):t('confirm')" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-inverse-surface/40 backdrop-blur-sm transition-all duration-300"><div class="bg-surface-container-lowest w-full max-w-[330px] rounded-xl p-5 shadow-lg flex flex-col items-center text-center relative border border-surface-container"><button type="button" @click="closeModal" :disabled="busy" :aria-label="t('close')" class="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center text-outline hover:bg-surface-container transition-colors"><UiIcon name="close" :size="20"/></button><div class="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-3 mt-1"><div class="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-on-primary shadow-sm"><UiIcon :name="success?'check':'redeem'" :size="24"/></div></div><h3 class="text-headline-sm font-headline-sm font-bold text-on-surface mb-1">{{success?t('success'):t('confirm')}}</h3><p class="text-body-sm font-body-sm text-on-surface-variant leading-relaxed mb-4 px-1"><span class="font-medium text-on-surface font-semibold" id="modalGoodsTitle">{{success?.name??confirmProduct?.name}}</span><br><span class="text-primary font-medium" id="modalDeductedPoints">{{success?t('deducted'):t('cost')}} {{success?.points_price??confirmProduct?.points_price}} PTS</span><br><span class="text-outline text-body-sm block mt-1">{{success?t('contact'):draft?(busy?t('loading'):notice?t(notice):t('pending')):t('confirmHint')}}</span><span v-if="errorCode" class="text-error text-xs block mt-1">[{{errorCode}}]</span></p><div class="flex flex-col gap-2 w-full"><button v-if="confirmProduct&&(!draft||busy)" type="button" :disabled="busy" :aria-busy="busy" @click="redeem(confirmProduct)" class="w-full py-2 rounded-xl bg-primary text-on-primary">{{busy?t('loading'):t('redeem')}}</button><button v-else-if="draft&&!success&&!busy" type="button" @click="terminal?retry():reconcile()" class="w-full py-2 rounded-xl bg-primary text-on-primary">{{t('retry')}}</button><button v-if="success" type="button" @click="emit('support')" class="w-full py-2 rounded-xl bg-primary text-on-primary">{{t('support')}}</button><button type="button" :disabled="busy" @click="closeModal" class="w-full py-2 rounded-xl bg-surface-container text-on-surface text-body-sm font-body-sm font-medium hover:bg-surface-container-high transition-colors text-center">{{t('close')}}</button></div></div></div></div></template>
