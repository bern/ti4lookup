import { SearchInput } from '../components/SearchInput'
import { ResultsList } from '../components/ResultsList'
import { useFuseSearch, partitionByType } from '../search/useFuseSearch'
import type { CardItem } from '../types'

const RECENT_MAX = 10

interface SearchViewProps {
  cards: CardItem[]
  recentSearches: string[]
  onAddRecent: (query: string) => void
  onBack: () => void
}

export function SearchView({
  cards,
  recentSearches,
  onAddRecent,
  onBack,
}: SearchViewProps) {
  const { query, setQuery, results } = useFuseSearch(cards, {
    limit: 120,
  })

  const commitRecent = (q: string) => {
    const trimmed = q.trim()
    if (trimmed) onAddRecent(trimmed)
  }

  const partitioned = partitionByType(results)
  const hasQuery = query.trim() !== ''
  const showRecent = !hasQuery && recentSearches.length > 0

  return (
    <div className="search-view">
      <div className="view-bar">
        <button
          type="button"
          className="back-btn"
          onClick={onBack}
          aria-label="Back to home"
        >
          ← Back
        </button>
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Search all…"
          autoFocus
          aria-label="Search all categories"
          onCommit={commitRecent}
        />
      </div>
      <main className="search-view__main">
        {showRecent && (
          <section className="recent-searches" aria-label="Recent searches">
            <h2 className="section-title">Recent searches</h2>
            <ul className="recent-searches__list">
              {recentSearches.slice(0, RECENT_MAX).map((q) => (
                <li key={q}>
                  <button
                    type="button"
                    className="recent-searches__item"
                    onClick={() => setQuery(q)}
                  >
                    {q}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}
        {hasQuery && (
          <div className="search-results-partitioned">
            {partitioned.action.length > 0 && (
              <section className="results-section" aria-label="Action Cards">
                <h2 className="section-title">Action Cards</h2>
                <ResultsList cards={partitioned.action} />
              </section>
            )}
            {partitioned.agenda.length > 0 && (
              <section className="results-section" aria-label="Agendas">
                <h2 className="section-title">Agendas</h2>
                <ResultsList cards={partitioned.agenda} />
              </section>
            )}
            {partitioned.strategy.length > 0 && (
              <section className="results-section" aria-label="Strategy Cards">
                <h2 className="section-title">Strategy Cards</h2>
                <ResultsList cards={partitioned.strategy} />
              </section>
            )}
            {partitioned.public_objective.length > 0 && (
              <section className="results-section" aria-label="Public Objectives">
                <h2 className="section-title">Public Objectives</h2>
                <ResultsList cards={partitioned.public_objective} />
              </section>
            )}
            {partitioned.secret_objective.length > 0 && (
              <section className="results-section" aria-label="Secret Objectives">
                <h2 className="section-title">Secret Objectives</h2>
                <ResultsList cards={partitioned.secret_objective} />
              </section>
            )}
            {partitioned.legendary_planet.length > 0 && (
              <section className="results-section" aria-label="Legendary Planets">
                <h2 className="section-title">Legendary Planets</h2>
                <ResultsList cards={partitioned.legendary_planet} />
              </section>
            )}
            {results.length === 0 && (
              <p className="results-message">No results found.</p>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
