import { useMemo, useState, useEffect } from 'react'
import Fuse from 'fuse.js'
import type { CardItem } from '../types'

const MAX_RESULTS = 50
const DEBOUNCE_MS = 50

/**
 * Fuse.js over combined action + strategy cards. Searches name and searchText.
 */
function createFuse(cards: CardItem[]): Fuse<CardItem> {
  return new Fuse(cards, {
    keys: [
      { name: 'name', weight: 0.5 },
      { name: 'searchText', weight: 0.5 },
    ],
    threshold: 0.4,
    ignoreLocation: false,
  })
}

/** Sort cards by name (A–Z). */
function sortByName(cards: CardItem[]): CardItem[] {
  return [...cards].sort((a, b) => a.name.localeCompare(b.name))
}

export function useFuseSearch(cards: CardItem[]) {
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
