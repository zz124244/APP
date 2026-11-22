<script setup lang="ts">
import {ref,computed,onMounted,onUnmounted} from 'vue'
import UiIcon from './UiIcon.vue'
import type {createApi} from './api'
import type {Locale} from './i18n'
import {taskText} from './task-text'
import {activityText,type ActivityTextKey} from './activity-text'
import {useActivityCommand,type ActivityStorage} from './activity-command'
import {validWheel,sectorPath,rotationForResult,wheelLabelStyle,type WheelItem} from './activity-flow'
const props=defineProps<{service:ReturnType<typeof createApi>;locale:Locale;userUid:string;storage?:ActivityStorage}>()
const emit=defineEmits<{back:[];support:[];unauthorized:[]}>()
const w=(key:ActivityTextKey)=>activityText(props.locale,key)
type State={business_date:string;current_vip_level:number;eligible:boolean;enabled:boolean;available:boolean;draw_limit:number;used:number;remaining:number;wheel:WheelItem[];config_version:string|null}
type Result={id:string;business_date:string;category:'cash'|'mobile'|'thanks';prize_name:string;amount:string|null;wheel:WheelItem[];winning_index:number;remaining:number;status:string;fulfillment_id:string|null}
const state=ref<State>(),result=ref<Result>(),modal=ref(false),animating=ref(false),rotation=ref(0),wheelSize=ref(304)
const tier=computed(()=>{const level=state.value?.current_vip_level??0;return level>0&&level<=5?taskText(props.locale,(['silver','gold','platinum','diamond','king'] as const)[level-1]!):''})
const wheel=computed(()=>result.value?.wheel??state.value?.wheel??[]),discSize=computed(()=>280*wheelSize.value/304)
let disposed=false,timer:ReturnType<typeof setTimeout>|undefined
function resize(){if(typeof window!=='undefined')wheelSize.value=Math.min(304,Math.max(180,window.innerWidth-76))}
async function refresh(){const key=`user:${props.userUid}:lottery`;const apply=(value:State)=>{if(!Array.isArray(value.wheel)||value.wheel.length>0&&!validWheel(value.wheel))throw Error('invalid_wheel');if(!disposed)state.value=value};if(typeof props.service.requestCached==='function'){const value=await props.service.requestCached<State>(key,'/lottery',undefined,{},undefined,{},apply);apply(value);return}state.value=undefined;apply(await props.service.request<State>('/lottery'))}
function display(value:Record<string,unknown>,fromSubmit:boolean){result.value=value as unknown as Result;rotation.value=rotationForResult(rotation.value,result.value.wheel.length,result.value.winning_index);const reduce=typeof window!=='undefined'&&typeof window.matchMedia==='function'&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;clearTimeout(timer);animating.value=fromSubmit&&!reduce;modal.value=!animating.value;if(animating.value)timer=setTimeout(()=>{if(!disposed){animating.value=false;modal.value=true}},4500)}
const controller=useActivityCommand({storage:props.storage,uid:props.userUid,action:'lottery.draw',service:props.service,refresh,result:display,unauthorized:()=>emit('unauthorized'),retainUntilClosed:true})
const {busy,blocked,notice,draft}=controller
const canDraw=computed(()=>!!state.value&&state.value.eligible&&state.value.enabled&&state.value.available&&Number(state.value.remaining)>0&&!busy.value&&!blocked.value&&!draft.value&&!result.value&&!animating.value)
function close(){if(controller.close()){modal.value=false;result.value=undefined;rotation.value=0}}
onMounted(()=>{resize();if(typeof window!=='undefined')window.addEventListener('resize',resize);void controller.load()});onUnmounted(()=>{disposed=true;controller.dispose();clearTimeout(timer);if(typeof window!=='undefined')window.removeEventListener('resize',resize)})
</script>
<template><div class="reference-surface reference-lottery"><header class="fixed top-0 w-full z-50 pt-safe bg-surface-container-lowest/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]"><div class="h-14 px-margin-sm flex items-center justify-between relative"><button :aria-label="w('back')" class="w-11 h-11 -ml-space-xs flex items-center justify-center text-on-surface hover:text-primary transition-colors" @click="emit('back')" type="button"><UiIcon class="material-symbols-outlined text-[24px]" name="arrow_back"/></button><div class="absolute left-1/2 -translate-x-1/2 flex items-center justify-center pointer-events-none max-w-[50%]"><h1 class="font-headline-sm text-headline-sm text-on-surface truncate">{{w('lottery')}}</h1></div></div></header><main class="flex-1 flex flex-col relative w-full pt-14 pb-safe bg-surface-container-lowest"><div class="flex flex-col w-full pb-10">
<div class="px-margin-sm space-y-4 pt-3"><p v-if="notice" role="alert">{{w(notice)}}</p><p v-if="state&&state.current_vip_level<=0" role="status">{{w('vipRequired')}}</p><p v-if="state&&!state.available&&!result" role="status">{{w('unavailable')}}</p><button v-if="!busy&&(!state||notice||draft&&!result)" @click="controller.load" type="button">{{w(draft?'checkResult':'retry')}}</button>

<div class="bg-surface-container-lowest rounded-xl shadow-sm p-4 relative overflow-hidden border border-surface-container-high/40"><div class="flex items-center justify-between relative z-10"><div class="flex items-center gap-3"><div class="w-11 h-11 rounded-xl bg-gradient-to-br from-secondary/15 via-secondary/5 to-transparent flex items-center justify-center border border-secondary/20 shadow-sm"><UiIcon class="material-symbols-outlined text-[24px] text-secondary" name="workspace_premium"/></div><div class="flex flex-col"><span class="font-body-sm text-body-sm text-tertiary">{{w('vip')}}</span><div class="flex items-center gap-1.5 mt-0.5"><span class="font-headline-sm text-[16px] font-bold text-on-surface tracking-tight">VIP <span class="font-label-numeric-lg text-secondary">{{state?.current_vip_level??'—'}} {{tier}}</span></span></div></div></div><div class="h-8 w-px bg-surface-container-high/60"></div><div class="text-right flex flex-col items-end"><span class="font-body-sm text-body-sm text-tertiary block">{{w('remaining')}}</span><div class="flex items-center justify-end gap-1.5 mt-0.5"><span class="w-2 h-2 rounded-full bg-primary animate-ping"></span><span class="font-label-numeric-lg text-label-numeric-lg text-primary font-bold" id="free-chances">{{state?.remaining??'—'}}</span><span class="font-body-sm text-body-sm text-on-surface">{{w('times')}}</span></div></div></div><div class="absolute -right-6 -bottom-6 w-28 h-28 rounded-full bg-gradient-to-br from-primary/10 to-transparent pointer-events-none blur-xl"></div><div class="absolute -left-6 -top-6 w-24 h-24 rounded-full bg-gradient-to-br from-secondary/10 to-transparent pointer-events-none blur-xl"></div></div>

<div class="w-full mb-2 rounded-lg bg-amber-50/70 px-3 py-2 text-[12px] leading-5 text-amber-800" role="note"><div>抽奖详情</div><div>VIP1每日免费抽奖1次</div><div>VIP2每日免费抽奖3次</div><div>VIP3每日免费抽奖4次</div><div>VIP4每日免费抽奖5次</div><div>VIP5每日免费抽奖6次</div></div>

<div class="bg-surface-container-lowest rounded-2xl shadow-sm p-5 flex flex-col items-center relative overflow-hidden border border-surface-container-high/40">

<div class="absolute w-72 h-72 rounded-full bg-primary/5 blur-3xl pointer-events-none"></div>

<div class="relative w-[304px] h-[304px] my-3 flex items-center justify-center" :style="{width:wheelSize+'px',height:wheelSize+'px'}">

<div class="absolute inset-0 rounded-full p-[9px] shadow-lg flex items-center justify-center" style="background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 35%, #d97706 70%, #b45309 100%);">

<div class="w-full h-full rounded-full border-2 border-amber-200/50 shadow-inner relative flex items-center justify-center bg-amber-50/20">

<span class="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-white shadow-[0_0_5px_#fff]"></span>
<span class="absolute top-[32px] right-[32px] w-2 h-2 rounded-full bg-amber-200 shadow-[0_0_4px_#fbbf24]"></span>
<span class="absolute top-1/2 -right-1 -translate-y-1/2 w-2 h-2 rounded-full bg-white shadow-[0_0_5px_#fff]"></span>
<span class="absolute bottom-[32px] right-[32px] w-2 h-2 rounded-full bg-emerald-300 shadow-[0_0_4px_#34d399]"></span>
<span class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-white shadow-[0_0_5px_#fff]"></span>
<span class="absolute bottom-[32px] left-[32px] w-2 h-2 rounded-full bg-amber-200 shadow-[0_0_4px_#fbbf24]"></span>
<span class="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 rounded-full bg-white shadow-[0_0_5px_#fff]"></span>
<span class="absolute top-[32px] left-[32px] w-2 h-2 rounded-full bg-emerald-300 shadow-[0_0_4px_#34d399]"></span>
</div>
</div>

<div class="absolute w-[280px] h-[280px] rounded-full overflow-hidden shadow-inner transition-transform duration-[4500ms] cubic-bezier(0.15,0.9,0.25,1) will-change-transform z-10" id="wheel" :style="{width:discSize+'px',height:discSize+'px',transition:animating?'transform 4.5s cubic-bezier(0.15, 0.9, 0.25, 1)':'none',transform:'rotate('+rotation+'deg)'}"><svg class="w-full h-full block" viewBox="0 0 280 280"><defs><linearGradient id="slice-gold" x1="0%" x2="100%" y1="0%" y2="100%"><stop offset="0%" stop-color="#fffbeb"/><stop offset="100%" stop-color="#fef3c7"/></linearGradient></defs><path v-for="(item,index) in wheel" :key="item.id" :d="sectorPath(index,wheel.length)" :fill="item.kind==='mobile'?'url(#slice-gold)':index%2?'#FFFFFF':'#FFF8ED'" :stroke="item.kind==='mobile'?'#fbbf24':'#e2e8f0'" :stroke-width="item.kind==='mobile'?1:0.8"/></svg><div v-for="(item,index) in wheel" :key="item.id" class="absolute inset-0 flex flex-col items-center pointer-events-none origin-center" :style="{transform:'rotate('+((index+.5)*360/wheel.length)+'deg)'}"><div :class="wheelLabelStyle(wheel,index).padding" class="flex flex-col items-center text-center"><span :class="wheelLabelStyle(wheel,index).text" class="max-w-[82px] break-words" :style="{fontSize:wheelLabelStyle(wheel,index).fontSize+'px'}">{{item.kind==='thanks'?w('none'):item.label}}</span></div></div></div>

<div class="absolute -top-1.5 left-1/2 -translate-x-1/2 z-30 pointer-events-none flex flex-col items-center filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)]">
<div class="w-4 h-4 rounded-full bg-primary border-2 border-white shadow-sm -mb-2 z-10"></div>
<div class="w-0 h-0 border-x-[9px] border-x-transparent border-t-[18px] border-t-primary"></div>
</div>

<button :aria-label="w('draw')" class="absolute z-20 w-20 h-20 rounded-full flex flex-col items-center justify-center text-center shadow-[0_4px_16px_rgba(180,83,9,0.35)] active:scale-95 transition-transform cursor-pointer p-[3px] focus:outline-none" id="spin-btn" :disabled="!canDraw" @click="controller.submit" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%);" type="button">
<div class="w-full h-full rounded-full border border-white/35 flex flex-col items-center justify-center p-1 bg-gradient-to-b from-amber-500 to-amber-600 shadow-inner">
<UiIcon class="material-symbols-outlined text-[18px] text-white -mb-0.5" name="play_arrow"/>
<span class="font-headline-sm text-[12px] font-bold text-white leading-tight">{{w(animating?'processing':'draw')}}</span>
<span class="font-label-numeric-sm text-[8.5px] text-amber-100 mt-0.5 font-medium" id="spin-cost-badge">{{state&&state.current_vip_level<=0?'VIP':(state?.remaining??'—')+' '+w('times')}}</span>
</div>
</button>
</div>
</div>
</div>
<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/40 backdrop-blur-sm transition-opacity duration-300" id="prize-modal" v-if="modal&&result" role="dialog" aria-modal="true" :aria-label="w('result')" @keydown.esc="close">
<div class="bg-surface-container-lowest rounded-2xl shadow-xl p-6 max-w-sm w-full flex flex-col items-center text-center transform transition-transform duration-300 relative scale-100">
<div class="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-3">
<UiIcon class="material-symbols-outlined text-[36px] text-primary" style="font-variation-settings: &quot;FILL&quot; 1;" name="celebration"/>
</div>
<span class="font-headline-sm text-headline-sm text-on-surface font-bold">{{w('result')}}</span>
<span class="font-headline-lg-mobile text-headline-lg-mobile text-primary font-bold my-2" id="modal-prize-name" style="overflow-wrap:anywhere;max-width:100%">{{result!.category==='thanks'?w('none'):result!.prize_name}}</span>
<p class="font-body-sm text-body-sm text-tertiary mb-6" id="modal-prize-desc">{{w(result!.category==='cash'?'cashResult':result!.category==='mobile'?'phoneResult':'none')}} · {{w('businessDate')}} {{result!.business_date}}</p>
<div class="w-full flex gap-3"><button v-if="result!.category==='mobile'" @click="emit('support')" type="button" class="flex-1 py-2.5 rounded-lg bg-primary text-on-primary font-body-md text-body-md">{{w('support')}}</button>
<button class="flex-1 py-2.5 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-body-md text-body-md font-medium transition-colors cursor-pointer" @click="close" type="button">{{w('close')}}</button>
</div>
</div>
</div>

<div class="fixed bottom-12 left-1/2 -translate-x-1/2 z-50 bg-inverse-surface text-inverse-on-surface px-4 py-2 rounded-full font-body-sm text-body-sm shadow-lg transition-opacity duration-200 opacity-0 pointer-events-none" id="toast" v-if="false"></div>
</div>
</main></div></template>
