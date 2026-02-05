import { useState, useEffect } from 'react'
import { loadAllCards } from './data/loadCards'
import { useFuseSearch } from './search/useFuseSearch'
import { SearchInput } from './components/SearchInput'
import { ResultsList } from './components/ResultsList'
import type { CardItem } from './types'

export function App() {
  const [cards, setCards] = useState<CardItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadAllCards()
      .then(setCards)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false))
  }, [])

  const { query, setQuery, results } = useFuseSearch(cards)

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">TI4 Action Card Lookup</h1>
        <SearchInput value={query} onChange={setQuery} placeholder="Search action & strategy cards…" />
      </header>
      <main className="app-main">
        <ResultsList cards={results} loading={loading} error={error} />
      </main>
    </div>
  )
}
