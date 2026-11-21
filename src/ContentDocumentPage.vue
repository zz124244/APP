<script setup lang="ts">
import {ref,onMounted,onBeforeUnmount} from 'vue'
import type {createApi} from './api'
import type {Locale} from './i18n'
import UiIcon from './UiIcon.vue'
import {contentText,type ContentTextKey} from './content-text'
import {loadDocument,contentParagraphs,type DocumentKind,type ContentDocument} from './content-document-flow'
import {createPrivateImageCache} from './private-images'
const props=defineProps<{service:ReturnType<typeof createApi>;locale:Locale;kind:DocumentKind}>()
const emit=defineEmits<{back:[];navigate:[target:string];unauthorized:[]}>()
const data=ref<ContentDocument|null>(null),busy=ref(false),failed=ref(false),tick=ref(0)
let disposed=false
const t=(key:ContentTextKey)=>contentText(props.locale,key)
const images=createPrivateImageCache(id=>props.service.image('/content-media/'+id),{create:blob=>URL.createObjectURL(blob),revoke:url=>URL.revokeObjectURL(url),changed:()=>tick.value++,failed:(e:any)=>{if(e?.status===401)emit('unauthorized')}})
function image(id:string){void tick.value;return images.urls[id]}
function imageFailed(id:string){void tick.value;return images.failed.has(id)}
async function load(){if(busy.value)return;busy.value=true;failed.value=false;data.value=null;try{const value=await loadDocument(props.service,props.kind);if(disposed)return;data.value=value;await images.retry(value.sections.map(s=>s.image_id).filter((id):id is string=>id!==null))}catch(e:any){if(disposed)return;if(e?.status===401)emit('unauthorized');else failed.value=true}finally{if(!disposed)busy.value=false}}
onMounted(load)
onBeforeUnmount(()=>{disposed=true;images.dispose()})
</script>
<template>
<div v-if="kind==='terms'" class="reference-terms">
<header class="fixed top-0 w-full z-50 pt-safe bg-white/95 backdrop-blur-md border-b border-gray-100"><div class="h-14 px-margin-sm flex items-center justify-between"><button :aria-label="t('back')" class="w-11 h-11 flex items-center justify-center text-on-surface hover:text-primary transition-colors" @click="emit('back')" type="button"><UiIcon name="arrow_back" :size="22"/></button><h1 class="font-headline-sm text-headline-sm text-on-surface text-center truncate flex-1 px-space-xs font-semibold">{{t('terms')}}</h1><div class="w-11 h-11 flex items-center justify-end"></div></div></header>
<main class="flex-1 flex flex-col relative w-full pt-14 pb-safe bg-white"><div class="flex flex-col w-full"><div class="px-6 py-6"><div class="prose max-w-none text-slate-700">
<p v-if="failed" role="alert">{{t('error')}} <button @click="load" type="button">{{t('retry')}}</button></p><p v-if="data&&!data.configured" role="status">{{t('empty')}}</p>
<template v-for="section in data?.sections??[]" :key="section.id"><h2 v-if="section.title" class="font-semibold text-base text-slate-900 mt-6 mb-3">{{section.title}}</h2><p v-for="(paragraph,i) in contentParagraphs(section.text)" :key="i" class="mb-4 text-slate-700 leading-relaxed text-sm content-paragraph">{{paragraph}}</p></template>
<button @click="emit('navigate','compliance')" type="button" class="flex items-center justify-between p-space-md border-t border-slate-100 w-full text-left text-primary">{{t('compliance')}}<UiIcon name="next"/></button>
</div></div></div></main></div>
<div v-else class="reference-compliance bg-surface text-on-surface font-body-md text-body-md antialiased">
<header class="fixed top-0 w-full z-50 pt-safe bg-surface-container-lowest/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]"><div class="h-14 px-margin-sm flex items-center justify-between"><button :aria-label="t('back')" class="w-11 h-11 flex items-center justify-center -ml-2 rounded-lg text-on-surface hover:bg-surface-container transition-colors" @click="emit('back')" type="button"><UiIcon name="arrow_back" :size="22"/></button><h1 class="text-headline-sm font-headline-sm text-on-surface text-center flex-1 mx-space-sm truncate">{{t('compliance')}}</h1><div class="w-11 h-11"></div></div></header>
<main class="flex flex-col relative w-full pt-14 pb-safe min-h-screen"><div class="w-full max-w-xl mx-auto px-margin-sm py-space-md">
<p v-if="failed" role="alert">{{t('error')}} <button @click="load" type="button">{{t('retry')}}</button></p><p v-if="data&&!data.configured" role="status">{{t('empty')}}</p>
<section v-if="data?.configured" class="mb-space-lg"><h1 class="font-headline-lg-mobile text-headline-lg-mobile text-on-surface mb-space-sm tracking-tight leading-snug">{{data.headline}}</h1></section>
<article v-for="section in data?.sections??[]" :key="section.id" class="mb-space-xl"><h2 class="font-headline-sm text-headline-sm text-on-surface mb-space-xs flex items-center gap-2"><span>{{section.title}}</span></h2><p v-for="(paragraph,i) in contentParagraphs(section.text)" :key="i" class="font-body-md text-body-md text-on-surface-variant mb-space-md leading-relaxed text-justify content-paragraph">{{paragraph}}</p><figure class="m-0 w-full"><div class="w-full rounded-xl overflow-hidden shadow-sm bg-surface-container-lowest relative"><img v-if="section.image_id&&image(section.image_id)" :alt="section.title" class="w-full h-auto object-cover block" :src="image(section.image_id)"/><p v-else-if="section.image_id&&imageFailed(section.image_id)" role="alert">{{t('imageError')}} <button @click="images.load(section.image_id)" type="button">{{t('retry')}}</button></p></div></figure></article>
</div></main></div>
</template>
