import { useState, useCallback, useEffect, useMemo } from 'react'
import { loadAllCards, loadFactions, type Faction } from './data/loadCards'
import { HomeView, type View } from './views/HomeView'
import { SearchView } from './views/SearchView'
import { CategoryView } from './views/CategoryView'
import { ThemeSelector, type ThemeId } from './components/ThemeSelector'
import {
  ExpansionSelector,
  type ExpansionId,
  expansionIdsToVersions,
  cardVersionMatchesExpansions,
} from './components/ExpansionSelector'
import type { CardItem } from './types'

const RECENT_MAX = 10
const THEME_STORAGE_KEY = 'ti4lookup-theme'
const EXPANSIONS_STORAGE_KEY = 'ti4lookup-expansions'

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

export function App() {
  const [cards, setCards] = useState<CardItem[]>([])
  const [factions, setFactions] = useState<Faction[]>([])
  const [factionFilter, setFactionFilter] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [view, setView] = useState<View>('home')
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [theme, setTheme] = useState<ThemeId>(() => {
    try {
      const s = localStorage.getItem(THEME_STORAGE_KEY)
      if (s && ['light', 'dark', 'hylar', 'gashlai', 'void'].includes(s)) return s as ThemeId
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

  const visibleFactions = useMemo(() => {
    const versions = expansionIdsToVersions(expansions)
    return factions.filter((f) =>
      cardVersionMatchesExpansions(f.version, versions)
    )
  }, [factions, expansions])

  const filteredCards = useMemo(() => {
    const versions = expansionIdsToVersions(expansions)
    let result = cards.filter((card) => cardVersionMatchesExpansions(
      'version' in card ? card.version : undefined,
      versions
    ))
    if (factionFilter) {
      result = result.filter((card) => {
        if ('factionId' in card && card.factionId === factionFilter) return true
        if (card.type === 'plot' && 'factionIds' in card && card.factionIds?.includes(factionFilter)) return true
        return false
      })
    }
    return result
  }, [cards, expansions, factionFilter])

  useEffect(() => {
    try {
      localStorage.setItem(EXPANSIONS_STORAGE_KEY, JSON.stringify([...expansions]))
    } catch {
      /* ignore */
    }
  }, [expansions])

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
  }, [view])

  if (error) {
    return (
      <div className="app">
        <header className="app-header">
          <button
            type="button"
            className="app-title app-title--btn"
            onClick={() => setView('home')}
          >
            TI4 Lookup
          </button>
          <div className="app-header__actions">
            <ExpansionSelector selected={expansions} onChange={setExpansions} />
            <ThemeSelector value={theme} onChange={setTheme} />
          </div>
        </header>
        <main className="app-main">
          <p className="results-message results-message--error">{error}</p>
        </main>
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
            onClick={() => setView('home')}
          >
            TI4 Lookup
          </button>
          <div className="app-header__actions">
            <ExpansionSelector selected={expansions} onChange={setExpansions} />
            <ThemeSelector value={theme} onChange={setTheme} />
          </div>
        </header>
        <main className="app-main">
          <p className="results-message">Loading…</p>
        </main>
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
            setFactionFilter(null)
            setView('home')
          }}
          aria-label="Back to home"
        >
          TI4 Lookup
        </button>
        <div className="app-header__actions">
          <ExpansionSelector selected={expansions} onChange={setExpansions} />
          <ThemeSelector value={theme} onChange={setTheme} />
        </div>
      </header>
      {view === 'home' && (
        <main className="app-main home-main">
          <HomeView
            factions={visibleFactions}
            onOpenSearch={() => {
              setFactionFilter(null)
              setView('search')
            }}
            onOpenFaction={(factionId) => {
              setFactionFilter(factionId)
              setView('search')
            }}
            onOpenCategory={(v) => setView(v)}
          />
        </main>
      )}
      {view === 'search' && (
        <SearchView
          cards={filteredCards}
          recentSearches={recentSearches}
          factionFilter={factionFilter}
          factionFilterName={factionFilter ? factions.find((f) => f.id === factionFilter)?.name ?? null : null}
          onAddRecent={onAddRecent}
          onBack={() => {
            setFactionFilter(null)
            setView('home')
          }}
        />
      )}
      {(view === 'action' || view === 'agenda' || view === 'strategy' || view === 'public_objective' || view === 'secret_objective' || view === 'legendary_planet' || view === 'exploration' || view === 'faction_ability' || view === 'faction_leader' || view === 'promissory_note' || view === 'breakthrough' || view === 'technology' || view === 'galactic_event' || view === 'plot') && (
        <CategoryView
          cards={filteredCards}
          category={view}
          onBack={() => setView('home')}
        />
      )}
    </div>
  )
}
