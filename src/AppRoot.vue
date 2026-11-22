<script setup lang="ts">
import {ref} from 'vue'
import App from './App.vue'
import StartupSlideshow from './StartupSlideshow.vue'
const entering=ref(true)
</script>
<template>
  <StartupSlideshow v-if="entering" @enter="entering=false" />
  <div v-else class="app-stage">
    <div class="app-background" aria-hidden="true"></div>
    <div class="app-scroll-layer"><App /></div>
  </div>
</template>
