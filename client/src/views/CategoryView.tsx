import { useMemo } from 'react'
import { SearchInput } from '../components/SearchInput'
import { ResultsList } from '../components/ResultsList'
import { useFuseSearch, sortByName, partitionByType } from '../search/useFuseSearch'
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
  relic: 'Relics',
  faction_ability: 'Faction Abilities',
  faction_leader: 'Faction Leaders',
  promissory_note: 'Promissory Notes',
  promissory_note_general: 'Promissory Notes (General)',
  promissory_note_faction: 'Faction Promissory Notes',
  breakthrough: 'Breakthroughs',
  technology: 'Technologies',
  technology_general: 'Technologies (General)',
  technology_faction: 'Faction Technologies',
  galactic_event: 'Galactic Events',
  plot: 'Plots',
  unit: 'Units',
  unit_general: 'Units (General)',
  unit_faction: 'Faction Units',
}

const CATEGORY_PLACEHOLDERS: Record<CardType, string> = {
  action: 'Search action cards…',
  agenda: 'Search agendas…',
  strategy: 'Search strategy cards…',
  public_objective: 'Search public objectives…',
  secret_objective: 'Search secret objectives…',
  legendary_planet: 'Search legendary planets…',
  exploration: 'Search exploration…',
  relic: 'Search relics…',
  faction_ability: 'Search faction abilities…',
  faction_leader: 'Search faction leaders…',
  promissory_note: 'Search promissory notes…',
  promissory_note_general: 'Search promissory notes (general)…',
  promissory_note_faction: 'Search faction promissory notes…',
  breakthrough: 'Search breakthroughs…',
  technology: 'Search technologies…',
  technology_general: 'Search technologies (general)…',
  technology_faction: 'Search faction technologies…',
  galactic_event: 'Search galactic events…',
  plot: 'Search plots…',
  unit: 'Search units…',
  unit_general: 'Search units (general)…',
  unit_faction: 'Search faction units…',
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

  const secretByPhase = useMemo(() => {
    if (category !== 'secret_objective') return null
    const secretObjectives = results.filter((c) => c.type === 'secret_objective')
    const whenLower = (w: string) => (w ?? '').toLowerCase()
    const getWhen = (c: CardItem) => ('whenToScore' in c ? (c as { whenToScore: string }).whenToScore : '')
    const secretAction = sortByName(secretObjectives.filter((c) => whenLower(getWhen(c)).includes('action')))
    const secretStatus = sortByName(secretObjectives.filter((c) => whenLower(getWhen(c)).includes('status')))
    const secretAgenda = sortByName(secretObjectives.filter((c) => whenLower(getWhen(c)).includes('agenda')))
    return { secretAction, secretStatus, secretAgenda }
  }, [category, results])

  const technologyBySection = useMemo(() => {
    if (category !== 'technology') return null
    const partitioned = partitionByType(results)
    return { general: partitioned.technology_general, faction: partitioned.technology_faction }
  }, [category, results])

  const promissoryNoteBySection = useMemo(() => {
    if (category !== 'promissory_note') return null
    const partitioned = partitionByType(results)
    return { general: partitioned.promissory_note_general, faction: partitioned.promissory_note_faction }
  }, [category, results])

  const unitBySection = useMemo(() => {
    if (category !== 'unit') return null
    const partitioned = partitionByType(results)
    return {
      general: partitioned.unit_general,
      faction: partitioned.unit_faction,
    }
  }, [category, results])

  const agendaBySection = useMemo(() => {
    if (category !== 'agenda') return null
    const agendaCards = results.filter((c) => c.type === 'agenda')
    const getAgendaType = (c: CardItem) => ('agendaType' in c ? (c as { agendaType: string }).agendaType : '')
    const law = sortByName(agendaCards.filter((c) => getAgendaType(c).toLowerCase() === 'law'))
    const directive = sortByName(agendaCards.filter((c) => getAgendaType(c).toLowerCase() === 'directive'))
    return { law, directive }
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
        ) : secretByPhase ? (
          <>
            <h2 className="section-title">{CATEGORY_LABELS[category]}</h2>
            {secretByPhase.secretStatus.length > 0 && (
              <section className="results-section" aria-label="Status Phase">
                <h3 className="section-title section-title--sub">Status Phase</h3>
                <ResultsList cards={secretByPhase.secretStatus} />
              </section>
            )}
            {secretByPhase.secretAction.length > 0 && (
              <section className="results-section" aria-label="Action Phase">
                <h3 className="section-title section-title--sub">Action Phase</h3>
                <ResultsList cards={secretByPhase.secretAction} />
              </section>
            )}
            {secretByPhase.secretAgenda.length > 0 && (
              <section className="results-section" aria-label="Agenda Phase">
                <h3 className="section-title section-title--sub">Agenda Phase</h3>
                <ResultsList cards={secretByPhase.secretAgenda} />
              </section>
            )}
            {secretByPhase.secretAction.length === 0 && secretByPhase.secretStatus.length === 0 &&
              secretByPhase.secretAgenda.length === 0 && (
              <p className="results-message">No objectives found.</p>
            )}
          </>
        ) : technologyBySection ? (
          <>
            <h2 className="section-title">{CATEGORY_LABELS[category]}</h2>
            {technologyBySection.general.length > 0 && (
              <section className="results-section" aria-label="Technologies (General)">
                <h3 className="section-title section-title--sub">Technologies (General)</h3>
                <ResultsList cards={technologyBySection.general} />
              </section>
            )}
            {technologyBySection.faction.length > 0 && (
              <section className="results-section" aria-label="Faction Technologies">
                <h3 className="section-title section-title--sub">Faction Technologies</h3>
                <ResultsList cards={technologyBySection.faction} />
              </section>
            )}
            {technologyBySection.general.length === 0 && technologyBySection.faction.length === 0 && (
              <p className="results-message">No technologies found.</p>
            )}
          </>
        ) : promissoryNoteBySection ? (
          <>
            <h2 className="section-title">{CATEGORY_LABELS[category]}</h2>
            {promissoryNoteBySection.general.length > 0 && (
              <section className="results-section" aria-label="Promissory Notes (General)">
                <h3 className="section-title section-title--sub">Promissory Notes (General)</h3>
                <ResultsList cards={promissoryNoteBySection.general} />
              </section>
            )}
            {promissoryNoteBySection.faction.length > 0 && (
              <section className="results-section" aria-label="Faction Promissory Notes">
                <h3 className="section-title section-title--sub">Faction Promissory Notes</h3>
                <ResultsList cards={promissoryNoteBySection.faction} />
              </section>
            )}
            {promissoryNoteBySection.general.length === 0 && promissoryNoteBySection.faction.length === 0 && (
              <p className="results-message">No promissory notes found.</p>
            )}
          </>
        ) : unitBySection ? (
          <>
            <h2 className="section-title">{CATEGORY_LABELS[category]}</h2>
            {unitBySection.general.length > 0 && (
              <section className="results-section" aria-label="Units (General)">
                <h3 className="section-title section-title--sub">Units (General)</h3>
                <ResultsList cards={unitBySection.general} />
              </section>
            )}
            {unitBySection.faction.length > 0 && (
              <section className="results-section" aria-label="Faction Units">
                <h3 className="section-title section-title--sub">Faction Units</h3>
                <ResultsList cards={unitBySection.faction} />
              </section>
            )}
            {unitBySection.general.length === 0 && unitBySection.faction.length === 0 && (
              <p className="results-message">No units found.</p>
            )}
          </>
        ) : agendaBySection ? (
          <>
            <h2 className="section-title">{CATEGORY_LABELS[category]}</h2>
            {agendaBySection.law.length > 0 && (
              <section className="results-section" aria-label="Laws">
                <h3 className="section-title section-title--sub">Laws</h3>
                <ResultsList cards={agendaBySection.law} />
              </section>
            )}
            {agendaBySection.directive.length > 0 && (
              <section className="results-section" aria-label="Directives">
                <h3 className="section-title section-title--sub">Directives</h3>
                <ResultsList cards={agendaBySection.directive} />
              </section>
            )}
            {agendaBySection.law.length === 0 && agendaBySection.directive.length === 0 && (
              <p className="results-message">No agendas found.</p>
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
