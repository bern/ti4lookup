import { useMemo } from 'react'
import { SearchInput } from '../components/SearchInput'
import { ResultsList } from '../components/ResultsList'
import { useFuseSearch, sortByName } from '../search/useFuseSearch'
import type { CardItem } from '../types'
import type { CardType } from '../search/useFuseSearch'

const CATEGORY_LABELS: Record<CardType, string> = {
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
}

const CATEGORY_PLACEHOLDERS: Record<CardType, string> = {
  action: 'Search action cards…',
  agenda: 'Search agendas…',
  strategy: 'Search strategy cards…',
  public_objective: 'Search public objectives…',
  secret_objective: 'Search secret objectives…',
  legendary_planet: 'Search legendary planets…',
  exploration: 'Search exploration…',
  faction_ability: 'Search faction abilities…',
  faction_leader: 'Search faction leaders…',
  promissory_note: 'Search promissory notes…',
  breakthrough: 'Search breakthroughs…',
}

interface CategoryViewProps {
  cards: CardItem[]
  category: CardType
  onBack: () => void
}

export function CategoryView({ cards, category, onBack }: CategoryViewProps) {
  const { query, setQuery, results } = useFuseSearch(cards, {
    typeFilter: category,
  })

  const publicByStage = useMemo(() => {
    if (category !== 'public_objective') return null
    const stage1 = sortByName(results.filter((c) => c.type === 'public_objective' && c.stage === '1'))
    const stage2 = sortByName(results.filter((c) => c.type === 'public_objective' && c.stage === '2'))
    return { stage1, stage2 }
  }, [category, results])

  return (
    <div className="category-view">
      <div className="view-bar">
        <button
          type="button"
          className="back-btn"
          onClick={onBack}
          aria-label="Back to home"
        >
          ← Back
        </button>
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder={CATEGORY_PLACEHOLDERS[category]}
          autoFocus
          aria-label={`Search ${CATEGORY_LABELS[category].toLowerCase()}`}
        />
      </div>
      <main className="category-view__main">
        {publicByStage ? (
          <>
            <h2 className="section-title">{CATEGORY_LABELS[category]}</h2>
            {publicByStage.stage1.length > 0 && (
              <section className="results-section" aria-label="Stage 1">
                <h3 className="section-title section-title--sub">Stage 1</h3>
                <ResultsList cards={publicByStage.stage1} />
              </section>
            )}
            {publicByStage.stage2.length > 0 && (
              <section className="results-section" aria-label="Stage 2">
                <h3 className="section-title section-title--sub">Stage 2</h3>
                <ResultsList cards={publicByStage.stage2} />
              </section>
            )}
            {publicByStage.stage1.length === 0 && publicByStage.stage2.length === 0 && (
              <p className="results-message">No objectives found.</p>
            )}
          </>
        ) : (
          <>
            <h2 className="section-title">{CATEGORY_LABELS[category]}</h2>
            <ResultsList cards={results} />
          </>
        )}
      </main>
    </div>
  )
}
