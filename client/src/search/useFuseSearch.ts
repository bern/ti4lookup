import { useMemo, useState, useEffect } from 'react'
import Fuse from 'fuse.js'
import type { CardItem } from '../types'

const MAX_RESULTS = 50
const DEBOUNCE_MS = 50

export type CardType = 'action' | 'agenda' | 'strategy' | 'public_objective' | 'secret_objective' | 'legendary_planet' | 'exploration' | 'faction_ability' | 'faction_leader' | 'promissory_note' | 'breakthrough' | 'technology' | 'galactic_event' | 'plot'

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

/** Partition cards by type and sort each appropriately (strategy by initiative, others by name). */
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
  promissory_note: CardItem[]
  breakthrough: CardItem[]
  technology: CardItem[]
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
  const faction_leader = sortByName(cards.filter((c) => c.type === 'faction_leader'))
  const promissory_note = sortByName(cards.filter((c) => c.type === 'promissory_note'))
  const breakthrough = sortByName(cards.filter((c) => c.type === 'breakthrough'))
  const technology = sortByName(cards.filter((c) => c.type === 'technology'))
  const galactic_event = sortByName(cards.filter((c) => c.type === 'galactic_event'))
  const plot = sortByName(cards.filter((c) => c.type === 'plot'))
  return { action, agenda, strategy, public_objective, secret_objective, legendary_planet, exploration, faction_ability, faction_leader, promissory_note, breakthrough, technology, galactic_event, plot }
}

function filterByType(cards: CardItem[], type: CardType): CardItem[] {
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
    return sortByName(filteredCards)
  }, [filteredCards, typeFilter])

  const results = useMemo(() => {
    const q = debouncedQuery.trim()
    if (q === '') return allSorted
    const hits = fuse.search(q, { limit })
    const items = hits.map((h) => h.item)
    if (typeFilter === 'strategy') return sortByInitiative(items)
    return items
  }, [debouncedQuery, fuse, allSorted, limit, typeFilter])

  return { query, setQuery, results, debouncedQuery }
}
