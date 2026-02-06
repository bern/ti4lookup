import { useState, useCallback, useEffect } from 'react'
import { loadAllCards } from './data/loadCards'
import { HomeView, type View } from './views/HomeView'
import { SearchView } from './views/SearchView'
import { CategoryView } from './views/CategoryView'
import type { CardItem } from './types'

const RECENT_MAX = 10

function addRecent(prev: string[], query: string): string[] {
  const trimmed = query.trim()
  if (!trimmed) return prev
  const rest = prev.filter((q) => q !== trimmed)
  return [trimmed, ...rest].slice(0, RECENT_MAX)
}

export function App() {
  const [cards, setCards] = useState<CardItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [view, setView] = useState<View>('home')
  const [recentSearches, setRecentSearches] = useState<string[]>([])

  useEffect(() => {
    loadAllCards()
      .then(setCards)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false))
  }, [])

  const onAddRecent = useCallback((query: string) => {
    setRecentSearches((prev) => addRecent(prev, query))
  }, [])

  if (error) {
    return (
      <div className="app">
        <header className="app-header">
          <h1 className="app-title">TI4 Lookup</h1>
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
          <h1 className="app-title">TI4 Lookup</h1>
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
        <h1 className="app-title">TI4 Lookup</h1>
      </header>
      {view === 'home' && (
        <main className="app-main home-main">
          <HomeView
            onOpenSearch={() => setView('search')}
            onOpenCategory={(v) => setView(v)}
          />
        </main>
      )}
      {view === 'search' && (
        <SearchView
          cards={cards}
          recentSearches={recentSearches}
          onAddRecent={onAddRecent}
          onBack={() => setView('home')}
        />
      )}
      {(view === 'action' || view === 'agenda' || view === 'strategy') && (
        <CategoryView
          cards={cards}
          category={view}
          onBack={() => setView('home')}
        />
      )}
    </div>
  )
}
