import { useMemo, useState, useEffect } from 'react'
import Fuse from 'fuse.js'
import type { CardItem } from '../types'

const MAX_RESULTS = 50
const DEBOUNCE_MS = 50

export type CardType =
  | 'action' | 'agenda' | 'strategy' | 'public_objective' | 'secret_objective' | 'legendary_planet' | 'exploration'
  | 'faction_ability' | 'faction_leader' | 'promissory_note' | 'promissory_note_general' | 'promissory_note_faction'
  | 'breakthrough' | 'technology' | 'technology_general' | 'technology_faction' | 'galactic_event' | 'plot'

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

/** Partition cards by type and sort each appropriately. */
export function partitionByType(cards: CardItem[]): {
  action: CardItem[]
  agenda: CardItem[]
  strategy: CardItem[]
  public_objective: CardItem[]
  secret_objective: CardItem[]
  legendary_planet: CardItem[]
  exploration: CardItem[]
  faction_ability: CardItem[]
  faction_leader: CardItem[]
  promissory_note_general: CardItem[]
  promissory_note_faction: CardItem[]
  breakthrough: CardItem[]
  technology_general: CardItem[]
  technology_faction: CardItem[]
  galactic_event: CardItem[]
  plot: CardItem[]
} {
  const action = sortByName(cards.filter((c) => c.type === 'action'))
  const agenda = sortByName(cards.filter((c) => c.type === 'agenda'))
  const strategy = sortByInitiative(cards.filter((c) => c.type === 'strategy'))
  const public_objective = sortByName(cards.filter((c) => c.type === 'public_objective'))
  const secret_objective = sortByName(cards.filter((c) => c.type === 'secret_objective'))
  const legendary_planet = sortByName(cards.filter((c) => c.type === 'legendary_planet'))
  const exploration = sortByName(cards.filter((c) => c.type === 'exploration'))
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
  return { action, agenda, strategy, public_objective, secret_objective, legendary_planet, exploration, faction_ability, faction_leader, promissory_note_general, promissory_note_faction, breakthrough, technology_general, technology_faction, galactic_event, plot }
}

function filterByType(cards: CardItem[], type: CardType): CardItem[] {
  if (type === 'promissory_note_general') return cards.filter((c) => c.type === 'promissory_note' && !(c.factionId ?? '').trim())
  if (type === 'promissory_note_faction') return cards.filter((c) => c.type === 'promissory_note' && (c.factionId ?? '').trim() !== '')
  if (type === 'technology_general') return cards.filter((c) => c.type === 'technology' && !(c.factionId ?? '').trim())
  if (type === 'technology_faction') return cards.filter((c) => c.type === 'technology' && (c.factionId ?? '').trim() !== '')
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
    if (typeFilter === 'technology_general') return sortByTechnology(filteredCards)
    if (typeFilter === 'technology_faction') return sortByTechnologyFaction(filteredCards)
    if (typeFilter === 'faction_leader') return sortByFactionLeader(filteredCards)
    return sortByName(filteredCards)
  }, [filteredCards, typeFilter])

  const results = useMemo(() => {
    const q = debouncedQuery.trim()
    if (q === '') return allSorted
    const hits = fuse.search(q, { limit })
    const items = hits.map((h) => h.item)
    if (typeFilter === 'strategy') return sortByInitiative(items)
    if (typeFilter === 'technology_general') return sortByTechnology(items)
    if (typeFilter === 'technology_faction') return sortByTechnologyFaction(items)
    if (typeFilter === 'faction_leader') return sortByFactionLeader(items)
    return items
  }, [debouncedQuery, fuse, allSorted, limit, typeFilter])

  return { query, setQuery, results, debouncedQuery }
}
