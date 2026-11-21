<script setup lang="ts">
import {computed,ref,onMounted,onUnmounted,watch,nextTick} from 'vue'
import {publicMediaUrl} from './media-url'
import UiIcon from './UiIcon.vue'
import LanguagePicker from './LanguagePicker.vue'
import EditorialVideo from './EditorialVideo.vue'
import {createContentFeed,type ContentFeedState,type ContentItem} from './content-feed'
import {contentText,type ContentTextKey} from './editorial-text'
import {ApiError,type createApi} from './api'
import type {Locale} from './i18n'
const props=defineProps<{service:ReturnType<typeof createApi>;locale:Locale;mode:'home'|'community'|'updates'|'news'}>()
const emit=defineEmits<{navigate:[string];back:[];locale:[Locale];unauthorized:[]}>()
const t=(key:ContentTextKey)=>contentText(props.locale,key)
const mediaUrl=(url:string)=>publicMediaUrl(url)
function cachedValue<T>(key:string,options: {persist?:boolean} = {}){return typeof props.service.getCached==='function'?props.service.getCached<T>(key,options):undefined}
async function refreshValue<T>(key:string,loader:()=>Promise<T>,options: {persist?:boolean} = {}){return typeof props.service.refreshCached==='function'?props.service.refreshCached(key,loader,options):{value:await loader(),changed:true}}
type Home={video:null|{url:string;cover_url:string;eyebrow:string;title:string};updates:ContentItem[];news:ContentItem[]}
const imageFailed=ref(false)
const home=ref<Home|null>(null),homeBusy=ref(false),homeError=ref(false),column=ref('featured'),detailId=ref(''),detail=ref<ContentItem|null>(null),detailBusy=ref(false),detailError=ref(false),unavailable=ref(false)
const feed=ref<ContentFeedState>({items:[],next_page:1,busy:false,error:false})
let disposed=false,homeEpoch=0,detailEpoch=0,savedScroll=0
function auth(e:unknown){if(e instanceof ApiError&&[401,403].includes(e.status))emit('unauthorized')}
const reader=createContentFeed(async(category,col,page)=>{const key=`public:content.${category}:${col||'all'}:${page}`;const loader=()=>props.service.request<{items:ContentItem[];next_page:number|null}>('/content/articles?category='+category+(col?'&column='+col:'')+'&page='+page);const cached=cachedValue<{items:ContentItem[];next_page:number|null}>(key,{persist:true});if(cached){void refreshValue(key,loader,{persist:true});return cached}try{return (await refreshValue(key,loader,{persist:true})).value}catch(e){auth(e);throw e}},s=>{feed.value=s})
const busy=computed(()=>detailId.value?detailBusy.value:props.mode==='home'?homeBusy.value:feed.value.busy)
const isFeed=computed(()=>props.mode!=='home')
const failed=computed(()=>detailId.value?detailError.value:props.mode==='home'?homeError.value:feed.value.error)
async function loadHome(){const run=++homeEpoch;homeBusy.value=true;homeError.value=false;const key='public:content.home';const loader=()=>props.service.request<Home>('/content/home');const cached=cachedValue<Home>(key,{persist:true});if(cached){home.value=cached;homeBusy.value=false;void refreshValue(key,loader,{persist:true}).then(result=>{if(!disposed&&run===homeEpoch&&result.changed)home.value=result.value}).catch(e=>{if(!disposed&&run===homeEpoch)auth(e)});return}home.value=null;try{const result=await refreshValue(key,loader,{persist:true});if(!disposed&&run===homeEpoch)home.value=result.value}catch(e){if(!disposed&&run===homeEpoch){auth(e);homeError.value=true}}finally{if(!disposed&&run===homeEpoch)homeBusy.value=false}}
async function resetFeed(){await reader.reset(props.mode==='community'?'community':props.mode,props.mode==='community'?column.value:undefined)}
async function loadDetail(){imageFailed.value=false;const run=++detailEpoch,id=detailId.value;if(!id)return;detail.value=null;detailBusy.value=true;detailError.value=false;unavailable.value=false;try{const r=await props.service.request<ContentItem>('/content/articles/'+id);if(!disposed&&run===detailEpoch)detail.value=r}catch(e){if(!disposed&&run===detailEpoch){auth(e);detailError.value=true;unavailable.value=e instanceof ApiError&&e.status===404}}finally{if(!disposed&&run===detailEpoch)detailBusy.value=false}}
async function openDetail(id:string){savedScroll=window.scrollY;detailId.value=id;window.scrollTo(0,0);await loadDetail()}
async function closeDetail(){detailEpoch++;detailId.value='';detail.value=null;unavailable.value=false;const count=feed.value.items.length;const wanted=feed.value.next_page;await (props.mode==='home'?loadHome():resetFeed());while(isFeed.value&&feed.value.next_page&&feed.value.items.length<count&&!feed.value.error&&feed.value.next_page!==wanted)await reader.more();await nextTick();if(!disposed)window.scrollTo(0,savedScroll)}
function retry(){if(detailId.value)void loadDetail();else if(props.mode==='home')void loadHome();else void reader.retry()}
function refresh(){if(document.visibilityState==='hidden'){homeEpoch++;detailEpoch++;home.value=null;detail.value=null;return}if(detailId.value)void loadDetail();else if(props.mode==='home')void loadHome();else void resetFeed()}
watch(()=>props.mode,()=>{detailEpoch++;detailId.value='';column.value='featured';window.scrollTo(0,0);refresh()})
onMounted(()=>{refresh();document.addEventListener('visibilitychange',refresh);window.addEventListener('pageshow',refresh)})
onUnmounted(()=>{disposed=true;homeEpoch++;detailEpoch++;reader.dispose();document.removeEventListener('visibilitychange',refresh);window.removeEventListener('pageshow',refresh)})
</script>
<template><div v-if="!detailId&&mode==='home'" class="reference-surface reference-home"><header class="relative z-10 bg-transparent"><div class="pt-safe px-margin"><div class="h-14 flex items-center justify-between"><div class="flex items-center gap-space-sm"><img alt="九合创投" class="h-8 object-contain w-8 rounded-full" src="/brand.png"/><div class="flex flex-col"><span class="font-headline-sm text-headline-sm text-slate-900 leading-none font-bold">九合创投</span></div></div><LanguagePicker :locale="locale" @change="emit('locale',$event)"></LanguagePicker></div></div></header><main class="flex flex-col relative w-full pb-24 bg-[#f8fafc] min-h-screen"><div class="flex flex-col w-full pt-2">


<div class="px-margin mb-space-sm">
<div class="relative w-full rounded-xl overflow-hidden bg-white border border-slate-200/90 shadow-md">

<div class="absolute -top-10 -right-10 w-44 h-44 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none"></div>
<div class="absolute -bottom-8 -left-8 w-36 h-36 rounded-full bg-sky-500/10 blur-2xl pointer-events-none"></div>
<div class="relative w-full h-44 bg-slate-900 overflow-hidden flex items-center justify-center">
<EditorialVideo v-if="mode==='home'" :locale="locale" :poster="home?.video?.cover_url" src="/bundled-media/home-video.mp4" @retry="loadHome"/>
<p v-else-if="!homeBusy&&!homeError" class="text-white">{{t('empty')}}</p>
</div>

<div class="p-space-md flex flex-col gap-1 relative z-10 bg-white">
<div class="flex items-center justify-between">
<span class="font-label-caps text-label-caps text-amber-600 tracking-widest uppercase font-semibold">{{home?.video?.eyebrow||''}}</span>
</div>
<h2 class="font-headline-sm text-headline-sm text-slate-900 font-bold tracking-tight">{{home?.video?.title||''}}</h2>
</div>
</div>
</div>

<div class="px-margin mb-space-lg">
<div class="bg-white rounded-xl p-space-md shadow-sm border border-slate-200/90">
<div class="grid grid-cols-4 gap-y-5 gap-x-4"><button @click="emit('navigate','deposit')" class="group flex flex-col items-center justify-center text-center" type="button"><div class="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100/80 flex items-center justify-center text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-all group-active:scale-90 shadow-sm"><UiIcon name="account_balance_wallet" :size="24"  class="material-symbols-outlined text-[24px]"/></div><span class="font-body-sm text-body-sm text-slate-700 mt-1.5 font-medium">{{t('deposit')}}</span></button><button @click="emit('navigate','withdraw')" class="group flex flex-col items-center justify-center text-center" type="button"><div class="w-12 h-12 rounded-xl bg-sky-50 border border-sky-100/80 flex items-center justify-center text-sky-600 group-hover:bg-sky-600 group-hover:text-white transition-all group-active:scale-90 shadow-sm"><UiIcon name="payments" :size="24"  class="material-symbols-outlined text-[24px]"/></div><span class="font-body-sm text-body-sm text-slate-700 mt-1.5 font-medium">{{t('withdraw')}}</span></button><button @click="emit('navigate','checkin')" class="group flex flex-col items-center justify-center text-center relative" type="button"><div class="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100/80 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all group-active:scale-90 shadow-sm"><UiIcon name="event_available_fill1" :size="24"  class="material-symbols-outlined text-[24px]" /></div><span class="font-body-sm text-body-sm text-slate-700 mt-1.5 font-medium">{{t('checkin')}}</span></button><button @click="emit('navigate','lottery')" class="group flex flex-col items-center justify-center text-center" type="button"><div class="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100/80 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all group-active:scale-90 shadow-sm"><UiIcon name="casino" :size="24"  class="material-symbols-outlined text-[24px]"/></div><span class="font-body-sm text-body-sm text-slate-700 mt-1.5 font-medium">{{t('lottery')}}</span></button><button v-if="mode!=='home'" @click="emit('navigate','team')" class="group flex flex-col items-center justify-center text-center" type="button"><div class="w-12 h-12 rounded-xl bg-teal-50 border border-teal-100/80 flex items-center justify-center text-teal-600 group-hover:bg-teal-600 group-hover:text-white transition-all group-active:scale-90 shadow-sm"><UiIcon name="diversity_3" :size="24"  class="material-symbols-outlined text-[24px]"/></div><span class="font-body-sm text-body-sm text-slate-700 mt-1.5 font-medium">{{t('team')}}</span></button><button v-if="mode!=='home'" @click="emit('navigate','invite')" class="group flex flex-col items-center justify-center text-center" type="button"><div class="w-12 h-12 rounded-xl bg-orange-50 border border-orange-100/80 flex items-center justify-center text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-all group-active:scale-90 shadow-sm"><UiIcon name="group_add" :size="24"  class="material-symbols-outlined text-[24px]"/></div><span class="font-body-sm text-body-sm text-slate-700 mt-1.5 font-medium">{{t('invite')}}</span></button><button @click="emit('navigate','mall')" class="group flex flex-col items-center justify-center text-center" type="button"><div class="w-12 h-12 rounded-xl bg-cyan-50 border border-cyan-100/80 flex items-center justify-center text-cyan-600 group-hover:bg-cyan-600 group-hover:text-white transition-all group-active:scale-90 shadow-sm"><UiIcon name="local_mall" :size="24"  class="material-symbols-outlined text-[24px]"/></div><span class="font-body-sm text-body-sm text-slate-700 mt-1.5 font-medium">{{t('mall')}}</span></button><button @click="emit('navigate','transfer')" class="group flex flex-col items-center justify-center text-center" type="button"><div class="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100/80 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all group-active:scale-90 shadow-sm"><UiIcon name="sync_alt" :size="24"  class="material-symbols-outlined text-[24px]"/></div><span class="font-body-sm text-body-sm text-slate-700 mt-1.5 font-medium">{{t('transfer')}}</span></button><button @click="emit('navigate','tasks')" class="group flex flex-col items-center justify-center text-center" type="button"><div class="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100/80 flex items-center justify-center text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-all group-active:scale-90 shadow-sm"><UiIcon name="military_tech" :size="24"  class="material-symbols-outlined text-[24px]"/></div><span class="font-body-sm text-body-sm text-slate-700 mt-1.5 font-medium">{{t('tasks')}}</span></button><button @click="emit('navigate','support')" class="group flex flex-col items-center justify-center text-center" type="button"><div class="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100/80 flex items-center justify-center text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-all group-active:scale-90 shadow-sm"><UiIcon name="headset_mic" :size="24"  class="material-symbols-outlined text-[24px]"/></div><span class="font-body-sm text-body-sm text-slate-700 mt-1.5 font-medium">{{t('support')}}</span></button></div>
</div>
</div>

<div class="px-margin mb-space-lg">
<div class="relative overflow-hidden rounded-xl bg-white border border-slate-200/90 p-space-md shadow-sm">

<div class="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none"></div>
<div class="relative z-10 flex flex-col gap-3">
<div class="flex items-center justify-between">
<div class="flex items-center gap-2">
<div class="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center"><UiIcon name="verified_user" :size="24"  class="material-symbols-outlined text-[18px]" /></div>
<div>
<h3 class="font-headline-sm text-headline-sm text-slate-900 font-bold leading-none">{{t('compliance')}}</h3>
<span class="font-label-caps text-label-caps text-slate-400 uppercase mt-0.5 tracking-wider font-semibold">{{t('trust')}}</span>
</div>
</div>
</div>

<div class="grid grid-cols-3 gap-2 py-1">
<div class="bg-slate-50 border border-slate-100 rounded-lg p-2 flex flex-col">
<div class="flex items-center gap-1 text-emerald-700 mb-1">
<UiIcon name="lock_reset" :size="24"  class="material-symbols-outlined text-[14px]"/>
<span class="font-label-caps text-label-caps font-bold">{{t('security')}}</span>
</div>
</div>
<div class="bg-slate-50 border border-slate-100 rounded-lg p-2 flex flex-col">
<div class="flex items-center gap-1 text-sky-700 mb-1">
<UiIcon name="security" :size="24"  class="material-symbols-outlined text-[14px]"/>
<span class="font-label-caps text-label-caps font-bold">{{t('column')}}</span>
</div>
</div>
</div>

<div class="flex items-center justify-between pt-1">
<button @click="emit('navigate','compliance')" class="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-600 text-white font-body-sm text-body-sm font-semibold hover:bg-amber-700 transition-colors active:scale-95 shadow-sm" type="button"><span class="">{{t('view')}}</span><UiIcon name="chevron_right" :size="24"  class="material-symbols-outlined text-[16px]"/></button>
</div>
</div>
</div>
</div>

<div class="px-margin mb-space-lg">
<div class="flex items-center justify-between mb-space-sm">
<div class="flex items-center gap-2">
<span class="w-1.5 h-4 rounded-full bg-amber-600"></span>
<h3 class="font-headline-sm text-headline-sm text-slate-900 font-bold">{{t('updates')}}</h3>
</div>
<button @click="emit('navigate','updates')" class="flex items-center gap-0.5 text-slate-500 hover:text-amber-600 transition-colors"><span class="font-body-sm text-body-sm font-medium">{{t('more')}}</span><UiIcon name="chevron_right" :size="24"  class="material-symbols-outlined text-[16px]"/></button>
</div>
<div class="space-y-2"><button :key="item.id" @click="openDetail(item.id)" class="block bg-white hover:bg-slate-50 border border-slate-200/90 rounded-xl p-space-md shadow-sm transition-all active:scale-[0.99] w-full text-left" type="button" v-for="item in home?.updates||[]">
<div class="flex items-center justify-between mb-1.5">
<div class="flex items-center gap-1.5">
<span class="font-body-sm text-body-sm font-semibold text-slate-900">{{item.title}}</span>
</div>
</div>
<p class="font-body-sm text-body-sm text-slate-600 line-clamp-1">{{item.summary}}</p>
</button><p v-if="!home?.updates.length">{{t('empty')}}</p></div>
</div>

<div class="px-margin mb-space-xl">
<div class="flex items-center justify-between mb-space-sm">
<div class="flex items-center gap-2">
<span class="w-1.5 h-4 rounded-full bg-sky-600"></span>
<h3 class="font-headline-sm text-headline-sm text-slate-900 font-bold">{{t('news')}}</h3>
</div>
<button @click="emit('navigate','news')" class="flex items-center gap-0.5 text-slate-500 hover:text-sky-600 transition-colors">
<span class="font-body-sm text-body-sm font-medium">{{t('more')}}</span>
<UiIcon name="chevron_right" :size="24"  class="material-symbols-outlined text-[16px]"/>
</button>
</div>
<div class="space-y-3"><button :key="item.id" @click="openDetail(item.id)" class="flex gap-3 bg-white hover:bg-slate-50 border border-slate-200/90 p-3 rounded-xl shadow-sm transition-all active:scale-[0.99] w-full text-left" type="button" v-for="item in home?.news||[]">
<div class="flex flex-col justify-between flex-1 min-w-0">
<h4 class="font-body-md text-body-md text-slate-900 font-semibold line-clamp-2 leading-snug">{{item.title}}</h4>
</div>
</button><p v-if="!home?.news.length">{{t('empty')}}</p></div>
</div>


</div>
<div class="px-margin-sm py-space-sm" aria-live="polite"><p v-if="failed" role="alert">{{t(unavailable?'unavailable':'error')}}</p><button v-if="failed" @click="retry" type="button">{{t('retry')}}</button><p v-if="!busy&&!failed&&isFeed&&!detailId&&!feed.items.length">{{t('empty')}}</p><button v-if="!detailId&&isFeed&&feed.next_page&&!feed.error" :disabled="feed.busy" @click="reader.more()">{{t('more')}}</button></div></main><nav class="fixed bottom-0 inset-x-0 z-50 pb-safe bg-white/95 backdrop-blur-xl border-t border-slate-200/90 shadow-[0_-4px_16px_rgba(0,0,0,0.06)]" data-active-classes="text-emerald-600 [&amp;_.nav-dot]:opacity-100 [&amp;_.nav-glow]:opacity-100"><div class="flex justify-around items-center h-16 px-space-xs max-w-md mx-auto"><button @click="emit('navigate','home')" aria-current="page" class="group flex flex-col items-center justify-center relative w-16 h-12 transition-colors text-amber-600 [&amp;_.nav-dot]:opacity-100 [&amp;_.nav-glow]:opacity-100" data-path="home" type="button"><UiIcon name="explore" :size="24"  class="material-symbols-outlined text-[24px] relative z-10 font-medium"/><span class="font-label-caps text-label-caps mt-1 relative z-10 font-bold">{{t('home')}}</span><span class="nav-dot w-1 h-1 rounded-full bg-amber-600 mt-0.5 opacity-0 transition-opacity"></span><span class="nav-glow absolute inset-0 rounded-xl bg-amber-500/10 blur-sm opacity-0 transition-opacity pointer-events-none"></span></button><button @click="emit('navigate','invest')" class="group flex flex-col items-center justify-center relative w-16 h-12 text-slate-500 transition-colors hover:text-slate-900" data-path="invest" type="button"><UiIcon name="trending_up" :size="24"  class="material-symbols-outlined text-[24px] relative z-10"/><span class="font-label-caps text-label-caps mt-1 relative z-10">{{t('invest')}}</span><span class="nav-dot w-1 h-1 rounded-full bg-emerald-600 mt-0.5 opacity-0 transition-opacity"></span><span class="nav-glow absolute inset-0 rounded-xl bg-emerald-500/10 blur-sm opacity-0 transition-opacity pointer-events-none"></span></button><button @click="emit('navigate','community')" class="group flex flex-col items-center justify-center relative w-16 h-12 text-slate-500 transition-colors hover:text-slate-900" data-path="community" type="button"><UiIcon name="groups" :size="24"  class="material-symbols-outlined text-[24px] relative z-10"/><span class="font-label-caps text-label-caps mt-1 relative z-10">{{t('community')}}</span><span class="nav-dot w-1 h-1 rounded-full bg-emerald-600 mt-0.5 opacity-0 transition-opacity"></span><span class="nav-glow absolute inset-0 rounded-xl bg-emerald-500/10 blur-sm opacity-0 transition-opacity pointer-events-none"></span></button><button @click="emit('navigate','wallet')" class="group flex flex-col items-center justify-center relative w-16 h-12 text-slate-500 transition-colors hover:text-slate-900" data-path="portfolio" type="button"><UiIcon name="account_balance_wallet" :size="24"  class="material-symbols-outlined text-[24px] relative z-10"/><span class="font-label-caps text-label-caps mt-1 relative z-10">{{t('wallet')}}</span><span class="nav-dot w-1 h-1 rounded-full bg-emerald-600 mt-0.5 opacity-0 transition-opacity"></span><span class="nav-glow absolute inset-0 rounded-xl bg-emerald-500/10 blur-sm opacity-0 transition-opacity pointer-events-none"></span></button></div></nav></div>
<div v-if="!detailId&&mode==='community'" class="reference-surface reference-community"><header class="relative z-10 bg-transparent"><div class="pt-safe px-margin"><div class="h-14 flex items-center justify-between"><div class="w-10"></div><h1 class="font-headline-sm text-headline-sm text-slate-900 font-bold absolute left-1/2 -translate-x-1/2">社区</h1><LanguagePicker :locale="locale" @change="emit('locale',$event)"></LanguagePicker></div></div></header><main class="flex flex-col relative w-full pb-24 bg-slate-50 min-h-screen"><div class="flex flex-col w-full px-margin pb-6 gap-space-sm pt-2">


<div class="flex flex-col gap-4 w-full"><div class="flex items-center justify-between bg-slate-200/70 p-1 rounded-xl"><button :aria-selected="column==='featured'" :class="column==='featured'?'bg-amber-600 text-white':'text-slate-600'" @click="column='featured';resetFeed()" class="community-tab flex-1 py-2 text-center rounded-lg font-headline-sm text-headline-sm transition-all flex items-center justify-center gap-1 font-semibold" data-target="tab-featured" type="button"><span class="">{{t('featured')}}</span></button><button :aria-selected="column==='benefits'" :class="column==='benefits'?'bg-amber-600 text-white':'text-slate-600'" @click="column='benefits';resetFeed()" class="community-tab flex-1 py-2 text-center rounded-lg font-body-md text-body-md text-slate-600 hover:text-slate-900 transition-all flex items-center justify-center gap-1" data-target="tab-benefits" type="button"><span class="">{{t('benefits')}}</span></button><button :aria-selected="column==='projects'" :class="column==='projects'?'bg-amber-600 text-white':'text-slate-600'" @click="column='projects';resetFeed()" class="community-tab flex-1 py-2 text-center rounded-lg font-body-md text-body-md text-slate-600 hover:text-slate-900 transition-all flex items-center justify-center gap-1" data-target="tab-projects" type="button"><span class="">{{t('projects')}}</span></button><button :aria-selected="column==='academy'" :class="column==='academy'?'bg-amber-600 text-white':'text-slate-600'" @click="column='academy';resetFeed()" class="community-tab flex-1 py-2 text-center rounded-lg font-body-md text-body-md text-slate-600 hover:text-slate-900 transition-all flex items-center justify-center gap-1" data-target="tab-academy" type="button"><span class="">{{t('academy')}}</span></button></div><div class="tab-pane flex flex-col gap-3.5"><div :key="item.id" @click="openDetail(item.id)" @keydown.enter="openDetail(item.id)" class="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow" role="button" tabindex="0" v-for="item in feed.items"><div class="flex items-center justify-between mb-2.5"><div class="flex items-center gap-2"><span class="text-[12px] text-slate-400">{{item.date}}</span></div></div><h3 class="text-[15px] font-bold text-slate-900 leading-snug hover:text-amber-700 transition-colors mb-1.5">{{item.title}}</h3><p class="text-[13px] text-slate-500 leading-relaxed line-clamp-2 mb-3">{{item.summary}}</p><div class="flex items-center justify-between pt-2.5 border-t border-slate-100 text-[12px] text-slate-400"><div class="flex items-center gap-4"></div><span class="text-amber-600 font-medium flex items-center gap-0.5">{{t('view')}}</span></div><img :alt="item.title" :src="mediaUrl(item.cover_url)" class="w-full rounded-xl" loading="lazy" v-if="item.cover_url"/></div></div></div>







</div>
<div class="px-margin-sm py-space-sm" aria-live="polite"><p v-if="failed" role="alert">{{t(unavailable?'unavailable':'error')}}</p><button v-if="failed" @click="retry" type="button">{{t('retry')}}</button><p v-if="!busy&&!failed&&isFeed&&!detailId&&!feed.items.length">{{t('empty')}}</p><button v-if="!detailId&&isFeed&&feed.next_page&&!feed.error" :disabled="feed.busy" @click="reader.more()">{{t('more')}}</button></div></main><nav class="fixed bottom-0 inset-x-0 z-50 pb-safe bg-white/95 backdrop-blur-xl border-t border-slate-200/90 shadow-[0_-4px_16px_rgba(0,0,0,0.06)]"><div class="flex justify-around items-center h-16 px-space-xs max-w-md mx-auto"><button @click="emit('navigate','home')" class="group flex flex-col items-center justify-center relative w-16 h-12 text-slate-500 transition-colors hover:text-slate-900" data-path="home" type="button"><UiIcon name="explore" :size="24" class="material-symbols-outlined text-[24px] relative z-10"/><span class="font-label-caps text-label-caps mt-1 relative z-10 font-medium">{{t('home')}}</span><span class="nav-dot w-1 h-1 rounded-full bg-amber-600 mt-0.5 opacity-0 transition-opacity"></span><span class="nav-glow absolute inset-0 rounded-xl bg-amber-500/10 blur-sm opacity-0 transition-opacity pointer-events-none"></span></button><button @click="emit('navigate','invest')" class="group flex flex-col items-center justify-center relative w-16 h-12 text-slate-500 transition-colors hover:text-slate-900" data-path="invest" type="button"><UiIcon name="trending_up" :size="24" class="material-symbols-outlined text-[24px] relative z-10"/><span class="font-label-caps text-label-caps mt-1 relative z-10 font-medium">{{t('invest')}}</span><span class="nav-dot w-1 h-1 rounded-full bg-amber-600 mt-0.5 opacity-0 transition-opacity"></span><span class="nav-glow absolute inset-0 rounded-xl bg-amber-500/10 blur-sm opacity-0 transition-opacity pointer-events-none"></span></button><button @click="emit('navigate','community')" aria-current="page" class="group flex flex-col items-center justify-center relative w-16 h-12 transition-colors text-amber-600 font-semibold [&amp;_.nav-dot]:opacity-100 [&amp;_.nav-glow]:opacity-100" data-path="community" type="button"><UiIcon name="groups" :size="24" class="material-symbols-outlined text-[24px] relative z-10"/><span class="font-label-caps text-label-caps mt-1 relative z-10 font-semibold">{{t('community')}}</span><span class="nav-dot w-1 h-1 rounded-full bg-amber-600 mt-0.5 opacity-100 transition-opacity"></span><span class="nav-glow absolute inset-0 rounded-xl bg-amber-500/10 blur-sm opacity-100 transition-opacity pointer-events-none"></span></button><button @click="emit('navigate','wallet')" class="group flex flex-col items-center justify-center relative w-16 h-12 text-slate-500 transition-colors hover:text-slate-900" data-path="portfolio" type="button"><UiIcon name="account_balance_wallet" :size="24" class="material-symbols-outlined text-[24px] relative z-10"/><span class="font-label-caps text-label-caps mt-1 relative z-10 font-medium">{{t('wallet')}}</span><span class="nav-dot w-1 h-1 rounded-full bg-amber-600 mt-0.5 opacity-0 transition-opacity"></span><span class="nav-glow absolute inset-0 rounded-xl bg-amber-500/10 blur-sm opacity-0 transition-opacity pointer-events-none"></span></button></div></nav></div>
<div v-if="!detailId&&(mode==='updates'||mode==='news')" class="reference-surface reference-article-list"><header class="fixed top-0 w-full z-50 pt-safe bg-surface-container-lowest/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]"><div class="h-14 px-margin-sm flex items-center justify-between"><button :aria-label="t('back')" @click="emit('back')"  class="w-11 h-11 flex items-center justify-center -ml-2 rounded-lg text-on-surface hover:bg-surface-container transition-colors"><UiIcon name="arrow_back" :size="24"  class="material-symbols-outlined text-[22px]"/></button><h1 class="text-headline-sm font-headline-sm text-on-surface text-center flex-1 mx-space-sm truncate">{{t(mode==='updates'?'updates':'news')}}</h1></div></header><main class="flex flex-col relative w-full pt-14 pb-safe bg-surface min-h-screen"><div class="px-margin-sm py-space-sm flex flex-col space-y-4"><article :key="item.id" @click="openDetail(item.id)" @keydown.enter="openDetail(item.id)" class="feed-item bg-surface-container-lowest rounded-xl p-space-md shadow-sm transition-all hover:shadow-md flex flex-col space-y-3 relative overflow-hidden" role="button" tabindex="0" v-for="item in feed.items">
<div class="flex items-center justify-between">
<div class="flex items-center space-x-2">
<span class="text-tertiary text-body-sm font-body-sm">{{item.date}}</span>
</div>
</div>
<h3 class="font-headline-sm text-headline-sm text-on-surface leading-snug">{{item.title}}</h3>
<p class="font-body-md text-body-md text-on-surface-variant leading-relaxed">{{item.summary}}</p>
</article></div><div class="px-margin-sm py-space-sm" aria-live="polite"><p v-if="failed" role="alert">{{t(unavailable?'unavailable':'error')}}</p><button v-if="failed" @click="retry" type="button">{{t('retry')}}</button><p v-if="!busy&&!failed&&isFeed&&!detailId&&!feed.items.length">{{t('empty')}}</p><button v-if="!detailId&&isFeed&&feed.next_page&&!feed.error" :disabled="feed.busy" @click="reader.more()">{{t('more')}}</button></div></main></div>
<div v-if="detailId" class="reference-surface reference-article-detail"><header class="fixed top-0 w-full z-50 pt-safe bg-surface-container-lowest/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]"><div class="h-14 px-margin-sm flex items-center justify-between"><button :aria-label="t('back')" @click="closeDetail"  class="w-11 h-11 flex items-center justify-center -ml-2 rounded-lg text-on-surface hover:bg-surface-container transition-colors"><UiIcon name="arrow_back" :size="24"  class="material-symbols-outlined text-[22px]"/></button><h1 class="text-headline-sm font-headline-sm text-on-surface text-center flex-1 mx-space-sm truncate">{{t((detail?.category||mode)==='community'?'community':(detail?.category||mode)==='updates'?'updates':'news')}}</h1></div></header><main class="flex flex-col relative w-full pt-14 pb-safe bg-surface min-h-screen"><div class="flex flex-col w-full">

<article class="px-margin-sm pt-space-md pb-space-xl flex flex-col gap-space-lg" v-if="detail"><div class="flex flex-col gap-2 pt-1"><h1 class="text-headline-lg-mobile font-headline-lg-mobile text-on-surface leading-tight tracking-tight">{{detail.title}}</h1><div class="flex items-center gap-3 text-body-sm text-on-surface-variant font-body-sm"><span class="text-primary font-medium">{{t('source')}}</span><span class="">·</span><span class="">{{detail.date}}</span></div></div><div class="flex flex-col gap-4 text-body-md font-body-md text-on-surface leading-relaxed"><p :key="i" class="text-on-surface-variant whitespace-pre-wrap" v-for="(paragraph,i) in detail.body?.split('\n\n')||[]">{{paragraph}}</p></div><figure :key="url" class="flex flex-col gap-2 my-1" v-for="(url,i) in detail.image_urls||[]"><div class="w-full rounded-xl overflow-hidden bg-surface-container shadow-sm border border-outline-variant/30"><img :alt="t('image')+' '+(i+1)" :src="mediaUrl(url)" class="w-full h-auto object-cover display-block" loading="lazy" @error="imageFailed=true"/></div></figure><div v-if="imageFailed" role="alert"><p>{{t('error')}}</p><button type="button" @click="loadDetail">{{t('retry')}}</button></div><EditorialVideo :locale="locale" :poster="detail.cover_url||undefined" :src="detail.video_url" @retry="loadDetail" v-if="detail.video_url"></EditorialVideo></article>
</div>
<div class="px-margin-sm py-space-sm" aria-live="polite"><p v-if="failed" role="alert">{{t(unavailable?'unavailable':'error')}}</p><button v-if="failed" @click="retry" type="button">{{t('retry')}}</button><p v-if="!busy&&!failed&&isFeed&&!detailId&&!feed.items.length">{{t('empty')}}</p><button v-if="!detailId&&isFeed&&feed.next_page&&!feed.error" :disabled="feed.busy" @click="reader.more()">{{t('more')}}</button></div></main></div></template>
