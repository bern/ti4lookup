import Papa from 'papaparse'
import type { ActionCard, StrategyCard, Agenda, PublicObjective, SecretObjective, LegendaryPlanet, Exploration, FactionAbility, FactionLeader, PromissoryNote, Breakthrough, Technology, GalacticEvent, Plot, Unit, CardItem } from '../types'

const ACTION_CSV_URL = '/action_cards.csv'
const STRATEGY_CSV_URL = '/strategy_cards.csv'
const AGENDAS_CSV_URL = '/agendas.csv'
const OBJECTIVES_CSV_URL = '/objectives.csv'
const LEGENDARY_PLANETS_CSV_URL = '/legendary_planets.csv'
const EXPLORATION_CSV_URL = '/exploration.csv'
const FACTION_ABILITIES_CSV_URL = '/faction_abilities.csv'
const FACTION_LEADERS_CSV_URL = '/faction_leaders.csv'
const PROMISSORY_NOTES_CSV_URL = '/promissory_notes.csv'
const BREAKTHROUGHS_CSV_URL = '/breakthroughs.csv'
const TECHNOLOGIES_CSV_URL = '/technologies.csv'
const FACTIONS_CSV_URL = '/factions.csv'
const GALACTIC_EVENTS_CSV_URL = '/galactic_events.csv'
const PLOTS_CSV_URL = '/plots.csv'
const UNITS_CSV_URL = '/units.csv'

function parseCsv<T>(url: string, mapRow: (row: Record<string, string>) => T): Promise<T[]> {
  return fetch(url)
    .then((res) => {
      if (!res.ok) throw new Error(`Failed to load CSV: ${url} — ${res.status}`)
      return res.text()
    })
    .then((text) => {
      const parsed = Papa.parse<Record<string, string>>(text, {
        header: true,
        skipEmptyLines: true,
      })
      if (parsed.errors.length > 0) console.warn('CSV parse warnings:', parsed.errors)
      return parsed.data.map(mapRow)
    })
}

/**
 * Fetches and parses action cards CSV into typed ActionCard[].
 */
export async function loadActionCards(): Promise<ActionCard[]> {
  return parseCsv(ACTION_CSV_URL, (row) => ({
    name: row.name ?? '',
    quantity: row.quantity ?? '',
    timing: row.timing ?? '',
    effect: row.effect ?? '',
    version: row.version ?? '',
    excludeAfter: (row['exclude after'] ?? '').trim() || undefined,
  }))
}

/**
 * Fetches and parses strategy cards CSV into typed StrategyCard[].
 * CSV column is "initative"; we map to initiative.
 */
export async function loadStrategyCards(): Promise<StrategyCard[]> {
  return parseCsv(STRATEGY_CSV_URL, (row) => ({
    name: row.name ?? '',
    initiative: row.initative ?? row.initiative ?? '',
    primary: row.primary ?? '',
    secondary: row.secondary ?? '',
    color: row.color ?? '',
    version: row.version ?? '',
    excludeAfter: (row['exclude after'] ?? '').trim() || undefined,
  }))
}

/**
 * Fetches and parses agendas CSV into typed Agenda[].
 * CSV column "removed in pok" is mapped to removedInPok.
 */
export async function loadAgendas(): Promise<Agenda[]> {
  return parseCsv(AGENDAS_CSV_URL, (row) => ({
    name: row.name ?? '',
    agendaType: row.type ?? '',
    elect: row.elect ?? '',
    effect: row.effect ?? '',
    version: row.version ?? '',
    removedInPok: row['removed in pok'] ?? '',
    excludeAfter: (row['exclude after'] ?? '').trim() || undefined,
  }))
}

/**
 * Fetches and parses objectives CSV; splits into public (stage 1 + stage 2) and secret.
 * CSV columns: name, condition, points, type, when to score, version.
 */
export async function loadObjectives(): Promise<{ public: PublicObjective[]; secret: SecretObjective[] }> {
  const rows = await parseCsv(OBJECTIVES_CSV_URL, (row) => ({
    name: row.name ?? '',
    condition: row.condition ?? '',
    points: row.points ?? '',
    type: (row.type ?? '').toLowerCase(),
    whenToScore: row['when to score'] ?? '',
    version: row.version ?? '',
    excludeAfter: (row['exclude after'] ?? '').trim() || undefined,
  }))
  const publicObjectives: PublicObjective[] = []
  const secretObjectives: SecretObjective[] = []
  for (const r of rows) {
    if (r.type === 'stage 1 public') {
      publicObjectives.push({
        name: r.name,
        condition: r.condition,
        points: r.points,
        stage: '1',
        whenToScore: r.whenToScore,
        version: r.version,
      })
    } else if (r.type === 'stage 2 public') {
      publicObjectives.push({
        name: r.name,
        condition: r.condition,
        points: r.points,
        stage: '2',
        whenToScore: r.whenToScore,
        version: r.version,
      })
    } else if (r.type === 'secret') {
      secretObjectives.push({
        name: r.name,
        condition: r.condition,
        points: r.points,
        whenToScore: r.whenToScore,
        version: r.version,
        excludeAfter: r.excludeAfter,
      })
    }
  }
  return { public: publicObjectives, secret: secretObjectives }
}

/**
 * Fetches and parses legendary planets CSV into typed LegendaryPlanet[].
 * CSV column "how to acquire" is mapped to howToAcquire.
 */
export async function loadLegendaryPlanets(): Promise<LegendaryPlanet[]> {
  return parseCsv(LEGENDARY_PLANETS_CSV_URL, (row) => ({
    name: row.name ?? '',
    factionId: (row['faction id'] ?? '').trim() || undefined,
    trait: row.trait ?? '',
    technology: row.technology ?? '',
    resources: row.resources ?? '',
    influence: row.influence ?? '',
    ability: row.ability ?? '',
    howToAcquire: row['how to acquire'] ?? '',
    version: row.version ?? '',
    excludeAfter: (row['exclude after'] ?? '').trim() || undefined,
  }))
}

/**
 * Fetches and parses exploration CSV. Columns: name, type, quantity, effect, version.
 */
export async function loadExploration(): Promise<Exploration[]> {
  return parseCsv(EXPLORATION_CSV_URL, (row) => ({
    name: row.name ?? '',
    explorationType: row.type ?? '',
    quantity: row.quantity ?? '',
    effect: row.effect ?? '',
    version: row.version ?? '',
  }))
}

export interface Faction {
  id: string
  name: string
  version: string
  startingFleet?: string
  startingTechnologies?: string
}

/**
 * Fetches factions CSV and returns a map of faction id -> full name for search.
 */
export async function loadFactionNames(): Promise<Map<string, string>> {
  const rows = await parseCsv(FACTIONS_CSV_URL, (row) => ({
    id: (row.id ?? '').trim(),
    name: (row.name ?? '').trim(),
  }))
  const map = new Map<string, string>()
  for (const r of rows) {
    if (r.id) map.set(r.id, r.name)
  }
  return map
}

/**
 * Fetches factions CSV and returns list of factions for the home grid.
 */
export async function loadFactions(): Promise<Faction[]> {
  const rows = await parseCsv(FACTIONS_CSV_URL, (row) => ({
    id: (row.id ?? '').trim(),
    name: (row.name ?? '').trim(),
    version: (row.version ?? '').trim(),
    startingFleet: (row['starting fleet'] ?? '').trim() || undefined,
    startingTechnologies: (row['starting technologies'] ?? '').trim() || undefined,
  }))
  return rows.filter((r) => r.id)
}

/**
 * Fetches and parses faction abilities CSV. Columns: faction id, name, text, version.
 */
export async function loadFactionAbilities(): Promise<FactionAbility[]> {
  return parseCsv(FACTION_ABILITIES_CSV_URL, (row) => ({
    factionId: (row['faction id'] ?? '').trim(),
    name: row.name ?? '',
    text: row.text ?? '',
    version: row.version ?? '',
    excludeAfter: (row['exclude after'] ?? '').trim() || undefined,
  }))
}

/**
 * Fetches and parses faction leaders CSV. Columns: faction id, type, name, unlock condition, ability name, ability, version.
 */
export async function loadFactionLeaders(): Promise<FactionLeader[]> {
  return parseCsv(FACTION_LEADERS_CSV_URL, (row) => ({
    factionId: (row['faction id'] ?? '').trim(),
    leaderType: row.type ?? '',
    name: row.name ?? '',
    unlockCondition: row['unlock condition'] ?? '',
    abilityName: row['ability name'] ?? '',
    ability: row.ability ?? '',
    version: row.version ?? '',
    excludeAfter: (row['exclude after'] ?? '').trim() || undefined,
  }))
}

/**
 * Fetches and parses promissory notes CSV. Columns: name, faction id, effect, version.
 */
export async function loadPromissoryNotes(): Promise<PromissoryNote[]> {
  return parseCsv(PROMISSORY_NOTES_CSV_URL, (row) => ({
    name: row.name ?? '',
    factionId: (row['faction id'] ?? '').trim(),
    effect: row.effect ?? '',
    version: row.version ?? '',
    excludeAfter: (row['exclude after'] ?? '').trim() || undefined,
  }))
}

/**
 * Fetches and parses breakthroughs CSV. Columns: faction id, name, synergy, effect, version.
 */
export async function loadBreakthroughs(): Promise<Breakthrough[]> {
  return parseCsv(BREAKTHROUGHS_CSV_URL, (row) => ({
    factionId: (row['faction id'] ?? '').trim(),
    name: row.name ?? '',
    synergy: row.synergy ?? '',
    effect: row.effect ?? '',
    version: row.version ?? '',
  }))
}

/**
 * Fetches and parses technologies CSV. Columns: name, faction id, type, unit, prerequisites, effect, version.
 */
export async function loadTechnologies(): Promise<Technology[]> {
  return parseCsv(TECHNOLOGIES_CSV_URL, (row) => ({
    name: row.name ?? '',
    factionId: (row['faction id'] ?? '').trim(),
    techType: (row.type ?? '').trim(),
    unit: (row.unit ?? '').trim(),
    prerequisites: (row.prerequisites ?? '').trim(),
    effect: row.effect ?? '',
    version: row.version ?? '',
    excludeAfter: (row['exclude after'] ?? '').trim() || undefined,
  }))
}

function parseFactionIds(s: string): string[] {
  const inner = (s ?? '').replace(/^\[|\]$/g, '').trim()
  if (!inner) return []
  return inner.split(',').map((id) => id.trim()).filter(Boolean)
}

/**
 * Fetches and parses galactic events CSV. Columns: name, effect, version.
 */
export async function loadGalacticEvents(): Promise<GalacticEvent[]> {
  return parseCsv(GALACTIC_EVENTS_CSV_URL, (row) => ({
    name: row.name ?? '',
    effect: row.effect ?? '',
    version: row.version ?? '',
  }))
}

/**
 * Fetches and parses plots CSV. Columns: name, faction ids, effect, version.
 */
export async function loadPlots(): Promise<Plot[]> {
  return parseCsv(PLOTS_CSV_URL, (row) => ({
    name: row.name ?? '',
    factionIds: parseFactionIds(row['faction ids'] ?? ''),
    effect: row.effect ?? '',
    version: row.version ?? '',
  }))
}

/**
 * Fetches and parses units CSV. Columns: name, faction id, unit, cost, move, combat, capacity, text abilities, unit abilities, version.
 */
export async function loadUnits(): Promise<Unit[]> {
  return parseCsv(UNITS_CSV_URL, (row) => ({
    name: row.name ?? '',
    factionId: (row['faction id'] ?? '').trim(),
    unit: row.unit ?? '',
    cost: row.cost ?? '',
    move: row.move ?? '',
    combat: row.combat ?? '',
    capacity: row.capacity ?? '',
    textAbilities: row['text abilities'] ?? '',
    unitAbilities: row['unit abilities'] ?? '',
    version: row.version ?? '',
    excludeAfter: (row['exclude after'] ?? '').trim() || undefined,
  }))
}

/**
 * Loads action cards, strategy cards, agendas, objectives, legendary planets, exploration, faction abilities, faction leaders, promissory notes, breakthroughs, technologies, galactic events, plots, units; returns a combined CardItem[] for search/display.
 */
export async function loadAllCards(): Promise<CardItem[]> {
  const [actionCards, strategyCards, agendas, objectives, legendaryPlanets, exploration, factionAbilities, factionLeaders, promissoryNotes, breakthroughs, technologies, galacticEvents, plots, units, factionNames] = await Promise.all([
    loadActionCards(),
    loadStrategyCards(),
    loadAgendas(),
    loadObjectives(),
    loadLegendaryPlanets(),
    loadExploration(),
    loadFactionAbilities(),
    loadFactionLeaders(),
    loadPromissoryNotes(),
    loadBreakthroughs(),
    loadTechnologies(),
    loadGalacticEvents(),
    loadPlots(),
    loadUnits(),
    loadFactionNames(),
  ])
  const actionItems: CardItem[] = actionCards.map((c) => ({
    type: 'action',
    ...c,
    searchText: [c.name, c.quantity, c.timing, c.effect, c.version].filter(Boolean).join(' '),
  }))
  const strategyItems: CardItem[] = strategyCards.map((c) => ({
    type: 'strategy',
    ...c,
    searchText: [c.name, c.initiative, c.primary, c.secondary, c.color, c.version].filter(Boolean).join(' '),
  }))
  const agendaItems: CardItem[] = agendas.map((c) => ({
    ...c,
    type: 'agenda',
    searchText: [
      c.name,
      c.agendaType,
      c.elect,
      c.effect,
      c.version,
      c.removedInPok === 'true' ? 'removed prophecy kings pok' : '',
    ]
      .filter(Boolean)
      .join(' '),
  }))
  const publicObjectiveItems: CardItem[] = objectives.public.map((c) => ({
    ...c,
    type: 'public_objective',
    searchText: [c.name, c.condition, c.points, c.stage, c.whenToScore, c.version].filter(Boolean).join(' '),
  }))
  const secretObjectiveItems: CardItem[] = objectives.secret.map((c) => ({
    ...c,
    type: 'secret_objective',
    searchText: [c.name, c.condition, c.points, c.whenToScore, c.version].filter(Boolean).join(' '),
  }))
  const legendaryPlanetItems: CardItem[] = legendaryPlanets.map((c) => ({
    ...c,
    factionName: c.factionId ? (factionNames.get(c.factionId) ?? undefined) : undefined,
    type: 'legendary_planet',
    searchText: [
      c.name,
      c.factionId,
      c.factionId ? factionNames.get(c.factionId) : undefined,
      c.trait,
      c.technology,
      c.resources,
      c.influence,
      c.ability,
      c.howToAcquire,
      c.version,
    ].filter(Boolean).join(' '),
  }))
  const explorationItems: CardItem[] = exploration.map((c) => ({
    ...c,
    type: 'exploration',
    searchText: [c.name, c.explorationType, c.quantity, c.effect, c.version].filter(Boolean).join(' '),
  }))
  const factionAbilityItems: CardItem[] = factionAbilities.map((c) => ({
    ...c,
    factionName: factionNames.get(c.factionId) ?? undefined,
    type: 'faction_ability',
    searchText: [c.factionId, factionNames.get(c.factionId), c.name, c.text, c.version].filter(Boolean).join(' '),
  }))
  const factionLeaderItems: CardItem[] = factionLeaders.map((c) => ({
    ...c,
    factionName: factionNames.get(c.factionId) ?? undefined,
    type: 'faction_leader',
    searchText: [c.factionId, factionNames.get(c.factionId), c.leaderType, c.name, c.unlockCondition, c.abilityName, c.ability, c.version].filter(Boolean).join(' '),
  }))
  const promissoryNoteItems: CardItem[] = promissoryNotes.map((c) => ({
    ...c,
    factionName: c.factionId ? (factionNames.get(c.factionId) ?? undefined) : undefined,
    type: 'promissory_note',
    searchText: [c.name, c.factionId, factionNames.get(c.factionId), c.effect, c.version].filter(Boolean).join(' '),
  }))
  const breakthroughItems: CardItem[] = breakthroughs.map((c) => ({
    ...c,
    factionName: factionNames.get(c.factionId) ?? undefined,
    type: 'breakthrough',
    searchText: [c.factionId, factionNames.get(c.factionId), c.name, c.synergy, c.effect, c.version].filter(Boolean).join(' '),
  }))
  const technologyItems: CardItem[] = technologies.map((c) => ({
    ...c,
    factionName: c.factionId ? (factionNames.get(c.factionId) ?? undefined) : undefined,
    type: 'technology',
    searchText: [c.name, c.factionId, factionNames.get(c.factionId), c.techType, c.unit, c.prerequisites, c.effect, c.version].filter(Boolean).join(' '),
  }))
  const galacticEventItems: CardItem[] = galacticEvents.map((c) => ({
    ...c,
    type: 'galactic_event',
    searchText: [c.name, c.effect, c.version].filter(Boolean).join(' '),
  }))
  const plotItems: CardItem[] = plots.map((c) => ({
    ...c,
    type: 'plot',
    searchText: [c.name, c.factionIds.join(' '), c.effect, c.version].filter(Boolean).join(' '),
  }))
  const unitItems: CardItem[] = units.map((c) => ({
    ...c,
    factionName: c.factionId ? (factionNames.get(c.factionId) ?? undefined) : undefined,
    type: 'unit',
    searchText: [
      c.name,
      c.factionId,
      factionNames.get(c.factionId),
      c.unit,
      c.cost,
      c.move,
      c.combat,
      c.capacity,
      c.textAbilities,
      c.unitAbilities,
      c.version,
    ].filter(Boolean).join(' '),
  }))
  return [
    ...actionItems,
    ...strategyItems,
    ...agendaItems,
    ...publicObjectiveItems,
    ...secretObjectiveItems,
    ...legendaryPlanetItems,
    ...explorationItems,
    ...factionAbilityItems,
    ...factionLeaderItems,
    ...promissoryNoteItems,
    ...breakthroughItems,
    ...technologyItems,
    ...galacticEventItems,
    ...plotItems,
    ...unitItems,
  ]
}
