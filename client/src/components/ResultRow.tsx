import { useState, useCallback, useEffect } from 'react'
import type { CardItem } from '../types'

const IMAGES_BASE = import.meta.env.BASE_URL + 'images'
const COPY_ICON_SRC = import.meta.env.BASE_URL + 'svg/copy.svg'
const COPY_ICON_DARK_SRC = import.meta.env.BASE_URL + 'svg/copy_dark.svg'

/** Join non-empty strings with double newlines. */
function joinSections(...parts: (string | undefined)[]): string {
  return parts.filter((p): p is string => Boolean(p?.trim())).join('\n\n')
}

/** Label with its content: single newline between them. */
function labelWithContent(label: string, content: string): string {
  if (!label?.trim()) return content?.trim() ?? ''
  if (!content?.trim()) return label.trim()
  return `${label.trim()}\n${content.trim()}`
}

/** Get category label for footer; promissory notes, technologies, units split by faction; exploration split into exploration/relic. */
function getCategoryLabel(card: CardItem): string {
  if (card.type === 'promissory_note') return (card.factionId ?? '').trim() ? 'Faction Promissory Notes' : 'Promissory Notes (General)'
  if (card.type === 'technology') return (card.factionId ?? '').trim() ? 'Faction Technologies' : 'Technologies (General)'
  if (card.type === 'unit') return (card.factionId ?? '').trim() ? 'Faction Units' : 'Units (General)'
  if (card.type === 'exploration') return (card.explorationType ?? '').toLowerCase() === 'relic' ? 'Relics' : 'Exploration'
  return CATEGORY_LABELS[card.type]
}

/** Build unit stats header string: Infantry • Cost 1 • Combat 5(x2) • Move 2 • Capacity 1 */
function getUnitStatsHeader(unit: { unit: string; cost: string; combat: string; move: string; capacity: string }): string {
  const parts: string[] = []
  if (unit.unit?.trim()) {
    parts.push(unit.unit.trim().replace(/\b\w/g, (c) => c.toUpperCase()))
  }
  if (unit.cost?.trim()) parts.push(`Cost ${unit.cost}`)
  if (unit.combat?.trim()) parts.push(`Combat ${unit.combat}`)
  if (unit.move?.trim()) parts.push(`Move ${unit.move}`)
  if (unit.capacity?.trim()) parts.push(`Capacity ${unit.capacity}`)
  return parts.join(' · ')
}

/** Build clipboard text from displayed card content. */
function getCardCopyText(card: CardItem): string {
  const baseLabel = getCategoryLabel(card)
  const factionName = 'factionName' in card ? card.factionName : undefined
  const footer = factionName ? `${baseLabel} • ${factionName}` : baseLabel

  if (card.type === 'action') {
    return joinSections(card.name, card.version, card.timing, card.effect, footer)
  }
  if (card.type === 'agenda') {
    const forAgainst = parseForAgainst(card.effect)
    if (forAgainst) {
      const meta = [card.agendaType, card.elect !== '-' ? `Elect: ${card.elect}` : '', card.version].filter(Boolean).join(' · ')
      const removed = card.removedInPok === 'true' ? 'Removed in Prophecy of Kings' : ''
      return joinSections(
        card.name,
        [meta, removed].filter(Boolean).join(' · ') || undefined,
        forAgainst.introText || undefined,
        labelWithContent('For', forAgainst.forText),
        labelWithContent('Against', forAgainst.againstText),
        footer
      )
    }
    const meta = [card.agendaType, card.elect !== '-' ? `Elect: ${card.elect}` : '', card.version].filter(Boolean).join(' · ')
    return joinSections(card.name, meta, card.effect, footer)
  }
  if (card.type === 'strategy') {
    const meta = [card.initiative, card.color, card.version].filter(Boolean).join(' · ')
    return joinSections(card.name, meta, labelWithContent('Primary', card.primary), labelWithContent('Secondary', card.secondary), footer)
  }
  if (card.type === 'public_objective') {
    const meta = `Stage ${card.stage} · ${card.points} VP · ${card.whenToScore} · ${card.version}`
    return joinSections(card.name, meta, card.condition, footer)
  }
  if (card.type === 'secret_objective') {
    const meta = `${card.points} VP · ${card.whenToScore} · ${card.version}`
    return joinSections(card.name, meta, card.condition, footer)
  }
  if (card.type === 'legendary_planet') {
    const meta = [card.trait, card.resources && card.influence ? `${card.resources}/${card.influence}` : card.resources || card.influence, card.technology ? `${card.technology} tech skip` : null].filter(Boolean).join(' · ')
    const parts: (string | undefined)[] = [card.name, `${meta} · ${card.version}`, card.ability]
    if (card.howToAcquire) parts.push(labelWithContent('How to acquire', card.howToAcquire))
    parts.push(footer)
    return joinSections(...parts)
  }
  if (card.type === 'exploration') {
    const meta = [card.explorationType, card.quantity ? `Qty ${card.quantity}` : '', card.version].filter(Boolean).join(' · ')
    return joinSections(card.name, meta, card.effect, footer)
  }
  if (card.type === 'faction_ability') {
    return joinSections(card.name, card.text, footer)
  }
  if (card.type === 'faction_leader') {
    const meta = `${card.leaderType} · ${card.unlockCondition} · ${card.version}`
    const parts: (string | undefined)[] = [card.name, meta]
    if (card.abilityName) parts.push(labelWithContent(card.abilityName, card.ability))
    else parts.push(card.ability)
    parts.push(footer)
    return joinSections(...parts)
  }
  if (card.type === 'promissory_note') {
    return joinSections(card.name, card.version, card.effect, footer)
  }
  if (card.type === 'breakthrough') {
    const synergyPart = card.synergy?.trim() ? labelWithContent('Synergy', card.synergy) : undefined
    return joinSections(card.name, card.effect, synergyPart, footer)
  }
  if (card.type === 'technology') {
    const meta = [card.techType, card.unit, card.version].filter(Boolean).join(' · ')
    const parts: (string | undefined)[] = [card.name, meta, card.effect]
    if (card.prerequisites?.trim() && card.prerequisites !== '[]') {
      parts.push(labelWithContent('Prerequisites:', card.prerequisites))
    }
    parts.push(footer)
    return joinSections(...parts)
  }
  if (card.type === 'galactic_event') {
    return joinSections(card.name, card.version, card.effect, footer)
  }
  if (card.type === 'plot') {
    return joinSections(card.name, card.version, card.effect, footer)
  }
  if (card.type === 'unit') {
    const stats = getUnitStatsHeader(card)
    const body = [card.textAbilities, card.unitAbilities].filter(Boolean).join('\n\n')
    return joinSections(card.name, stats || undefined, body, card.version, footer)
  }
  return ''
}

function CopyButton({ card }: { card: CardItem }) {
  const [copied, setCopied] = useState(false)
  useEffect(() => {
    if (!copied) return
    const t = setTimeout(() => setCopied(false), 1200)
    return () => clearTimeout(t)
  }, [copied])
  const handleClick = useCallback(async () => {
    const text = getCardCopyText(card)
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
    } catch {
      /* ignore */
    }
  }, [card])
  return (
    <button
      type="button"
      className="result-row__copy"
      onClick={handleClick}
      title="Copy"
      aria-label="Copy"
    >
      <img src={COPY_ICON_SRC} alt="" className="result-row__copy-icon result-row__copy-icon--light" />
      <img src={COPY_ICON_DARK_SRC} alt="" className="result-row__copy-icon result-row__copy-icon--dark" />
      {copied && <span className="result-row__copy-feedback">Copied!</span>}
    </button>
  )
}

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
  promissory_note: 'Promissory Notes',
  breakthrough: 'Breakthroughs',
  technology: 'Technologies',
  galactic_event: 'Galactic Events',
  plot: 'Plots',
  unit: 'Units',
}

/** Parse prerequisites string e.g. "[blue,blue,yellow]" into color ids for icons. */
function parsePrerequisiteIds(prereq: string): string[] {
  const s = (prereq ?? '').trim()
  if (!s || s === '[]') return []
  const inner = s.replace(/^\[|\]$/g, '').trim()
  if (!inner) return []
  return inner.split(',').map((c) => c.trim().toLowerCase()).filter((c) => TECH_TYPE_IDS.has(c))
}

/** Image ids to show in card footer (faction/tech/trait). */
function getCardImages(card: CardItem): string[] {
  const ids: string[] = []
  if (card.type === 'faction_ability' && card.factionId) ids.push(card.factionId)
  if (card.type === 'faction_leader' && card.factionId) ids.push(card.factionId)
  if (card.type === 'promissory_note' && card.factionId) ids.push(card.factionId)
  if (card.type === 'breakthrough' && card.factionId) ids.push(card.factionId)
  if (card.type === 'technology') {
    if (card.factionId) ids.push(card.factionId)
    const t = card.techType?.toLowerCase()
    if (t && TECH_TYPE_IDS.has(t)) ids.push(t)
    /* unit upgrades: no type icon */
  }
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
  if (card.type === 'plot' && card.factionIds?.length) {
    ids.push(...card.factionIds)
  }
  if (card.type === 'unit' && card.factionId) {
    ids.push(card.factionId)
  }
  return [...new Set(ids)]
}

function CardFooter({ card }: { card: CardItem }) {
  const baseLabel = getCategoryLabel(card)
  const factionName = 'factionName' in card ? card.factionName : undefined
  const label = factionName ? `${baseLabel} • ${factionName}` : baseLabel
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

/** Technology color (blue, yellow, green, red) → rgba with low opacity. */
const TECH_COLOR_BG: Record<string, string> = {
  blue: 'rgba(60, 100, 180, 0.12)',
  yellow: 'rgba(200, 170, 50, 0.12)',
  green: 'rgba(50, 140, 70, 0.12)',
  red: 'rgba(180, 50, 50, 0.12)',
}

function getCardBgStyle(card: CardItem): { backgroundColor?: string } {
  if (card.type === 'strategy' && card.color) {
    const bg = CARD_COLOR_BG[card.color.toLowerCase()]
    return bg ? { backgroundColor: bg } : {}
  }
  if (card.type === 'technology') {
    const t = (card.techType ?? '').trim().toLowerCase()
    const bg = TECH_COLOR_BG[t]
    return bg ? { backgroundColor: bg } : {}
  }
  return {}
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
          <div className="result-row__header-content">
            <span className="result-row__name">{card.name}</span>
            <span className="result-row__meta">{`Qty ${card.quantity} · ${card.version}`}</span>
          </div>
          <CopyButton card={card} />
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
          <div className="result-row__header-content">
            <span className="result-row__name">{card.name}</span>
            <span className="result-row__meta">
              {card.agendaType}
              {card.elect && card.elect !== '-' ? ` · Elect: ${card.elect}` : ''} · {card.version}
              {card.removedInPok === 'true' ? (
                <span className="result-row__removed" title="Removed in Prophecy of Kings"> · 🚫 Removed in PoK</span>
              ) : null}
            </span>
          </div>
          <CopyButton card={card} />
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
          <div className="result-row__header-content">
            <span className="result-row__name">{card.name}</span>
            <span className="result-row__meta">
              Stage {card.stage} · {card.points} VP · {card.whenToScore} · {card.version}
            </span>
          </div>
          <CopyButton card={card} />
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
          <div className="result-row__header-content">
            <span className="result-row__name">{card.name}</span>
            <span className="result-row__meta">
              {card.points} VP · {card.whenToScore} · {card.version}
            </span>
          </div>
          <CopyButton card={card} />
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
          <div className="result-row__header-content">
            <span className="result-row__name">{card.name}</span>
            <span className="result-row__meta">
              {meta} · {card.version}
            </span>
          </div>
          <CopyButton card={card} />
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
          <div className="result-row__header-content">
            <span className="result-row__name">{card.name}</span>
            <span className="result-row__meta">
              {card.explorationType}
              {card.quantity ? ` · Qty ${card.quantity}` : ''} · {card.version}
            </span>
          </div>
          <CopyButton card={card} />
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
          <div className="result-row__header-content">
            <span className="result-row__name">{card.name}</span>
          </div>
          <CopyButton card={card} />
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
          <div className="result-row__header-content">
            <span className="result-row__name">{card.name}</span>
            <span className="result-row__meta">
              {card.leaderType} · {card.unlockCondition} · {card.version}
            </span>
          </div>
          <CopyButton card={card} />
        </header>
        {card.abilityName ? (
          <p className="result-row__label">{card.abilityName}</p>
        ) : null}
        <p className="result-row__effect">{card.ability}</p>
        <CardFooter card={card} />
      </article>
    )
  }

  if (card.type === 'promissory_note') {
    return (
      <article className="result-row result-row--promissory-note" style={bgStyle}>
        <header className="result-row__header">
          <div className="result-row__header-content">
            <span className="result-row__name">{card.name}</span>
            <span className="result-row__meta">{card.version}</span>
          </div>
          <CopyButton card={card} />
        </header>
        <p className="result-row__effect">{card.effect}</p>
        <CardFooter card={card} />
      </article>
    )
  }

  if (card.type === 'breakthrough') {
    const synergyIds = parsePrerequisiteIds(card.synergy)
    return (
      <article className="result-row result-row--breakthrough" style={bgStyle}>
        <header className="result-row__header">
          <div className="result-row__header-content">
            <span className="result-row__name">{card.name}</span>
          </div>
          <CopyButton card={card} />
        </header>
        <p className="result-row__effect">{card.effect}</p>
        {card.synergy?.trim() && (
          <>
            <div style={{ marginBottom: '1em' }} />
            <p className="result-row__label">Synergy</p>
            <span className="result-row__prerequisites">
              {synergyIds.map((id, i) => (
                <img key={`${id}-${i}`} src={`${IMAGES_BASE}/${id}.png`} alt="" className="result-row__icon" />
              ))}
            </span>
          </>
        )}
        <CardFooter card={card} />
      </article>
    )
  }

  if (card.type === 'technology') {
    const prereqIds = parsePrerequisiteIds(card.prerequisites)
    const meta = [card.techType, card.unit, card.version].filter(Boolean).join(' · ')
    return (
      <article className="result-row result-row--technology" style={bgStyle}>
        <header className="result-row__header">
          <div className="result-row__header-content">
            <span className="result-row__name">{card.name}</span>
            <span className="result-row__meta">{meta}</span>
          </div>
          <CopyButton card={card} />
        </header>
        <p className="result-row__effect">{card.effect}</p>
        {prereqIds.length > 0 && (
          <>
            <p className="result-row__label">Prerequisites:</p>
            <span className="result-row__prerequisites">
              {prereqIds.map((id, i) => (
                <img key={`${id}-${i}`} src={`${IMAGES_BASE}/${id}.png`} alt="" className="result-row__icon" />
              ))}
            </span>
          </>
        )}
        <CardFooter card={card} />
      </article>
    )
  }

  if (card.type === 'galactic_event') {
    return (
      <article className="result-row result-row--galactic-event" style={bgStyle}>
        <header className="result-row__header">
          <div className="result-row__header-content">
            <span className="result-row__name">{card.name}</span>
            <span className="result-row__meta">{card.version}</span>
          </div>
          <CopyButton card={card} />
        </header>
        <p className="result-row__effect">{card.effect}</p>
        <CardFooter card={card} />
      </article>
    )
  }

  if (card.type === 'plot') {
    return (
      <article className="result-row result-row--plot" style={bgStyle}>
        <header className="result-row__header">
          <div className="result-row__header-content">
            <span className="result-row__name">{card.name}</span>
            <span className="result-row__meta">{card.version}</span>
          </div>
          <CopyButton card={card} />
        </header>
        <p className="result-row__effect">{card.effect}</p>
        <CardFooter card={card} />
      </article>
    )
  }

  if (card.type === 'unit') {
    const statsHeader = getUnitStatsHeader(card)
    return (
      <article className="result-row result-row--unit" style={bgStyle}>
        <header className="result-row__header">
          <div className="result-row__header-content">
            <span className="result-row__name">{card.name}</span>
            {(statsHeader || card.version) ? (
              <span className="result-row__meta result-row__unit-stats">
                {statsHeader}
                {statsHeader && card.version ? ' · ' : ''}
                {card.version}
              </span>
            ) : null}
          </div>
          <CopyButton card={card} />
        </header>
        {card.textAbilities && <p className="result-row__effect">{card.textAbilities}</p>}
        {card.textAbilities && card.unitAbilities && <div style={{ marginBottom: '1em' }} />}
        {card.unitAbilities && <p className="result-row__effect">{card.unitAbilities}</p>}
        <CardFooter card={card} />
      </article>
    )
  }

  return (
    <article className="result-row result-row--strategy" style={bgStyle}>
      <header className="result-row__header">
        <div className="result-row__header-content">
          <span className="result-row__name">{card.name}</span>
          <span className="result-row__meta">
            {card.initiative} · {card.color} · {card.version}
          </span>
        </div>
        <CopyButton card={card} />
      </header>
      <p className="result-row__label">Primary</p>
      <p className="result-row__effect">{card.primary}</p>
      <p className="result-row__label">Secondary</p>
      <p className="result-row__effect result-row__effect--secondary">{card.secondary}</p>
      <CardFooter card={card} />
    </article>
  )
}
