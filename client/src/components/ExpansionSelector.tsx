import { useState, useRef, useEffect } from 'react'

export type ExpansionId = 'pok' | 'codex1' | 'codex2' | 'codex3' | 'codex4' | 'thundersEdge'

export const EXPANSION_OPTIONS: { id: ExpansionId; label: string }[] = [
  { id: 'pok', label: 'Prophecy of Kings' },
  { id: 'codex1', label: 'Codex 1' },
  { id: 'codex2', label: 'Codex 2' },
  { id: 'codex3', label: 'Codex 3' },
  { id: 'codex4', label: 'Codex 4' },
  { id: 'thundersEdge', label: "Thunder's Edge" },
]

const EXPANSION_TO_VERSION: Record<ExpansionId, string> = {
  pok: 'pok',
  codex1: 'codex 1',
  codex2: 'codex 2',
  codex3: 'codex 3',
  codex4: 'codex 4',
  thundersEdge: 'thunders edge',
}

export function expansionIdsToVersions(ids: Set<ExpansionId>): Set<string> {
  const versions = new Set<string>()
  for (const id of ids) {
    versions.add(EXPANSION_TO_VERSION[id])
  }
  return versions
}

export function cardVersionMatchesExpansions(
  cardVersion: string | undefined,
  selectedVersions: Set<string>
): boolean {
  const v = (cardVersion ?? '').trim().toLowerCase()
  if (!v) return true // no version = always include (e.g. faction abilities, breakthroughs)
  if (v === 'base game') return true
  return selectedVersions.has(v)
}

/** Expansion order for "exclude after" and "removed in pok" logic. */
const EXPANSION_ORDER: ExpansionId[] = [
  'pok',
  'codex1',
  'codex2',
  'codex3',
  'codex4',
  'thundersEdge',
]

/** Versions that map to expansion IDs (for exclude after comparison). */
const VERSION_TO_EXPANSION_IDS: Record<string, ExpansionId[]> = {
  'base game': EXPANSION_ORDER,
  pok: ['pok', 'codex1', 'codex2', 'codex3', 'codex4', 'thundersEdge'],
  'codex 1': ['codex1', 'codex2', 'codex3', 'codex4', 'thundersEdge'],
  'codex 2': ['codex2', 'codex3', 'codex4', 'thundersEdge'],
  'codex 3': ['codex3', 'codex4', 'thundersEdge'],
  'codex 4': ['codex4', 'thundersEdge'],
  'thunders edge': ['thundersEdge'],
}

/** Returns true if the card should be excluded based on "exclude after" column. */
export function isExcludedByExcludeAfter(
  excludeAfter: string | undefined,
  selectedExpansions: Set<ExpansionId>
): boolean {
  const val = (excludeAfter ?? '').trim().toLowerCase()
  if (!val) return false
  const idsAtOrAfter = VERSION_TO_EXPANSION_IDS[val]
  if (!idsAtOrAfter) return false
  return idsAtOrAfter.some((id) => selectedExpansions.has(id))
}

/** Returns true if the card should be excluded based on "removed in pok" (agendas only). */
export function isExcludedByRemovedInPok(
  removedInPok: string,
  selectedExpansions: Set<ExpansionId>
): boolean {
  if (removedInPok !== 'true') return false
  return selectedExpansions.has('pok') || EXPANSION_ORDER.some((id) => selectedExpansions.has(id))
}

/** Count Ω characters in a string. */
function countOmegas(s: string): number {
  return (s.match(/Ω/g) ?? []).length
}

/** Base name without Ω. */
function baseName(name: string): string {
  return name.replace(/Ω/g, '').replace(/\s+/g, ' ').trim()
}

/** Get factionId from card for omega grouping (faction-specific cards group separately). */
function getFactionId(card: { type: string; factionId?: string }): string {
  return 'factionId' in card && card.factionId ? card.factionId : ''
}

/** Filter to only the latest omega version per (type, baseName, factionId). */
export function filterToLatestOmega<T extends { name: string; type: string; factionId?: string }>(
  cards: T[]
): T[] {
  const byKey = new Map<string, T[]>()
  for (const card of cards) {
    const key = `${card.type}:${baseName(card.name)}:${getFactionId(card)}`
    const list = byKey.get(key) ?? []
    list.push(card)
    byKey.set(key, list)
  }
  const result: T[] = []
  for (const list of byKey.values()) {
    if (list.length === 1) {
      result.push(list[0])
    } else {
      const best = list.reduce((a, b) => (countOmegas(b.name) >= countOmegas(a.name) ? b : a))
      result.push(best)
    }
  }
  return result
}

interface ExpansionSelectorProps {
  selected: Set<ExpansionId>
  onChange: (selected: Set<ExpansionId>) => void
  includeRetiredCards: boolean
  onIncludeRetiredCardsChange: (value: boolean) => void
}

export function ExpansionSelector({
  selected,
  onChange,
  includeRetiredCards,
  onIncludeRetiredCardsChange,
}: ExpansionSelectorProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    if (open) {
      document.addEventListener('click', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
    }
    return () => {
      document.removeEventListener('click', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [open])

  const toggle = (id: ExpansionId) => {
    const next = new Set(selected)
    if (next.has(id)) {
      next.delete(id)
      if (id === 'thundersEdge') {
        next.delete('codex1')
        next.delete('codex2')
        next.delete('codex3')
        next.delete('codex4')
      }
    } else {
      next.add(id)
      if (id === 'thundersEdge') {
        next.add('codex1')
        next.add('codex2')
        next.add('codex3')
        next.add('codex4')
      }
    }
    onChange(next)
  }

  const count = selected.size
  const label = `${count} expansion${count === 1 ? '' : 's'}${includeRetiredCards ? ' + Ω' : ''}`

  return (
    <div className="expansion-selector" ref={ref}>
      <button
        type="button"
        className="expansion-selector__trigger"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label="Select expansions"
      >
        {label} ▾
      </button>
      {open && (
        <div className="expansion-selector__dropdown" role="group" aria-label="Expansion options">
          {EXPANSION_OPTIONS.map((opt) => (
            <label key={opt.id} className="expansion-selector__option">
              <input
                type="checkbox"
                checked={selected.has(opt.id)}
                onChange={() => toggle(opt.id)}
              />
              <span>{opt.label}</span>
            </label>
          ))}
          <div className="expansion-selector__divider" />
          <label className="expansion-selector__option">
            <input
              type="checkbox"
              checked={includeRetiredCards}
              onChange={(e) => onIncludeRetiredCardsChange(e.target.checked)}
            />
            <span>Include retired cards</span>
          </label>
        </div>
      )}
    </div>
  )
}
