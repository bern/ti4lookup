import { useState, useEffect } from 'react'
import type { Faction } from '../data/loadCards'
import { FactionGridItem } from '../components/FactionGridItem'

const FACTION_PORTRAITS_STORAGE_KEY = 'ti4lookup-faction-portraits'

export type View = 'home' | 'search' | 'action' | 'agenda' | 'strategy' | 'public_objective' | 'secret_objective' | 'legendary_planet' | 'exploration' | 'relic' | 'faction_ability' | 'faction_leader' | 'promissory_note' | 'breakthrough' | 'technology' | 'galactic_event' | 'unit'

interface HomeViewProps {
  factions: Faction[]
  onOpenSearch: () => void
  onOpenFaction: (factionId: string) => void
  onOpenCategory: (view: Exclude<View, 'home' | 'search'>) => void
}

export function HomeView({ factions, onOpenSearch, onOpenFaction, onOpenCategory }: HomeViewProps) {
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
        <button
          type="button"
          className="home-category-btn"
          onClick={() => onOpenCategory('strategy')}
        >
          Strategy Cards
        </button>
        <button
          type="button"
          className="home-category-btn"
          onClick={() => onOpenCategory('faction_ability')}
        >
          Faction Abilities
        </button>
        <button
          type="button"
          className="home-category-btn"
          onClick={() => onOpenCategory('technology')}
        >
          Technologies
        </button>
        <button
          type="button"
          className="home-category-btn"
          onClick={() => onOpenCategory('unit')}
        >
          Units
        </button>
        <button
          type="button"
          className="home-category-btn"
          onClick={() => onOpenCategory('faction_leader')}
        >
          Faction Leaders
        </button>
        <button
          type="button"
          className="home-category-btn"
          onClick={() => onOpenCategory('promissory_note')}
        >
          Promissory Notes
        </button>
        <button
          type="button"
          className="home-category-btn"
          onClick={() => onOpenCategory('breakthrough')}
        >
          Breakthroughs
        </button>
        <button
          type="button"
          className="home-category-btn"
          onClick={() => onOpenCategory('public_objective')}
        >
          Public Objectives
        </button>
        <button
          type="button"
          className="home-category-btn"
          onClick={() => onOpenCategory('secret_objective')}
        >
          Secret Objectives
        </button>
        <button
          type="button"
          className="home-category-btn"
          onClick={() => onOpenCategory('agenda')}
        >
          Agendas
        </button>
        <button
          type="button"
          className="home-category-btn"
          onClick={() => onOpenCategory('action')}
        >
          Action Cards
        </button>
        <button
          type="button"
          className="home-category-btn"
          onClick={() => onOpenCategory('legendary_planet')}
        >
          Legendary Planets
        </button>
        <button
          type="button"
          className="home-category-btn"
          onClick={() => onOpenCategory('exploration')}
        >
          Exploration
        </button>
        <button
          type="button"
          className="home-category-btn"
          onClick={() => onOpenCategory('relic')}
        >
          Relics
        </button>
        <button
          type="button"
          className="home-category-btn"
          onClick={() => onOpenCategory('galactic_event')}
        >
          Galactic Events
        </button>
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
