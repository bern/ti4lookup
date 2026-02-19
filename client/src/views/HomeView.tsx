import { useState, useEffect, useMemo } from 'react'
import type { Faction } from '../data/loadCards'
import { FactionGridItem } from '../components/FactionGridItem'
import { partitionByType } from '../search/useFuseSearch'
import type { CardItem } from '../types'

const FACTION_PORTRAITS_STORAGE_KEY = 'ti4lookup-faction-portraits'

export type View = 'home' | 'search' | 'action' | 'agenda' | 'strategy' | 'public_objective' | 'secret_objective' | 'legendary_planet' | 'exploration' | 'relic' | 'faction_ability' | 'faction_leader' | 'promissory_note' | 'breakthrough' | 'technology' | 'galactic_event' | 'unit'

interface HomeViewProps {
  factions: Faction[]
  cards: CardItem[]
  onOpenSearch: () => void
  onOpenFaction: (factionId: string) => void
  onOpenCategory: (view: Exclude<View, 'home' | 'search'>) => void
}

const CATEGORY_BUTTONS: { view: Exclude<View, 'home' | 'search'>; label: string }[] = [
  { view: 'strategy', label: 'Strategy Cards' },
  { view: 'faction_ability', label: 'Faction Abilities' },
  { view: 'technology', label: 'Technologies' },
  { view: 'unit', label: 'Units' },
  { view: 'faction_leader', label: 'Faction Leaders' },
  { view: 'promissory_note', label: 'Promissory Notes' },
  { view: 'breakthrough', label: 'Breakthroughs' },
  { view: 'public_objective', label: 'Public Objectives' },
  { view: 'secret_objective', label: 'Secret Objectives' },
  { view: 'agenda', label: 'Agendas' },
  { view: 'action', label: 'Action Cards' },
  { view: 'legendary_planet', label: 'Legendary Planets' },
  { view: 'exploration', label: 'Exploration' },
  { view: 'relic', label: 'Relics' },
  { view: 'galactic_event', label: 'Galactic Events' },
]

export function HomeView({ factions, cards, onOpenSearch, onOpenFaction, onOpenCategory }: HomeViewProps) {
  const categoriesWithCards = useMemo(() => {
    const p = partitionByType(cards)
    const set = new Set<Exclude<View, 'home' | 'search'>>()
    if (p.strategy.length > 0) set.add('strategy')
    if (p.faction_ability.length > 0) set.add('faction_ability')
    if (p.technology_general.length > 0 || p.technology_faction.length > 0) set.add('technology')
    if (p.unit_general.length > 0 || p.unit_faction.length > 0) set.add('unit')
    if (p.faction_leader.length > 0) set.add('faction_leader')
    if (p.promissory_note_general.length > 0 || p.promissory_note_faction.length > 0) set.add('promissory_note')
    if (p.breakthrough.length > 0) set.add('breakthrough')
    if (p.public_objective.length > 0) set.add('public_objective')
    if (p.secret_objective.length > 0) set.add('secret_objective')
    if (p.agenda.length > 0) set.add('agenda')
    if (p.action.length > 0) set.add('action')
    if (p.legendary_planet.length > 0) set.add('legendary_planet')
    if (p.exploration.length > 0) set.add('exploration')
    if (p.relic.length > 0) set.add('relic')
    if (p.galactic_event.length > 0) set.add('galactic_event')
    return set
  }, [cards])

  const categoryHasCards = (view: Exclude<View, 'home' | 'search'>) => categoriesWithCards.has(view)

  const [factionPortraits, setFactionPortraits] = useState(() => {
    try {
      const s = localStorage.getItem(FACTION_PORTRAITS_STORAGE_KEY)
      return s === 'true'
    } catch {
      return false
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(FACTION_PORTRAITS_STORAGE_KEY, String(factionPortraits))
    } catch {
      /* ignore */
    }
  }, [factionPortraits])
  return (
    <div className="home-view">
      <button
        type="button"
        className="home-search-trigger"
        onClick={onOpenSearch}
        aria-label="Search all categories"
      >
        Search all…
      </button>
      <nav className="home-categories" aria-label="Categories">
        {CATEGORY_BUTTONS.filter(({ view }) => categoryHasCards(view)).map(({ view, label }) => (
          <button
            key={view}
            type="button"
            className="home-category-btn"
            onClick={() => onOpenCategory(view)}
          >
            {label}
          </button>
        ))}
      </nav>
      <section className="home-factions" aria-label="Browse by faction">
        <div className="home-factions__header">
          <h2 className="section-title">Browse by faction</h2>
          <label className="faction-portraits-toggle">
            <input
              type="checkbox"
              checked={factionPortraits}
              onChange={(e) => setFactionPortraits(e.target.checked)}
              aria-label="Show faction portraits"
            />
            <span>Show Portraits</span>
          </label>
        </div>
        <div className="faction-grid">
          {factions.map((faction) => (
            <FactionGridItem
              key={faction.id}
              faction={faction}
              portraitMode={factionPortraits}
              onOpenFaction={onOpenFaction}
            />
          ))}
        </div>
      </section>
    </div>
  )
}
