<script setup lang="ts">
import {ref,reactive,computed,onMounted,onUnmounted} from 'vue'
import UiIcon from './UiIcon.vue'
import TeamMemberCard from './TeamMemberCard.vue'
import {ApiError,type createApi} from './api'
import type {Locale} from './i18n'
import {depositText} from './deposit-i18n'
import {teamText,type TeamTextKey} from './team-text'
import {createTeamLoader,formatTeamNumber,teamVariant,type TeamState} from './team-flow'
import {copyInvitationAndMark,writeClipboardText} from './invitation-flow'
import {invitationQr} from './invitation-qr'
const props=defineProps<{service:ReturnType<typeof createApi>;locale:Locale;userUid?:string}>()
const emit=defineEmits<{back:[];unauthorized:[]}>()
const w=(key:TeamTextKey)=>teamText(props.locale,key),d=(key:Parameters<typeof depositText>[1])=>depositText(props.locale,key)
type Summary={member_count:string;level_counts:Record<number,string>;referral_earned_total:string;recharge_total:string;withdrawal_net_total:string;investment_outstanding_total:string;team_leader_level:number}
const summary=ref<Summary>(),invitation=ref<{invite_code:string;invite_url:string}>(),qr=ref(''),qrError=ref(false),summaryError=ref(false),invitationError=ref(false),notice=ref(''),expanded=ref(false),copyFeedback=reactive({copiedType:''})
let disposed=false
function failure(e:unknown){if(e instanceof ApiError&&e.status===401)emit('unauthorized')}
async function cachedRequest<T>(key:string,path:string,onChange?:(value:T)=>void):Promise<T>{if(typeof props.service.requestCached==='function')return props.service.requestCached<T>(key,path,undefined,{},undefined,{},value=>{if(!disposed)onChange?.(value)});return props.service.request<T>(path)}
const state=reactive<TeamState>({depth:1,items:[],next_cursor:null,loaded:false,busy:false,error:false}),loader=createTeamLoader(state,failure)
const visibleMembers=computed(()=>expanded.value?state.items:state.items.slice(0,state.depth===1?3:2))
async function loadSummary(){summaryError.value=false;try{const key=props.userUid?`user:${props.userUid}:team.summary`:'team.summary';const value=await cachedRequest<Summary>(key,'/team/summary',next=>{summary.value=next});if(!disposed)summary.value=value}catch(e){if(!disposed){summaryError.value=true;failure(e)}}}
async function loadInvitation(){invitationError.value=false;qrError.value=false;try{const value=await props.service.request<{invite_code:string;invite_url:string}>('/invitations/mine');if(disposed)return;invitation.value=value;qr.value='';try{qr.value=await invitationQr(value.invite_url)}catch{if(!disposed)qrError.value=true}}catch(e){if(!disposed){invitationError.value=true;failure(e)}}}
function loadMembers(more=false){return loader.load(state.depth,cursor=>props.service.request('/team/members?depth='+state.depth+(cursor?'&cursor='+encodeURIComponent(cursor):'')),more)}
function switchDepth(depth:number){if(depth===state.depth)return;expanded.value=false;state.depth=depth;void loadMembers()}
function toggleExpanded(){expanded.value=!expanded.value}
async function copy(value:string|undefined,type:'code'|'link'){notice.value='';const copied=await copyInvitationAndMark(copyFeedback,type,value,text=>writeClipboardText(text));if(!disposed&&!copied)notice.value=w('copyFailed')}
onMounted(()=>{void loadSummary();void loadInvitation();void loadMembers()});onUnmounted(()=>{disposed=true;loader.dispose()})
</script>
<template><div class="reference-surface reference-team"><header class="fixed top-0 w-full z-50 pt-safe bg-surface-container-lowest/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]"><div class="h-14 px-gutter-sm flex items-center justify-between"><div class="flex items-center gap-space-xs"><button :aria-label="d('back')" @click="emit('back')" class="w-11 h-11 flex items-center justify-center text-on-surface hover:text-primary transition-colors" type="button"><UiIcon :size="24" class="material-symbols-outlined text-[24px]" name="arrow_back"></UiIcon></button><h1 class="text-headline-sm font-headline-sm tracking-tight text-on-surface pl-space-xs">{{w('team')}}</h1></div></div></header><main class="flex flex-col relative w-full pt-14 pb-safe bg-surface-container-lowest min-h-screen"><div class="flex flex-col w-full px-margin-sm space-y-space-md pb-space-xl"><p role="alert" v-if="summaryError">{{w('error')}} <button @click="loadSummary">{{w('retry')}}</button></p><p role="alert" v-if="invitationError">{{w('error')}} <button @click="loadInvitation">{{w('retry')}}</button></p><p role="status" v-if="notice">{{notice}}</p>

<div class="relative w-full rounded-xl bg-surface-container-lowest p-space-md shadow-sm overflow-hidden">
<div class="absolute -right-12 -top-12 w-44 h-44 rounded-full bg-primary-fixed/20 blur-2xl pointer-events-none"></div>
<div class="absolute right-0 top-0 w-28 h-28 bg-gradient-to-br from-transparent to-secondary-fixed/20 pointer-events-none"></div>
<div class="relative z-10 flex flex-col space-y-space-md">


<div class="relative flex flex-col rounded-lg bg-surface-container-low p-space-md">
<div class="flex items-center justify-between">
<span class="font-body-sm text-body-sm text-tertiary">{{w('reward')}}</span>
<span v-if="(summary?.team_leader_level??0)>0" class="absolute top-3 right-3 inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">{{w('teamLeader')}} {{summary?.team_leader_level}}</span>
</div>
<div class="flex items-baseline gap-1.5 mt-1">
<span class="font-headline-lg-mobile text-headline-lg-mobile font-semibold text-primary" style="color: rgb(217, 119, 6);">{{formatTeamNumber(summary?.referral_earned_total)}}</span>
<span class="font-label-numeric-sm text-label-numeric-sm font-semibold text-primary" style="color: rgb(217, 119, 6);">USDT</span>
</div>
</div>

<div class="grid grid-cols-2 gap-2.5">
<div class="flex flex-col p-3 rounded-lg bg-surface-container-low">
<div class="flex items-center gap-1 text-tertiary">
<UiIcon :size="16" class="material-symbols-outlined text-[16px]" name="groups"></UiIcon>
<span class="font-body-sm text-body-sm">{{w('count')}}</span>
</div>
<div class="flex items-baseline gap-1 mt-1">
<span class="font-label-numeric-lg text-label-numeric-lg font-semibold text-on-surface">{{formatTeamNumber(summary?.member_count)}}</span>
<span class="font-body-sm text-body-sm text-tertiary">{{w('person')}}</span>
</div>
</div>
<div class="flex flex-col p-3 rounded-lg bg-surface-container-low">
<div class="flex items-center gap-1 text-tertiary">
<UiIcon :size="16" class="material-symbols-outlined text-[16px]" name="account_balance_wallet"></UiIcon>
<span class="font-body-sm text-body-sm">{{w('recharge')}}</span>
</div>
<div class="flex items-baseline gap-1 mt-1">
<span class="font-label-numeric-lg text-label-numeric-lg font-semibold text-on-surface">{{formatTeamNumber(summary?.recharge_total)}}</span>
</div>
</div>
<div class="flex flex-col p-3 rounded-lg bg-surface-container-low">
<div class="flex items-center gap-1 text-tertiary">
<UiIcon :size="16" class="material-symbols-outlined text-[16px]" name="query_stats"></UiIcon>
<span class="font-body-sm text-body-sm">{{w('invested')}}</span>
</div>
<div class="flex items-baseline gap-1 mt-1">
<span class="font-label-numeric-lg text-label-numeric-lg font-semibold text-on-surface">{{formatTeamNumber(summary?.investment_outstanding_total)}}</span>
</div>
</div>
<div class="flex flex-col p-3 rounded-lg bg-surface-container-low">
<div class="flex items-center gap-1 text-tertiary">
<UiIcon :size="16" class="material-symbols-outlined text-[16px]" name="payments"></UiIcon>
<span class="font-body-sm text-body-sm">{{w('withdraw')}}</span>
</div>
<div class="flex items-baseline gap-1 mt-1">
<span class="font-label-numeric-lg text-label-numeric-lg font-semibold text-on-surface">{{formatTeamNumber(summary?.withdrawal_net_total)}}</span>
</div>
</div>
</div>
</div>
</div>

<div class="w-full rounded-xl bg-surface-container-lowest p-space-md shadow-sm space-y-space-sm">
<div class="flex items-center justify-between">
<div class="flex items-center gap-2">
<div class="w-2 h-4 rounded-full bg-primary"></div>
<h2 class="font-headline-sm text-headline-sm font-semibold text-on-surface">{{w('tools')}}</h2>
</div>
</div>

<div class="flex flex-col space-y-2 pt-1">
<div class="flex items-center justify-between p-2.5 rounded-lg bg-surface-container-low">
<div class="flex flex-col">
<span class="font-body-sm text-body-sm text-tertiary">{{w('code')}}</span>
<span class="font-label-numeric-lg text-label-numeric-lg font-semibold tracking-wider text-on-surface" id="invite-code-val">{{invitation?.invite_code??'—'}}</span>
</div>
<button :disabled="!invitation" @click="copy(invitation?.invite_code,'code')" class="h-9 px-3.5 rounded-lg text-on-primary font-body-md text-body-md font-medium hover:bg-primary-container active:scale-95 transition-all shadow-sm" style="background-color: rgb(217, 119, 6);" type="button">{{copyFeedback.copiedType==='code'?w('copied'):w('copy')}}</button>
</div>

<div class="flex items-center justify-between p-2.5 rounded-lg bg-surface-container-low">
<div class="flex flex-col min-w-0 pr-2">
<span class="font-body-sm text-body-sm text-tertiary">{{w('link')}}</span>
<span class="font-label-numeric-sm text-label-numeric-sm text-on-surface-variant truncate">{{invitation?.invite_url??'—'}}</span>
</div>
<button :disabled="!invitation" @click="copy(invitation?.invite_url,'link')" class="h-9 px-3.5 rounded-lg bg-surface-container-highest text-on-surface font-body-md text-body-md font-medium hover:bg-surface-dim active:scale-95 transition-all" type="button">{{copyFeedback.copiedType==='link'?w('copied'):w('copyLink')}}</button>
</div>
</div>

<div v-if="invitation" class="flex flex-col items-center gap-2 rounded-xl bg-surface-container-low p-space-md text-center"><div class="flex h-44 w-44 items-center justify-center rounded-xl bg-white p-2 shadow-sm"><img v-if="qr" :src="qr" :alt="w('link')" class="h-full w-full rounded-lg"/></div><span class="font-body-sm text-body-sm text-tertiary">{{w('exclusive')}}</span><p v-if="qrError" role="alert">{{w('error')}}</p></div>
<div class="grid grid-cols-2 gap-2 pt-1">
</div>
</div>

<div class="w-full rounded-xl bg-surface-container-lowest p-space-md shadow-sm space-y-space-md" id="team-members-section"><div class="flex items-center justify-between"><div class="flex items-center gap-2"><div class="w-2 h-4 rounded-full bg-primary"></div><h2 class="font-headline-sm text-headline-sm font-semibold text-on-surface">{{w('members')}}</h2></div><span class="font-label-numeric-sm text-label-numeric-sm text-tertiary">{{w('total')}} {{formatTeamNumber(summary?.member_count)}} {{w('person')}}</span></div><div class="grid grid-cols-3 gap-1.5 p-1 bg-surface-container-low rounded-lg"><button :aria-pressed="state.depth===1" :class="state.depth===1?'bg-surface-container-lowest text-primary shadow-sm':'text-tertiary'" @click="switchDepth(1)" class="flex flex-col items-center py-2 px-1 rounded-md transition-all text-tertiary" id="tab-btn-l1" type="button"><span class="font-body-sm text-body-sm font-semibold">{{w('level1')}}</span><span class="font-label-numeric-sm text-label-numeric-sm text-outline mt-0.5">{{formatTeamNumber(summary?.level_counts[1])}} {{w('person')}}</span></button><button :aria-pressed="state.depth===2" :class="state.depth===2?'bg-surface-container-lowest text-primary shadow-sm':'text-tertiary'" @click="switchDepth(2)" class="flex flex-col items-center py-2 px-1 rounded-md hover:text-on-surface transition-all text-tertiary" id="tab-btn-l2" type="button"><span class="font-body-sm text-body-sm font-semibold">{{w('level2')}}</span><span class="font-label-numeric-sm text-label-numeric-sm text-outline mt-0.5">{{formatTeamNumber(summary?.level_counts[2])}} {{w('person')}}</span></button><button :aria-pressed="state.depth===3" :class="state.depth===3?'bg-surface-container-lowest text-primary shadow-sm':'text-tertiary'" @click="switchDepth(3)" class="flex flex-col items-center py-2 px-1 rounded-md hover:text-on-surface transition-all font-medium" id="tab-btn-l3" type="button"><span class="font-body-sm text-body-sm font-semibold">{{w('level3')}}</span><span class="font-label-numeric-sm text-label-numeric-sm text-outline mt-0.5">{{formatTeamNumber(summary?.level_counts[3])}} {{w('person')}}</span></button></div><div class="tab-tier-panel flex flex-col space-y-2.5 pt-1" id="panel-l1" v-if="state.depth===1"><TeamMemberCard :key="row.id" :locale="locale" :row="row" :variant="teamVariant(state.depth,i)" v-for="(row,i) in visibleMembers"></TeamMemberCard></div><div class="tab-tier-panel flex flex-col space-y-2.5 pt-1" id="panel-l2" v-if="state.depth===2"><TeamMemberCard :key="row.id" :locale="locale" :row="row" :variant="teamVariant(state.depth,i)" v-for="(row,i) in visibleMembers"></TeamMemberCard></div><div class="tab-tier-panel flex flex-col space-y-2.5 pt-1" id="panel-l3" v-if="state.depth===3"><TeamMemberCard :key="row.id" :locale="locale" :row="row" :variant="teamVariant(state.depth,i)" v-for="(row,i) in visibleMembers"></TeamMemberCard></div><div class="flex flex-col items-center justify-center pt-2"><div class="inline-flex items-center gap-1.5 text-outline font-body-sm text-body-sm" id="expand-dots" v-if="!expanded"><span class="w-1.5 h-1.5 rounded-full bg-outline-variant"></span><span class="w-1.5 h-1.5 rounded-full bg-outline-variant"></span></div><button :disabled="state.busy||!state.loaded" @click="toggleExpanded" class="mt-2 inline-flex items-center gap-1 text-primary font-body-sm text-body-sm font-medium hover:underline transition-all" id="toggle-expand-btn" type="button"><span id="toggle-expand-text">{{w(expanded?'collapse':'more')}}</span><UiIcon :size="16" class="material-symbols-outlined text-[16px] transition-transform duration-300" id="toggle-expand-icon" name="expand_more"></UiIcon></button></div><p role="alert" v-if="state.error">{{w('error')}} <button @click="loadMembers(!!state.items.length)">{{w('retry')}}</button></p><p v-if="state.loaded&amp;&amp;!state.items.length">{{w('empty')}}</p><button :disabled="state.busy" @click="loadMembers(true)" v-if="expanded&amp;&amp;state.next_cursor">{{w('more')}}</button></div>


<div class="flex flex-col items-center justify-center pt-2 pb-4 space-y-1 text-center">
<div class="flex items-center gap-1.5 text-outline font-body-sm text-body-sm font-medium tracking-wide">{{w('brand')}}</div>
</div>
</div></main>

</div></template>
