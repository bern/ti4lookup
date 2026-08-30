import { useMemo } from 'react'
import { SearchInput } from '../components/SearchInput'
import { ProgressiveSections, type ResultSection, type ResultGroup } from '../components/ProgressiveSections'
import { useFuseSearch, sortByName, partitionByType } from '../search/useFuseSearch'
import type { CardItem } from '../types'
import type { CardType } from '../search/useFuseSearch'

const BASE_CATEGORY_LABELS: Record<CardType, string> = {
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
  faction_card: 'Faction Cards',
  unit: 'Units',
  unit_general: 'Units (General)',
  unit_faction: 'Faction Units',
}

const getCategoryLabels = (isTwilightsFall: boolean): Record<CardType, string> => ({
  ...BASE_CATEGORY_LABELS,
  agenda: isTwilightsFall ? 'Edicts' : 'Agendas',
  faction_leader: isTwilightsFall ? 'Genomes & Paradigms' : 'Faction Leaders',
  faction_ability: isTwilightsFall ? 'Abilities' : 'Faction Abilities',
  unit: 'Units & Upgrades',
  unit_faction: isTwilightsFall ? 'Unit Upgrades' : 'Faction Units',
})

const BASE_CATEGORY_PLACEHOLDERS: Record<CardType, string> = {
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
  faction_card: 'Search faction cards…',
  unit: 'Search units…',
  unit_general: 'Search units (general)…',
  unit_faction: 'Search faction units…',
}

const getCategoryPlaceholders = (isTwilightsFall: boolean): Record<CardType, string> => ({
  ...BASE_CATEGORY_PLACEHOLDERS,
  agenda: isTwilightsFall ? 'Search edicts…' : 'Search agendas…',
  faction_leader: isTwilightsFall ? 'Search genomes & paradigms…' : 'Search faction leaders…',
  faction_ability: isTwilightsFall ? 'Search abilities…' : 'Search faction abilities…',
})

interface CategoryViewProps {
  cards: CardItem[]
  category: CardType
  onBack: () => void
  isTwilightsFall: boolean
}

export function CategoryView({ cards, category, onBack, isTwilightsFall }: CategoryViewProps) {
  const { query, setQuery, results, debouncedQuery } = useFuseSearch(cards, {
    typeFilter: category,
  })

  const CATEGORY_LABELS = useMemo(() => getCategoryLabels(isTwilightsFall), [isTwilightsFall])
  const CATEGORY_PLACEHOLDERS = useMemo(() => getCategoryPlaceholders(isTwilightsFall), [isTwilightsFall])

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

  const unitUpgradeTechnologies = useMemo(() => {
    if (category !== 'unit') return []
    const techs = results.filter(
      (c) => c.type === 'technology' && (c.techType ?? '').toLowerCase() === 'unit upgrade'
    )
    const general = sortByName(techs.filter((c) => !('factionId' in c && (c.factionId ?? '').trim())))
    const faction = sortByName(techs.filter((c) => 'factionId' in c && (c.factionId ?? '').trim() !== ''))
    return [...general, ...faction]
  }, [category, results])

  const agendaBySection = useMemo(() => {
    if (category !== 'agenda') return null
    const agendaCards = results.filter((c) => c.type === 'agenda')
    const getAgendaType = (c: CardItem) => ('agendaType' in c ? (c as { agendaType: string }).agendaType : '')
    const law = sortByName(agendaCards.filter((c) => getAgendaType(c).toLowerCase() === 'law'))
    const directive = sortByName(agendaCards.filter((c) => getAgendaType(c).toLowerCase() === 'directive'))
    const edict = sortByName(agendaCards.filter((c) => getAgendaType(c).toLowerCase() === 'edict'))
    return { law, directive, edict }
  }, [category, results])

    const leadersBySection = useMemo(() => {
    if (category !== 'faction_leader') return null
    const factionLeaderCards = results.filter((c) => c.type === 'faction_leader')
    const getLeaderType = (c: CardItem) => ('leaderType' in c ? (c as { leaderType: string }).leaderType : '')
    const genomes = sortByName(factionLeaderCards.filter((c) => getLeaderType(c).toLowerCase() === 'genome'))
    const paradigms = sortByName(factionLeaderCards.filter((c) => getLeaderType(c).toLowerCase() === 'paradigm'))
    const leaders = sortByName(factionLeaderCards.filter((c) => (getLeaderType(c).toLowerCase() !== 'paradigm') && (getLeaderType(c).toLowerCase() !== 'genome')))
    return { genomes, paradigms, leaders }
  }, [category, results])

  // Collapse the category's sub-sections into groups for the progressive renderer.
  const { sectionGroups, emptyMessage } = useMemo((): { sectionGroups: ResultGroup[]; emptyMessage: string } => {
    if (publicByStage) {
      return {
        sectionGroups: [
          { subtitle: 'Stage 1', cards: publicByStage.stage1 },
          { subtitle: 'Stage 2', cards: publicByStage.stage2 },
        ],
        emptyMessage: 'No objectives found.',
      }
    }
    if (secretByPhase) {
      return {
        sectionGroups: [
          { subtitle: 'Status Phase', cards: secretByPhase.secretStatus },
          { subtitle: 'Action Phase', cards: secretByPhase.secretAction },
          { subtitle: 'Agenda Phase', cards: secretByPhase.secretAgenda },
        ],
        emptyMessage: 'No objectives found.',
      }
    }
    if (technologyBySection) {
      return {
        sectionGroups: [
          { subtitle: 'Technologies (General)', cards: technologyBySection.general },
          { subtitle: 'Faction Technologies', cards: technologyBySection.faction },
        ],
        emptyMessage: 'No technologies found.',
      }
    }
    if (promissoryNoteBySection) {
      return {
        sectionGroups: [
          { subtitle: 'Promissory Notes (General)', cards: promissoryNoteBySection.general },
          { subtitle: 'Faction Promissory Notes', cards: promissoryNoteBySection.faction },
        ],
        emptyMessage: 'No promissory notes found.',
      }
    }
    if (unitBySection) {
      return {
        sectionGroups: [
          { subtitle: 'Units (General)', cards: unitBySection.general },
          { subtitle: isTwilightsFall ? 'Unit Upgrades' : 'Faction Units', cards: unitBySection.faction },
          { subtitle: 'Unit Upgrades', cards: unitUpgradeTechnologies },
        ],
        emptyMessage: 'No units found.',
      }
    }
    if (agendaBySection) {
      return {
        sectionGroups: [
          { subtitle: 'Laws', cards: agendaBySection.law },
          { subtitle: 'Directives', cards: agendaBySection.directive },
          { subtitle: 'Edicts', cards: agendaBySection.edict },
        ],
        emptyMessage: 'No agendas found.',
      }
    }
    if (leadersBySection) {
      return {
        sectionGroups: [
          // TF
          { subtitle: 'Genomes', cards: leadersBySection.genomes },
          { subtitle: 'Paradigms', cards: leadersBySection.paradigms },

          // TE
          { cards: leadersBySection.leaders },
        ],
        emptyMessage: 'No leaders found.',
      }
    }
    return { sectionGroups: [{ cards: results }], emptyMessage: 'No cards found.' }
  }, [publicByStage, secretByPhase, technologyBySection, promissoryNoteBySection, unitBySection, unitUpgradeTechnologies, agendaBySection, leadersBySection, results, isTwilightsFall])

  const sections: ResultSection[] = [{ key: category, groups: sectionGroups }]

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
      <main id="main-content" className="category-view__main">
        <h2 className="section-title">{CATEGORY_LABELS[category]}</h2>
        <ProgressiveSections key={`${category}:${debouncedQuery}`} sections={sections} />
        {results.length === 0 && (
          <p className="results-message">{emptyMessage}</p>
        )}
      </main>
    </div>
  )
}
