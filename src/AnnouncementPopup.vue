<script setup lang="ts">
import {ref,onMounted,onUnmounted,nextTick} from 'vue'
import type {Locale} from './i18n'
import type {Announcement} from './announcement-flow'
const props=defineProps<{announcement:Announcement;locale:Locale}>()
const emit=defineEmits<{close:[]}>()
const dialog=ref<HTMLElement|null>(null)
let previousFocus:HTMLElement|null=null
onMounted(async()=>{previousFocus=document.activeElement as HTMLElement;await nextTick();dialog.value?.querySelector<HTMLButtonElement>('button')?.focus()})
onUnmounted(()=>previousFocus?.focus())
function focusTrap(event:KeyboardEvent){if(event.key!=='Tab')return;const buttons=Array.from(dialog.value?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')||[]);if(!buttons.length){event.preventDefault();return}const first=buttons[0],last=buttons[buttons.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus()}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus()}}
const labels={ 'zh-CN':['公告','我知道了'],en:['Announcement','Got it'],ja:['お知らせ','確認しました'],ko:['공지사항','확인했습니다'],fr:['Annonce','J’ai compris'],de:['Mitteilung','Verstanden'],'zh-TW':['公告','我知道了']}
</script>
<template><div ref="dialog" @keydown="focusTrap" class="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4" role="dialog" aria-modal="true" :aria-label="labels[locale][0]" @keydown.esc="emit('close')"><div class="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl max-h-[80vh] overflow-y-auto"><h2 class="text-lg font-semibold break-words">{{props.announcement.title}}</h2><p class="whitespace-pre-wrap break-words my-4 text-sm leading-relaxed">{{props.announcement.body}}</p><button class="w-full min-h-11 rounded-xl bg-amber-600 text-white p-3" @click="emit('close')">{{labels[locale][1]}}</button></div></div></template>
