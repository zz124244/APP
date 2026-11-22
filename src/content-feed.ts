export type ContentItem={id:string;category?:string;column?:string|null;title:string;summary:string;date:string;cover_url?:string|null;body?:string;image_urls?:string[];video_url?:string|null}
export type ContentFeedState={items:ContentItem[];next_page:number|null;busy:boolean;error:boolean}
export function createContentFeed(read:(category:string,column:string|undefined,page:number)=>Promise<{items:ContentItem[];next_page:number|null}>,changed:(s:ContentFeedState)=>void){
 let epoch=0,disposed=false,category='news',column:string|undefined,failedPage=1
 let state:ContentFeedState={items:[],next_page:1,busy:false,error:false}
 const publish=(s:ContentFeedState)=>{state=s;changed({...s,items:[...s.items]})}
 async function load(page:number,run:number,replace=false){
  if(disposed||run!==epoch||state.busy)return
  publish({...state,busy:true,error:false});failedPage=page
  try{const r=await read(category,column,page);if(disposed||run!==epoch)return;const items=replace?[]:[...state.items];for(const item of r.items){if(!items.some(x=>x.id===item.id))items.push(item)}publish({items,next_page:r.next_page,busy:false,error:false})}
  catch{if(!disposed&&run===epoch)publish({...state,busy:false,error:true})}
 }
 return {
  async reset(c:string,col?:string){if(disposed)return;category=c;column=col;const run=++epoch;publish({items:[],next_page:1,busy:false,error:false});await load(1,run,true)},
  async more(){if(state.next_page!==null)await load(state.next_page,epoch)},
  async retry(){await load(failedPage,epoch,failedPage===1)},
  dispose(){disposed=true;epoch++}
 }
}
