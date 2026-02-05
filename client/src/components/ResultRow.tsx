import type { ActionCard } from '../types'

interface ResultRowProps {
  card: ActionCard
}

export function ResultRow({ card }: ResultRowProps) {
  return (
    <article className="result-row">
      <header className="result-row__header">
        <span className="result-row__name">{card.name}</span>
        <span className="result-row__version">{card.version}</span>
      </header>
      {card.timing ? (
        <p className="result-row__timing">{card.timing}</p>
      ) : null}
      <p className="result-row__effect">{card.effect}</p>
    </article>
  )
}
