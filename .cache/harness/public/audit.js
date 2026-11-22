// Runtime overflow probe. Runs inside the served app (optionally inside the /frame.html iframe).
(function () {
  var params = new URLSearchParams(location.search)
  var flow = params.get('flow') || 'login'
  var wait = function (ms) { return new Promise(function (r) { setTimeout(r, ms) }) }
  var embedded = window.parent !== window

  function cssPath(el) {
    var parts = [], n = el, guard = 0
    while (n && n.nodeType === 1 && guard++ < 6) {
      var s = n.tagName.toLowerCase()
      if (n.id) { s += '#' + n.id; parts.unshift(s); break }
      var cls = typeof n.className === 'string' ? n.className.trim() : ''
      if (cls) s += '.' + cls.split(/\s+/).slice(0, 3).join('.')
      parts.unshift(s)
      n = n.parentElement
    }
    return parts.join('>')
  }

  function clipAncestor(el) {
    var n = el.parentElement
    while (n && n !== document.documentElement) {
      var cs = getComputedStyle(n)
      if (cs.overflowX === 'hidden' || cs.overflowX === 'clip') return n
      n = n.parentElement
    }
    return null
  }

  function measure() {
    var de = document.documentElement
    var vw = window.innerWidth, vh = window.innerHeight
    var out = {
      vw: vw, vh: vh,
      docScrollW: de.scrollWidth, docScrollH: de.scrollHeight,
      bodyScrollW: document.body.scrollWidth,
      hOverflow: de.scrollWidth - vw, vOverflow: de.scrollHeight - vh,
      offenders: [], cutText: []
    }
    var nodes = document.querySelectorAll('body *')
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i]
      var cs = getComputedStyle(el)
      if (cs.display === 'none' || cs.visibility === 'hidden') continue
      var r = el.getBoundingClientRect()
      if (r.width < 1 && r.height < 1) continue
      var rightOver = r.right - vw, leftOver = -r.left
      var innerX = el.scrollWidth - el.clientWidth
      var scrollable = /auto|scroll/.test(cs.overflowX)
      if (rightOver > 0.5 || leftOver > 0.5 || (innerX > 0.5 && !scrollable)) {
        out.offenders.push({
          s: cssPath(el), cls: String(el.className || '').slice(0, 80),
          l: Math.round(r.left), r: Math.round(r.right), w: Math.round(r.width),
          rightOver: +rightOver.toFixed(1), leftOver: +leftOver.toFixed(1),
          innerX: innerX, pos: cs.position, scrollable: scrollable,
          ow: cs.overflowWrap, ws: cs.whiteSpace, wb: cs.wordBreak, disp: cs.display, mw: cs.minWidth,
          txt: (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 28)
        })
      }
      var leafText = el.children.length === 0 && (el.textContent || '').trim().length > 1
      if (leafText && cs.position !== 'fixed') {
        var anc = clipAncestor(el)
        if (anc) {
          var ar = anc.getBoundingClientRect()
          if (r.right > ar.right + 1 || r.left < ar.left - 1) {
            out.cutText.push({
              s: cssPath(el), anc: cssPath(anc), txt: (el.textContent || '').trim().slice(0, 24),
              over: +Math.max(r.right - ar.right, ar.left - r.left).toFixed(1)
            })
          }
        }
      }
    }
    if (out.offenders.length > 60) out.offenders = out.offenders.slice(0, 60)
    if (out.cutText.length > 40) out.cutText = out.cutText.slice(0, 40)
    return out
  }

  function click(sel) {
    var el = document.querySelector(sel)
    if (!el) return 'missing:' + sel
    el.click()
    return 'clicked:' + sel
  }

  async function waitFor(sel, timeout) {
    var started = Date.now()
    while (Date.now() - started < (timeout || 8000)) {
      if (document.querySelector(sel)) return true
      await wait(200)
    }
    return false
  }

  function scrollProbe() {
    var d = document.createElement('div')
    d.style.cssText = 'position:absolute;top:0;left:0;width:120%;height:2px;pointer-events:none;visibility:hidden'
    document.body.appendChild(d)
    var before = window.scrollX
    window.scrollTo(120, window.scrollY)
    var after = window.scrollX
    window.scrollTo(before, window.scrollY)
    d.remove()
    return { before: before, after: after, blocked: after === before }
  }

  function publish(rep) {    if (embedded) { try { window.parent.postMessage(JSON.stringify(rep), '*') } catch (e) { } }
    var pre = document.getElementById('__audit')
    if (!pre) { pre = document.createElement('pre'); pre.id = '__audit'; document.body.appendChild(pre) }
    pre.textContent = JSON.stringify(rep)
    document.title = 'AUDIT h=' + rep.hOverflow + ' v=' + rep.vOverflow + ' n=' + (rep.offenders || []).length
  }

  async function run() {
    var steps = []
    try {
      await wait(900)
      steps.push(click('.startup-enter'))          // leave the launch slideshow
      await wait(1200)
      var flowText = { ledger: '资金明细', orders: '认购订单', team: '我的团队', deposit: '充值入金', withdraw: '立即提现', depositHistory: '充值记录', withdrawHistory: '提现记录', password: '更改密码', address: '收货地址', identity: '实名认证', withdrawalAddress: '提现地址', points: '购买', support: '充值入金' }
      if (flow === 'login') { steps.push('login-only') }
      else {
        var ok = await waitFor('nav button', 9000)
        var navBtns = Array.prototype.slice.call(document.querySelectorAll('nav button'))
        steps.push('navReady=' + ok)
        if (flowText[flow] || flow === 'wallet' || flow === 'community' || flow === 'invest') {
          // go to the wallet tab first, then click the entry button by label
          var want = flow === 'community' ? '社区' : flow === 'invest' ? '投资' : '我的'
          var tab = null
          for (var b = 0; b < navBtns.length; b++) if ((navBtns[b].textContent || '').trim().indexOf(want) >= 0) { tab = navBtns[b]; break }
          if (tab) { tab.click(); steps.push('tab:' + want) } else steps.push('tab missing')
          await wait(1800)
          if (flowText[flow]) {
            var hit = null, all = Array.prototype.slice.call(document.querySelectorAll('button'))
            for (var c = 0; c < all.length; c++) if ((all[c].textContent || '').trim() === flowText[flow]) { hit = all[c]; break }
            if (hit) { hit.click(); steps.push('clicked:' + flowText[flow]) }
            else steps.push('entry missing:' + flowText[flow])
            await wait(2200)
          }
          if (flow === 'support') {
            var sup = null, bs = Array.prototype.slice.call(document.querySelectorAll('button'))
            for (var s = 0; s < bs.length; s++) if ((bs[s].textContent || '').indexOf('在线客服') >= 0) { sup = bs[s]; break }
            if (sup) { sup.click(); steps.push('open support') } else steps.push('support entry missing')
            await wait(2600)
          }
        }
      }
      await wait(1600)
      var rep = measure()
      rep.flow = flow
      rep.steps = steps
      rep.buttons = Array.prototype.slice.call(document.querySelectorAll('button'))
        .filter(function (b) { var r = b.getBoundingClientRect(); return r.width > 0 && r.height > 0 })
        .map(function (b) { return (b.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 12) })
        .filter(function (t) { return t })
        .slice(0, 40)
      rep.inputs = Array.prototype.slice.call(document.querySelectorAll('input,select,textarea'))
        .filter(function (el) { var r = el.getBoundingClientRect(); return r.width > 0 })
        .map(function (el) { return (el.name || el.type || el.tagName.toLowerCase()) + ':' + getComputedStyle(el).fontSize })
        .slice(0, 20)
      rep.viewport = (document.querySelector('meta[name=viewport]') || {}).content || ''
      rep.scrollProbe = scrollProbe()
      publish(rep)
    } catch (e) {
      publish({ error: String(e), stack: (e && e.stack || '').slice(0, 400), flow: flow, steps: steps })
    }
  }
  if (document.readyState === 'complete') run()
  else window.addEventListener('load', run)
})()
