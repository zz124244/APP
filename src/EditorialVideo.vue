<script setup lang="ts">
import {ref,watch} from 'vue'
import {contentText} from './editorial-text'
import type {Locale} from './i18n'
import {publicMediaUrl} from './media-url'
const props=defineProps<{src:string;poster?:string;locale:Locale}>()
const emit=defineEmits<{retry:[]}>()
const failed=ref(false)
watch(()=>props.src,()=>failed.value=false)
</script>
<template><div class="w-full h-full relative"><video v-if="!failed" :key="src" :src="src.startsWith('/bundled-media/home-video.')?src:publicMediaUrl(src)" :poster="poster?publicMediaUrl(poster):undefined" controls playsinline webkit-playsinline controlslist="nofullscreen nodownload noremoteplayback" disablepictureinpicture preload="auto" class="w-full h-full object-contain" @error="failed=true"></video><div v-else role="alert" class="p-4"><p>{{contentText(locale,'error')}}</p><button type="button" @click="failed=false;emit('retry')">{{contentText(locale,'retry')}}</button></div></div></template>
