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

interface ExpansionSelectorProps {
  selected: Set<ExpansionId>
  onChange: (selected: Set<ExpansionId>) => void
}

export function ExpansionSelector({ selected, onChange }: ExpansionSelectorProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
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
  const label = `${count} expansion${count === 1 ? '' : 's'}`

  return (
    <div className="expansion-selector" ref={ref}>
      <button
        type="button"
        className="expansion-selector__trigger"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label="Select expansions"
      >
        {label} ▾
      </button>
      {open && (
        <div className="expansion-selector__dropdown" role="listbox">
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
        </div>
      )}
    </div>
  )
}
