export type WithdrawalAddress={id:string;address:string}
export type AddressBook={TRC20:WithdrawalAddress[];BEP20:WithdrawalAddress[]}
export const NETWORKS=['TRC20','BEP20'] as const
export const PER_NETWORK_LIMIT=3
export function emptyBook():AddressBook{return {TRC20:[],BEP20:[]}}
export function normalizeAddress(network:string,value:string):string{const trimmed=(value??'').trim();return network==='BEP20'?trimmed.toLowerCase():trimmed}
export function isValidAddress(network:string,value:string):boolean{
  const address=normalizeAddress(network,value)
  if(network==='TRC20')return /^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(address)
  if(network==='BEP20')return /^0x[0-9a-f]{40}$/.test(address)
  return false
}
export function addressHint(book:AddressBook,network:'TRC20'|'BEP20',value:string):'ok'|'invalid'|'duplicate'|'limit'{
  const address=normalizeAddress(network,value)
  if(!isValidAddress(network,address))return 'invalid'
  const list=book[network]??[]
  if(list.some(item=>item.address===address))return 'duplicate'
  if(list.length>=PER_NETWORK_LIMIT)return 'limit'
  return 'ok'
}
export function entriesFor(book:AddressBook|undefined,network:string|undefined):WithdrawalAddress[]{
  if(!book||!network)return []
  if(network==='TRC20')return book.TRC20??[]
  if(network==='BEP20')return book.BEP20??[]
  return []
}
export function shortAddress(address:string):string{return address.length<=16?address:address.slice(0,6)+'…'+address.slice(-6)}
export function readBook(raw:unknown):AddressBook{
  const book=emptyBook()
  if(!raw||typeof raw!=='object')return book
  for(const network of NETWORKS){
    const list=(raw as Record<string,unknown>)[network]
    if(!Array.isArray(list))continue
    for(const item of list){
      if(!item||typeof item!=='object')continue
      const id=(item as {id?:unknown}).id,address=(item as {address?:unknown}).address
      if(typeof id!=='string'||typeof address!=='string'||!isValidAddress(network,address))continue
      book[network].push({id,address:normalizeAddress(network,address)})
    }
  }
  return book
}
