export function normalizeAmount(value: string): string | null {
  if (!/^(?:0|[1-9][0-9]{0,21})(?:\.[0-9]{1,2})?$/.test(value)) return null
  const [integer, fraction = ''] = value.split('.')
  return integer + '.' + fraction.padEnd(2, '0')
}
export function amountAtLeast(value: string, minimum: string): boolean {
  const left = normalizeAmount(value), right = normalizeAmount(minimum)
  if (!left || !right) return false
  const [li] = left.split('.'), [ri] = right.split('.')
  return li!.length !== ri!.length ? li!.length > ri!.length : left >= right
}
export function commandKey(): string {
  const bytes = new Uint8Array(16); crypto.getRandomValues(bytes)
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('')
}
export type DepositDraft = { amount: string; fileId: string; network: 'TRC20'|'BEP20'; key: string }
export function readDraft(value: string | null): DepositDraft | null {
  if (!value) return null
  try { const draft = JSON.parse(value); return typeof draft.amount === 'string' && normalizeAmount(draft.amount) === draft.amount && typeof draft.fileId === 'string' && /^[1-9][0-9]{0,19}$/.test(draft.fileId) && (draft.network === undefined || draft.network === 'TRC20' || draft.network === 'BEP20') && typeof draft.key === 'string' && /^[a-f0-9]{32}$/.test(draft.key) ? { amount: draft.amount, fileId: draft.fileId, network: draft.network ?? 'TRC20', key: draft.key } : null } catch { return null }
}

export function clearMatchingDraft(storage: Pick<Storage,'getItem'|'removeItem'>, storageKey: string, expectedKey: string): boolean {
  if (!/^[a-f0-9]{32}$/.test(expectedKey)) return false
  const raw=storage.getItem(storageKey)
  let current:unknown
  try {current=JSON.parse(raw??'null')} catch {return false}
  if (!current||typeof current!=='object'||Array.isArray(current)) return false
  const key=(current as {key?:unknown}).key
  if (typeof key!=='string'||!/^[a-f0-9]{32}$/.test(key)||key!==expectedKey) return false
  storage.removeItem(storageKey); return true
}
export async function executeDepositSubmission(options: {
  draft: DepositDraft|null; amount: string; network?: 'TRC20'|'BEP20'; upload:()=>Promise<string>; persist:(draft:DepositDraft)=>void;
  post:(draft:DepositDraft)=>Promise<{status:string}>; active:()=>boolean
}): Promise<{status:string}> {
  let draft=options.draft
  if(!draft){const fileId=await options.upload();if(!options.active())return {status:'abandoned'};draft={amount:options.amount,fileId,network:options.network ?? 'TRC20',key:commandKey()};options.persist(draft)}
  if(!options.active())return {status:'abandoned'}
  const result=await options.post(draft)
  return options.active()?result:{status:'abandoned'}
}
export function businessTime(value:string,includeSeconds=false):string {
  const clean=value.replace(' ','T').replace(/(\.\d{3})\d+/, '$1')
  const date=new Date(clean.endsWith('Z')||/[+-]\d{2}:\d{2}$/.test(clean)?clean:clean+'Z')
  if(!Number.isFinite(date.getTime()))return value
  const beijing=new Date(date.getTime()+8*60*60*1000),pad=(n:number)=>String(n).padStart(2,'0')
  return `${beijing.getUTCFullYear()}-${pad(beijing.getUTCMonth()+1)}-${pad(beijing.getUTCDate())} ${pad(beijing.getUTCHours())}:${pad(beijing.getUTCMinutes())}${includeSeconds?':'+pad(beijing.getUTCSeconds()):''}`
}
