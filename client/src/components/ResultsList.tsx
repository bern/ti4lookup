import type { CardItem } from '../types'
import { ResultRow } from './ResultRow'

interface ResultsListProps {
  cards: CardItem[]
  loading?: boolean
  error?: string | null
}

function cardKey(card: CardItem, index: number): string {
  if (card.type === 'action') return `action-${card.name}-${card.version}-${index}`
  if (card.type === 'strategy') return `strategy-${card.name}-${card.version}-${card.initiative}-${index}`
  return `agenda-${card.name}-${card.version}-${index}`
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
      {cards.map((card, i) => (
        <li key={cardKey(card, i)} className="results-list__item">
          <ResultRow card={card} />
        </li>
      ))}
    </ul>
  )
}
