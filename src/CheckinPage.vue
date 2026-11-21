<script setup lang="ts">
import {ref,onMounted,onUnmounted} from 'vue'
import UiIcon from './UiIcon.vue'
import type {createApi} from './api'
import type {Locale} from './i18n'
import {activityText,type ActivityTextKey} from './activity-text'
function cycleRewardInteger(value:string):string { const match=/^(0|[1-9][0-9]*)(?:\.[0-9]+)?$/.exec(value); return match?.[1] ?? value }
import {useActivityCommand,type ActivityStorage} from './activity-command'
const props=defineProps<{service:ReturnType<typeof createApi>;locale:Locale;userUid:string;storage?:ActivityStorage}>()
const emit=defineEmits<{back:[];unauthorized:[]}>()
const w=(key:ActivityTextKey)=>activityText(props.locale,key)
type Calendar={business_date:string;lifetime_count:string;total_received:string;cycle_index:string;today_signed:boolean;claim_amount:string;days:{day:number;amount:string;state:'claimed'|'available'|'locked'}[]}
const calendar=ref<Calendar>(),receipt=ref<{business_date:string;amount:string}>()
let disposed=false
async function refresh(){const key=`user:${props.userUid}:checkins.calendar`;const apply=(value:Calendar)=>{if(!disposed)calendar.value=value};if(typeof props.service.requestCached==='function'){const value=await props.service.requestCached<Calendar>(key,'/checkins/calendar',undefined,{},undefined,{},apply);if(!disposed)calendar.value=value;return}calendar.value=undefined;apply(await props.service.request<Calendar>('/checkins/calendar'))}
const controller=useActivityCommand({storage:props.storage,uid:props.userUid,action:'checkin.claim',service:props.service,refresh,result(value){receipt.value={business_date:String(value.business_date),amount:String(value.amount)}},unauthorized:()=>emit('unauthorized')})
const {busy,blocked,notice,draft}=controller
onMounted(()=>controller.load());onUnmounted(()=>{disposed=true;controller.dispose()})
</script>
<template><div class="reference-surface reference-checkin"><header class="fixed top-0 w-full z-50 bg-surface-container-lowest/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] pt-safe"><div class="h-14 px-margin-sm flex items-center justify-between"><div class="flex items-center gap-space-xs"><button  :aria-label="w('back')" class="w-11 h-11 flex items-center justify-center text-on-surface hover:text-primary transition-colors" @click="emit('back')" type="button"><UiIcon class="material-symbols-outlined text-[24px]" name="arrow_back"/></button></div><div class="absolute left-1/2 -translate-x-1/2 flex items-center pointer-events-none"><h1 class="font-headline-sm text-headline-sm text-on-surface tracking-tight truncate max-w-[200px] text-center">{{w('checkin')}}</h1></div></div></header><main class="flex-1 w-full pt-14 pb-safe bg-surface flex flex-col"><div class="flex flex-col w-full px-margin-sm space-y-space-md pb-space-xl"><p v-if="notice==='error'" role="alert">{{w('error')}}</p><button v-if="!busy&&(!calendar||(notice&&notice!=='credited'))" @click="controller.load" type="button">{{w(draft?'checkResult':'retry')}}</button>



<div class="relative overflow-hidden bg-surface-container-lowest rounded-xl shadow-sm p-space-md">
<div class="absolute -right-12 -top-12 w-44 h-44 rounded-full bg-primary-fixed/30 blur-2xl pointer-events-none"></div>
<div class="absolute right-4 top-4 opacity-5 pointer-events-none">
<UiIcon class="material-symbols-outlined text-[108px] text-primary" name="verified_user"/>
</div>

<div class="flex items-center justify-between relative z-10 mb-space-sm">
<div class="flex items-center gap-1 text-secondary">


</div>
</div>

<div class="relative z-10 grid grid-cols-2 gap-space-sm my-space-sm">
<div class="bg-surface-container-low/70 rounded-lg p-2.5">
<span class="block font-body-sm text-body-sm text-tertiary">{{w('total')}}</span>
<div class="flex items-baseline gap-1 mt-0.5">
<span class="font-label-numeric-lg text-label-numeric-lg font-bold text-on-surface" id="rewardDisplay" aria-live="polite">{{calendar?.total_received??'—'}}</span>
<span class="font-label-caps text-label-caps text-tertiary">USDT</span>
</div>
</div>
<div class="bg-surface-container-low/70 rounded-lg p-2.5">
<span class="block font-body-sm text-body-sm text-tertiary">{{w('todayStatus')}}</span>
<div class="flex items-baseline gap-1 mt-0.5">
<span class="font-headline-sm text-headline-sm text-secondary" id="todayStatusText">{{w(calendar?.today_signed?'signed':'unsigned')}}</span>

</div>
</div>
</div>

<div class="relative z-10 mt-space-md">
<button class="w-full h-12 bg-primary hover:bg-primary-container text-on-primary rounded-xl flex items-center justify-center gap-2 shadow-[0_4px_14px_-2px_rgba(0,105,72,0.3)] active:scale-[0.99] transition-all" id="checkInBtn" :disabled="!calendar||calendar.today_signed||busy||blocked||!!draft" @click="controller.submit" type="button" style="background-color: rgb(217, 119, 6); box-shadow: rgba(217, 119, 6, 0.4) 0px 4px 14px -2px;">
<UiIcon class="material-symbols-outlined text-[20px] text-primary-fixed" name="electric_bolt"/>
<span class="font-body-lg text-body-lg font-medium tracking-wide" id="btnLabel">{{calendar?.today_signed?w('signed'):w('check')+' · '+w('receive')+' '+(calendar?.claim_amount??'—')+' USDT'}}</span>
</button>
<div class="flex items-center justify-between mt-2 px-1">
<div class="flex items-center gap-1 text-tertiary font-body-sm text-body-sm">


</div>
<span class="font-body-sm text-body-sm text-tertiary">{{w('restricted')}}</span>
</div>
</div>
</div>



<div class="bg-surface-container-lowest rounded-xl shadow-sm p-space-md">
<div class="flex items-center justify-between mb-space-sm">
<div class="flex items-center gap-1.5">
<UiIcon class="material-symbols-outlined text-primary text-[20px]" name="calendar_month"/>
<h2 class="font-headline-sm text-headline-sm text-on-surface">{{w('calendar')}}</h2>
</div>

</div>

<div class="grid grid-cols-5 gap-2" id="gridContainer"><template v-for="day in calendar?.days??[]" :key="day.day"><template v-if="day.state==='claimed'"><div class="bg-primary/10 rounded-lg p-2 flex flex-col items-center justify-between aspect-square">
<span class="font-label-numeric-sm text-label-numeric-sm text-primary">D{{String(day.day).padStart(2,'0')}}</span>
<UiIcon class="material-symbols-outlined text-[16px] text-primary" name="check_circle"/>
<span class="font-label-numeric-sm text-label-numeric-sm text-primary">+{{cycleRewardInteger(day.amount)}}U</span>
</div></template><template v-else-if="day.state==='available'"><div class="bg-surface-container-lowest shadow-md rounded-lg p-2 flex flex-col items-center justify-between aspect-square transition-all" id="currentDayCard" style="border: 1.5px solid rgb(217, 119, 6); background-color: rgb(255, 251, 235);">
<span class="font-label-caps text-label-caps text-primary font-bold" style="color: rgb(217, 119, 6);">{{w('today')}}</span>
<UiIcon class="material-symbols-outlined text-[18px] text-primary animate-bounce" id="currentDayIcon" style="color: rgb(217, 119, 6);" name="hourglass_top"/>
<span class="font-label-numeric-sm text-label-numeric-sm font-bold text-primary" id="currentDayText" style="color: rgb(217, 119, 6);">+{{cycleRewardInteger(day.amount)}}U</span>
</div></template><template v-else><div class="bg-surface-container-low/60 rounded-lg p-2 flex flex-col items-center justify-between aspect-square">
<span class="font-label-numeric-sm text-label-numeric-sm text-tertiary">D{{String(day.day).padStart(2,'0')}}</span>
<UiIcon class="material-symbols-outlined text-[14px] text-outline-variant" name="lock"/>
<span class="font-label-numeric-sm text-label-numeric-sm text-tertiary">+{{cycleRewardInteger(day.amount)}}U</span>
</div></template></template></div>
</div>



<div class="bg-surface-container-lowest rounded-xl shadow-sm p-space-md space-y-space-sm">
<div class="flex items-center gap-1.5 pb-1">
<UiIcon class="material-symbols-outlined text-primary text-[20px]" name="shield"/>
<h2 class="font-headline-sm text-headline-sm text-on-surface">{{w('rules')}}</h2>
</div>
<div class="space-y-2.5 font-body-sm text-body-sm text-on-surface-variant">
<div class="flex items-start gap-2">

<p class="">{{w('ruleCycle')}}</p>
</div>
<div class="flex items-start gap-2">

<p v-if="w('ruleAmounts')" class="">{{w('ruleAmounts')}}</p>
</div>

<div class="flex items-start gap-2">

<p class="">{{w('ruleFunds')}}</p>
</div>
</div>
</div>

<div class="text-center py-space-sm space-y-1">
<div class="flex items-center justify-center gap-2 text-tertiary">
<span class="font-label-caps text-label-caps tracking-widest text-on-surface font-medium">{{w('brand1')}}</span>
<span class="text-tertiary text-xs">―</span>
<span class="font-label-caps text-label-caps tracking-widest text-on-surface font-medium">{{w('brand2')}}</span>
<span class="text-tertiary text-xs">―</span>
<span class="font-label-caps text-label-caps tracking-widest text-on-surface font-medium">{{w('brand3')}}</span>
</div>

</div>
</div>

</main></div></template>
