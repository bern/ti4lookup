import { SearchInput } from '../components/SearchInput'
import { ResultsList } from '../components/ResultsList'
import { useFuseSearch } from '../search/useFuseSearch'
import type { CardItem } from '../types'
import type { CardType } from '../search/useFuseSearch'

const CATEGORY_LABELS: Record<CardType, string> = {
  action: 'Action Cards',
  agenda: 'Agendas',
  strategy: 'Strategy Cards',
  public_objective: 'Public Objectives',
  secret_objective: 'Secret Objectives',
}

const CATEGORY_PLACEHOLDERS: Record<CardType, string> = {
  action: 'Search action cards…',
  agenda: 'Search agendas…',
  strategy: 'Search strategy cards…',
  public_objective: 'Search public objectives…',
  secret_objective: 'Search secret objectives…',
}

interface CategoryViewProps {
  cards: CardItem[]
  category: CardType
  onBack: () => void
}

export function CategoryView({ cards, category, onBack }: CategoryViewProps) {
  const { query, setQuery, results } = useFuseSearch(cards, {
    typeFilter: category,
  })

  return (
    <div className="category-view">
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
          placeholder={CATEGORY_PLACEHOLDERS[category]}
          autoFocus
          aria-label={`Search ${CATEGORY_LABELS[category].toLowerCase()}`}
        />
      </div>
      <main className="category-view__main">
        <h2 className="section-title">{CATEGORY_LABELS[category]}</h2>
        <ResultsList cards={results} />
      </main>
    </div>
  )
}
