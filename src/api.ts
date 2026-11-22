type CacheOptions = { persist?: boolean }
type CacheRefreshResult<T> = { value: T; changed: boolean }
type CacheEntry = { value: unknown; fingerprint: string }
const cacheStoragePrefix = 'jiuhe:read-cache:v1:'
const cacheMemory = new Map<string, CacheEntry>()
const cachePending = new Map<string, Promise<CacheRefreshResult<unknown>>>()
const cacheFingerprint = (value: unknown): string => {
  if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? String(value)
  if (Array.isArray(value)) return '[' + value.map(cacheFingerprint).join(',') + ']'
  const record = value as Record<string, unknown>
  return '{' + Object.keys(record).sort().map(key => JSON.stringify(key) + ':' + cacheFingerprint(record[key])).join(',') + '}'
}
const readCached = <T>(key: string, options: CacheOptions = {}): T | undefined => {
  const current = cacheMemory.get(key)
  if (current) return current.value as T
  if (!options.persist) return undefined
  try {
    const raw = localStorage.getItem(cacheStoragePrefix + key)
    if (raw === null) return undefined
    const value = JSON.parse(raw) as T
    cacheMemory.set(key, { value, fingerprint: cacheFingerprint(value) })
    return value
  } catch { return undefined }
}
const writeCached = <T>(key: string, value: T, options: CacheOptions = {}): void => {
  cacheMemory.set(key, { value, fingerprint: cacheFingerprint(value) })
  if (options.persist) try { localStorage.setItem(cacheStoragePrefix + key, JSON.stringify(value)) } catch { /* Cache failure never blocks the page. */ }
}
const refreshReadCache = async <T>(key: string, loader: () => Promise<T>, options: CacheOptions = {}): Promise<CacheRefreshResult<T>> => {
  const running = cachePending.get(key)
  if (running) return running as Promise<CacheRefreshResult<T>>
  const previous = cacheMemory.get(key)?.fingerprint
  const request = loader().then(value => { const next = cacheFingerprint(value); writeCached(key, value, options); return { value, changed: previous !== next } }).finally(() => cachePending.delete(key))
  cachePending.set(key, request as Promise<CacheRefreshResult<unknown>>)
  return request
}
const invalidateCached = (...keys: string[]): void => {
  for (const key of keys) {
    cacheMemory.delete(key)
    try { localStorage.removeItem(cacheStoragePrefix + key) } catch { /* Ignore unavailable storage. */ }
  }
}
const invalidateCachedPrefix = (prefix: string): void => {
  for (const key of [...cacheMemory.keys()]) if (key.startsWith(prefix)) cacheMemory.delete(key)
  try { for (let index = localStorage.length - 1; index >= 0; index -= 1) { const key = localStorage.key(index); if (key?.startsWith(cacheStoragePrefix + prefix)) localStorage.removeItem(key) } } catch { /* Ignore unavailable storage. */ }
}

export class ApiError extends Error {
  status: number
  retryAfter: number
  constructor(key: string, status = 0, retryAfter = 0) { super(key); this.name = 'ApiError'; this.status = status; this.retryAfter = retryAfter }
}
export type RequestOptions = {timeoutMs?: number; retries?: number}
const wait=(ms:number)=>new Promise<void>(resolve=>{setTimeout(resolve,ms)})
async function deadline<T>(work:(signal:AbortSignal|undefined)=>Promise<T>,timeoutMs=20000):Promise<T>{
  const controller=typeof AbortController==='function'?new AbortController():undefined
  let timeout:ReturnType<typeof setTimeout>|undefined
  const expired=new Promise<never>((_resolve,reject)=>{timeout=setTimeout(()=>{controller?.abort();reject(new ApiError('network_error'))},timeoutMs)})
  try{return await Promise.race([work(controller?.signal),expired])}finally{clearTimeout(timeout)}
}
// 移动网络偶发超时、断流很常见：只有调用方明确允许时才重试，
// 且只重试网络错误与 5xx，业务错误（4xx）原样返回，避免重复提交。
function transient(problem:unknown):boolean{
  return problem instanceof ApiError && (problem.message==='network_error'||problem.status>=500)
}
export function createApi(baseUrl = (import.meta.env?.VITE_API_ORIGIN||'').replace(/\/$/,'')+'/api/v1', fetcher: typeof fetch = (...args) => fetch(...args), mode:'bearer'|'browser'='bearer') {
  let token: string | null = null
  let installation: string | null = null
  const appHeaders = (): Record<string,string> => ({...(mode==='browser'?{'X-App-Request':'1','X-App-Session':'browser'}:{}),...(installation?{'X-Installation-Id':installation}:{})})
  async function send<T>(path: string, body: unknown, extraHeaders: Record<string,string>, method: 'PUT'|'DELETE'|undefined, timeoutMs: number): Promise<T> {
    const sentToken=token
    const headers: Record<string, string> = { Accept: 'application/json', ...appHeaders(), ...extraHeaders }
    if (sentToken) headers.Authorization = `Bearer ${sentToken}`
    const multipart = body instanceof FormData
    if (body !== undefined && !multipart) headers['Content-Type'] = 'application/json'
    try { return await deadline(async signal=>{
      const response=await fetcher(`${baseUrl}${path}`,{method:method??(body===undefined?'GET':'POST'),headers,signal,body:body===undefined?undefined:multipart?body:JSON.stringify(body),cache:'no-store',credentials:mode==='browser'?'same-origin':'omit'})
      if(response.status===401&&token===sentToken)token=null
      if(response.status===429){const seconds=Number(response.headers.get('Retry-After')||'60');throw new ApiError('request_throttled',429,Number.isFinite(seconds)?Math.max(1,Math.min(3600,Math.ceil(seconds))):60)}
      let result
      try{result=await response.json()}catch{throw new ApiError('service_unavailable',response.status)}
      if(!response.ok)throw new ApiError(result.message_key||'request_failed',response.status)
      return result.data as T
    },timeoutMs)} catch(problem){if(problem instanceof ApiError)throw problem;throw new ApiError('network_error')}
  }
  return {
    setToken(value: string | null) { token = value },
    setInstallation(value: string | null) { installation = typeof value === 'string' && value !== '' ? value : null },
    getCached<T>(key: string, options: CacheOptions = {}) { return readCached<T>(key, options) },
    setCached<T>(key: string, value: T, options: CacheOptions = {}) { writeCached(key, value, options) },
    refreshCached<T>(key: string, loader: () => Promise<T>, options: CacheOptions = {}): Promise<CacheRefreshResult<T>> { return refreshReadCache(key, loader, options) },
    async requestCached<T>(key: string, path: string, body?: unknown, extraHeaders: Record<string,string> = {}, method?: 'PUT'|'DELETE', options: RequestOptions & CacheOptions = {}, changed?: (value: T) => void): Promise<T> {
      const cached = readCached<T>(key, options)
      const load = async () => {
        const attempts = Math.max(1, Math.min(3, (options.retries ?? 0) + 1))
        for (let attempt = 1; ; attempt += 1) {
          try { return await send<T>(path, body, extraHeaders, method, options.timeoutMs ?? 20000) }
          catch (problem) { if (attempt >= attempts || !transient(problem)) throw problem; await wait(300 * attempt) }
        }
      }
      if (cached !== undefined) {
        void refreshReadCache(key, load, options).then(result => { if (result.changed) changed?.(result.value) })
        return cached
      }
      return (await refreshReadCache(key, load, options)).value
    },
    invalidateCached(...keys: string[]) { invalidateCached(...keys) },
    invalidateCachedPrefix(prefix: string) { invalidateCachedPrefix(prefix) },
    async image(path: string): Promise<Blob> {
      const sentToken=token
      try{return await deadline(async signal=>{
        const response=await fetcher(`${baseUrl}${path}`,{headers:{...(sentToken?{Authorization:`Bearer ${sentToken}`} :{}),...appHeaders()},signal,cache:'no-store',credentials:mode==='browser'?'same-origin':'omit'})
        if(response.status===401&&token===sentToken)token=null
        if(!response.ok)throw new ApiError(response.status===401?'session_expired':'request_failed',response.status)
        if(!['image/png','image/jpeg'].includes(response.headers.get('Content-Type')?.split(';')[0]||''))throw new ApiError('service_unavailable')
        return response.blob()
      })}catch(problem){if(problem instanceof ApiError)throw problem;throw new ApiError('network_error')}
    },
    async request<T>(path: string, body?: unknown, extraHeaders: Record<string,string> = {}, method?: 'PUT'|'DELETE', options: RequestOptions = {}): Promise<T> {
      const attempts=Math.max(1,Math.min(3,(options.retries??0)+1))
      for(let attempt=1;;attempt++){
        try{ return await send<T>(path,body,extraHeaders,method,options.timeoutMs??20000) }
        catch(problem){
          if(attempt>=attempts||!transient(problem))throw problem
          await wait(300*attempt)
        }
      }
    },
  }
}
