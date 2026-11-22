
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
