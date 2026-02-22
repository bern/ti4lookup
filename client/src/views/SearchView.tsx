import { useMemo } from 'react'
import { SearchInput } from '../components/SearchInput'
import { ResultsList } from '../components/ResultsList'
import { FactionSetupCard } from '../components/FactionSetupCard'
import { useFuseSearch, partitionByType, sortByName } from '../search/useFuseSearch'
import type { CardItem } from '../types'
import type { Faction } from '../data/loadCards'

const RECENT_MAX = 10

function partitionSecretObjectives(secretObj: CardItem[]) {
  const whenLower = (w: string) => (w ?? '').toLowerCase()
  const getWhen = (c: CardItem) => ('whenToScore' in c ? (c as { whenToScore: string }).whenToScore : '')
  const secretAction = sortByName(secretObj.filter((c) => whenLower(getWhen(c)).includes('action')))
  const secretStatus = sortByName(secretObj.filter((c) => whenLower(getWhen(c)).includes('status')))
  const secretAgenda = sortByName(secretObj.filter((c) => whenLower(getWhen(c)).includes('agenda')))
  return { secretAction, secretStatus, secretAgenda }
}

function partitionAgendas(agendaCards: CardItem[]) {
  const getAgendaType = (c: CardItem) => ('agendaType' in c ? (c as { agendaType: string }).agendaType : '')
  const law = sortByName(agendaCards.filter((c) => getAgendaType(c).toLowerCase() === 'law'))
  const directive = sortByName(agendaCards.filter((c) => getAgendaType(c).toLowerCase() === 'directive'))
  const edict = sortByName(agendaCards.filter((c) => getAgendaType(c).toLowerCase() === 'edict'))
  return { law, directive, edict }
}

function partitionFactionLeaders(factionLeaderCards: CardItem[]) {
  const getLeaderType = (c: CardItem) => ('leaderType' in c ? (c as { leaderType: string }).leaderType : '')
  const genomes = sortByName(factionLeaderCards.filter((c) => getLeaderType(c).toLowerCase() === 'genome'))
  const paradigms = sortByName(factionLeaderCards.filter((c) => getLeaderType(c).toLowerCase() === 'paradigm'))
  const leaders = sortByName(factionLeaderCards.filter((c) => (getLeaderType(c).toLowerCase() !== 'paradigm') && (getLeaderType(c).toLowerCase() !== 'genome')))
  return { genomes, paradigms, leaders }
}

interface SearchViewProps {
  cards: CardItem[]
  recentSearches: string[]
  factionFilter: string | null
  factionFilterName: string | null
  faction: Faction | null
  techNameToColor: Map<string, string>
  onAddRecent: (query: string) => void
  onBack: () => void
}

export function SearchView({
  cards,
  recentSearches,
  factionFilter,
  factionFilterName,
  faction,
  techNameToColor,
  onAddRecent,
  onBack,
}: SearchViewProps) {
  const { query, setQuery, results } = useFuseSearch(cards, {
    limit: 120,
  })

  const commitRecent = (q: string) => {
    const trimmed = q.trim()
    if (trimmed) onAddRecent(trimmed)
  }

  const partitioned = partitionByType(results)
  const publicObjectiveSections = useMemo(() => {
    const stage1 = sortByName(partitioned.public_objective.filter((c) => c.type === 'public_objective' && c.stage === '1'))
    const stage2 = sortByName(partitioned.public_objective.filter((c) => c.type === 'public_objective' && c.stage === '2'))
    return { stage1, stage2 }
  }, [partitioned.public_objective])
  const secretObjectiveSections = useMemo(
    () => partitionSecretObjectives(partitioned.secret_objective),
    [partitioned.secret_objective]
  )
  const hasPublicObjectives = publicObjectiveSections.stage1.length > 0 || publicObjectiveSections.stage2.length > 0
  const hasSecretObjectives = secretObjectiveSections.secretAction.length > 0 ||
    secretObjectiveSections.secretStatus.length > 0 || secretObjectiveSections.secretAgenda.length > 0
  const agendaSections = useMemo(
    () => partitionAgendas(partitioned.agenda),
    [partitioned.agenda]
  )
  const factionLeaderSections = useMemo(
    () => partitionFactionLeaders(partitioned.faction_leader),
    [partitioned.faction_leader]
  )
  const hasParadigms = factionLeaderSections.paradigms.length > 0
  const hasGenomes = factionLeaderSections.genomes.length > 0
  const hasQuery = query.trim() !== ''
  const showRecent = !hasQuery && recentSearches.length > 0 && !factionFilter
  const showFactionResults = factionFilter && !hasQuery

  return (
    <div className="search-view">
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
          placeholder="Search all…"
          autoFocus
          aria-label="Search all categories"
          onCommit={commitRecent}
        />
      </div>
      <main id="main-content" className="search-view__main">
        {showRecent && (
          <section className="recent-searches" aria-label="Recent searches">
            <h2 className="section-title">Recent searches</h2>
            <ul className="recent-searches__list">
              {recentSearches.slice(0, RECENT_MAX).map((q) => (
                <li key={q}>
                  <button
                    type="button"
                    className="recent-searches__item"
                    onClick={() => setQuery(q)}
                  >
                    {q}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}
        {showFactionResults && (
          <div className="search-results-partitioned">
            {factionFilterName && (
              <h2 className="section-title">
                {factionFilterName}
              </h2>
            )}
            {faction && (
              <section className="results-section" aria-label="Faction Setup">
                <ul className="results-list" role="list">
                  <li className="results-list__item">
                    <FactionSetupCard faction={faction} techNameToColor={techNameToColor} />
                  </li>
                </ul>
              </section>
            )}
            {partitioned.strategy.length > 0 && (
              <section className="results-section" aria-label="Strategy Cards">
                <h2 className="section-title">Strategy Cards</h2>
                <ResultsList cards={partitioned.strategy} />
              </section>
            )}
            {partitioned.faction_ability.length > 0 && (
              <section className="results-section" aria-label="Faction Abilities">
                <h2 className="section-title">Faction Abilities</h2>
                <ResultsList cards={partitioned.faction_ability} />
              </section>
            )}
            {partitioned.technology_general.length > 0 && (
              <section className="results-section" aria-label="Technologies (General)">
                <h2 className="section-title">Technologies (General)</h2>
                <ResultsList cards={partitioned.technology_general} />
              </section>
            )}
            {partitioned.unit_general.length > 0 && (
              <section className="results-section" aria-label="Units (General)">
                <h2 className="section-title">Units (General)</h2>
                <ResultsList cards={partitioned.unit_general} />
              </section>
            )}
            {partitioned.unit_faction.length > 0 && (
              <section className="results-section" aria-label="Faction Units">
                <h2 className="section-title">Faction Units</h2>
                <ResultsList cards={partitioned.unit_faction} />
              </section>
            )}
            {partitioned.technology_faction.length > 0 && (
              <section className="results-section" aria-label="Faction Technologies">
                <h2 className="section-title">Faction Technologies</h2>
                <ResultsList cards={partitioned.technology_faction} />
              </section>
            )}
            {partitioned.faction_leader.length > 0 && (
              <section className="results-section" aria-label="Faction Leaders">
                <h2 className="section-title">Faction Leaders</h2>
                <ResultsList cards={partitioned.faction_leader} />
              </section>
            )}
            {partitioned.promissory_note_general.length > 0 && (
              <section className="results-section" aria-label="Promissory Notes (General)">
                <h2 className="section-title">Promissory Notes (General)</h2>
                <ResultsList cards={partitioned.promissory_note_general} />
              </section>
            )}
            {partitioned.promissory_note_faction.length > 0 && (
              <section className="results-section" aria-label="Faction Promissory Notes">
                <h2 className="section-title">Faction Promissory Notes</h2>
                <ResultsList cards={partitioned.promissory_note_faction} />
              </section>
            )}
            {partitioned.breakthrough.length > 0 && (
              <section className="results-section" aria-label="Breakthroughs">
                <h2 className="section-title">Breakthroughs</h2>
                <ResultsList cards={partitioned.breakthrough} />
              </section>
            )}
            {partitioned.legendary_planet.length > 0 && (
              <section className="results-section" aria-label="Legendary Planets">
                <h2 className="section-title">Legendary Planets</h2>
                <ResultsList cards={partitioned.legendary_planet} />
              </section>
            )}
            {partitioned.plot.length > 0 && (
              <section className="results-section" aria-label="Plots">
                <h2 className="section-title">Plots</h2>
                <ResultsList cards={partitioned.plot} />
              </section>
            )}
            {results.length === 0 && (
              <p className="results-message">No cards found for this faction.</p>
            )}
          </div>
        )}
        {hasQuery && (
          <div className="search-results-partitioned">
            {partitioned.strategy.length > 0 && (
              <section className="results-section" aria-label="Strategy Cards">
                <h2 className="section-title">Strategy Cards</h2>
                <ResultsList cards={partitioned.strategy} />
              </section>
            )}
            {partitioned.faction_ability.length > 0 && (
              <section className="results-section" aria-label="Faction Abilities">
                <h2 className="section-title">Faction Abilities</h2>
                <ResultsList cards={partitioned.faction_ability} />
              </section>
            )}
            {partitioned.technology_general.length > 0 && (
              <section className="results-section" aria-label="Technologies (General)">
                <h2 className="section-title">Technologies (General)</h2>
                <ResultsList cards={partitioned.technology_general} />
              </section>
            )}
            {partitioned.unit_general.length > 0 && (
              <section className="results-section" aria-label="Units (General)">
                <h2 className="section-title">Units (General)</h2>
                <ResultsList cards={partitioned.unit_general} />
              </section>
            )}
            {partitioned.unit_faction.length > 0 && (
              <section className="results-section" aria-label="Faction Units">
                <h2 className="section-title">Faction Units</h2>
                <ResultsList cards={partitioned.unit_faction} />
              </section>
            )}
            {partitioned.technology_faction.length > 0 && (
              <section className="results-section" aria-label="Faction Technologies">
                <h2 className="section-title">Faction Technologies</h2>
                <ResultsList cards={partitioned.technology_faction} />
              </section>
            )}
            {/* {partitioned.faction_leader.length > 0 && (
              <section className="results-section" aria-label="Faction Leaders">
                <h2 className="section-title">Faction Leaders</h2>
                <ResultsList cards={partitioned.faction_leader} />
              </section>
            )} */}
            {(factionLeaderSections.genomes.length > 0 || factionLeaderSections.paradigms.length > 0 || factionLeaderSections.leaders.length > 0) && (
              <section className="results-section" aria-label="Faction Leaders">
                <h2 className="section-title">Faction Leaders</h2>
                {factionLeaderSections.genomes.length > 0 && (
                  <>
                    <h3 className="section-title section-title--sub">Genomes</h3>
                    <ResultsList cards={factionLeaderSections.genomes} />
                  </>
                )}
                {factionLeaderSections.paradigms.length > 0 && (
                  <>
                    <h3 className="section-title section-title--sub">Paradigms</h3>
                    <ResultsList cards={factionLeaderSections.paradigms} />
                  </>
                )}
                {factionLeaderSections.leaders.length > 0 && (
                  <>
                    <h3 className="section-title section-title--sub">Faction Leaders</h3>
                    <ResultsList cards={factionLeaderSections.leaders} />
                  </>
                )}
              </section>
            )}
            {partitioned.promissory_note_general.length > 0 && (
              <section className="results-section" aria-label="Promissory Notes (General)">
                <h2 className="section-title">Promissory Notes (General)</h2>
                <ResultsList cards={partitioned.promissory_note_general} />
              </section>
            )}
            {partitioned.promissory_note_faction.length > 0 && (
              <section className="results-section" aria-label="Faction Promissory Notes">
                <h2 className="section-title">Faction Promissory Notes</h2>
                <ResultsList cards={partitioned.promissory_note_faction} />
              </section>
            )}
            {partitioned.breakthrough.length > 0 && (
              <section className="results-section" aria-label="Breakthroughs">
                <h2 className="section-title">Breakthroughs</h2>
                <ResultsList cards={partitioned.breakthrough} />
              </section>
            )}
            {hasPublicObjectives && (
              <section className="results-section" aria-label="Public Objectives">
                <h2 className="section-title">Public Objectives</h2>
                {publicObjectiveSections.stage1.length > 0 && (
                  <>
                    <h3 className="section-title section-title--sub">Stage 1</h3>
                    <ResultsList cards={publicObjectiveSections.stage1} />
                  </>
                )}
                {publicObjectiveSections.stage2.length > 0 && (
                  <>
                    <h3 className="section-title section-title--sub">Stage 2</h3>
                    <ResultsList cards={publicObjectiveSections.stage2} />
                  </>
                )}
              </section>
            )}
            {hasSecretObjectives && (
              <section className="results-section" aria-label="Secret Objectives">
                <h2 className="section-title">Secret Objectives</h2>
                {secretObjectiveSections.secretStatus.length > 0 && (
                  <>
                    <h3 className="section-title section-title--sub">Status Phase</h3>
                    <ResultsList cards={secretObjectiveSections.secretStatus} />
                  </>
                )}
                {secretObjectiveSections.secretAction.length > 0 && (
                  <>
                    <h3 className="section-title section-title--sub">Action Phase</h3>
                    <ResultsList cards={secretObjectiveSections.secretAction} />
                  </>
                )}
                {secretObjectiveSections.secretAgenda.length > 0 && (
                  <>
                    <h3 className="section-title section-title--sub">Agenda Phase</h3>
                    <ResultsList cards={secretObjectiveSections.secretAgenda} />
                  </>
                )}
              </section>
            )}
            {(agendaSections.law.length > 0 || agendaSections.directive.length > 0 || agendaSections.edict.length > 0) && (
              <section className="results-section" aria-label="Agendas">
                <h2 className="section-title">Agendas</h2>
                {agendaSections.law.length > 0 && (
                  <>
                    <h3 className="section-title section-title--sub">Laws</h3>
                    <ResultsList cards={agendaSections.law} />
                  </>
                )}
                {agendaSections.directive.length > 0 && (
                  <>
                    <h3 className="section-title section-title--sub">Directives</h3>
                    <ResultsList cards={agendaSections.directive} />
                  </>
                )}
                {agendaSections.edict.length > 0 && (
                  <>
                    <h3 className="section-title section-title--sub">Edicts</h3>
                    <ResultsList cards={agendaSections.edict} />
                  </>
                )}
              </section>
            )}
            {partitioned.action.length > 0 && (
              <section className="results-section" aria-label="Action Cards">
                <h2 className="section-title">Action Cards</h2>
                <ResultsList cards={partitioned.action} />
              </section>
            )}
            {partitioned.legendary_planet.length > 0 && (
              <section className="results-section" aria-label="Legendary Planets">
                <h2 className="section-title">Legendary Planets</h2>
                <ResultsList cards={partitioned.legendary_planet} />
              </section>
            )}
            {partitioned.exploration.length > 0 && (
              <section className="results-section" aria-label="Exploration">
                <h2 className="section-title">Exploration</h2>
                <ResultsList cards={partitioned.exploration} />
              </section>
            )}
            {partitioned.relic.length > 0 && (
              <section className="results-section" aria-label="Relics">
                <h2 className="section-title">Relics</h2>
                <ResultsList cards={partitioned.relic} />
              </section>
            )}
            {partitioned.galactic_event.length > 0 && (
              <section className="results-section" aria-label="Galactic Events">
                <h2 className="section-title">Galactic Events</h2>
                <ResultsList cards={partitioned.galactic_event} />
              </section>
            )}
            {partitioned.plot.length > 0 && (
              <section className="results-section" aria-label="Plots">
                <h2 className="section-title">Plots</h2>
                <ResultsList cards={partitioned.plot} />
              </section>
            )}
            {results.length === 0 && (
              <p className="results-message">No results found.</p>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
