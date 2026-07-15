import { Fragment, useEffect, useRef, useState, type ReactNode } from 'react'
import type { CardItem } from '../types'
import { ResultsList } from './ResultsList'

/** A sub-group within a section, optionally preceded by an h3 sub-header. */
export interface ResultGroup {
  subtitle?: string
  cards: CardItem[]
}

export interface ResultSection {
  /** Stable identity for React keys. */
  key: string
  /** Section header (h2). Omit for an untitled section. */
  title?: string
  ariaLabel?: string
  /** A non-card element rendered before the groups (e.g. a faction setup card). Counts as one row toward the reveal budget. */
  leadNode?: ReactNode
  groups: ResultGroup[]
}

interface ProgressiveSectionsProps {
  /** Sections in display order. */
  sections: ResultSection[]
  /** Reveal window resets to the initial batch whenever this changes (e.g. the query). */
  resetKey: string
  /** Rows mounted on first render. */
  initialCount?: number
  /** Rows added each time the sentinel scrolls into view. */
  batchSize?: number
}

const DEFAULT_INITIAL = 8
const DEFAULT_BATCH = 8

/** Nearest scrollable ancestor, used as the IntersectionObserver root so prefetch works inside a scroll container (not just the window). */
function getScrollParent(node: HTMLElement | null): HTMLElement | null {
  let el = node?.parentElement ?? null
  while (el) {
    const overflowY = getComputedStyle(el).overflowY
    if (overflowY === 'auto' || overflowY === 'scroll') return el
    el = el.parentElement
  }
  return null
}

/**
 * Renders a sectioned list of result rows, but only mounts the first N rows and
 * reveals more as the user scrolls (a global "infinite scroll" across all
 * sections). This keeps the initial React reconciliation cheap even when a query
 * matches 100+ cards — off-screen rows are never created until needed.
 *
 * The budget is global, not per-section: rows are handed out in display order,
 * so a query spread across 15 sections still only mounts `initialCount` rows up
 * front rather than `initialCount × 15`.
 */
export function ProgressiveSections({
  sections,
  resetKey,
  initialCount = DEFAULT_INITIAL,
  batchSize = DEFAULT_BATCH,
}: ProgressiveSectionsProps) {
  const [visibleCount, setVisibleCount] = useState(initialCount)
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  // Collapse back to the first batch when the query changes. Done during render
  // (not in an effect) so the new results mount at `initialCount` immediately,
  // rather than briefly mounting the previous — possibly large — visible count.
  const prevResetKey = useRef(resetKey)
  if (prevResetKey.current !== resetKey) {
    prevResetKey.current = resetKey
    setVisibleCount(initialCount)
  }

  const totalRows = sections.reduce(
    (sum, s) => sum + (s.leadNode ? 1 : 0) + s.groups.reduce((g, grp) => g + grp.cards.length, 0),
    0
  )
  const hasMore = visibleCount < totalRows

  // Grow the window when the sentinel nears the viewport. Re-observing on every
  // visibleCount change re-checks intersection, so a short list keeps loading
  // until the sentinel is pushed out of view.
  useEffect(() => {
    if (!hasMore) return
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) setVisibleCount((c) => c + batchSize)
      },
      { root: getScrollParent(el), rootMargin: '800px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasMore, batchSize, visibleCount])

  // Walk sections in order, handing out the row budget.
  let remaining = visibleCount
  const rendered: ReactNode[] = []
  for (const section of sections) {
    if (remaining <= 0) break

    let lead: ReactNode = null
    if (section.leadNode) {
      lead = section.leadNode
      remaining -= 1
    }

    const visibleGroups: ResultGroup[] = []
    for (const group of section.groups) {
      if (remaining <= 0) break
      if (group.cards.length === 0) continue
      const slice = group.cards.slice(0, remaining)
      remaining -= slice.length
      visibleGroups.push({ subtitle: group.subtitle, cards: slice })
    }

    if (!lead && visibleGroups.length === 0) continue

    rendered.push(
      <section key={section.key} className="results-section" aria-label={section.ariaLabel ?? section.title}>
        {section.title && <h2 className="section-title">{section.title}</h2>}
        {lead}
        {visibleGroups.map((g, i) => (
          <Fragment key={g.subtitle ?? i}>
            {g.subtitle && <h3 className="section-title section-title--sub">{g.subtitle}</h3>}
            <ResultsList cards={g.cards} />
          </Fragment>
        ))}
      </section>
    )
  }

  return (
    <>
      {rendered}
      {hasMore && <div ref={sentinelRef} className="results-sentinel" aria-hidden />}
    </>
  )
}
