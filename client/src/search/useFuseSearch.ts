import { useMemo, useState, useEffect } from 'react'
import Fuse from 'fuse.js'
import type { CardItem } from '../types'

const MAX_RESULTS = 50
const DEBOUNCE_MS = 50

export type CardType =
  | 'action' | 'agenda' | 'strategy' | 'public_objective' | 'secret_objective' | 'legendary_planet' | 'exploration' | 'relic'
  | 'faction_ability' | 'faction_leader' | 'promissory_note' | 'promissory_note_general' | 'promissory_note_faction'
  | 'breakthrough' | 'technology' | 'technology_general' | 'technology_faction' | 'galactic_event' | 'plot'
  | 'unit' | 'unit_general' | 'unit_faction'

/**
 * Fuse.js over cards. Searches name and searchText.
 * ignoreLocation: true so multi-word queries (e.g. "victory point") match when words appear anywhere in the text.
 * threshold: 0.2 — stricter than default; only closer matches pass (0 = exact, 1 = anything).
 * useExtendedSearch: true so whitespace acts as AND (e.g. "jolnar hero" only returns cards matching both terms, with the best match on top).
 */
function createFuse(cards: CardItem[]): Fuse<CardItem> {
  return new Fuse(cards, {
    keys: [
      { name: 'name', weight: 0.5 },
      { name: 'searchText', weight: 0.5 },
    ],
    threshold: 0.2,
    ignoreLocation: true,
    useExtendedSearch: true,
  })
}

/** Sort cards by name (A–Z). */
export function sortByName(cards: CardItem[]): CardItem[] {
  return [...cards].sort((a, b) => a.name.localeCompare(b.name))
}

const EXPLORATION_TYPE_ORDER = ['cultural', 'industrial', 'hazardous', 'frontier'] as const

/** Sort exploration cards: by type (cultural, industrial, hazardous, frontier), then by name. */
function sortByExploration(cards: CardItem[]): CardItem[] {
  return [...cards].sort((a, b) => {
    if (a.type !== 'exploration' || b.type !== 'exploration') return 0
    const ta = (a.explorationType ?? '').toLowerCase()
    const tb = (b.explorationType ?? '').toLowerCase()
    const ia = EXPLORATION_TYPE_ORDER.indexOf(ta as (typeof EXPLORATION_TYPE_ORDER)[number])
    const ib = EXPLORATION_TYPE_ORDER.indexOf(tb as (typeof EXPLORATION_TYPE_ORDER)[number])
    if (ia !== ib) return (ia >= 0 ? ia : 999) - (ib >= 0 ? ib : 999)
    return a.name.localeCompare(b.name)
  })
}

/** Sort strategy cards by initiative order (1–8). */
function sortByInitiative(cards: CardItem[]): CardItem[] {
  return [...cards].sort((a, b) => {
    const na = (a.type === 'strategy' ? parseInt(a.initiative, 10) : 0) || 0
    const nb = (b.type === 'strategy' ? parseInt(b.initiative, 10) : 0) || 0
    return na - nb
  })
}

const TECH_COLOR_ORDER = ['blue', 'yellow', 'green', 'red', 'unit upgrade', 'nekro'] as const

function getTechSortKey(card: CardItem): { colorIndex: number; prereqCount: number } {
  if (card.type !== 'technology') return { colorIndex: 999, prereqCount: 0 }
  const factionId = (card.factionId ?? '').trim().toLowerCase()
  const techType = (card.techType ?? '').trim().toLowerCase()
  let colorIndex = TECH_COLOR_ORDER.indexOf('nekro')
  if (factionId === 'nekro') {
    colorIndex = TECH_COLOR_ORDER.indexOf('nekro')
  } else if (techType === 'unit upgrade') {
    colorIndex = TECH_COLOR_ORDER.indexOf('unit upgrade')
  } else {
    const idx = TECH_COLOR_ORDER.indexOf(techType as (typeof TECH_COLOR_ORDER)[number])
    colorIndex = idx >= 0 ? idx : 999
  }
  const prereq = (card.prerequisites ?? '').trim()
  const prereqCount = !prereq || prereq === '[]' ? 0 : prereq.replace(/^\[|\]$/g, '').split(',').filter(Boolean).length
  return { colorIndex, prereqCount }
}

/** Sort technologies: by color (blue, yellow, green, red, unit upgrade, nekro), then by prereq count ascending. */
function sortByTechnology(cards: CardItem[]): CardItem[] {
  return [...cards].sort((a, b) => {
    const ka = getTechSortKey(a)
    const kb = getTechSortKey(b)
    if (ka.colorIndex !== kb.colorIndex) return ka.colorIndex - kb.colorIndex
    return ka.prereqCount - kb.prereqCount
  })
}

/** Sort faction technologies: by faction, then by color and prereq count. */
function sortByTechnologyFaction(cards: CardItem[]): CardItem[] {
  return [...cards].sort((a, b) => {
    if (a.type !== 'technology' || b.type !== 'technology') return 0
    const fa = (a.factionId ?? '').localeCompare(b.factionId ?? '')
    if (fa !== 0) return fa
    const ka = getTechSortKey(a)
    const kb = getTechSortKey(b)
    if (ka.colorIndex !== kb.colorIndex) return ka.colorIndex - kb.colorIndex
    return ka.prereqCount - kb.prereqCount
  })
}

const LEADER_TYPE_ORDER = ['agent', 'commander', 'hero'] as const

/** Sort faction leaders: by faction, then by agent < commander < hero. */
function sortByFactionLeader(cards: CardItem[]): CardItem[] {
  return [...cards].sort((a, b) => {
    if (a.type !== 'faction_leader' || b.type !== 'faction_leader') return 0
    const fa = (a.factionId ?? '').localeCompare(b.factionId ?? '')
    if (fa !== 0) return fa
    const la = (a.leaderType ?? '').toLowerCase()
    const lb = (b.leaderType ?? '').toLowerCase()
    const ia = LEADER_TYPE_ORDER.indexOf(la as (typeof LEADER_TYPE_ORDER)[number])
    const ib = LEADER_TYPE_ORDER.indexOf(lb as (typeof LEADER_TYPE_ORDER)[number])
    return (ia >= 0 ? ia : 999) - (ib >= 0 ? ib : 999)
  })
}

/** Parse unit cost for sorting. Empty/undefined = Infinity (sort to bottom). */
function parseUnitCost(cost: string): number {
  const s = (cost ?? '').trim()
  if (!s) return Infinity
  const n = parseFloat(s)
  return Number.isFinite(n) ? n : Infinity
}

/** Unit type order: non-mech/flagship first, then flagship, then mech. */
const UNIT_CLASS_ORDER: Record<string, number> = {
  flagship: 1,
  mech: 2,
}

function getUnitClassOrder(unit: string): number {
  const u = (unit ?? '').toLowerCase()
  return UNIT_CLASS_ORDER[u] ?? 0
}

/** Sort general units: by cost ascending, no-cost at bottom. */
function sortByUnitGeneral(cards: CardItem[]): CardItem[] {
  return [...cards].sort((a, b) => {
    if (a.type !== 'unit' || b.type !== 'unit') return 0
    const ca = parseUnitCost(a.cost)
    const cb = parseUnitCost(b.cost)
    if (ca !== cb) return ca - cb
    return a.name.localeCompare(b.name)
  })
}

/** Faction display order for grouping (matches factions.csv). */
export const FACTION_ORDER = [
  'arborec', 'barony', 'saar', 'muaat', 'hacan', 'sol', 'ghosts', 'lizix', 'mentak', 'naalu', 'nekro', 'sardakk',
  'jolnar', 'winnu', 'xxcha', 'yin', 'yssaril', 'argent', 'empyrean', 'mahact', 'nra', 'nomad', 'titans', 'cabal',
  'keleres', 'crimson', 'deepwrought', 'firmament', 'obsidian', 'bastion', 'lizards',
]

function sortByUnitFaction(cards: CardItem[]): CardItem[] {
  function factionIndex(fid: string): number {
    const i = FACTION_ORDER.indexOf(fid.toLowerCase())
    return i >= 0 ? i : 999
  }
  return [...cards].sort((a, b) => {
    if (a.type !== 'unit' || b.type !== 'unit') return 0
    const fa = factionIndex(a.factionId ?? '')
    const fb = factionIndex(b.factionId ?? '')
    if (fa !== fb) return fa - fb
    const oa = getUnitClassOrder(a.unit)
    const ob = getUnitClassOrder(b.unit)
    if (oa !== ob) return oa - ob
    const ca = parseUnitCost(a.cost)
    const cb = parseUnitCost(b.cost)
    if (ca !== cb) return ca - cb
    return a.name.localeCompare(b.name)
  })
}

/** Partition cards by type and sort each appropriately. */
export function partitionByType(cards: CardItem[]): {
  action: CardItem[]
  agenda: CardItem[]
  strategy: CardItem[]
  public_objective: CardItem[]
  secret_objective: CardItem[]
  legendary_planet: CardItem[]
  exploration: CardItem[]
  relic: CardItem[]
  faction_ability: CardItem[]
  faction_leader: CardItem[]
  promissory_note_general: CardItem[]
  promissory_note_faction: CardItem[]
  breakthrough: CardItem[]
  technology_general: CardItem[]
  technology_faction: CardItem[]
  galactic_event: CardItem[]
  plot: CardItem[]
  unit_general: CardItem[]
  unit_faction: CardItem[]
} {
  const action = sortByName(cards.filter((c) => c.type === 'action'))
  const agenda = sortByName(cards.filter((c) => c.type === 'agenda'))
  const strategy = sortByInitiative(cards.filter((c) => c.type === 'strategy'))
  const public_objective = sortByName(cards.filter((c) => c.type === 'public_objective'))
  const secret_objective = sortByName(cards.filter((c) => c.type === 'secret_objective'))
  const legendary_planet = sortByName(cards.filter((c) => c.type === 'legendary_planet'))
  const explorationCards = cards.filter((c) => c.type === 'exploration')
  const exploration = sortByExploration(explorationCards.filter((c) => (c.explorationType ?? '').toLowerCase() !== 'relic'))
  const relic = sortByName(explorationCards.filter((c) => (c.explorationType ?? '').toLowerCase() === 'relic'))
  const faction_ability = sortByName(cards.filter((c) => c.type === 'faction_ability'))
  const faction_leader = sortByFactionLeader(cards.filter((c) => c.type === 'faction_leader'))
  const promissoryNoteCards = cards.filter((c) => c.type === 'promissory_note')
  const promissory_note_general = sortByName(promissoryNoteCards.filter((c) => !(c.factionId ?? '').trim()))
  const promissory_note_faction = sortByName(promissoryNoteCards.filter((c) => (c.factionId ?? '').trim() !== ''))
  const breakthrough = sortByName(cards.filter((c) => c.type === 'breakthrough'))
  const techCards = cards.filter((c) => c.type === 'technology')
  const technology_general = sortByTechnology(techCards.filter((c) => !(c.factionId ?? '').trim()))
  const technology_faction = sortByTechnologyFaction(techCards.filter((c) => (c.factionId ?? '').trim() !== ''))
  const galactic_event = sortByName(cards.filter((c) => c.type === 'galactic_event'))
  const plot = sortByName(cards.filter((c) => c.type === 'plot'))
  const unitCards = cards.filter((c) => c.type === 'unit')
  const unit_general = sortByUnitGeneral(unitCards.filter((c) => !(c.factionId ?? '').trim()))
  const unit_faction = sortByUnitFaction(unitCards.filter((c) => (c.factionId ?? '').trim() !== ''))
  return { action, agenda, strategy, public_objective, secret_objective, legendary_planet, exploration, relic, faction_ability, faction_leader, promissory_note_general, promissory_note_faction, breakthrough, technology_general, technology_faction, galactic_event, plot, unit_general, unit_faction }
}

function filterByType(cards: CardItem[], type: CardType): CardItem[] {
  if (type === 'promissory_note_general') return cards.filter((c) => c.type === 'promissory_note' && !(c.factionId ?? '').trim())
  if (type === 'promissory_note_faction') return cards.filter((c) => c.type === 'promissory_note' && (c.factionId ?? '').trim() !== '')
  if (type === 'technology_general') return cards.filter((c) => c.type === 'technology' && !(c.factionId ?? '').trim())
  if (type === 'technology_faction') return cards.filter((c) => c.type === 'technology' && (c.factionId ?? '').trim() !== '')
  if (type === 'unit_general') return cards.filter((c) => c.type === 'unit' && !(c.factionId ?? '').trim())
  if (type === 'unit_faction') return cards.filter((c) => c.type === 'unit' && (c.factionId ?? '').trim() !== '')
  if (type === 'unit') return cards.filter((c) => c.type === 'unit')
  if (type === 'relic') return cards.filter((c) => c.type === 'exploration' && (c.explorationType ?? '').toLowerCase() === 'relic')
  if (type === 'exploration') return cards.filter((c) => c.type === 'exploration' && (c.explorationType ?? '').toLowerCase() !== 'relic')
  return cards.filter((c) => c.type === type)
}

export interface UseFuseSearchOptions {
  /** When set, only search within this category. */
  typeFilter?: CardType
  /** Max results (default 50; use higher for global search). */
  limit?: number
}

export function useFuseSearch(cards: CardItem[], options: UseFuseSearchOptions = {}) {
  const { typeFilter, limit = MAX_RESULTS } = options
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')

  const filteredCards = useMemo(
    () => (typeFilter ? filterByType(cards, typeFilter) : cards),
    [cards, typeFilter]
  )

  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedQuery(query), DEBOUNCE_MS)
    return () => window.clearTimeout(id)
  }, [query])

  const fuse = useMemo(() => createFuse(filteredCards), [filteredCards])
  const allSorted = useMemo(() => {
    if (typeFilter === 'strategy') return sortByInitiative(filteredCards)
    if (typeFilter === 'exploration') return sortByExploration(filteredCards)
    if (typeFilter === 'technology_general') return sortByTechnology(filteredCards)
    if (typeFilter === 'technology_faction') return sortByTechnologyFaction(filteredCards)
    if (typeFilter === 'faction_leader') return sortByFactionLeader(filteredCards)
    if (typeFilter === 'unit_general') return sortByUnitGeneral(filteredCards)
    if (typeFilter === 'unit_faction') return sortByUnitFaction(filteredCards)
    if (typeFilter === 'unit') {
      const unitCards = filteredCards.filter((c) => c.type === 'unit')
      const general = sortByUnitGeneral(unitCards.filter((c) => !(c.factionId ?? '').trim()))
      const faction = sortByUnitFaction(unitCards.filter((c) => (c.factionId ?? '').trim() !== ''))
      return [...general, ...faction]
    }
    return sortByName(filteredCards)
  }, [filteredCards, typeFilter])

  const results = useMemo(() => {
    const q = debouncedQuery.trim()
    if (q === '') return allSorted
    const hits = fuse.search(q, { limit })
    const items = hits.map((h) => h.item)
    if (typeFilter === 'strategy') return sortByInitiative(items)
    if (typeFilter === 'exploration') return sortByExploration(items)
    if (typeFilter === 'technology_general') return sortByTechnology(items)
    if (typeFilter === 'technology_faction') return sortByTechnologyFaction(items)
    if (typeFilter === 'faction_leader') return sortByFactionLeader(items)
    if (typeFilter === 'unit_general') return sortByUnitGeneral(items)
    if (typeFilter === 'unit_faction') return sortByUnitFaction(items)
    if (typeFilter === 'unit') {
      const unitCards = items.filter((c) => c.type === 'unit')
      const general = sortByUnitGeneral(unitCards.filter((c) => !(c.factionId ?? '').trim()))
      const faction = sortByUnitFaction(unitCards.filter((c) => (c.factionId ?? '').trim() !== ''))
      return [...general, ...faction]
    }
    return items
  }, [debouncedQuery, fuse, allSorted, limit, typeFilter])

  return { query, setQuery, results, debouncedQuery }
}
