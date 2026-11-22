import type {createApi} from './api'

type Service=ReturnType<typeof createApi>
type ReadOptions={persist?:boolean;retries?:number;timeoutMs?:number}

export function cachedRead<T>(service:Service,key:string,path:string,changed?:(value:T)=>void,options:ReadOptions={persist:true}):Promise<T>{
  if(typeof service.requestCached==='function')return service.requestCached<T>(key,path,undefined,{},undefined,options,changed)
  return service.request<T>(path)
}
