<script setup lang="ts">
import BrandMotto from './BrandMotto.vue'
import {ref,onMounted,onUnmounted} from 'vue'
import UiIcon from './UiIcon.vue'
import {ApiError,type createApi} from './api'
import type {Locale} from './i18n'
import {businessTime} from './deposit'
import {depositText} from './deposit-i18n'
import {entriesText,type EntriesTextKey} from './entries-text'
import {entryVariant,entryIcon,entryAmount,executeEntriesLoad,applyEntriesPage,type EntriesState} from './entries-flow'
const props=defineProps<{service:ReturnType<typeof createApi>;locale:Locale;userUid:string}>()
const emit=defineEmits<{back:[];unauthorized:[]}>()
const w=(k:EntriesTextKey)=>entriesText(props.locale,k),d=(k:Parameters<typeof depositText>[1])=>depositText(props.locale,k)
const state=ref<EntriesState>({items:[],next_cursor:null,loaded:false}),busy=ref(false),error=ref('')
let disposed=false
async function load(more=false){if(busy.value||disposed||more&&!state.value.next_cursor)return;busy.value=true;error.value='';const previous=state.value,key=`user:${props.userUid}:wallet.entries`;try{if(!more&&typeof props.service.requestCached==='function'){const value=await props.service.requestCached<{items:unknown[];next_cursor:string|null}>(key,'/wallet/entries',undefined,{},undefined,{persist:true},page=>{if(!disposed){try{state.value=applyEntriesPage(state.value,page,false)}catch{}}});if(!disposed)state.value=applyEntriesPage(state.value,value,false)}else await executeEntriesLoad({previous,more,active:()=>!disposed,read:()=>props.service.request('/wallet/entries'+(more?'?cursor='+encodeURIComponent(previous.next_cursor!):'')),commit:value=>{state.value=value}})}catch(e){if(disposed)return;if(e instanceof ApiError&&e.status===401){emit('unauthorized');return}error.value=e instanceof ApiError&&e.message==='cursor_invalid'?w('cursor_invalid'):d('error')}finally{busy.value=false}}
onMounted(()=>load());onUnmounted(()=>{disposed=true})
</script>
<template>
<div class="reference-surface reference-entries"><header class="fixed top-0 w-full z-50 pt-safe bg-surface-container-lowest/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]"><div class="h-14 px-margin-sm flex items-center justify-between"><div class="flex items-center gap-space-xs"><button :aria-label="d('back')" @click="emit('back')" class="w-11 h-11 flex items-center justify-center rounded-lg text-on-surface hover:bg-surface-container-low transition-colors" type="button"><UiIcon :size="24" class="material-symbols-outlined text-[24px]" name="arrow_back"></UiIcon></button><h1 class="font-headline-sm text-headline-sm text-on-surface tracking-tight select-none">{{w('title')}}</h1></div></div></header><main class="flex-1 w-full pt-14 pb-safe bg-surface flex flex-col"><div class="flex flex-col w-full">

<div class="px-margin-sm pt-space-sm pb-space-xs">
</div>

<div class="px-margin-sm py-space-xs">
</div>

<div class="px-margin-sm py-space-xs flex flex-col gap-space-sm" id="transactionList"><template :key="row.id" v-for="row in state.items"><div class="tx-card bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col gap-space-xs hover:bg-surface-container-low/50 transition-all" data-category="reward" data-original-entry="0" v-if="entryVariant(row)===0">
<div class="flex items-start justify-between">
<div class="flex items-start gap-space-sm min-w-0">
<div class="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center flex-shrink-0 text-on-primary-fixed mt-0.5">
<UiIcon :name="entryIcon(row,0)" :size="20" class="material-symbols-outlined text-[20px]" style='font-variation-settings: "FILL" 1;'></UiIcon>
</div>
<div class="flex flex-col min-w-0">
<div class="flex items-center gap-1.5">
<span class="font-label-caps text-label-caps px-1.5 py-0.5 rounded bg-primary-fixed text-on-primary-fixed">{{w(row.type==='other'&&row.movement?'other_movement':row.type)}}</span>
</div>
<div class="font-label-numeric-sm text-label-numeric-sm text-on-surface-variant mt-1">{{businessTime(row.occurred_at,true)}}</div>
</div>
</div>
<div class="flex flex-col items-end flex-shrink-0 pl-space-xs">
<span :class="row.asset==='ITEM'?'break-words max-w-[140px] font-body-sm text-body-sm':''" class="font-label-numeric-lg text-label-numeric-lg font-bold text-primary">{{entryAmount(row)}}</span>
<span class="font-label-caps text-label-caps text-on-surface-variant">{{row.asset==='ITEM'?w('physical'):row.asset}}</span>
</div>
</div>
</div><div class="tx-card bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col gap-space-xs hover:bg-surface-container-low/50 transition-all" data-category="reward" data-original-entry="1" v-if="entryVariant(row)===1">
<div class="flex items-start justify-between">
<div class="flex items-start gap-space-sm min-w-0">
<div class="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center flex-shrink-0 text-on-primary-fixed mt-0.5">
<UiIcon :name="entryIcon(row,1)" :size="20" class="material-symbols-outlined text-[20px]" style='font-variation-settings: "FILL" 1;'></UiIcon>
</div>
<div class="flex flex-col min-w-0">
<div class="flex items-center gap-1.5">
<span class="font-label-caps text-label-caps px-1.5 py-0.5 rounded bg-primary-fixed text-on-primary-fixed">{{w(row.type==='other'&&row.movement?'other_movement':row.type)}}</span>
</div>
<div class="font-label-numeric-sm text-label-numeric-sm text-on-surface-variant mt-1">{{businessTime(row.occurred_at,true)}}</div>
</div>
</div>
<div class="flex flex-col items-end flex-shrink-0 pl-space-xs">
<span :class="row.asset==='ITEM'?'break-words max-w-[140px] font-body-sm text-body-sm':''" class="font-label-numeric-lg text-label-numeric-lg font-bold text-primary">{{entryAmount(row)}}</span>
<span class="font-label-caps text-label-caps text-on-surface-variant">{{row.asset==='ITEM'?w('physical'):row.asset}}</span>
</div>
</div>
</div><div class="tx-card bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col gap-space-xs hover:bg-surface-container-low/50 transition-all" data-category="yield" data-original-entry="2" v-if="entryVariant(row)===2">
<div class="flex items-start justify-between">
<div class="flex items-start gap-space-sm min-w-0">
<div class="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center flex-shrink-0 text-primary mt-0.5">
<UiIcon :name="entryIcon(row,2)" :size="20" class="material-symbols-outlined text-[20px]" style='font-variation-settings: "FILL" 1;'></UiIcon>
</div>
<div class="flex flex-col min-w-0">
<div class="flex items-center gap-1.5">
<span class="font-label-caps text-label-caps px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant">{{w(row.type==='other'&&row.movement?'other_movement':row.type)}}</span>
</div>
<div class="font-label-numeric-sm text-label-numeric-sm text-on-surface-variant mt-1">{{businessTime(row.occurred_at,true)}}</div>
</div>
</div>
<div class="flex flex-col items-end flex-shrink-0 pl-space-xs">
<span :class="row.asset==='ITEM'?'break-words max-w-[140px] font-body-sm text-body-sm':''" class="font-label-numeric-lg text-label-numeric-lg font-bold text-primary">{{entryAmount(row)}}</span>
<span class="font-label-caps text-label-caps text-on-surface-variant">{{row.asset==='ITEM'?w('physical'):row.asset}}</span>
</div>
</div>
</div><div class="tx-card bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col gap-space-xs hover:bg-surface-container-low/50 transition-all" data-category="task" data-original-entry="3" v-if="entryVariant(row)===3">
<div class="flex items-start justify-between">
<div class="flex items-start gap-space-sm min-w-0">
<div class="w-10 h-10 rounded-full bg-secondary-fixed flex items-center justify-center flex-shrink-0 text-on-secondary-fixed mt-0.5">
<UiIcon :name="entryIcon(row,3)" :size="20" class="material-symbols-outlined text-[20px]" style='font-variation-settings: "FILL" 1;'></UiIcon>
</div>
<div class="flex flex-col min-w-0">
<div class="flex items-center gap-1.5">
<span class="font-label-caps text-label-caps px-1.5 py-0.5 rounded bg-secondary-fixed text-on-secondary-fixed">{{w(row.type==='other'&&row.movement?'other_movement':row.type)}}</span>
</div>
<div class="font-label-numeric-sm text-label-numeric-sm text-on-surface-variant mt-1">{{businessTime(row.occurred_at,true)}}</div>
</div>
</div>
<div class="flex flex-col items-end flex-shrink-0 pl-space-xs">
<span :class="row.asset==='ITEM'?'break-words max-w-[140px] font-body-sm text-body-sm':''" class="font-label-numeric-lg text-label-numeric-lg font-bold text-primary">{{entryAmount(row)}}</span>
<span class="font-label-caps text-label-caps text-on-surface-variant">{{row.asset==='ITEM'?w('physical'):row.asset}}</span>
</div>
</div>
</div><div class="tx-card bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col gap-space-xs hover:bg-surface-container-low/50 transition-all" data-category="task" data-original-entry="4" v-if="entryVariant(row)===4">
<div class="flex items-start justify-between">
<div class="flex items-start gap-space-sm min-w-0">
<div class="w-10 h-10 rounded-full bg-secondary-fixed flex items-center justify-center flex-shrink-0 text-on-secondary-fixed mt-0.5">
<UiIcon :name="entryIcon(row,4)" :size="20" class="material-symbols-outlined text-[20px]" style='font-variation-settings: "FILL" 1;'></UiIcon>
</div>
<div class="flex flex-col min-w-0">
<div class="flex items-center gap-1.5">
<span class="font-label-caps text-label-caps px-1.5 py-0.5 rounded bg-secondary-fixed text-on-secondary-fixed">{{w(row.type==='other'&&row.movement?'other_movement':row.type)}}</span>
</div>
<div class="font-label-numeric-sm text-label-numeric-sm text-on-surface-variant mt-1">{{businessTime(row.occurred_at,true)}}</div>
</div>
</div>
<div class="flex flex-col items-end flex-shrink-0 pl-space-xs">
<span :class="row.asset==='ITEM'?'break-words max-w-[140px] font-body-sm text-body-sm':''" class="font-label-numeric-lg text-label-numeric-lg font-bold text-primary">{{entryAmount(row)}}</span>
<span class="font-label-caps text-label-caps text-on-surface-variant">{{row.asset==='ITEM'?w('physical'):row.asset}}</span>
</div>
</div>
</div><div class="tx-card bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col gap-space-xs hover:bg-surface-container-low/50 transition-all" data-category="reward" data-original-entry="5" v-if="entryVariant(row)===5">
<div class="flex items-start justify-between">
<div class="flex items-start gap-space-sm min-w-0">
<div class="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center flex-shrink-0 text-primary mt-0.5">
<UiIcon :name="entryIcon(row,5)" :size="20" class="material-symbols-outlined text-[20px]" style='font-variation-settings: "FILL" 1;'></UiIcon>
</div>
<div class="flex flex-col min-w-0">
<div class="flex items-center gap-1.5">
<span class="font-label-caps text-label-caps px-1.5 py-0.5 rounded bg-primary-fixed text-on-primary-fixed">{{w(row.type==='other'&&row.movement?'other_movement':row.type)}}</span>
</div>
<div class="font-label-numeric-sm text-label-numeric-sm text-on-surface-variant mt-1">{{businessTime(row.occurred_at,true)}}</div>
</div>
</div>
<div class="flex flex-col items-end flex-shrink-0 pl-space-xs">
<span :class="row.asset==='ITEM'?'break-words max-w-[140px] font-body-sm text-body-sm':''" class="font-label-numeric-lg text-label-numeric-lg font-bold text-primary">{{entryAmount(row)}}</span>
<span class="font-label-caps text-label-caps text-on-surface-variant">{{row.asset==='ITEM'?w('physical'):row.asset}}</span>
</div>
</div>
</div><div class="tx-card bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col gap-space-xs hover:bg-surface-container-low/50 transition-all" data-category="transfer" data-original-entry="6" v-if="entryVariant(row)===6">
<div class="flex items-start justify-between">
<div class="flex items-start gap-space-sm min-w-0">
<div class="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center flex-shrink-0 text-on-surface mt-0.5">
<UiIcon :name="entryIcon(row,6)" :size="20" class="material-symbols-outlined text-[20px]" style='font-variation-settings: "FILL" 1;'></UiIcon>
</div>
<div class="flex flex-col min-w-0">
<div class="flex items-center gap-1.5">
<span class="font-label-caps text-label-caps px-1.5 py-0.5 rounded bg-surface-container-highest text-on-surface-variant">{{w(row.type==='other'&&row.movement?'other_movement':row.type)}}</span>
</div>
<div class="font-label-numeric-sm text-label-numeric-sm text-on-surface-variant mt-1">{{businessTime(row.occurred_at,true)}}</div>
</div>
</div>
<div class="flex flex-col items-end flex-shrink-0 pl-space-xs">
<span class="font-label-numeric-lg text-label-numeric-lg font-bold text-on-surface">{{entryAmount(row)}}</span>
<span class="font-label-caps text-label-caps text-on-surface-variant">{{row.asset==='ITEM'?w('physical'):row.asset}}</span>
</div>
</div>
</div><div class="tx-card bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col gap-space-xs hover:bg-surface-container-low/50 transition-all" data-category="transfer" data-original-entry="7" v-if="entryVariant(row)===7">
<div class="flex items-start justify-between">
<div class="flex items-start gap-space-sm min-w-0">
<div class="w-10 h-10 rounded-full bg-secondary-fixed flex items-center justify-center flex-shrink-0 text-on-secondary-fixed mt-0.5">
<UiIcon :name="entryIcon(row,7)" :size="20" class="material-symbols-outlined text-[20px]" style='font-variation-settings: "FILL" 1;'></UiIcon>
</div>
<div class="flex flex-col min-w-0">
<div class="flex items-center gap-1.5">
<span class="font-label-caps text-label-caps px-1.5 py-0.5 rounded bg-secondary-fixed text-on-secondary-fixed">{{w(row.type==='other'&&row.movement?'other_movement':row.type)}}</span>
</div>
<div class="font-label-numeric-sm text-label-numeric-sm text-on-surface-variant mt-1">{{businessTime(row.occurred_at,true)}}</div>
</div>
</div>
<div class="flex flex-col items-end flex-shrink-0 pl-space-xs">
<span class="font-label-numeric-lg text-label-numeric-lg font-bold text-on-surface">{{entryAmount(row)}}</span>
<span class="font-label-caps text-label-caps text-secondary font-semibold">{{row.asset==='ITEM'?w('physical'):row.asset}}</span>
</div>
</div>
</div><div class="tx-card bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col gap-space-xs hover:bg-surface-container-low/50 transition-all" data-category="transfer" data-original-entry="8" v-if="entryVariant(row)===8">
<div class="flex items-start justify-between">
<div class="flex items-start gap-space-sm min-w-0">
<div class="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center flex-shrink-0 text-on-primary-fixed mt-0.5">
<UiIcon :name="entryIcon(row,8)" :size="20" class="material-symbols-outlined text-[20px]" style='font-variation-settings: "FILL" 1;'></UiIcon>
</div>
<div class="flex flex-col min-w-0">
<div class="flex items-center gap-1.5">
<span class="font-label-caps text-label-caps px-1.5 py-0.5 rounded bg-primary-fixed text-on-primary-fixed">{{w(row.type==='other'&&row.movement?'other_movement':row.type)}}</span>
</div>
<div class="font-label-numeric-sm text-label-numeric-sm text-on-surface-variant mt-1">{{businessTime(row.occurred_at,true)}}</div>
</div>
</div>
<div class="flex flex-col items-end flex-shrink-0 pl-space-xs">
<span :class="row.asset==='ITEM'?'break-words max-w-[140px] font-body-sm text-body-sm':''" class="font-label-numeric-lg text-label-numeric-lg font-bold text-primary">{{entryAmount(row)}}</span>
<span class="font-label-caps text-label-caps text-primary font-semibold">{{row.asset==='ITEM'?w('physical'):row.asset}}</span>
</div>
</div>
</div><div class="tx-card bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col gap-space-xs hover:bg-surface-container-low/50 transition-all" data-category="yield" data-original-entry="9" v-if="entryVariant(row)===9">
<div class="flex items-start justify-between">
<div class="flex items-start gap-space-sm min-w-0">
<div class="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center flex-shrink-0 text-on-surface mt-0.5">
<UiIcon :name="entryIcon(row,9)" :size="20" class="material-symbols-outlined text-[20px]" style='font-variation-settings: "FILL" 1;'></UiIcon>
</div>
<div class="flex flex-col min-w-0">
<div class="flex items-center gap-1.5">
<span class="font-label-caps text-label-caps px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant">{{w(row.type==='other'&&row.movement?'other_movement':row.type)}}</span>
</div>
<div class="font-label-numeric-sm text-label-numeric-sm text-on-surface-variant mt-1">{{businessTime(row.occurred_at,true)}}</div>
</div>
</div>
<div class="flex flex-col items-end flex-shrink-0 pl-space-xs">
<span class="font-label-numeric-lg text-label-numeric-lg font-bold text-on-surface">{{entryAmount(row)}}</span>
<span class="font-label-caps text-label-caps text-on-surface-variant">{{row.asset==='ITEM'?w('physical'):row.asset}}</span>
</div>
</div>
</div><div class="tx-card bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col gap-space-xs hover:bg-surface-container-low/50 transition-all" data-category="yield" data-original-entry="10" v-if="entryVariant(row)===10">
<div class="flex items-start justify-between">
<div class="flex items-start gap-space-sm min-w-0">
<div class="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center flex-shrink-0 text-on-primary-fixed mt-0.5">
<UiIcon :name="entryIcon(row,10)" :size="20" class="material-symbols-outlined text-[20px]" style='font-variation-settings: "FILL" 1;'></UiIcon>
</div>
<div class="flex flex-col min-w-0">
<div class="flex items-center gap-1.5">
<span class="font-label-caps text-label-caps px-1.5 py-0.5 rounded bg-primary-fixed text-on-primary-fixed">{{w(row.type==='other'&&row.movement?'other_movement':row.type)}}</span>
</div>
<div class="font-label-numeric-sm text-label-numeric-sm text-on-surface-variant mt-1">{{businessTime(row.occurred_at,true)}}</div>
</div>
</div>
<div class="flex flex-col items-end flex-shrink-0 pl-space-xs">
<span :class="row.asset==='ITEM'?'break-words max-w-[140px] font-body-sm text-body-sm':''" class="font-label-numeric-lg text-label-numeric-lg font-bold text-primary">{{entryAmount(row)}}</span>
<span class="font-label-caps text-label-caps text-on-surface-variant">{{row.asset==='ITEM'?w('physical'):row.asset}}</span>
</div>
</div>
</div></template></div><div class="px-margin-sm py-space-sm flex flex-col gap-space-sm"><p class="error" role="alert" v-if="error">{{error}}</p><p class="font-body-sm text-body-sm" role="status" v-if="state.loaded&&!state.items.length&&!error&&!busy">{{w('empty')}}</p><button :disabled="busy" @click="load(true)" class="w-full py-2.5 rounded-lg bg-surface-container text-on-surface font-body-sm font-medium" type="button" v-if="state.next_cursor">{{d('more')}}</button><button :disabled="busy" @click="load(false)" class="w-full py-2.5 rounded-lg bg-surface-container text-on-surface font-body-sm font-medium" type="button">{{w('refresh')}}</button></div>

<div class="px-margin-sm py-space-lg flex flex-col items-center gap-space-md text-center">

<div class="pt-space-xs pb-space-sm flex flex-col items-center">
<BrandMotto :locale="locale"/>
</div>
</div>




</div>
</main></div>
</template>
