import type { CardItem } from '../types'

const IMAGES_BASE = '/images'

/** Planet traits with icons (including frontier). */
const PLANET_TRAIT_IDS = new Set(['hazardous', 'cultural', 'industrial', 'relic', 'legendary', 'station', 'frontier'])
/** Exploration deck icons: relic, hazardous, cultural, industrial, frontier only. */
const EXPLORATION_TYPE_IDS = new Set(['relic', 'hazardous', 'cultural', 'industrial', 'frontier'])
const TECH_TYPE_IDS = new Set(['green', 'red', 'blue', 'yellow'])

/** Category label for each card type (shown at bottom of card when out-of-context). */
const CATEGORY_LABELS: Record<CardItem['type'], string> = {
  action: 'Action Cards',
  agenda: 'Agendas',
  strategy: 'Strategy Cards',
  public_objective: 'Public Objectives',
  secret_objective: 'Secret Objectives',
  legendary_planet: 'Legendary Planets',
  exploration: 'Exploration',
  faction_ability: 'Faction Abilities',
  faction_leader: 'Faction Leaders',
}

/** Image ids to show in card footer (faction/tech/trait). */
function getCardImages(card: CardItem): string[] {
  const ids: string[] = []
  if (card.type === 'faction_ability' && card.factionId) ids.push(card.factionId)
  if (card.type === 'faction_leader' && card.factionId) ids.push(card.factionId)
  if (card.type === 'exploration') {
    const t = card.explorationType?.toLowerCase()
    if (t && EXPLORATION_TYPE_IDS.has(t)) ids.push(t)
  }
  if (card.type === 'legendary_planet') {
    const trait = card.trait?.toLowerCase()
    if (trait && PLANET_TRAIT_IDS.has(trait)) ids.push(trait)
    const tech = card.technology?.toLowerCase()
    if (tech && TECH_TYPE_IDS.has(tech)) ids.push(tech)
  }
  return [...new Set(ids)]
}

function CardFooter({ card }: { card: CardItem }) {
  const label = CATEGORY_LABELS[card.type]
  const imageIds = getCardImages(card)
  return (
    <footer className="result-row__footer">
      <span className="result-row__category">{label}</span>
      {imageIds.length > 0 && (
        <span className="result-row__images">
          {imageIds.map((id) => (
            <img key={id} src={`${IMAGES_BASE}/${id}.png`} alt="" className="result-row__icon" />
          ))}
        </span>
      )}
    </footer>
  )
}

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

/** If effect contains "FOR:" and "AGAINST:", return intro (if any), forText, againstText; otherwise null. */
function parseForAgainst(effect: string): { introText: string; forText: string; againstText: string } | null {
  const match = /^(.*?)\s*FOR:\s*(.*?)\s*AGAINST:\s*(.*)/is.exec(effect)
  if (!match) return null
  const introText = match[1].trim()
  return {
    introText,
    forText: match[2].trim(),
    againstText: match[3].trim(),
  }
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
        <CardFooter card={card} />
      </article>
    )
  }

  if (card.type === 'agenda') {
    const forAgainst = parseForAgainst(card.effect)
    return (
      <article className="result-row result-row--agenda" style={bgStyle}>
        <header className="result-row__header">
          <span className="result-row__name">{card.name}</span>
          <span className="result-row__meta">
            {card.agendaType}
            {card.elect && card.elect !== '-' ? ` · Elect: ${card.elect}` : ''} · {card.version}
            {card.removedInPok === 'true' ? (
              <span className="result-row__removed" title="Removed in Prophecy of Kings"> · 🚫 Removed in PoK</span>
            ) : null}
          </span>
        </header>
        {forAgainst ? (
          <>
            {forAgainst.introText ? (
              <p className="result-row__effect">{forAgainst.introText}</p>
            ) : null}
            <p className="result-row__label">For</p>
            <p className="result-row__effect">{forAgainst.forText}</p>
            <p className="result-row__label">Against</p>
            <p className="result-row__effect result-row__effect--secondary">{forAgainst.againstText}</p>
          </>
        ) : (
          <p className="result-row__effect">{card.effect}</p>
        )}
        <CardFooter card={card} />
      </article>
    )
  }

  if (card.type === 'public_objective') {
    return (
      <article className="result-row result-row--public-objective" style={bgStyle}>
        <header className="result-row__header">
          <span className="result-row__name">{card.name}</span>
          <span className="result-row__meta">
            Stage {card.stage} · {card.points} VP · {card.whenToScore} · {card.version}
          </span>
        </header>
        <p className="result-row__effect">{card.condition}</p>
        <CardFooter card={card} />
      </article>
    )
  }

  if (card.type === 'secret_objective') {
    return (
      <article className="result-row result-row--secret-objective" style={bgStyle}>
        <header className="result-row__header">
          <span className="result-row__name">{card.name}</span>
          <span className="result-row__meta">
            {card.points} VP · {card.whenToScore} · {card.version}
          </span>
        </header>
        <p className="result-row__effect">{card.condition}</p>
        <CardFooter card={card} />
      </article>
    )
  }

  if (card.type === 'legendary_planet') {
    const meta = [card.trait, card.resources && card.influence ? `${card.resources}/${card.influence}` : card.resources || card.influence, card.technology ? `${card.technology} tech skip` : null].filter(Boolean).join(' · ')
    return (
      <article className="result-row result-row--legendary-planet" style={bgStyle}>
        <header className="result-row__header">
          <span className="result-row__name">{card.name}</span>
          <span className="result-row__meta">
            {meta} · {card.version}
          </span>
        </header>
        <p className="result-row__effect">{card.ability}</p>
        {card.howToAcquire ? (
          <>
            <p className="result-row__label">How to acquire</p>
            <p className="result-row__effect result-row__effect--secondary">{card.howToAcquire}</p>
          </>
        ) : null}
        <CardFooter card={card} />
      </article>
    )
  }

  if (card.type === 'exploration') {
    return (
      <article className="result-row result-row--exploration" style={bgStyle}>
        <header className="result-row__header">
          <span className="result-row__name">{card.name}</span>
          <span className="result-row__meta">
            {card.explorationType}
            {card.quantity ? ` · Qty ${card.quantity}` : ''} · {card.version}
          </span>
        </header>
        <p className="result-row__effect">{card.effect}</p>
        <CardFooter card={card} />
      </article>
    )
  }

  if (card.type === 'faction_ability') {
    return (
      <article className="result-row result-row--faction-ability" style={bgStyle}>
        <header className="result-row__header">
          <span className="result-row__name">{card.name}</span>
        </header>
        <p className="result-row__effect">{card.text}</p>
        <CardFooter card={card} />
      </article>
    )
  }

  if (card.type === 'faction_leader') {
    return (
      <article className="result-row result-row--faction-leader" style={bgStyle}>
        <header className="result-row__header">
          <span className="result-row__name">{card.name}</span>
          <span className="result-row__meta">
            {card.leaderType} · {card.unlockCondition} · {card.version}
          </span>
        </header>
        {card.abilityName ? (
          <p className="result-row__label">{card.abilityName}</p>
        ) : null}
        <p className="result-row__effect">{card.ability}</p>
        <CardFooter card={card} />
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
      <CardFooter card={card} />
    </article>
  )
}
