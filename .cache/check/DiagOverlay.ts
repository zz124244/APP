
import {onMounted,ref} from 'vue'
import {layoutPeaks,layoutSamples,resetLayoutWatch,type LayoutSample} from './layout-watch'
const emit=defineEmits<{close:[]}>()
const report=ref('测量中…'),copied=ref(false),ruler=ref(false)
type Line={k:string;v:string}
type Hits={sel:string;overflowX:string;scrollW:number;clientW:number;clipped:boolean;root:boolean}

function safeInsets():string{
  const probe=document.createElement('div')
  probe.style.cssText='position:fixed;top:0;left:0;width:0;height:0;visibility:hidden;pointer-events:none;'
    +'padding-top:env(safe-area-inset-top,-1px);padding-right:env(safe-area-inset-right,-1px);'
    +'padding-bottom:env(safe-area-inset-bottom,-1px);padding-left:env(safe-area-inset-left,-1px)'
  document.body.appendChild(probe)
  const style=getComputedStyle(probe)
  const value=[style.paddingTop,style.paddingRight,style.paddingBottom,style.paddingLeft].join(' / ')
  probe.remove()
  return value
}
// 被祖先 overflow:hidden 裁掉的文字（卡片里地址/金额被切就是这一类）
function clippedText(){
  const hits:{sel:string;txt:string;over:number}[]=[]
  document.querySelectorAll('body *').forEach(element=>{
    if(element.children.length)return
    const text=(element.textContent||'').trim()
    if(text.length<2)return
    const box=element.getBoundingClientRect()
    if(box.width<1||box.height<1)return
    const style=getComputedStyle(element)
    if(style.display==='none'||style.visibility==='hidden'||style.position==='fixed')return
    let parent=element.parentElement
    while(parent&&parent!==document.documentElement){
      const ps=getComputedStyle(parent)
      if(ps.overflowX==='hidden'||ps.overflowX==='clip'){
        const pb=parent.getBoundingClientRect()
        const over=Math.max(box.right-pb.right,pb.left-box.left)
        if(over>1)hits.push({sel:parent.tagName.toLowerCase()+'.'+(parent.className||'').toString().replace(/\s+/g,'.').slice(0,40),txt:text.slice(0,18),over:Math.round(over)})
        break
      }
      parent=parent.parentElement
    }
  })
  return hits.sort((a,b)=>b.over-a.over).slice(0,10)
}
// 底部被顶出屏幕的固定/粘性元素（例如键盘弹出后聊天输入框）
function underScreen(){
  const hits:{sel:string;bottom:number}[]=[]
  const vh=window.innerHeight
  document.querySelectorAll('body *').forEach(element=>{
    const style=getComputedStyle(element)
    if(style.position!=='fixed'&&style.position!=='sticky')return
    if(style.display==='none'||style.visibility==='hidden')return
    const box=element.getBoundingClientRect()
    if(box.height<8)return
    if(box.bottom>vh+1)hits.push({sel:element.tagName.toLowerCase()+'.'+(element.className||'').toString().replace(/\s+/g,'.').slice(0,40),bottom:Math.round(box.bottom-vh)})
  })
  return hits.sort((a,b)=>b.bottom-a.bottom).slice(0,6)
}
// "能左右随意拖"到底是谁在滚：把真正可横向滚动、以及本该被裁却仍溢出的容器点名出来
function scrollers(){
  const hits:Hits[]=[]
  const nodes:Element[]=[document.documentElement,document.body]
  document.querySelectorAll('body *').forEach(element=>nodes.push(element))
  for(const element of nodes){
    const scrollW=element.scrollWidth,clientW=element.clientWidth
    if(clientW<1||scrollW-clientW<=1)continue
    const cs=getComputedStyle(element)
    const canScroll=/auto|scroll/.test(cs.overflowX)
    const clipped=cs.overflowX==='hidden'||cs.overflowX==='clip'||cs.overflowX==='visible'
    const isRoot=element===document.documentElement||element===document.body||element.id==='app'
    // 只保留能真滚的容器，和"根元素/本该裁掉却溢出"这两种真正能拖动整页的
    if(!canScroll&&!isRoot&&!clipped)continue
    if(!canScroll&&!isRoot)continue
    const cls=(element.className||'').toString().replace(/\s+/g,'.').slice(0,34)
    hits.push({sel:element.tagName.toLowerCase()+(element.id?'#'+element.id:'')+(cls?'.'+cls:''),overflowX:cs.overflowX,scrollW,clientW,clipped,root:isRoot})
  }
  return hits.sort((a,b)=>(b.scrollW-b.clientW)-(a.scrollW-a.clientW)).slice(0,10)
}
function verdict(peaks:ReturnType<typeof layoutPeaks>,wide:number,scroll:Hits[]){  const out:string[]=[]
  const wider=peaks.innerW-peaks.screenW
  out.push(wider>1
    ?'✗ 网页布局宽度 '+peaks.innerW+'px 比屏幕 '+peaks.screenW+'px 宽 '+wider+'px —— 这是"页面比屏幕宽"型溢出'
    :'✓ 布局宽度 '+peaks.innerW+'px = 屏幕 '+peaks.screenW+'px，网页没有被撑宽')
  out.push(peaks.maxScale>1.01
    ?'✗ 整页曾被放大到 '+peaks.maxScale.toFixed(3)+' 倍 —— 缩放型溢出（换页也不会恢复）'
    :'✓ 全程视觉缩放 1.000，从未被放大')
  out.push(peaks.maxScrollX>1
    ?'✗ 整页曾被横向推走 '+peaks.maxScrollX+'px —— 左侧内容会跑到屏幕外'
    :'✓ 全程没有被横向推走（scrollX 恒为 0）')
  const rootScroll=scroll.filter(item=>item.root)
  if(rootScroll.length){
    const top=rootScroll[0]
    out.push('✗ 根元素本身可横向滚动（'+top.sel+'：内容 '+top.scrollW+'px / 可视 '+top.clientW+'px，overflow-x='+top.overflowX+'）—— 这就是"手指能左右随意拖整页"的直接原因')
  }else{
    out.push('✓ 根元素不可横向滚动（手指本不该能拖动整页）')
  }
  out.push(peaks.maxOverflow>1
    ?'✗ 曾有元素比视口宽 '+peaks.maxOverflow+'px（见下方元素清单）'
    :'✓ 没有元素比视口更宽')
  if(peaks.maxKeyboard>60)out.push('! 键盘弹出时可视高度被压缩 '+peaks.maxKeyboard+'px —— 输入框可能被键盘遮住')
  if(wide===0&&peaks.maxScale<=1.01&&peaks.maxScrollX<=1&&peaks.maxOverflow<=1&&Math.abs(wider)<=1&&rootScroll.length===0){
    out.push('结论：网页层完全清白。若手指仍能左右拖动整页 / 屏幕仍被切 → 问题在原生壳（WKWebView 的 scrollView 内容宽度或 frame），点"边缘标尺"后截图即可确认。')
  }else{
    out.push('结论：网页层已定位到上面带 ✗ 的项，可直接按它修。')
  }
  return out
}
function measure(){
  const root=document.documentElement
  const vv:VisualViewport|null=window.visualViewport??null
  const peaks=layoutPeaks()
  const vw=window.innerWidth
  const wide:{tag:string;cls:string;w:number;l:number;r:number}[]=[]
  document.querySelectorAll('body *').forEach(element=>{
    const box=element.getBoundingClientRect()
    if(box.width<1||box.height<1)return
    const style=getComputedStyle(element)
    if(style.display==='none'||style.visibility==='hidden')return
    if(box.right>vw+0.5||box.left<-0.5)wide.push({tag:element.tagName.toLowerCase(),cls:(element.className||'').toString().replace(/\s+/g,'.').slice(0,70),w:Math.round(box.width),l:Math.round(box.left),r:Math.round(box.right)})
  })
  wide.sort((a,b)=>b.r-a.r)
  const lines:Line[]=[
    {k:'innerWidth × innerHeight（布局视口，CSS px）',v:`${window.innerWidth} × ${window.innerHeight}`},
    {k:'documentElement.clientWidth（可视宽度）',v:String(root.clientWidth)},
    {k:'screen.width × screen.height',v:`${window.screen.width} × ${window.screen.height}`},
    {k:'devicePixelRatio',v:String(window.devicePixelRatio)},
    {k:'visualViewport.scale（>1 就是被放大了）',v:vv?vv.scale.toFixed(3):'不支持'},
    {k:'visualViewport.width × height',v:vv?`${Math.round(vv.width)} × ${Math.round(vv.height)}`:'—'},
    {k:'visualViewport.offsetLeft / offsetTop',v:vv?`${Math.round(vv.offsetLeft)} / ${Math.round(vv.offsetTop)}`:'—'},
    {k:'window.scrollX / scrollY（>0 说明整页被横向推走了）',v:`${Math.round(window.scrollX)} / ${Math.round(window.scrollY)}`},
    {k:'documentElement.scrollWidth（>clientWidth 就是有元素更宽）',v:String(root.scrollWidth)},
    {k:'body.scrollWidth',v:String(document.body.scrollWidth)},
    {k:'safe-area-inset top/right/bottom/left',v:safeInsets()},
    {k:'viewport meta',v:(document.querySelector('meta[name=viewport]') as HTMLMetaElement| null)?.content||'缺失'},
    {k:'页面宽度占视口比例（布局宽/可视宽）',v:`${(root.scrollWidth/Math.max(1,root.clientWidth)*100).toFixed(1)}%`},
  ]
  const recent=layoutSamples().slice(-6).map((s:LayoutSample)=>`  ${new Date(s.t).toLocaleTimeString('zh-CN',{hour12:false})}  scale=${s.scale}  offset=${s.offsetLeft}/${s.offsetTop}  scrollX=${s.scrollX}  ${s.innerW}×${s.innerH}  可视=${s.vvW}×${s.vvH}  文档宽=${s.scrollW}  键盘压缩=${s.keyboard}`)
  const clipped=clippedText()
  const bottom=underScreen()
  const scroll=scrollers()
  const text=[
    '【判定】',
    ...verdict(peaks,wide.length,scroll),
    '',
    '【当前状态】',
    ...lines.map(line=>line.k+'：'+line.v),
    '',
    `【历史峰值】采样 ${peaks.count} 次 / 覆盖 ${peaks.spanSeconds} 秒`,
    `  视觉缩放最大：${peaks.maxScale.toFixed(3)}`,
    `  横向推走最大：${peaks.maxScrollX}px`,
    `  元素超宽最大：${peaks.maxOverflow}px`,
    `  视觉视口偏移最大：${peaks.maxOffset}px`,
    `  键盘压缩最大：${peaks.maxKeyboard}px`,
    '  最近采样（时间 / scale / offset / scrollX / 布局 / 可视 / 文档宽 / 键盘）：',
    ...recent,
    '',
    `【超出视口的元素】共 ${wide.length} 个，最多列 12 个：`,
    ...wide.slice(0,12).map(item=>`  ${item.tag}.${item.cls}  w=${item.w}  left=${item.l}  right=${item.r}（右侧超出 ${item.r-vw}px）`),
    '',
    `【可横向滚动的容器（"能左右拖"就是这里）】共 ${scroll.length} 个：`,
    ...scroll.map(item=>`  ${item.sel}  overflow-x=${item.overflowX}  内容 ${item.scrollW}px / 可视 ${item.clientW}px（多出 ${item.scrollW-item.clientW}px）${item.root?'  ← 根元素':''}`),
    '',
    `【被祖先裁掉的文字】共 ${clipped.length} 条，最多列 10 条：`,
    ...clipped.map(item=>`  "${item.txt}"  被 ${item.sel} 裁掉 ${item.over}px`),
    '',
    `【底部被顶出屏幕的固定元素】共 ${bottom.length} 个：`,
    ...bottom.map(item=>`  ${item.sel}  底部超出屏幕 ${item.bottom}px`),
    '',
    'UA：'+navigator.userAgent,
  ].join('\n')
  report.value=text
}
function toggleRuler(){
  ruler.value=!ruler.value
  const id='__diag_ruler'
  const old=document.getElementById(id)
  if(old)old.remove()
  if(!ruler.value)return
  const frame=document.createElement('div')
  frame.id=id
  frame.style.cssText='position:fixed;inset:0;z-index:2147483001;pointer-events:none;outline:3px solid #ff0040;outline-offset:-3px'
  const cornerStyle='position:absolute;width:28px;height:28px;border:3px solid #00ff88;pointer-events:none'
  const spots=['top:0;left:0;border-right:0;border-bottom:0','top:0;right:0;border-left:0;border-bottom:0','bottom:0;left:0;border-right:0;border-top:0','bottom:0;right:0;border-left:0;border-top:0']
  spots.forEach(spot=>{const dot=document.createElement('div');dot.style.cssText=cornerStyle+';'+spot;frame.appendChild(dot)})
  const cross=document.createElement('div')
  cross.style.cssText='position:absolute;left:50%;top:0;bottom:0;width:1px;background:#ff0040;opacity:.8'
  frame.appendChild(cross)
  document.body.appendChild(frame)
}
async function copy(){
  try{await navigator.clipboard.writeText(report.value);copied.value=true;setTimeout(()=>copied.value=false,2000)}catch{copied.value=false}
}
onMounted(()=>{
  measure()
  setTimeout(measure,1200)
})
