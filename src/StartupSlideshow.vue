<script setup lang="ts">
import {ref,onMounted,onUnmounted} from 'vue'
const emit=defineEmits<{enter:[]}>()
const slides=[1,2,3,4,5].map(number=>'/startup/slide-'+number+'.png')
const descriptions=['九合创投品牌介绍','长期投资','专注投资','利他理念','九合创投品牌愿景']
const current=ref(0)
let timer:ReturnType<typeof setInterval>|undefined
let startX=0,startY=0,touching=false,entered=false
function stop(){clearInterval(timer);timer=undefined}
function start(){stop();if(!entered&&!document.hidden)timer=setInterval(()=>current.value=(current.value+1)%slides.length,3000)}
function select(index:number){current.value=(index+slides.length)%slides.length;start()}
function enter(){if(entered)return;entered=true;stop();emit('enter')}
function visibility(){if(document.hidden)stop();else start()}
function touchStart(event:TouchEvent){const touch=event.touches[0];if(!touch)return;startX=touch.clientX;startY=touch.clientY;touching=true;stop()}
function touchEnd(event:TouchEvent){if(!touching)return;touching=false;const touch=event.changedTouches[0];if(touch){const dx=touch.clientX-startX,dy=touch.clientY-startY;if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy)){select(current.value+(dx<0?1:-1));return}}start()}
onMounted(()=>{start();document.addEventListener('visibilitychange',visibility)})
onUnmounted(()=>{stop();document.removeEventListener('visibilitychange',visibility)})
</script>

<template>
  <section class="startup-screen" aria-label="启动幻灯片" @keydown.left.prevent="select(current-1)" @keydown.right.prevent="select(current+1)">
    <div class="startup-art" @touchstart.passive="touchStart" @touchend.passive="touchEnd" @touchcancel="touching=false;start()">
      <img :src="slides[current]" :alt="descriptions[current]" class="startup-image" width="720" height="1280" fetchpriority="high" draggable="false" />
      <button type="button" class="startup-enter" aria-label="立即体验，进入APP" @click="enter"><span class="startup-accessible">立即体验</span></button>
    </div>
    <nav class="startup-dots" aria-label="选择启动图片">
      <button v-for="(_,index) in slides" :key="index" type="button" :aria-label="'第'+(index+1)+'张，共5张'" :aria-current="current===index?'step':undefined" @click="select(index)"><span :class="{active:current===index}" /></button>
    </nav>
  </section>
</template>

<style scoped>
.startup-screen{position:fixed;inset:0;z-index:1000;display:flex;align-items:center;justify-content:center;background:#050605;overflow:hidden;height:100%;height:100dvh;touch-action:pan-y}
.startup-art{position:relative;height:100%;width:100%;max-width:56.25vh;max-width:56.25dvh;max-height:177.78vw;flex-shrink:0}
.startup-image{display:block;width:100%;height:100%;object-fit:contain}
.startup-enter{position:absolute;left:20%;width:60%;top:83%;height:13%;background:transparent;border:0;cursor:pointer;border-radius:8px}
.startup-enter:focus-visible{outline:2px solid #ffe7a9;outline-offset:2px}
.startup-accessible{position:absolute;width:1px;height:1px;padding:0;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap}
.startup-skip{position:absolute;right:16px;top:16px;top:calc(16px + env(safe-area-inset-top));min-width:58px;min-height:44px;border:1px solid #c3b38b;border-radius:24px;background:rgba(0,0,0,.65);color:#fff2d1;font-size:14px;padding:8px 15px;cursor:pointer}
.startup-dots{position:absolute;bottom:8px;bottom:calc(8px + env(safe-area-inset-bottom));display:flex;align-items:center;justify-content:center;gap:0}
.startup-dots button{width:36px;height:44px;border:0;padding:0;background:transparent;display:flex;align-items:center;justify-content:center;cursor:pointer}
.startup-dots span{display:block;width:7px;height:7px;border-radius:50%;background:#82785e;border:1px solid #d8c79e}
.startup-dots span.active{width:20px;border-radius:5px;background:#fff0be}
</style>
