import { useMemo } from 'react'
import { SearchInput } from '../components/SearchInput'
import { FactionSetupCard } from '../components/FactionSetupCard'
import { ProgressiveSections, type ResultSection } from '../components/ProgressiveSections'
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
  isTwilightsFall: boolean
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
  isTwilightsFall,
  onAddRecent,
  onBack,
}: SearchViewProps) {
  const { query, setQuery, results, debouncedQuery } = useFuseSearch(cards, {
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
  const agendaSections = useMemo(
    () => partitionAgendas(partitioned.agenda),
    [partitioned.agenda]
  )
  const factionLeaderSections = useMemo(
    () => partitionFactionLeaders(partitioned.faction_leader),
    [partitioned.faction_leader]
  )
  const hasQuery = query.trim() !== ''
  const showRecent = !hasQuery && recentSearches.length > 0 && !factionFilter
  const showFactionResults = factionFilter && !hasQuery

  const factionAbilityLabel = isTwilightsFall ? 'Abilities' : 'Faction Abilities'
  const factionUnitLabel = isTwilightsFall ? 'Unit Upgrades' : 'Faction Units'
  const factionLeaderLabel = isTwilightsFall ? 'Genomes & Paradigms' : 'Faction Leaders'
  const agendaLabel = isTwilightsFall ? 'Edicts' : 'Agendas'

  // Sections for a faction browse (no query). Faction leaders are not sub-grouped here.
  const factionSections: ResultSection[] = [
    ...(faction
      ? [{
          key: 'faction-setup',
          ariaLabel: 'Faction Setup',
          leadNode: (
            <ul className="results-list" role="list">
              <li className="results-list__item">
                <FactionSetupCard faction={faction} techNameToColor={techNameToColor} isTwilightsFall={isTwilightsFall} />
              </li>
            </ul>
          ),
          groups: [],
        } as ResultSection]
      : []),
    { key: 'strategy', title: 'Strategy Cards', groups: [{ cards: partitioned.strategy }] },
    { key: 'faction_ability', title: factionAbilityLabel, groups: [{ cards: partitioned.faction_ability }] },
    { key: 'technology_general', title: 'Technologies (General)', groups: [{ cards: partitioned.technology_general }] },
    { key: 'unit_general', title: 'Units (General)', groups: [{ cards: partitioned.unit_general }] },
    { key: 'unit_faction', title: factionUnitLabel, groups: [{ cards: partitioned.unit_faction }] },
    { key: 'technology_faction', title: 'Faction Technologies', groups: [{ cards: partitioned.technology_faction }] },
    { key: 'faction_leader', title: factionLeaderLabel, groups: [{ cards: partitioned.faction_leader }] },
    { key: 'promissory_note_general', title: 'Promissory Notes (General)', groups: [{ cards: partitioned.promissory_note_general }] },
    { key: 'promissory_note_faction', title: 'Faction Promissory Notes', groups: [{ cards: partitioned.promissory_note_faction }] },
    { key: 'breakthrough', title: 'Breakthroughs', groups: [{ cards: partitioned.breakthrough }] },
    { key: 'legendary_planet', title: 'Legendary Planets', groups: [{ cards: partitioned.legendary_planet }] },
    { key: 'faction_card', title: 'Faction Cards', groups: [{ cards: partitioned.faction_card }] },
  ]

  // Sections for a text query, in the same display order as before.
  const querySections: ResultSection[] = [
    { key: 'strategy', title: 'Strategy Cards', groups: [{ cards: partitioned.strategy }] },
    { key: 'faction_ability', title: factionAbilityLabel, groups: [{ cards: partitioned.faction_ability }] },
    { key: 'technology_general', title: 'Technologies (General)', groups: [{ cards: partitioned.technology_general }] },
    { key: 'unit_general', title: 'Units (General)', groups: [{ cards: partitioned.unit_general }] },
    { key: 'unit_faction', title: factionUnitLabel, groups: [{ cards: partitioned.unit_faction }] },
    { key: 'technology_faction', title: 'Faction Technologies', groups: [{ cards: partitioned.technology_faction }] },
    {
      key: 'faction_leader',
      title: factionLeaderLabel,
      groups: [
        // TF
        { subtitle: 'Genomes', cards: factionLeaderSections.genomes },
        { subtitle: 'Paradigms', cards: factionLeaderSections.paradigms },

        // TE
        { cards: factionLeaderSections.leaders },
      ],
    },
    { key: 'promissory_note_general', title: 'Promissory Notes (General)', groups: [{ cards: partitioned.promissory_note_general }] },
    { key: 'promissory_note_faction', title: 'Faction Promissory Notes', groups: [{ cards: partitioned.promissory_note_faction }] },
    { key: 'breakthrough', title: 'Breakthroughs', groups: [{ cards: partitioned.breakthrough }] },
    {
      key: 'public_objective',
      title: 'Public Objectives',
      groups: [
        { subtitle: 'Stage 1', cards: publicObjectiveSections.stage1 },
        { subtitle: 'Stage 2', cards: publicObjectiveSections.stage2 },
      ],
    },
    {
      key: 'secret_objective',
      title: 'Secret Objectives',
      groups: [
        { subtitle: 'Status Phase', cards: secretObjectiveSections.secretStatus },
        { subtitle: 'Action Phase', cards: secretObjectiveSections.secretAction },
        { subtitle: 'Agenda Phase', cards: secretObjectiveSections.secretAgenda },
      ],
    },
    {
      key: 'agenda',
      title: agendaLabel,
      groups: [
        { subtitle: 'Laws', cards: agendaSections.law },
        { subtitle: 'Directives', cards: agendaSections.directive },
        { subtitle: 'Edicts', cards: agendaSections.edict },
      ],
    },
    { key: 'action', title: 'Action Cards', groups: [{ cards: partitioned.action }] },
    { key: 'legendary_planet', title: 'Legendary Planets', groups: [{ cards: partitioned.legendary_planet }] },
    { key: 'exploration', title: 'Exploration', groups: [{ cards: partitioned.exploration }] },
    { key: 'relic', title: 'Relics', groups: [{ cards: partitioned.relic }] },
    { key: 'galactic_event', title: 'Galactic Events', groups: [{ cards: partitioned.galactic_event }] },
    { key: 'faction_card', title: 'Faction Cards', groups: [{ cards: partitioned.faction_card }] },
  ]

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
            <ProgressiveSections sections={factionSections} resetKey={factionFilter ?? ''} />
            {results.length === 0 && (
              <p className="results-message">No cards found for this faction.</p>
            )}
          </div>
        )}
        {hasQuery && (
          <div className="search-results-partitioned">
            <ProgressiveSections sections={querySections} resetKey={debouncedQuery} />
            {results.length === 0 && (
              <p className="results-message">No results found.</p>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
