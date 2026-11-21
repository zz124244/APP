<script setup lang="ts">
import {ref,onMounted,onUnmounted} from 'vue'
import UiIcon from './UiIcon.vue'
import type {Locale} from './i18n'
import {ApiError,type createApi} from './api'
import {NETWORKS,PER_NETWORK_LIMIT,addressHint,emptyBook,entriesFor,readBook,shortAddress,type AddressBook} from './withdrawal-address-flow'
import {withdrawalAddressText,type WithdrawalAddressTextKey} from './withdrawal-address-text'
const props=defineProps<{service:ReturnType<typeof createApi>;locale:Locale;userUid:string}>()
const emit=defineEmits<{back:[];unauthorized:[]}>()
const w=(key:WithdrawalAddressTextKey)=>withdrawalAddressText(props.locale,key)
const book=ref<AddressBook>(emptyBook()),inputs=ref<Record<string,string>>({TRC20:'',BEP20:''}),busy=ref(false),message=ref<WithdrawalAddressTextKey|null>(null),loaded=ref(false)
let disposed=false
function failed(problem:unknown){if(disposed)return;if(problem instanceof ApiError&&problem.status===401){emit('unauthorized');return}message.value=problem instanceof ApiError&&problem.message==='withdrawal_address_limit'?'limit':problem instanceof ApiError&&problem.message==='withdrawal_address_invalid'?'invalid':'error'}
async function load(){try{const data=await props.service.request<AddressBook>('/withdrawal-addresses');if(!disposed){book.value=readBook(data);loaded.value=true}}catch(problem){if(!disposed)failed(problem)}}
async function add(network:'TRC20'|'BEP20'){
  if(busy.value)return
  const value=inputs.value[network]??''
  const hint=addressHint(book.value,network,value)
  if(hint!=='ok'){message.value=hint==='limit'?'limit':hint==='duplicate'?'duplicate':'invalid';return}
  busy.value=true;message.value=null
  try{await props.service.request('/withdrawal-addresses',{network,address:value});if(disposed)return;inputs.value[network]='';await load()}catch(problem){if(!disposed)failed(problem)}finally{if(!disposed)busy.value=false}
}
async function remove(entry:{id:string}){
  if(busy.value)return
  if(typeof window==='object'&&typeof window.confirm==='function'&&!window.confirm(w('confirmRemove')))return
  busy.value=true;message.value=null
  try{await props.service.request('/withdrawal-addresses/'+entry.id,undefined,{},'DELETE');if(disposed)return;await load()}catch(problem){if(!disposed)failed(problem)}finally{if(!disposed)busy.value=false}
}
onMounted(()=>{void load()})
onUnmounted(()=>{disposed=true})
</script>
<template>
<div class="reference-surface reference-withdrawal"><header class="fixed top-0 w-full z-50 bg-surface-container-lowest/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] pt-safe"><div class="h-14 px-margin-sm flex items-center justify-between"><div class="flex items-center gap-space-xs"><button aria-label="back" :disabled="busy" @click="emit('back')" class="w-11 h-11 flex items-center justify-center text-on-surface hover:text-primary transition-colors" type="button"><UiIcon :size="24" class="material-symbols-outlined text-[24px]" name="arrow_back"></UiIcon></button></div><div class="absolute left-1/2 -translate-x-1/2 flex items-center pointer-events-none"><h1 class="font-headline-sm text-headline-sm text-on-surface tracking-tight truncate max-w-[200px]">{{w('title')}}</h1></div><div class="flex items-center gap-space-xs"></div></div></header><main class="flex flex-col relative w-full pt-14 pb-safe bg-surface min-h-screen"><div class="px-4 pt-3 pb-8 flex flex-col gap-3"><p class="font-body-sm text-body-sm text-on-surface-variant">{{w('hint')}}</p><p class="error" role="alert" v-if="message">{{w(message)}}</p><div v-for="network in NETWORKS" :key="network" class="bg-surface-container-lowest rounded-xl p-4 shadow-sm flex flex-col gap-2.5"><div class="flex items-center justify-between"><span class="font-body-md text-body-md font-semibold text-on-surface">{{network==='TRC20'?'TRC20 (Tron)':'BEP20 (BSC)'}}</span><span class="font-label-numeric-sm text-[12px] text-on-surface-variant">{{entriesFor(book,network).length}}/{{PER_NETWORK_LIMIT}}</span></div><p class="font-body-sm text-body-sm text-outline" v-if="loaded&&!entriesFor(book,network).length">{{w('empty')}}</p><div v-for="entry in entriesFor(book,network)" :key="entry.id" class="flex items-center justify-between gap-2 rounded-lg bg-surface-container-low px-3 py-2"><span class="font-label-numeric-sm text-[13px] text-on-surface break-all">{{shortAddress(entry.address)}}</span><button :disabled="busy" @click="remove(entry)" class="text-body-sm text-error shrink-0" type="button">{{w('remove')}}</button></div><div class="flex items-center gap-2"><input :aria-label="w('placeholder')" :disabled="busy||entriesFor(book,network).length>=PER_NETWORK_LIMIT" :placeholder="w('placeholder')" v-model="inputs[network]" class="flex-1 min-w-0 h-11 rounded-lg bg-surface-container-low px-3 font-label-numeric-sm text-[13px]" type="text" autocomplete="off" spellcheck="false"/><button :disabled="busy||entriesFor(book,network).length>=PER_NETWORK_LIMIT" @click="add(network)" class="h-11 px-3 rounded-lg bg-primary text-on-primary font-body-sm text-body-sm shrink-0" type="button">{{w('add')}}</button></div></div></div></main></div>
</template>
