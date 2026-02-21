import type { View } from './views/HomeView'

export type LocationState = { view: View; factionFilter: string | null }

const BASE = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '') || ''

/** Category view to URL slug. */
const CATEGORY_TO_SLUG: Record<Exclude<View, 'home' | 'search'>, string> = {
  action: 'action_cards',
  agenda: 'agendas',
  strategy: 'strategy_cards',
  public_objective: 'public_objectives',
  secret_objective: 'secret_objectives',
  legendary_planet: 'legendary_planets',
  exploration: 'exploration',
  relic: 'relics',
  faction_ability: 'faction_abilities',
  faction_leader: 'faction_leaders',
  promissory_note: 'promissory_notes',
  breakthrough: 'breakthroughs',
  technology: 'technologies',
  galactic_event: 'galactic_events',
  unit: 'units',
}

const SLUG_TO_CATEGORY = new Map<string, Exclude<View, 'home' | 'search'>>(
  (Object.entries(CATEGORY_TO_SLUG) as [Exclude<View, 'home' | 'search'>, string][]).map(
    ([view, slug]) => [slug, view]
  )
)

export function locationToPath(state: LocationState): string {
  const { view, factionFilter } = state
  if (view === 'home') return `${BASE}/`
  if (view === 'search') {
    if (factionFilter) return `${BASE}/factions/${encodeURIComponent(factionFilter)}`
    return `${BASE}/search`
  }
  const slug = CATEGORY_TO_SLUG[view]
  if (slug) return `${BASE}/categories/${slug}`
  return `${BASE}/`
}

export function pathToLocation(pathname: string): LocationState {
  const path = BASE ? (pathname.startsWith(BASE) ? pathname.slice(BASE.length) || '/' : pathname) : pathname
  const segments = path.split('/').filter(Boolean)

  if (segments.length === 0) return { view: 'home', factionFilter: null }
  if (segments[0] === 'search') return { view: 'search', factionFilter: null }
  if (segments[0] === 'factions' && segments[1]) {
    return { view: 'search', factionFilter: decodeURIComponent(segments[1]) }
  }
  if (segments[0] === 'categories' && segments[1]) {
    const view = SLUG_TO_CATEGORY.get(segments[1])
    if (view) return { view, factionFilter: null }
  }
  return { view: 'home', factionFilter: null }
}

export function getCurrentPath(): string {
  return window.location.pathname
}
