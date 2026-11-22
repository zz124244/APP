<script setup lang="ts">
import UiIcon from './UiIcon.vue'
import {languages,translate,type Locale} from './i18n'
defineProps<{locale:Locale}>()
const emit=defineEmits<{change:[locale:Locale]}>()
const captions:Record<Locale,string>={'zh-CN':'CN/ EN',en:'EN',ja:'JP',ko:'KR',fr:'FR',de:'DE','zh-TW':'繁體'}
</script>
<template><label class="reference-language"><UiIcon name="language" :size="16"/><span>{{captions[locale]}}</span><select :value="locale" :aria-label="translate(locale,'language')" @change="emit('change',($event.target as HTMLSelectElement).value as Locale)"><option v-for="[value,label] in languages" :key="value" :value="value">{{label}}</option></select></label></template>
<style scoped>
.reference-language{position:relative;display:inline-flex;align-items:center;gap:4px;padding:4px 10px;border-radius:9999px;border:1px solid #e2e8f0cc;background:#ffffffe6;box-shadow:0 1px 2px #0000000d;color:#64748b;min-height:26px;flex-shrink:0;font:500 12px/16px Inter,system-ui,sans-serif;letter-spacing:.01em}.reference-language span{color:#334155}.reference-language select{position:absolute;top:-9px;right:0;bottom:-9px;left:0;width:100%;height:calc(100% + 18px);opacity:0;cursor:pointer}.reference-language:focus-within{outline:2px solid #059669;outline-offset:3px}.reference-language::after{content:'';position:absolute;left:0;right:0;top:-9px;bottom:-9px;pointer-events:none}
</style>
