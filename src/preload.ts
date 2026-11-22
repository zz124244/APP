import type {createApi} from './api'

type Service = ReturnType<typeof createApi>
type StageTask = () => Promise<unknown>

async function run(tasks: StageTask[]): Promise<void> {
  await Promise.allSettled(tasks.map(task => task()))
}

function cached(service: Service, key: string, path: string, persist = false): StageTask {
  return () => (typeof service.refreshCached==='function'?service.refreshCached(key, () => service.request(path), { persist }):service.request(path)).then(() => undefined)
}

export type PreloadRun = { done: Promise<void>; cancel: () => void }

export function startPreload(service: Service, uid: string): PreloadRun {
  let cancelled = false
  const guarded = (task: StageTask): StageTask => async () => {
    if (cancelled) return
    await task()
  }

  const stageOne = run([
    guarded(cached(service, 'public:content.home', '/content/home', true)),
    guarded(cached(service, 'public:content.community:featured:1', '/content/articles?category=community&column=featured&page=1', true)),
    guarded(cached(service, `user:${uid}:wallet.summary`, '/wallet/summary')),
    guarded(cached(service, `user:${uid}:announcement`, '/announcement')),
    guarded(cached(service, `user:${uid}:products:featured:1`, '/products?featured=1&page=1')),
    guarded(cached(service, `user:${uid}:products:novice:1`, '/products?category=novice&page=1')),
    guarded(cached(service, `user:${uid}:products:fixed:1`, '/products?category=fixed&page=1')),
    guarded(cached(service, `user:${uid}:products:vip:1`, '/products?category=vip&page=1')),
    guarded(cached(service, `user:${uid}:products:benefit:1`, '/products?category=benefit&page=1')),
    guarded(cached(service, `user:${uid}:products:equity:1`, '/products?category=equity&page=1')),
  ])

  const stageTwo = stageOne.then(() => run([
    guarded(cached(service, `user:${uid}:withdrawal-config`, '/withdrawal-config')),
    guarded(cached(service, `user:${uid}:payment-password`, '/security/payment-password')),
    guarded(cached(service, `user:${uid}:checkins.calendar`, '/checkins/calendar')),
    guarded(cached(service, `user:${uid}:tasks.config`, '/tasks/config')),
    guarded(cached(service, `user:${uid}:tasks`, '/tasks')),
    guarded(cached(service, `user:${uid}:team.summary`, '/team/summary')),
    guarded(cached(service, `user:${uid}:invitations.mine`, '/invitations/mine')),
    guarded(cached(service, `user:${uid}:lottery`, '/lottery')),
    guarded(cached(service, `user:${uid}:mall.products:1`, '/mall/products')),
    guarded(cached(service, `user:${uid}:wallet.transfers`, '/wallet/transfers')),
  ]))

  const stageThree = stageTwo.then(() => run([
    guarded(cached(service, `user:${uid}:investments.active`, '/investments')),
    guarded(cached(service, `user:${uid}:wallet.entries`, '/wallet/entries')),
    guarded(cached(service, `user:${uid}:deposits`, '/deposits')),
    guarded(cached(service, `user:${uid}:withdrawals`, '/withdrawals')),
    guarded(cached(service, `user:${uid}:withdrawal-addresses`, '/withdrawal-addresses')),
    guarded(cached(service, `user:${uid}:support.conversation`, '/support/conversation')),
    guarded(cached(service, 'public:content.community:benefits:1', '/content/articles?category=community&column=benefits&page=1', true)),
    guarded(cached(service, 'public:content.community:projects:1', '/content/articles?category=community&column=projects&page=1', true)),
    guarded(cached(service, 'public:content.community:academy:1', '/content/articles?category=community&column=academy&page=1', true)),
  ]))

  return { done: stageThree, cancel: () => { cancelled = true } }
}
