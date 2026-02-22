import { useState, useCallback, useEffect, useMemo } from 'react'
import { loadAllCards, loadFactions, type Faction } from './data/loadCards'
import { HomeView } from './views/HomeView'
import { SearchView } from './views/SearchView'
import { CategoryView } from './views/CategoryView'
import type { ThemeId } from './components/ThemeSelector'
import {
  ExpansionSelector,
  type ExpansionId,
  expansionIdsToVersions,
  cardVersionMatchesExpansions,
  isExcludedByExcludeAfter,
  isExcludedByExcludeIn,
  filterToLatestOmega,
} from './components/ExpansionSelector'
import { AppFooter } from './components/AppFooter'
import type { CardItem } from './types'
import { pathToLocation, locationToPath, type LocationState } from './routes'

const RECENT_MAX = 10
const THEME_STORAGE_KEY = 'ti4lookup-theme'
const EXPANSIONS_STORAGE_KEY = 'ti4lookup-expansions'
const INCLUDE_RETIRED_STORAGE_KEY = 'ti4lookup-include-retired'

function parseStoredExpansions(s: string | null): Set<ExpansionId> {
  if (!s) return new Set()
  try {
    const parsed = JSON.parse(s) as unknown
    if (!Array.isArray(parsed)) return new Set()
    const valid = ['baseGame', 'pok', 'codex1', 'codex2', 'codex3', 'codex4', 'thundersEdge'] as const
    return new Set(parsed.filter((id): id is ExpansionId => valid.includes(id)))
  } catch {
    return new Set()
  }
}

function addRecent(prev: string[], query: string): string[] {
  const trimmed = query.trim()
  if (!trimmed) return prev
  const rest = prev.filter((q) => q !== trimmed)
  return [trimmed, ...rest].slice(0, RECENT_MAX)
}

const HOME_STATE: LocationState = { view: 'home', factionFilter: null }
const DEFAULT_TITLE = 'TI4 Lookup: Search for anything in Twilight Imperium 4'

function getCategoryLabels(expansions: Set<ExpansionId>): Record<Exclude<LocationState['view'], 'home' | 'search'>, string> {
  const isTwilightsFall = expansions.has('twilightsFall')
  return {
    action: 'Action Cards',
    agenda: isTwilightsFall ? 'Edicts' : 'Agendas',
    strategy: 'Strategy Cards',
    public_objective: 'Public Objectives',
    secret_objective: 'Secret Objectives',
    legendary_planet: 'Legendary Planets',
    exploration: 'Exploration',
    relic: 'Relics',
    faction_ability: 'Faction Abilities',
    faction_leader: isTwilightsFall ? 'Genomes & Paradigms' : 'Faction Leaders',
    promissory_note: 'Promissory Notes',
    breakthrough: 'Breakthroughs',
    technology: 'Technologies',
    galactic_event: 'Galactic Events',
    unit: 'Units',
  }
}

export function App() {
  const [cards, setCards] = useState<CardItem[]>([])
  const [factions, setFactions] = useState<Faction[]>([])
  const [location, setLocation] = useState<LocationState>(HOME_STATE)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [theme, setTheme] = useState<ThemeId>(() => {
    try {
      const s = localStorage.getItem(THEME_STORAGE_KEY)
      if (s && ['light', 'dark', 'hylar', 'gashlai', 'void', 'mordai'].includes(s)) return s as ThemeId
    } catch {
      /* ignore */
    }
    return 'light'
  })
  const [expansions, setExpansions] = useState<Set<ExpansionId>>(() => {
    try {
      const s = localStorage.getItem(EXPANSIONS_STORAGE_KEY)
      if (s === null) return new Set(['baseGame','pok', 'codex1', 'codex2', 'codex3', 'codex4', 'thundersEdge'])
      const stored = parseStoredExpansions(s)
      return stored
    } catch {
      return new Set(['baseGame', 'pok', 'codex1', 'codex2', 'codex3', 'codex4', 'thundersEdge'])
    }
  })
  const [includeRetiredCards, setIncludeRetiredCards] = useState<boolean>(() => {
    try {
      const s = localStorage.getItem(INCLUDE_RETIRED_STORAGE_KEY)
      if (s === null) return true // default checked
      return s !== 'false'
    } catch {
      return true
    }
  })

  const visibleFactions = useMemo(() => {
    const versions = expansionIdsToVersions(expansions)
    let result = factions.filter((f) =>
      cardVersionMatchesExpansions(f.version, versions)
    )
    if (expansions.has('twilightsFall')) {
      result = result.filter((f) => f.version.toLowerCase() === 'twilights fall')
    }
    return result
  }, [factions, expansions])

  const techNameToColor = useMemo(() => {
    const map = new Map<string, string>()
    for (const card of cards) {
      if (card.type === 'technology' && card.techType) {
        const color = card.techType.trim().toLowerCase()
        if (['blue', 'green', 'red', 'yellow'].includes(color)) {
          map.set(card.name.trim(), color)
        }
      }
    }
    return map
  }, [cards])

  const filteredCards = useMemo(() => {
    const versions = expansionIdsToVersions(expansions)
    let result = cards.filter((card) => cardVersionMatchesExpansions(
      'version' in card ? card.version : undefined,
      versions
    ))
    const factionFilter = location.factionFilter
    if (factionFilter) {
      result = result.filter((card) => {
        if ('factionId' in card && card.factionId === factionFilter) return true
        if (card.type === 'plot' && 'factionIds' in card && card.factionIds?.includes(factionFilter)) return true
        if (card.type === 'legendary_planet' && 'factionId' in card && card.factionId === factionFilter) return true
        return false
      })
    }
    if (!includeRetiredCards) {
      result = result.filter((card) => {
        const excludeAfter = 'excludeAfter' in card ? card.excludeAfter : undefined
        if (excludeAfter && isExcludedByExcludeAfter(excludeAfter, expansions)) return false
        if (card.type === 'agenda' && 'excludeIn' in card && isExcludedByExcludeIn(card.excludeIn, expansions)) return false
        return true
      })
      result = filterToLatestOmega(result)
    }
    if (!expansions.has('pok')) {
      result = result.filter((card) => {
        if (card.type === 'faction_leader') return false
        if (card.type === 'exploration' && (card.explorationType ?? '').toLowerCase() !== 'relic') return false
        if (card.type === 'unit' && (card.unit ?? '').toLowerCase() === 'mech') return false
        return true
      })
    }
    if (!expansions.has('thundersEdge')) {
      result = result.filter((card) => {
        if (card.type === 'breakthrough') return false
        if (card.type === 'galactic_event') return false
        return true
      })
    }
    if (!expansions.has('pok')) {
      result = result.filter((card) => {
        if (card.type === 'galactic_event' && 'requiresPok' in card && card.requiresPok) return false
        return true
      })
    }
    const hasRelicExpansion = expansions.has('pok') || expansions.has('codex2') || expansions.has('codex4') || expansions.has('thundersEdge')
    if (!hasRelicExpansion) {
      result = result.filter((card) => {
        if (card.type === 'exploration' && (card.explorationType ?? '').toLowerCase() === 'relic') return false
        return true
      })
    }
    const hasLegendaryPlanetExpansion = expansions.has('pok') || expansions.has('codex3') || expansions.has('thundersEdge')
    if (!hasLegendaryPlanetExpansion) {
      result = result.filter((card) => {
        if (card.type === 'legendary_planet') return false
        return true
      })
    }
    if (expansions.has('twilightsFall')) {
      result = result.filter((card) => {
        if (card.type === 'action' && card.version.toLowerCase() !== 'twilights fall') return false
        if (card.type === 'agenda' && card.version.toLowerCase() !== 'twilights fall') return false
        if (card.type === 'faction_leader' && card.version.toLowerCase() !== 'twilights fall') return false
        if (card.type === 'faction_ability' && card.version.toLowerCase() !== 'twilights fall') return false
        if (card.type === 'strategy' && card.version.toLowerCase() !== 'twilights fall') return false
        if (card.type === 'unit' && card.version.toLowerCase() !== 'twilights fall') return false
        if (card.type === 'technology' && card.version.toLowerCase() !== 'twilights fall') return false
        return true
      })
    }
    return result
  }, [cards, expansions, location.factionFilter, includeRetiredCards])

  const navigate = useCallback((next: LocationState) => {
    const path = locationToPath(next)
    window.history.pushState(next, '', path)
    setLocation(next)
  }, [])

  const scrollToTop = useCallback(() => {
    window.scrollTo(0, 0)
    const main = document.querySelector('.search-view__main, .category-view__main, .app-main')
    if (main) main.scrollTop = 0
  }, [])

  const goHome = useCallback(() => {
    if (location.view !== 'home') {
      navigate(HOME_STATE)
    }
    scrollToTop()
  }, [navigate, location.view, scrollToTop])

  useEffect(() => {
    const state = pathToLocation(window.location.pathname)
    if (state.view !== 'home') {
      // Insert home into history so back from a direct deep link goes to root
      window.history.replaceState(HOME_STATE, '', locationToPath(HOME_STATE))
      window.history.pushState(state, '', locationToPath(state))
    } else {
      window.history.replaceState(state, '', locationToPath(state))
    }
    setLocation(state)
  }, [])

  useEffect(() => {
    const handlePopState = () => {
      setLocation(pathToLocation(window.location.pathname))
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(EXPANSIONS_STORAGE_KEY, JSON.stringify([...expansions]))
    } catch {
      /* ignore */
    }
  }, [expansions])

  useEffect(() => {
    try {
      localStorage.setItem(INCLUDE_RETIRED_STORAGE_KEY, String(includeRetiredCards))
    } catch {
      /* ignore */
    }
  }, [includeRetiredCards])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme)
    } catch {
      /* ignore */
    }
  }, [theme])

  useEffect(() => {
    Promise.all([loadAllCards(), loadFactions()])
      .then(([cardsData, factionsData]) => {
        setCards(cardsData)
        setFactions(factionsData)
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false))
  }, [])

  const onAddRecent = useCallback((query: string) => {
    setRecentSearches((prev) => addRecent(prev, query))
  }, [])

  useEffect(() => {
    window.scrollTo(0, 0)
    const main = document.querySelector('.search-view__main, .category-view__main, .app-main')
    if (main) main.scrollTop = 0
  }, [location.view])

  useEffect(() => {
    if (location.view === 'home') return
    let label: string
    if (location.view === 'search' && location.factionFilter) {
      label = factions.find((f) => f.id === location.factionFilter)?.name ?? location.factionFilter
    } else if (location.view === 'search') {
      label = 'Search'
    } else {
      label = getCategoryLabels(expansions)[location.view]
    }
    document.title = `${label} - TI4 Lookup`
    return () => {
      document.title = DEFAULT_TITLE
    }
  }, [location.view, location.factionFilter, factions, expansions])

  if (error) {
    return (
      <div className="app">
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <header className="app-header">
          <h1 className="app-title-wrap">
            <button
              type="button"
              className="app-title app-title--btn"
              onClick={goHome}
              aria-label="TI4 Lookup home"
            >
              TI4 Lookup
            </button>
          </h1>
          <div className="app-header__actions">
            <ExpansionSelector
              selected={expansions}
              onChange={setExpansions}
              includeRetiredCards={includeRetiredCards}
              onIncludeRetiredCardsChange={setIncludeRetiredCards}
            />
          </div>
        </header>
        <main id="main-content" className="app-main">
          <p className="results-message results-message--error" role="alert">{error}</p>
        </main>
        <AppFooter theme={theme} onThemeChange={setTheme} />
      </div>
    )
  }

  if (loading) {
    return (
      <div className="app">
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <header className="app-header">
          <h1 className="app-title-wrap">
            <button
              type="button"
              className="app-title app-title--btn"
              onClick={goHome}
              aria-label="TI4 Lookup home"
            >
              TI4 Lookup
            </button>
          </h1>
          <div className="app-header__actions">
            <ExpansionSelector
              selected={expansions}
              onChange={setExpansions}
              includeRetiredCards={includeRetiredCards}
              onIncludeRetiredCardsChange={setIncludeRetiredCards}
            />
          </div>
        </header>
        <main id="main-content" className="app-main">
          <p className="results-message">Loading…</p>
        </main>
        <AppFooter theme={theme} onThemeChange={setTheme} />
      </div>
    )
  }

  return (
    <div className="app">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <header className="app-header">
        <h1 className="app-title-wrap">
          <button
            type="button"
            className="app-title app-title--btn"
            onClick={goHome}
            aria-label={location.view === 'home' ? 'TI4 Lookup home' : 'Back to home'}
          >
            TI4 Lookup
          </button>
        </h1>
        <div className="app-header__actions">
          <ExpansionSelector
              selected={expansions}
              onChange={setExpansions}
              includeRetiredCards={includeRetiredCards}
              onIncludeRetiredCardsChange={setIncludeRetiredCards}
            />
        </div>
      </header>
      {location.view === 'home' && (
        <main id="main-content" className="app-main home-main">
          <HomeView
            factions={visibleFactions}
            cards={filteredCards}
            expansions={expansions}
            onOpenSearch={() => navigate({ view: 'search', factionFilter: null })}
            onOpenFaction={(factionId) => navigate({ view: 'search', factionFilter: factionId })}
            onOpenCategory={(v) => navigate({ view: v, factionFilter: null })}
          />
        </main>
      )}
      {location.view === 'search' && (
        <SearchView
          cards={filteredCards}
          recentSearches={recentSearches}
          factionFilter={location.factionFilter}
          factionFilterName={location.factionFilter ? factions.find((f) => f.id === location.factionFilter)?.name ?? null : null}
          faction={location.factionFilter ? factions.find((f) => f.id === location.factionFilter) ?? null : null}
          techNameToColor={techNameToColor}
          onAddRecent={onAddRecent}
          onBack={() => window.history.back()}
        />
      )}
      {(location.view === 'action' || location.view === 'agenda' || location.view === 'strategy' || location.view === 'public_objective' || location.view === 'secret_objective' || location.view === 'legendary_planet' || location.view === 'exploration' || location.view === 'relic' || location.view === 'faction_ability' || location.view === 'faction_leader' || location.view === 'promissory_note' || location.view === 'breakthrough' || location.view === 'technology' || location.view === 'galactic_event' || location.view === 'unit') && ( //location.view === 'genome'
        <CategoryView
          cards={filteredCards}
          category={location.view}
          onBack={() => window.history.back()}
        />
      )}
      <AppFooter theme={theme} onThemeChange={setTheme} />
    </div>
  )
}
