export type View = 'home' | 'search' | 'action' | 'agenda' | 'strategy' | 'public_objective' | 'secret_objective' | 'legendary_planet' | 'exploration' | 'faction_ability' | 'faction_leader' | 'promissory_note' | 'breakthrough' | 'technology'

interface HomeViewProps {
  onOpenSearch: () => void
  onOpenCategory: (view: Exclude<View, 'home' | 'search'>) => void
}

export function HomeView({ onOpenSearch, onOpenCategory }: HomeViewProps) {
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
      </nav>
    </div>
  )
}
