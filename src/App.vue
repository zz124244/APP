<script setup lang="ts">
import {defineAsyncComponent} from 'vue'
const ContentHubPage=defineAsyncComponent(()=>import('./ContentHubPage.vue'))
import UiIcon from './UiIcon.vue'
import {sourceText} from './source-text'
import LanguagePicker from './LanguagePicker.vue'
import DepositPage from './DepositPage.vue'
import SupportPage from './SupportPage.vue'
import WalletPage from './WalletPage.vue'
import WithdrawalAddressPage from './WithdrawalAddressPage.vue'
import ProductPage from './ProductPage.vue'
import OrdersPage from './OrdersPage.vue'
import RolloverPage from './RolloverPage.vue'
import WithdrawalPage from './WithdrawalPage.vue'
import IdentityPage from './IdentityPage.vue'
import TransferPage from './TransferPage.vue'
import EntriesPage from './EntriesPage.vue'
import TeamPage from './TeamPage.vue'
import TaskPage from './TaskPage.vue'
import CheckinPage from './CheckinPage.vue'
import LotteryPage from './LotteryPage.vue'
import MallPage from './MallPage.vue'
import AddressPage from './AddressPage.vue'
import ContentDocumentPage from './ContentDocumentPage.vue'
import InvitationPage from './InvitationPage.vue'
import PasswordPage from './PasswordPage.vue'
import RecoveryPage from './RecoveryPage.vue'
import RegistrationPage from './RegistrationPage.vue'
import ForcedPasswordPage from './ForcedPasswordPage.vue'
import {credentialText,type CredentialTextKey} from './credential-text'
import {profileText} from './profile-text'
import { depositText } from './deposit-i18n'
import { computed, ref, watch, onUnmounted, onMounted } from 'vue'
import { createApi, ApiError } from './api'
import { languages, translate, type Locale, type TranslationKey } from './i18n'
import {isNative,nativeStore,nativeBridge,installationNonce} from './native-session'
import {createSessionState} from './session-state'
import {createUpdateCheck,type AppRelease} from './update-check'
import AppUpdatePrompt from './AppUpdatePrompt.vue'
import AnnouncementPopup from './AnnouncementPopup.vue'
import {shouldShowAnnouncement,type Announcement} from './announcement-flow'
import {nativeApiOrigin} from './native-config'
import {createSessionResume} from './session-resume'
import {sessionText} from './session-text'
import {startPreload,type PreloadRun} from './preload'
const updateRelease=ref<AppRelease|null>(null)
const service = createApi(undefined,undefined,isNative?'bearer':'browser')
const SESSION_HEARTBEAT_MS = 10000
const updater=createUpdateCheck(async()=>{const info=await nativeBridge.info();return service.request('/app/releases/latest?platform='+info.platform+'&build='+info.build)},r=>{updateRelease.value=r})
function dismissUpdate(){if(updateRelease.value)updater.dismiss(updateRelease.value.build);updateRelease.value=null}
const announcement=ref<Announcement|null>(null)
async function loadAnnouncement(uid:string){
 if(!uid)return
 try{const apply=(result:Announcement)=>{if(!signedIn.value||currentUid.value!==uid)return;announcement.value=shouldShowAnnouncement(result)?result:null};const result=typeof service.requestCached==='function'?await service.requestCached<Announcement>(`user:${uid}:announcement`,'/announcement',undefined,{},undefined,{},apply):await service.request<Announcement>('/announcement');apply(result)}catch{/* 公告失败不影响登录与其它业务 */}
}
function dismissAnnouncement(){announcement.value=null}
const savedSession=createSessionState(nativeStore,value=>service.setToken(value))
const persistenceWarning=ref(false),clearWarning=ref(false),restoring=ref(false)
const sessionCovered=ref(false),resumeFailed=ref(false)
const resume=createSessionResume(async()=>{const expectedUid=currentUid.value;const me=await service.request<{uid:string;phone?:string;vip_level?:number}>('/auth/me');if(me.uid!==expectedUid)throw new ApiError('session_expired',401)},value=>sessionCovered.value=value,value=>resumeFailed.value=value,error=>{if(error instanceof ApiError&&[401,403].includes(error.status))leaveSession()})
function onVisibility(){if(!signedIn.value)return;if(document.visibilityState==='hidden')resume.hide();else void resume.resume()}
const passwordTarget=ref<'login'|'pay'>('login')
function recoveryPaymentSetup(){if(signedIn.value&&recoveryKind.value==='payment'){showRecovery.value=false;passwordTarget.value='pay';page.value='password'}}
const restricted=ref(false),showRecovery=ref(false),recoveryKind=ref<'login'|'payment'>('login')
function openRecovery(kind:'login'|'payment'){recoveryKind.value=kind;showRecovery.value=true}
const loginNotice=ref(''),credentialLoginNotice=ref<CredentialTextKey|null>(null)
function passwordChanged(uncertain:boolean){leaveSession();password.value='';visible.value=false;credentialLoginNotice.value=uncertain?'loginUnknown':'loginSuccess'}
const page=ref<'home'|'community'|'updates'|'news'|'wallet'|'deposit'|'history'|'support'|'products'|'orders'|'rollover'|'withdraw'|'withdrawalHistory'|'identity'|'transfer'|'ledger'|'team'|'invite'|'password'|'withdrawalAddress'|'tasks'|'checkin'|'lottery'|'mall'|'address'|'terms'|'compliance'>('home'), currentUid=ref(''),supportBack=ref<'home'|'wallet'|'deposit'|'password'|'lottery'|'mall'>('wallet')
const entryBack=ref<'home'|'wallet'>('wallet')
const orderNo=ref(''),contentBack=ref<'home'|'wallet'|'terms'>('home')
function navigate(target:string){if(page.value==='home'||page.value==='wallet')entryBack.value=page.value;if(target==='compliance')contentBack.value=page.value==='terms'?'terms':page.value==='home'?'home':'wallet';if(['home','community','updates','news','wallet'].includes(target)){page.value=target as typeof page.value;if(target==='wallet')void loadWalletFromCache();return}if(target==='password')passwordTarget.value='login';if(target==='checkin'||target==='lottery'||target==='tasks'||target==='team'||target==='invite'||target==='password'||target==='mall'||target==='address'||target==='terms'||target==='compliance'){page.value=target;return}if(target==='ledger'){page.value='ledger';return}if(target==='transfer'){page.value='transfer';return}if(target==='identity'){page.value='identity';return}if(target==='withdraw'||target==='withdrawalHistory')page.value=target;else if(target==='withdrawalAddress')page.value='withdrawalAddress';else if(target==='deposit')page.value='deposit';else if(target==='deposits')page.value='history';else if(target==='support')openSupport(page.value==='home'?'home':'wallet');else if(target==='rollover')page.value='rollover';else if(target==='invest')page.value='products';else if(target==='orders'){orderNo.value='';page.value='orders'}}
function openSupport(from:'home'|'wallet'|'deposit'|'password'|'lottery'|'mall'){supportBack.value=from;page.value='support'}
function clearPhone(){if(busy.value)return;phone.value='';errorKey.value=null}
function leaveSession(){const previousUid=currentUid.value;if(typeof preloadRun?.cancel==='function')preloadRun.cancel();preloadRun=undefined;if(previousUid)service.invalidateCachedPrefix?.(`user:${previousUid}:`);resume.cancel();if(isNative)void savedSession.clear().catch(()=>clearWarning.value=true);restricted.value=false;showRecovery.value=false;service.setToken(null);signedIn.value=false;wallet.value=null;page.value='wallet';currentUid.value=''}
function backToWallet(){page.value=entryBack.value;if(page.value==='wallet')void loadWalletFromCache()}
const phone = ref(''), password = ref(''), visible = ref(false), busy = ref(false)
const registeredPhone = ref(''), vipLevel = ref(0), locale = ref<Locale>('zh-CN'), errorKey = ref<TranslationKey | null>(null), signedIn = ref(false), registering = ref(false)
type Wallet = { available: string; withdrawable: string; invested: string; frozen: string; total_assets: string; points: string;recharge_total:string;withdrawal_net_total:string;investment_historical_total:string;investment_outstanding_total:string }
const wallet = ref<Wallet | null>(null)
let preloadRun:PreloadRun|undefined
const retrySeconds = ref(0)
let retryTimer: ReturnType<typeof setInterval> | undefined
let heartbeat: ReturnType<typeof setInterval> | undefined
onUnmounted(() => clearInterval(retryTimer))
try { phone.value = localStorage.getItem('last_phone') || ''; const saved = localStorage.getItem('locale'); if (languages.some(([value]) => value === saved)) locale.value = saved as Locale } catch { /* Storage may be unavailable in restricted WebViews. */ }
const t = (key: TranslationKey) => translate(locale.value, key)
watch(locale, value => { document.documentElement.lang = value; try { localStorage.setItem('locale', value) } catch {} }, { immediate: true })
const error = computed(() => errorKey.value ? t(errorKey.value) : '')
function showError(problem: unknown) {
  if (problem instanceof ApiError && problem.status === 429) {
    errorKey.value = 'throttled'; retrySeconds.value = problem.retryAfter
    clearInterval(retryTimer)
    retryTimer = setInterval(() => { retrySeconds.value = Math.max(0, retrySeconds.value - 1); if (retrySeconds.value === 0) clearInterval(retryTimer) }, 1000)
    return
  }
  if (problem instanceof ApiError && problem.status === 401) { leaveSession() }
  errorKey.value = problem instanceof ApiError && problem.message === 'invalid_credentials' ? 'invalid' : problem instanceof ApiError && problem.status === 403 ? 'unavailable' : problem instanceof ApiError && problem.status === 422 ? 'validation' : problem instanceof ApiError && problem.status === 401 ? 'session' : 'network'
}
async function loadWallet() {
  const me=await service.request<{uid:string;phone?:string;vip_level?:number}>('/auth/me', undefined, {}, undefined, {retries: 1}); currentUid.value=me.uid; registeredPhone.value=me.phone||''; vipLevel.value=Number(me.vip_level||0)
  wallet.value = await service.request<Wallet>('/wallet/summary', undefined, {}, undefined, {retries: 1})
  service.setCached?.(`user:${currentUid.value}:wallet.summary`, wallet.value)
}
function walletCacheKey(uid = currentUid.value){return uid?`user:${uid}:wallet.summary`:''}
async function loadWalletFromCache(){
  const uid=currentUid.value;if(!uid)return
  const key=walletCacheKey(uid),apply=(value:Wallet)=>{if(signedIn.value&&currentUid.value===uid)wallet.value=value}
  try{
    if(typeof service.requestCached==='function'){const value=await service.requestCached<Wallet>(key,'/wallet/summary',undefined,{},undefined,{retries:1},apply);apply(value)}
    else apply(await service.request<Wallet>('/wallet/summary',undefined,{},undefined,{retries:1}))
  }catch(problem){if(signedIn.value&&currentUid.value===uid)throw problem}
}
// 登录成功后的余额/资料加载失败，不应把用户挡在登录页：后台自动补一次
async function loadWalletQuietly() {
  try { await loadWallet() } catch { wallet.value = null; setTimeout(() => { if (signedIn.value) void loadWalletQuietly() }, 2000) }
}
async function login() {
  if (busy.value || retrySeconds.value > 0) return
  const submittedPhone = phone.value, submittedPassword = password.value
  errorKey.value = null
  if (!/^1[3-9][0-9]{9}$/.test(phone.value) || !/^[!-~]{8,16}$/.test(password.value)) { errorKey.value = 'validation'; return }
  resume.cancel();busy.value = true
  try {
    if(isNative)nativeApiOrigin(import.meta.env.VITE_API_ORIGIN,import.meta.env.VITE_ALLOW_USB_HTTP==='true')
    const installation = await installationNonce()
    service.setInstallation(installation)
    const result = await service.request<{access_token?:string;session_scope:string;expires_at:string;user?:{uid:string;phone?:string;vip_level?:number};wallet?:Wallet}>('/auth/login', { phone: '+86' + submittedPhone, password: submittedPassword, installation_nonce: installation }, {}, undefined, {retries: 1, timeoutMs: 25000})
    service.setToken(result.access_token??null); page.value='home';currentUid.value=''; password.value = ''; visible.value = false
    try { localStorage.setItem('last_phone', submittedPhone) } catch {}
    if(result.session_scope==='login_reset'){if(isNative){await savedSession.clear();service.setToken(result.access_token??null)}restricted.value=true;signedIn.value=false;wallet.value=null;return}
    if(isNative){try{await savedSession.save(result);persistenceWarning.value=false}catch{persistenceWarning.value=true}}
    restricted.value=false
    if (result.user) { currentUid.value = result.user.uid; registeredPhone.value = result.user.phone || ''; vipLevel.value = Number(result.user.vip_level || 0); service.setCached?.(`user:${result.user.uid}:me`,result.user) }
    signedIn.value = true
    if (result.wallet) { wallet.value = result.wallet; if(currentUid.value)service.setCached(`user:${currentUid.value}:wallet.summary`,result.wallet) } else { await loadWalletQuietly() }
  } catch (problem) { showError(problem) } finally { busy.value = false }
}
async function reload() { if (busy.value) return; busy.value = true; errorKey.value = null; try { service.invalidateCached?.(walletCacheKey()); await loadWalletFromCache() } catch (problem) { showError(problem) } finally { busy.value = false } }
async function logout() {
  if (busy.value) return
  busy.value = true; errorKey.value = null
  try { await service.request('/auth/logout', {}); leaveSession() } catch (problem) { showError(problem) } finally { busy.value = false }
}
async function restoreSession(){
 if(restoring.value)return;restoring.value=true;busy.value=true;errorKey.value=null
 try{
  if(isNative)nativeApiOrigin(import.meta.env.VITE_API_ORIGIN,import.meta.env.VITE_ALLOW_USB_HTTP==='true')
  const verify=async()=>{const me=await service.request<{uid:string;phone?:string;vip_level?:number;scope?:string}>('/auth/me');if(me.scope==='login_reset'){service.setToken(null);return null}return me}
  const me=isNative?await savedSession.restore(verify):await verify()
  if(me){currentUid.value=me.uid;registeredPhone.value=me.phone||'';vipLevel.value=Number(me.vip_level||0);service.setCached?.(`user:${me.uid}:me`,me);wallet.value=await service.request<Wallet>('/wallet/summary');service.setCached?.(`user:${me.uid}:wallet.summary`,wallet.value);signedIn.value=true;page.value=new URLSearchParams(location.search).get('preview')==='orders'?'orders':'home'}
 }catch(e){if(e instanceof ApiError&&[401,403].includes(e.status)){leaveSession()}else{errorKey.value='network'}}finally{restoring.value=false;busy.value=false}
}
let heartbeatBusy=false
async function verifySession(){if(!signedIn.value||heartbeatBusy)return;heartbeatBusy=true;try{const me=await service.request<{uid:string}>('/auth/me');if(me.uid!==currentUid.value)leaveSession()}catch(problem){if(problem instanceof ApiError&&[401,403].includes(problem.status))leaveSession()}finally{heartbeatBusy=false}}
onMounted(async()=>{try{service.setInstallation(await installationNonce())}catch{/* 拿不到安装标识时按旧逻辑放行 */}void restoreSession();document.addEventListener('visibilitychange',onVisibility);heartbeat=setInterval(()=>{if(document.visibilityState!=='hidden')void verifySession()},SESSION_HEARTBEAT_MS)})
onUnmounted(()=>{document.removeEventListener('visibilitychange',onVisibility);resume.cancel();clearInterval(heartbeat)})
watch([page,busy,signedIn],()=>{updater.cancel();updateRelease.value=null;if(isNative&&signedIn.value)void updater.check(page.value,busy.value)})
watch(signedIn,value=>{if(value&&currentUid.value)void loadAnnouncement(currentUid.value);else announcement.value=null})
watch([signedIn,currentUid],([active,uid])=>{if(active&&uid){if(typeof preloadRun?.cancel==='function')preloadRun.cancel();preloadRun=startPreload(service,uid)}else{if(typeof preloadRun?.cancel==='function')preloadRun.cancel();preloadRun=undefined}})
</script>
<template>
  <div v-if="sessionCovered" class="fixed inset-0 z-[200] bg-white flex flex-col items-center justify-center p-6 text-center" role="status"><p>{{sessionText(locale,resumeFailed?3:2)}}</p><button v-if="resumeFailed" class="min-h-11 p-3" @click="resume.resume()">{{sessionText(locale,4)}}</button></div>
  <div :style="sessionCovered?{visibility:'hidden',pointerEvents:'none'}:undefined">
  <AnnouncementPopup v-if="announcement&&signedIn&&!restricted" :announcement="announcement" :locale="locale" @close="dismissAnnouncement"/>
  <AppUpdatePrompt v-if="updateRelease&&signedIn&&!busy&&(page==='home'||page==='wallet')" :release="updateRelease" :locale="locale" @later="dismissUpdate"/>
  <p v-if="persistenceWarning||clearWarning" class="error" role="alert">{{sessionText(locale,clearWarning?1:0)}}</p>
  <ForcedPasswordPage v-if="restricted" :service="service" :locale="locale" @finished="passwordChanged" @exit="leaveSession" />
  <RecoveryPage v-else-if="showRecovery" :service="service" :locale="locale" :kind="recoveryKind" :user-uid="currentUid" :phone="phone" @payment-setup="recoveryPaymentSetup" @back="showRecovery=false" @unauthorized="leaveSession" />
  <RegistrationPage v-else-if="registering" :service="service" :locale="locale" @back="registering=false" @registered="value=>{phone=value;registering=false}" />
  <ContentHubPage v-else-if="signedIn&&(page==='home'||page==='community'||page==='updates'||page==='news')" :service="service" :locale="locale" :mode="page" @navigate="navigate" @locale="locale=$event" @back="page='home'" @unauthorized="leaveSession" />
  <DepositPage v-else-if="signedIn&&currentUid&&(page==='deposit'||page==='history')" :key="page" :service="service" :locale="locale" :user-uid="currentUid" :history="page==='history'" @back="backToWallet" @support="openSupport('deposit')" @unauthorized="leaveSession" />
  <SupportPage v-else-if="signedIn&&page==='support'" :service="service" :locale="locale" @back="page=supportBack" @unauthorized="leaveSession" />
  <ProductPage v-else-if="signedIn&&page==='products'" :service="service" :locale="locale" :user-uid="currentUid" @locale="locale=$event" @navigate="navigate" @back="backToWallet" @orders="orderNo=$event;page='orders'" @deposit="page='deposit'" @rollover="page='rollover'" @unauthorized="leaveSession"  :available="wallet?.available" />
  <PasswordPage :initial-mode="passwordTarget" v-else-if="signedIn&&page==='password'" :service="service" :locale="locale" :user-uid="currentUid" @back="passwordTarget==='pay'?page='withdraw':backToWallet()" @support="openRecovery('payment')" @login-changed="passwordChanged" @payment-changed="passwordTarget==='pay'?page='withdraw':undefined" @unauthorized="leaveSession" />
  <CheckinPage v-else-if="signedIn&&page==='checkin'" :service="service" :locale="locale" :user-uid="currentUid" @back="backToWallet" @unauthorized="leaveSession" />
  <ContentDocumentPage v-else-if="signedIn&&(page==='terms'||page==='compliance')" :key="page" :service="service" :locale="locale" :kind="page" @back="page==='compliance'?page=contentBack:backToWallet()" @navigate="navigate" @unauthorized="leaveSession" />
  <AddressPage v-else-if="signedIn&&page==='address'" :service="service" :locale="locale" :user-uid="currentUid" @back="backToWallet" @unauthorized="leaveSession" />
  <MallPage v-else-if="signedIn&&page==='mall'" :service="service" :locale="locale" :user-uid="currentUid" @back="backToWallet" @support="openSupport('mall')" @unauthorized="leaveSession" />
  <LotteryPage v-else-if="signedIn&&page==='lottery'" :service="service" :locale="locale" :user-uid="currentUid" @back="backToWallet" @support="openSupport('lottery')" @unauthorized="leaveSession" />
  <TaskPage v-else-if="signedIn&&page==='tasks'" :service="service" :locale="locale" :user-uid="currentUid" @back="backToWallet" @unauthorized="leaveSession" />
  <TeamPage v-else-if="signedIn&&page==='team'" :service="service" :locale="locale" :user-uid="currentUid" @back="backToWallet" @unauthorized="leaveSession" />
  <InvitationPage v-else-if="signedIn&&page==='invite'" :service="service" :locale="locale" :user-uid="currentUid" @back="backToWallet" @unauthorized="leaveSession" />
  <EntriesPage v-else-if="signedIn&&page==='ledger'" :service="service" :locale="locale" :user-uid="currentUid" @back="backToWallet" @unauthorized="leaveSession" />
  <TransferPage v-else-if="signedIn&&page==='transfer'" :service="service" :locale="locale" :user-uid="currentUid" @back="backToWallet" @setup-password="passwordTarget='pay';page='password'" @unauthorized="leaveSession" />
  <IdentityPage v-else-if="signedIn&&page==='identity'" :service="service" :locale="locale" :user-uid="currentUid" @back="backToWallet" @unauthorized="leaveSession" />
  <WithdrawalAddressPage v-else-if="signedIn&&page==='withdrawalAddress'" :service="service" :locale="locale" :user-uid="currentUid" @back="backToWallet" @unauthorized="leaveSession" />
  <WithdrawalPage v-else-if="signedIn&&(page==='withdraw'||page==='withdrawalHistory')" :key="page" :service="service" :locale="locale" :user-uid="currentUid" :history="page==='withdrawalHistory'" @back="backToWallet" @history="page='withdrawalHistory'" @setup-password="passwordTarget='pay';page='password'" @unauthorized="leaveSession" />
  <RolloverPage v-else-if="signedIn&&page==='rollover'" :service="service" :locale="locale" :user-uid="currentUid" @back="backToWallet" @unauthorized="leaveSession" />
  <OrdersPage v-else-if="signedIn&&page==='orders'" :service="service" :locale="locale" :user-uid="currentUid" :order-no="orderNo" @back="backToWallet" @unauthorized="leaveSession" />
  <WalletPage v-else-if="signedIn" :uid="currentUid" :registered-phone="registeredPhone" :vip-level="vipLevel" :wallet="wallet" :locale="locale" :busy="busy" :error="error" @locale="locale=$event" @logout="logout" @reload="reload" @navigate="navigate" />
  <div v-else class="reference-surface reference-login"><header class="fixed top-0 w-full z-50 pt-safe bg-surface/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]"><div class="h-14 px-margin-sm flex items-center justify-between"><div class="flex items-center gap-space-sm"></div><LanguagePicker :locale="locale" @change="locale=$event"></LanguagePicker></div></header><main class="flex flex-col relative w-full pt-14 pb-safe bg-surface min-h-screen"><div class="flex flex-col w-full px-margin-sm pb-space-xl">
<div class="relative w-full overflow-hidden pointer-events-none mb-space-sm">
<div class="absolute -top-12 left-1/2 -translate-x-1/2 w-72 h-36 bg-gradient-to-b from-primary-fixed/20 via-surface-container/30 to-transparent blur-2xl rounded-full"></div>
</div>
<div class="flex flex-col items-center text-center mt-space-xs mb-space-lg relative z-10">
<div class="diag-trigger relative w-16 h-16 mb-space-sm flex items-center justify-center bg-surface-container-lowest rounded-full shadow-md overflow-hidden p-0.5" @contextmenu.prevent><img alt="九合创投" class="w-full h-full object-cover rounded-full" draggable="false" src="/brand.png"/></div>
<div class="flex items-center gap-space-xs">
<span class="font-headline-sm text-headline-sm font-semibold tracking-tight text-on-surface">九合创投</span>
</div>
<span class="font-body-sm text-body-sm text-outline tracking-wider mt-0.5">UNITY VENTURES</span>
<div class="mt-space-md">
<h1 class="font-headline-lg-mobile text-headline-lg-mobile font-semibold text-on-surface tracking-tight">{{t('welcome')}}</h1>
</div>
</div>
<form @submit.prevent="login" class="bg-surface-container-lowest rounded-xl p-space-md shadow-sm space-y-space-md">
<div class="space-y-1.5">
<label class="block font-label-caps text-label-caps text-outline uppercase tracking-wider" for="input-account">{{t('phone')}}</label>
<div class="flex items-center bg-surface-container-low rounded-lg px-space-sm h-12 focus-within:bg-surface-container-lowest focus-within:ring-2 focus-within:ring-primary/20 transition-all" id="wrapper-account">
<span class="flex items-center gap-0.5 text-on-surface font-label-numeric-md text-label-numeric-md pr-space-xs mr-space-xs" id="prefix-btn">+86</span>
<span class="w-[1px] h-4 bg-outline-variant mr-space-xs"></span>
<input :aria-invalid="errorKey==='invalid'" :placeholder="t('phonePlaceholder')" :readonly="busy" @input="errorKey=null" autocomplete="username" class="w-full bg-transparent font-body-md text-body-md text-on-surface placeholder:text-outline-variant outline-none" id="input-account" inputmode="numeric" maxlength="11" name="phone" type="tel" v-model="phone"/>
<button @click="clearPhone" :disabled="busy||!phone" :aria-label="sourceText(locale,'clearAccount')" class="p-1 text-outline hover:text-on-surface flex items-center justify-center" type="button"><UiIcon name="close" :size="16"/></button>
</div>
</div>
<div class="space-y-1.5" id="section-pwd">
<div class="flex items-center justify-between">
<label class="block font-label-caps text-label-caps text-outline uppercase tracking-wider" for="input-password">{{t('password')}}</label>
<button @click="openRecovery('login')" class="source-forgot" type="button">{{profileText(locale,'forgot')}}</button></div>
<div class="flex items-center bg-surface-container-low rounded-lg px-space-sm h-12 focus-within:bg-surface-container-lowest focus-within:ring-2 focus-within:ring-primary/20 transition-all" id="wrapper-password">
<UiIcon :size="20" class="material-symbols-outlined text-[20px] text-outline mr-space-xs" name="lock"></UiIcon>
<input :aria-invalid="errorKey==='invalid'" :placeholder="t('passwordPlaceholder')" :readonly="busy" :type="visible?'text':'password'" @input="errorKey=null" autocomplete="current-password" class="w-full bg-transparent font-body-md text-body-md text-on-surface placeholder:text-outline-variant outline-none" id="input-password" maxlength="16" name="password" v-model="password"/>
<button :aria-label="t(visible?'hidePassword':'showPassword')" :aria-pressed="visible" @click="visible=!visible" class="p-1 text-outline hover:text-on-surface flex items-center justify-center" type="button"><UiIcon :name="visible?'eyeOff':'eye'" :size="20"></UiIcon></button>
</div>
</div>
<div class="flex items-center gap-2 p-2.5 rounded-lg bg-[#fff1f0] border border-[#ffccc7] text-[#cf1322] text-[13px] leading-snug transition-all duration-200 shake-error" id="login-error-alert" role="alert" v-if="error"><UiIcon :size="18" class="material-symbols-outlined text-[18px] text-[#ff4d4f] select-none" name="error"></UiIcon><span class="font-medium">{{error}}</span></div><div class="flex items-center justify-between pt-space-xs">
<label class="flex items-center gap-space-xs cursor-pointer select-none">
</label>
</div>
<div class="pt-space-xs">
<button :disabled="busy||retrySeconds>0" class="w-full h-12 bg-primary hover:bg-primary-container text-on-primary font-headline-sm text-[15px] font-medium rounded-lg flex items-center justify-center gap-space-xs shadow-md shadow-primary/25 active:scale-[0.99] transition-all" style="background-color: rgb(217, 119, 6); box-shadow: rgba(217, 119, 6, 0.25) 0px 4px 6px -1px;" type="submit">
<UiIcon :size="19" class="material-symbols-outlined text-[19px]" name="lock_open"></UiIcon>
<span class="">{{retrySeconds>0?t('throttled')+' ('+retrySeconds+')':t(busy?'loading':'login')}}</span>
</button>
</div>
<p class="font-body-sm text-body-sm text-outline" role="status" v-if="credentialLoginNotice">{{credentialText(locale,credentialLoginNotice)}}</p><p class="font-body-sm text-body-sm text-outline" role="status" v-if="loginNotice">{{loginNotice}}</p>
 <div class="pt-space-xs">
 <button @click="registering=true" class="flex h-12 w-full items-center justify-center rounded-lg text-on-primary font-headline-sm text-[15px] font-medium shadow-md active:scale-[0.99] transition-colors" style="background-color: rgb(217, 119, 6); box-shadow: rgba(217, 119, 6, 0.25) 0px 4px 6px -1px;" type="button">{{t('register')}}</button>
 </div>
 </form>
<div class="mt-space-xl flex flex-col items-center text-center space-y-space-sm px-space-xs">
<div class="pt-space-xs flex items-center gap-2">
<span class="w-6 h-[1px] bg-outline-variant/60"></span>
<span class="font-label-caps text-label-caps text-outline tracking-widest uppercase">{{t('footer')}}</span>
<span class="w-6 h-[1px] bg-outline-variant/60"></span>
</div>
</div>
</div>
</main></div>
</div>
</template>

