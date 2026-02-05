import { useMemo, useState, useEffect } from 'react'
import Fuse from 'fuse.js'
import type { ActionCard } from '../types'

const MAX_RESULTS = 50
const DEBOUNCE_MS = 50

/**
 * Fuse.js options: prioritize name, then effect/timing/version.
 * Sensible fuzzy defaults: threshold 0.4, ignoreLocation false so exact field matches rank better.
 */
function createFuse(cards: ActionCard[]): Fuse<ActionCard> {
  return new Fuse(cards, {
    keys: [
      { name: 'name', weight: 0.5 },
      { name: 'effect', weight: 0.25 },
      { name: 'timing', weight: 0.15 },
      { name: 'version', weight: 0.1 },
    ],
    threshold: 0.4,
    ignoreLocation: false,
  })
}

/** Sort cards by name (A–Z). */
function sortByName(cards: ActionCard[]): ActionCard[] {
  return [...cards].sort((a, b) => a.name.localeCompare(b.name))
}

export function useFuseSearch(cards: ActionCard[]) {
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')

  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedQuery(query), DEBOUNCE_MS)
    return () => window.clearTimeout(id)
  }, [query])

  const fuse = useMemo(() => createFuse(cards), [cards])
  const allSorted = useMemo(() => sortByName(cards), [cards])

  const results = useMemo(() => {
    const q = debouncedQuery.trim()
    if (q === '') return allSorted
    const hits = fuse.search(q, { limit: MAX_RESULTS })
    return hits.map((h) => h.item)
  }, [debouncedQuery, fuse, allSorted])

  return { query, setQuery, results }
}
