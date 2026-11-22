<script setup lang="ts">
import {onMounted,onBeforeUnmount,reactive,ref} from 'vue'
import UiIcon from './UiIcon.vue'
import type {createApi} from './api'
import type {Locale} from './i18n'
import {commandKey} from './deposit'
import {addressText,type AddressTextKey} from './address-text'
import {readAddressDraft,saveAddressDraft,clearAddressDraft,verifyAddress,resolveAddress,validAddressFields,type AddressFields,type AddressState,type AddressDraft,type AddressReceipt} from './address-flow'
import {cachedRead} from './cached-read'
const props=defineProps<{service:ReturnType<typeof createApi>;locale:Locale;userUid:string}>()
const emit=defineEmits<{back:[];unauthorized:[]}>()
const state=ref<AddressState>({version:'0',address:null}),loaded=ref(false),busy=ref(false),editing=ref(false),formVersion=ref('0'),notice=ref<AddressTextKey|null>(null),pending=ref<AddressDraft|null>(null),blocked=ref(false),savedWait=ref(false)
const form=reactive<AddressFields>({name:'',phone:'',region:'',address:''})
const fieldNames=['name','phone','region','address'] as const
const maxLengths={name:120,phone:64,region:200,address:1000}
const scope='address.change:'+props.userUid
let disposed=false,timer:ReturnType<typeof setTimeout>|undefined
const t=(key:AddressTextKey)=>addressText(props.locale,key)
function fail(e:any){if(disposed)return;if(e?.status===401){emit('unauthorized');return}notice.value=e?.message==='storage'?'storage':e?.message==='address_changed'||e?.status===409?'conflict':e?.status===422?'invalid':'error'}
function wipe(){for(const key of fieldNames)form[key]=''}
async function load(){const apply=(data:AddressState)=>{if(!disposed){state.value=data;loaded.value=true}};const data=await cachedRead<AddressState>(props.service,`user:${props.userUid}:address`,'/address',apply);apply(data)}
function clearPending(){if(!pending.value)return;if(!clearAddressDraft(localStorage,scope,pending.value.key))throw Error('storage');pending.value=null}
async function verified(receipt:AddressReceipt,expected?:AddressFields){
 const result=await verifyAddress(props.service,receipt,expected)
 if(disposed)return
 clearPending();state.value=result.list;loaded.value=true;props.service.invalidateCached?.(`user:${props.userUid}:address`);savedWait.value=true;notice.value=receipt.exists?'saved':'removed'
 timer=setTimeout(()=>{if(disposed)return;editing.value=false;wipe();savedWait.value=false},1000)
}
async function reconcile(original?:any,expected?:AddressFields){
 const d=pending.value;if(!d)return
 const result=await resolveAddress(props.service,d)
 if(disposed)return
 if(result.status==='not_applied'){clearPending();await load();if(!disposed){notice.value='notApplied';if(original)fail(original)};return}
 try{await verified(result.result,expected)}catch(e:any){if(disposed)return;if(e?.message==='address_changed'){await load();if(disposed)return;clearPending()}throw e}
}
async function startEdit(){if(busy.value||pending.value||blocked.value||savedWait.value)return;busy.value=true;notice.value=null;try{const data=await props.service.request<AddressState>('/address/edit');if(disposed)return;formVersion.value=data.version;for(const key of fieldNames)form[key]=data.address?.[key]??'';editing.value=true}catch(e){fail(e)}finally{if(!disposed)busy.value=false}}
async function change(kind:'save'|'delete'){
 if(busy.value||pending.value||blocked.value||savedWait.value||!loaded.value)return
 if(kind==='save'&&!validAddressFields(form)){notice.value='invalid';return}
 if(kind==='delete'&&!window.confirm(t('confirmDelete')))return
 const expected=kind==='save'?{name:form.name.trim(),phone:form.phone.trim(),region:form.region.trim(),address:form.address.trim()}:undefined
 let d:AddressDraft
 try{d={uid:props.userUid,key:commandKey(),kind,version:kind==='save'?formVersion.value:state.value.version};saveAddressDraft(localStorage,scope,d);pending.value=d}catch{blocked.value=true;notice.value='storage';return}
 busy.value=true;notice.value=null
 try{const receipt=await props.service.request<AddressReceipt>('/address',{expected_version:d.version,...(expected??{})},{'Idempotency-Key':d.key},kind==='save'?'PUT':'DELETE');if(disposed)return;await verified(receipt,expected)}catch(e){if(disposed)return;try{if(pending.value)await reconcile(e,expected);else fail(e)}catch(recoveryError){fail(recoveryError)}}finally{if(!disposed)busy.value=false}
}
async function retry(){if(busy.value||savedWait.value)return;busy.value=true;notice.value=null;try{if(pending.value)await reconcile();else await load()}catch(e){fail(e)}finally{if(!disposed)busy.value=false}}
function back(){if(busy.value||savedWait.value)return;if(editing.value){if(fieldNames.some(k=>form[k])&&!window.confirm(t('discard')))return;editing.value=false;wipe();return}emit('back')}
onMounted(async()=>{try{const raw=localStorage.getItem(scope);pending.value=readAddressDraft(raw,props.userUid);if(raw&&!pending.value){blocked.value=true;notice.value='storage'}}catch{blocked.value=true;notice.value='storage'}busy.value=true;try{if(pending.value)await reconcile();else await load()}catch(e){fail(e)}finally{if(!disposed)busy.value=false}})
onBeforeUnmount(()=>{disposed=true;clearTimeout(timer);wipe()})
</script>
<template><div class="reference-address bg-surface font-body-md text-body-md text-on-surface flex flex-col min-h-screen"><header class="fixed top-0 w-full z-50 bg-surface-container-lowest/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(11,28,48,0.04)] pt-safe"><div class="h-14 px-gutter-sm flex items-center justify-between"><button :aria-label="t('back')" :disabled="busy||savedWait" class="w-11 h-11 flex items-center justify-center text-on-surface hover:text-primary transition-colors" @click="back" type="button"><UiIcon name="arrow_back_ios_new" :size="22"/></button><h1 class="font-headline-sm text-headline-sm text-on-surface text-center flex-1 truncate px-space-xs">{{t('title')}}</h1></div></header><main class="flex flex-col relative w-full pt-14 bg-surface min-h-screen px-gutter-sm pb-safe"><div class="flex flex-col w-full pb-24">

<p v-if="notice" :role="notice==='saved'||notice==='removed'?'status':'alert'" class="py-3 address-notice">{{t(notice)}} <button v-if="!busy&&!savedWait&&notice!=='saved'&&notice!=='removed'" @click="retry" type="button" class="text-primary px-2">{{t('retry')}}</button></p>
<p v-if="pending&&!busy" role="status" class="py-3">{{t('pending')}}</p>
<section v-if="!editing" class="space-y-3.5" id="address-list">
<article v-if="loaded&&state.address" class="bg-surface-container-lowest rounded-full p-4 shadow-sm relative overflow-hidden transition-all duration-200" id="card-addr-1">
<div class="flex items-start justify-between mb-2"><div class="flex items-center gap-2 flex-wrap"><span class="font-headline-sm text-body-lg font-semibold text-on-surface">{{state.address.name}}</span><span class="font-label-numeric-md text-label-numeric-md text-on-surface-variant font-medium">{{state.address.phone}}</span><span class="font-body-sm text-body-sm text-primary">{{t('default')}}</span></div></div>
<div class="mb-3 text-on-surface-variant font-body-md text-body-md leading-relaxed pr-2"><span class="text-on-surface font-medium">{{state.address.region}}</span> {{state.address.address}}</div>
<div class="pt-3 flex items-center justify-between bg-surface-bright -mx-4 -mb-4 px-4 py-2.5 rounded-b-full"><div class="flex items-center gap-3"><button :disabled="busy||!!pending||blocked||savedWait" class="flex items-center gap-1 font-body-sm text-body-sm text-tertiary hover:text-primary transition-colors py-1 px-1.5" @click="startEdit" type="button"><UiIcon name="edit_square" :size="16"/><span>{{t('edit')}}</span></button><button :disabled="busy||!!pending||blocked||savedWait" class="flex items-center gap-1 font-body-sm text-body-sm text-tertiary hover:text-error transition-colors py-1 px-1.5" @click="change('delete')" type="button"><UiIcon name="delete" :size="16"/><span>{{t('remove')}}</span></button></div></div>
</article>
<p v-else-if="loaded" class="py-3" role="status">{{t('empty')}}</p>
</section>
<form v-else @submit.prevent="change('save')" class="px-5 pt-3 pb-8 flex flex-col gap-space-md" autocomplete="off">
<div class="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col gap-space-md"><div v-for="field in fieldNames" :key="field" class="flex flex-col gap-1.5"><div class="flex items-center justify-between"><label class="font-body-sm font-medium text-on-surface flex items-center gap-1" :for="'address-'+field"><span>{{t(field)}}</span><span class="text-error font-bold">*</span></label></div><div class="relative flex items-center"><div class="absolute left-3 flex items-center pointer-events-none text-on-surface-variant"><UiIcon :name="field==='name'?'badge':field==='phone'?'pin':'address'" :size="20"/></div><input class="w-full h-11 pl-10 pr-10 bg-surface-container-lowest text-on-surface placeholder:text-outline font-body-md rounded-lg shadow-sm focus:outline-none focus:bg-surface-bright transition-all" :id="'address-'+field" :type="field==='phone'?'tel':'text'" :maxlength="maxLengths[field]" :readonly="busy||!!pending||savedWait" :aria-invalid="notice==='invalid'" :placeholder="t(field)" v-model="form[field]" required/></div></div></div>
<button :disabled="busy||!!pending||blocked||savedWait" type="submit" class="w-full h-12 bg-primary text-on-primary rounded-xl font-headline-sm text-body-lg">{{t('save')}}</button><button :disabled="busy||savedWait" @click="back" type="button" class="text-tertiary">{{t('cancel')}}</button>
</form>
<p class="py-3 font-body-sm text-body-sm text-on-surface-variant">{{t('onlyOne')}}</p>
<div v-if="!editing" class="fixed bottom-0 left-0 right-0 p-4 bg-surface-container-lowest/95 backdrop-blur-md shadow-lg z-40 pb-safe"><div class="max-w-md mx-auto w-full"><button v-if="loaded&&!state.address" :disabled="busy||!!pending||blocked||savedWait" @click="startEdit" type="button" class="w-full h-12 bg-primary text-on-primary rounded-xl font-headline-sm text-body-lg">{{t('add')}}</button></div></div>
</div></main></div></template>
