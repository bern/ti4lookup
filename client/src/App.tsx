import { useState, useCallback, useEffect, useMemo } from 'react'
import { loadAllCards, loadFactions, type Faction } from './data/loadCards'
import { HomeView, type View } from './views/HomeView'
import { SearchView } from './views/SearchView'
import { CategoryView } from './views/CategoryView'
import type { ThemeId } from './components/ThemeSelector'
import {
  ExpansionSelector,
  type ExpansionId,
  expansionIdsToVersions,
  cardVersionMatchesExpansions,
  isExcludedByExcludeAfter,
  isExcludedByRemovedInPok,
  filterToLatestOmega,
} from './components/ExpansionSelector'
import { AppFooter } from './components/AppFooter'
import type { CardItem } from './types'

const RECENT_MAX = 10
const THEME_STORAGE_KEY = 'ti4lookup-theme'
const EXPANSIONS_STORAGE_KEY = 'ti4lookup-expansions'
const INCLUDE_RETIRED_STORAGE_KEY = 'ti4lookup-include-retired'

function parseStoredExpansions(s: string | null): Set<ExpansionId> {
  if (!s) return new Set()
  try {
    const parsed = JSON.parse(s) as unknown
    if (!Array.isArray(parsed)) return new Set()
    const valid = ['pok', 'codex1', 'codex2', 'codex3', 'codex4', 'thundersEdge'] as const
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

export type LocationState = { view: View; factionFilter: string | null }

const HOME_STATE: LocationState = { view: 'home', factionFilter: null }

function applyLocationState(state: LocationState | null): LocationState {
  if (state && typeof state.view === 'string') {
    const view = state.view as View
    const factionFilter = state.factionFilter ?? null
    return { view, factionFilter }
  }
  return HOME_STATE
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
      const stored = parseStoredExpansions(localStorage.getItem(EXPANSIONS_STORAGE_KEY))
      if (stored.size > 0) return stored
      return new Set(['pok', 'codex1', 'codex2', 'codex3', 'codex4', 'thundersEdge'])
    } catch {
      return new Set(['pok', 'codex1', 'codex2', 'codex3', 'codex4', 'thundersEdge'])
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
    return factions.filter((f) =>
      cardVersionMatchesExpansions(f.version, versions)
    )
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
        return false
      })
    }
    if (!includeRetiredCards) {
      result = result.filter((card) => {
        const excludeAfter = 'excludeAfter' in card ? card.excludeAfter : undefined
        if (excludeAfter && isExcludedByExcludeAfter(excludeAfter, expansions)) return false
        if (card.type === 'agenda' && 'removedInPok' in card && isExcludedByRemovedInPok(card.removedInPok, expansions)) return false
        return true
      })
      result = filterToLatestOmega(result)
    }
    return result
  }, [cards, expansions, location.factionFilter, includeRetiredCards])

  const navigate = useCallback((next: LocationState) => {
    window.history.pushState(next, '', window.location.href)
    setLocation(next)
  }, [])

  useEffect(() => {
    const state = applyLocationState(window.history.state as LocationState | null)
    window.history.replaceState(state, '', window.location.href)
    setLocation(state)
  }, [])

  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      setLocation(applyLocationState(e.state as LocationState | null))
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

  if (error) {
    return (
      <div className="app">
        <header className="app-header">
          <button
            type="button"
            className="app-title app-title--btn"
            onClick={() => setLocation(HOME_STATE)}
          >
            TI4 Lookup
          </button>
          <div className="app-header__actions">
            <ExpansionSelector
              selected={expansions}
              onChange={setExpansions}
              includeRetiredCards={includeRetiredCards}
              onIncludeRetiredCardsChange={setIncludeRetiredCards}
            />
          </div>
        </header>
        <main className="app-main">
          <p className="results-message results-message--error">{error}</p>
        </main>
        <AppFooter theme={theme} onThemeChange={setTheme} />
      </div>
    )
  }

  if (loading) {
    return (
      <div className="app">
        <header className="app-header">
          <button
            type="button"
            className="app-title app-title--btn"
            onClick={() => setLocation(HOME_STATE)}
          >
            TI4 Lookup
          </button>
          <div className="app-header__actions">
            <ExpansionSelector
              selected={expansions}
              onChange={setExpansions}
              includeRetiredCards={includeRetiredCards}
              onIncludeRetiredCardsChange={setIncludeRetiredCards}
            />
          </div>
        </header>
        <main className="app-main">
          <p className="results-message">Loading…</p>
        </main>
        <AppFooter theme={theme} onThemeChange={setTheme} />
      </div>
    )
  }

  return (
    <div className="app">
      <header className="app-header">
        <button
          type="button"
          className="app-title app-title--btn"
          onClick={() => {
            if (location.view !== 'home') {
              window.history.back()
            }
          }}
          aria-label="Back to home"
        >
          TI4 Lookup
        </button>
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
        <main className="app-main home-main">
          <HomeView
            factions={visibleFactions}
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
      {(location.view === 'action' || location.view === 'agenda' || location.view === 'strategy' || location.view === 'public_objective' || location.view === 'secret_objective' || location.view === 'legendary_planet' || location.view === 'exploration' || location.view === 'relic' || location.view === 'faction_ability' || location.view === 'faction_leader' || location.view === 'promissory_note' || location.view === 'breakthrough' || location.view === 'technology' || location.view === 'galactic_event' || location.view === 'unit') && (
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
