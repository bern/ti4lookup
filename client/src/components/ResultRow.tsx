import type { CardItem } from '../types'

/** Strategy card color name → rgba with low opacity for readable bg. */
const CARD_COLOR_BG: Record<string, string> = {
  red: 'rgba(180, 50, 50, 0.1)',
  orange: 'rgba(220, 120, 40, 0.1)',
  yellow: 'rgba(200, 170, 50, 0.15)',
  green: 'rgba(50, 140, 70, 0.1)',
  teal: 'rgba(40, 140, 140, 0.1)',
  'light blue': 'rgba(100, 160, 220, 0.1)',
  'dark blue': 'rgba(50, 80, 160, 0.1)',
  purple: 'rgba(120, 70, 160, 0.1)',
}

function getCardBgStyle(card: CardItem): { backgroundColor?: string } {
  if (card.type !== 'strategy' || !card.color) return {}
  const bg = CARD_COLOR_BG[card.color.toLowerCase()]
  return bg ? { backgroundColor: bg } : {}
}

interface ResultRowProps {
  card: CardItem
}

export function ResultRow({ card }: ResultRowProps) {
  const bgStyle = getCardBgStyle(card)

  if (card.type === 'action') {
    return (
      <article className="result-row result-row--action" style={bgStyle}>
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
  return (
    <article className="result-row result-row--strategy" style={bgStyle}>
      <header className="result-row__header">
        <span className="result-row__name">{card.name}</span>
        <span className="result-row__meta">
          {card.initiative} · {card.color} · {card.version}
        </span>
      </header>
      <p className="result-row__label">Primary</p>
      <p className="result-row__effect">{card.primary}</p>
      <p className="result-row__label">Secondary</p>
      <p className="result-row__effect result-row__effect--secondary">{card.secondary}</p>
    </article>
  )
}
