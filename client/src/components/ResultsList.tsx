import type { ActionCard } from '../types'
import { ResultRow } from './ResultRow'

interface ResultsListProps {
  cards: ActionCard[]
  loading?: boolean
  error?: string | null
}

export function ResultsList({ cards, loading, error }: ResultsListProps) {
  if (error) {
    return <p className="results-message results-message--error">{error}</p>
  }
  if (loading) {
    return <p className="results-message">Loading cards…</p>
  }
  if (cards.length === 0) {
    return <p className="results-message">No cards found.</p>
  }
  return (
    <ul className="results-list" role="list">
      {cards.map((card) => (
        <li key={card.name} className="results-list__item">
          <ResultRow card={card} />
        </li>
      ))}
    </ul>
  )
}
