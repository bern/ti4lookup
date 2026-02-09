import type { CardItem } from '../types'
import { ResultRow } from './ResultRow'

interface ResultsListProps {
  cards: CardItem[]
  loading?: boolean
  error?: string | null
}

function cardKey(card: CardItem, index: number): string {
  const version = 'version' in card ? card.version : ''
  if (card.type === 'action') return `action-${card.name}-${version}-${index}`
  if (card.type === 'strategy') return `strategy-${card.name}-${version}-${card.initiative}-${index}`
  if (card.type === 'agenda') return `agenda-${card.name}-${version}-${index}`
  if (card.type === 'public_objective') return `public_objective-${card.name}-${version}-${index}`
  if (card.type === 'secret_objective') return `secret_objective-${card.name}-${version}-${index}`
  if (card.type === 'legendary_planet') return `legendary_planet-${card.name}-${version}-${index}`
  if (card.type === 'exploration') return `exploration-${card.name}-${card.explorationType}-${version}-${index}`
  if (card.type === 'faction_ability') return `faction_ability-${card.factionId}-${card.name}-${index}`
  if (card.type === 'faction_leader') return `faction_leader-${card.factionId}-${card.name}-${card.leaderType}-${version}-${index}`
  if (card.type === 'promissory_note') return `promissory_note-${card.factionId}-${card.name}-${version}-${index}`
  if (card.type === 'breakthrough') return `breakthrough-${card.factionId}-${card.name}-${index}`
  return `fallback-${index}`
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
