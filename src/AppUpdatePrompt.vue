<script setup lang="ts">
import {ref,onMounted,onUnmounted,nextTick} from 'vue'
import type {Locale} from './i18n'
import type {AppRelease} from './update-check'
import {nativeBridge} from './native-session'
const props=defineProps<{release:AppRelease;locale:Locale}>()
const emit=defineEmits<{later:[]}>()
const failed=ref(false),opening=ref(false),dialog=ref<HTMLElement|null>(null)
let previousFocus:HTMLElement|null=null
onMounted(async()=>{previousFocus=document.activeElement as HTMLElement;await nextTick();dialog.value?.querySelector<HTMLButtonElement>('button')?.focus()})
onUnmounted(()=>previousFocus?.focus())
function focusTrap(event:KeyboardEvent){if(event.key!=='Tab')return;const buttons=Array.from(dialog.value?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')||[]);if(!buttons.length){event.preventDefault();return}const first=buttons[0],last=buttons[buttons.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus()}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus()}}
const labels={ 'zh-CN':['发现新版本','下载更新','稍后','无法打开下载页，请稍后重试'],en:['New version available','Download update','Later','Cannot open downloads. Try again later.'],ja:['新しいバージョンがあります','更新をダウンロード','後で','ダウンロードを開けません。後で再試行してください'],ko:['새 버전이 있습니다','업데이트 다운로드','나중에','다운로드 페이지를 열 수 없습니다. 나중에 다시 시도하세요'],fr:['Nouvelle version disponible','Télécharger','Plus tard','Impossible d’ouvrir les téléchargements. Réessayez plus tard.'],de:['Neue Version verfügbar','Herunterladen','Später','Downloadseite nicht verfügbar. Bitte später erneut versuchen.'],'zh-TW':['發現新版本','下載更新','稍後','無法開啟下載頁，請稍後重試']}
async function download(){if(opening.value)return;opening.value=true;failed.value=false;try{const origin=import.meta.env.VITE_API_ORIGIN||'';const url=new URL('/web/download',origin);if(url.protocol!=='https:')throw Error('invalid_url');await nativeBridge.openDownload({url:url.href});emit('later')}catch{failed.value=true}finally{opening.value=false}}
</script>
<template><div ref="dialog" @keydown="focusTrap" class="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4" role="dialog" aria-modal="true" :aria-label="labels[locale][0]" @keydown.esc="emit('later')"><div class="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl"><h2 class="text-lg font-semibold">{{labels[locale][0]}} {{release.version}}</h2><p class="whitespace-pre-wrap break-words my-4">{{release.notes}}</p><p v-if="failed" role="alert">{{labels[locale][3]}}</p><button class="w-full min-h-11 rounded-xl bg-amber-600 text-white p-3" @click="download" :disabled="opening" :aria-busy="opening">{{labels[locale][1]}}</button><button class="w-full min-h-11 p-3" @click="emit('later')">{{labels[locale][2]}}</button></div></div></template>
