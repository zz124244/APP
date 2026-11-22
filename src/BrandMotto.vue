<script setup lang="ts">
import {sourceText} from './source-text'
import type {Locale} from './i18n'
defineProps<{locale:Locale}>()
</script>

<template>
<div class="inline-flex items-center justify-center space-x-2 text-primary font-display text-body-md tracking-wider">
<span class="">{{sourceText(locale,'longTerm')}}</span>
<span class="text-tertiary-container/40">·</span>
<span class="">{{sourceText(locale,'focus')}}</span>
<span class="text-tertiary-container/40">·</span>
<span class="">{{sourceText(locale,'altruism')}}</span>
</div>
</template>
