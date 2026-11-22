// Local-only layout audit harness for the built iOS web bundle.
// Serves ios/App/App/public on 127.0.0.1 with a stubbed /api/v1 so no external host is ever contacted.
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url')

const ROOT = path.resolve(__dirname, 'public')
const PORT = Number(process.env.PORT || 8731)
let authMode = process.env.AUTH === '0' ? 0 : 1   // 0 = behave signed-out, 1 = signed-in stub

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2',
  '.mp4': 'video/mp4', '.txt': 'text/plain; charset=utf-8',
}

const art = (id, column, title, summary) => ({
  id, category: 'community', column: column || null, title, summary: summary || '这是用于布局审计的示例摘要文本，长度接近真实内容，用来检查换行与溢出。',
  date: '2025-01-0' + (1 + (id.length % 8)), cover_url: null, body: null, image_urls: [], video_url: null,
})

// Worst-case-but-plausible records: 7-digit money, 66-char hashes, long order numbers, full addresses.
const TX = 'a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90'
const ADDR = 'TXk9mQ2rLpV7sN4hJ8fD1cB6yG3uW5zA0eR'
const record = (i, kind) => ({
  id: 'row-' + i, type: kind, movement: 'increase', status: 'completed', kind,
  title: kind === 'deposit' ? '充值入金' : kind === 'withdraw' ? '提现出金' : '认购扣款',
  description: '链上转账 · TRC20 · 区块确认 19/19',
  amount: '1234567.89', amount_usdt: '1234567.89', fee: '1234.56', net_amount: '1233333.33',
  balance: '2387634.5678', total: '2387634.5678',
  tx_hash: TX, txid: TX, hash: TX, order_no: 'JH2025010800012345', order_number: 'JH2025010800012345',
  network: 'TRC20', address: ADDR, to_address: ADDR, from_address: ADDR,
  account: '139****1234', account_masked: '139****1234', phone: '139****1234',
  created_at: '2025-01-08T12:34:56+08:00', date: '2025-01-08', business_date: '2025-01-08',
  remark: '系统自动入账，如有疑问请联系在线客服核实处理',
})
const records = (kind, n) => ({ items: Array.from({ length: n }, (_, i) => record(i, kind)), next_page: null, next_before: null, total: '99999999.9999', summary: { total: '99999999.9999', count: n } })

const articles = (column, page) => ({
  items: [art(column + '-a' + page, column, '九合创投：长期主义与产业协同的第八年'), art(column + '-b' + page, column, '被投企业季度观察与行业趋势速览')],
  next_page: page < 2 ? page + 1 : null,
})

function fixture(pathname) {
  const p = pathname.replace(/^\/api\/v1/, '')
  const u = url.parse(p, true), q = u.query, route = u.pathname
  if (route === '/auth/me') {
    if (!authMode) return { status: 401, body: { message_key: 'session_expired' } }
    return { body: { uid: 'U1000001', phone: '13900001234', vip_level: 3 } }
  }
  if (route === '/auth/logout') return { body: {} }
  if (route === '/wallet/summary') return { body: { available: '128888.88', withdrawable: '88888.88', invested: '520000.00', frozen: '1200.00', total_assets: '2387634.5678', points: '128000', recharge_total: '1000000.00', withdrawal_net_total: '200000.00', investment_historical_total: '500000.00', investment_outstanding_total: '300000.00' } }
  if (route === '/announcement') return { body: null }
  if (route === '/content/home') return { body: { video: null, updates: [art('u1', 'updates', '平台服务协议更新公告'), art('u2', 'updates', '关于收益结算周期的说明')], news: [art('n1', null, '九合创投完成新一轮产业基金募集'), art('n2', null, '被投企业登陆资本市场'), art('n3', null, '行业观察：长期资本的结构性机会')] } }
  if (route === '/content/articles') return { body: articles(String(q.column || 'all'), Number(q.page || 1)) }
  if (route.startsWith('/content/articles/')) return { body: art('d1', null, '详情标题：产业投资的长期主义实践与结构性机会', '正文段落。'.repeat(20)) }
  if (route === '/team/summary') return { body: { direct_count: 12, indirect_count: 128, total_commission: '12345.67', level: 2, invite_code: 'JH8848999' } }
  if (route === '/team/members') return { body: { items: [1, 2, 3].map(i => ({ ...record(i, 'team'), level: i, direct_count: 12 * i, total_commission: '123456.78' })), next_depth: null } }
  if (route === '/wallet/entries') return { body: records('entry', 5) }
  if (route === '/wallet/transfers') return { body: records('transfer', 4) }
  if (route === '/deposits') return { body: records('deposit', 4) }
  if (route === '/withdrawals') return { body: records('withdraw', 4) }
  if (route === '/investments') return { body: records('investment', 3) }
  if (route === '/withdrawal-addresses') return { body: records('address', 2) }
  if (route === '/lottery') return { body: { business_date: '2025-01-08', current_vip_level: 3, eligible: true, enabled: true, available: true, draw_limit: 4, used: 1, remaining: 3, wheel: [], config_version: '1' } }
  if (route === '/mall/products') return { body: { items: [], next_page: null } }
  if (route === '/checkins/calendar') return { body: { days: [] } }
  if (route === '/withdrawal-config') return { body: { min_amount: '100', max_amount: '50000', fee_rate: '0.01', networks: [] } }
  if (route === '/support/conversation') return { body: { id: 'c1', status: 'open', unread: 0 } }
  if (route === '/support/messages') return {
    body: {
      items: [
        { id: 'm1', sender_type: 'staff', text: '您好，这里是九合创投在线客服，请问有什么可以帮您？', file_id: null, sent_at: '2025-01-08T12:30:00+08:00' },
        { id: 'm2', sender_type: 'user', text: '我想确认一下充值到账时间，已经转账 30 分钟了。', file_id: null, sent_at: '2025-01-08T12:31:00+08:00' },
        { id: 'm3', sender_type: 'staff', text: 'TRC20 一般 1-3 分钟确认，请把交易哈希发给我，我帮您核查区块确认数。', file_id: null, sent_at: '2025-01-08T12:32:00+08:00' },
      ],
      profile: { display_name: '九合客服', staffed_hours: true, avatar_id: null },
      next_before: null,
    }
  }
  if (route.startsWith('/app/releases')) return { body: null }
  if (route === '/products') return { body: { items: [], next_page: null } }
  return { body: Array.isArray(q.page) ? [] : [] }
}

const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url, true)
  if (parsed.pathname === '/__mode') {
    authMode = parsed.query.auth === '0' ? 0 : 1
    res.writeHead(200, { 'content-type': 'application/json' })
    return res.end(JSON.stringify({ authMode }))
  }
  if (parsed.pathname.startsWith('/api/v1')) {
    const f = fixture(parsed.pathname)
    if (process.env.LOGREQ === '1') console.log('[api] ' + (f.status || 200) + ' ' + req.method + ' ' + req.url)
    res.writeHead(f.status || 200, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' })
    return res.end(JSON.stringify(f.status ? { message_key: f.body.message_key } : { data: f.body }))
  }
  let file = path.join(ROOT, decodeURIComponent(parsed.pathname))
  if (parsed.pathname === '/' || parsed.pathname === '') file = path.join(ROOT, 'index.html')
  if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end('no') }
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) { res.writeHead(404, { 'content-type': 'text/plain' }); return res.end('not found: ' + parsed.pathname) }
    res.writeHead(200, { 'content-type': MIME[path.extname(file)] || 'application/octet-stream', 'cache-control': 'no-store' })
    fs.createReadStream(file).pipe(res)
  })
})
server.listen(PORT, '127.0.0.1', () => console.log('audit server on http://127.0.0.1:' + PORT + ' auth=' + authMode))
