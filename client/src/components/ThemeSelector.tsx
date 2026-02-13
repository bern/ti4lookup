import { useState, useRef, useEffect } from 'react'

export type ThemeId = 'light' | 'dark' | 'hylar' | 'gashlai' | 'void' | 'mordai'

export const THEME_OPTIONS: { id: ThemeId; label: string }[] = [
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
  { id: 'hylar', label: 'Hylar' },
  { id: 'gashlai', label: 'Gashlai' },
  { id: 'void', label: 'Void' },
  { id: 'mordai', label: 'Mordai' },
]

interface ThemeSelectorProps {
  value: ThemeId
  onChange: (theme: ThemeId) => void
}

export function ThemeSelector({ value, onChange }: ThemeSelectorProps) {
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

  const currentLabel = THEME_OPTIONS.find((o) => o.id === value)?.label ?? value

  return (
    <div className="theme-selector" ref={ref}>
      <button
        type="button"
        className="theme-selector__trigger"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label="Select theme"
      >
        {currentLabel} ▾
      </button>
      {open && (
        <div className="theme-selector__dropdown" role="group" aria-label="Theme options">
          {THEME_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              className={`theme-selector__option ${opt.id === value ? 'theme-selector__option--selected' : ''}`}
              onClick={() => {
                onChange(opt.id)
                setOpen(false)
              }}
            >
              {opt.id === value ? '• ' : ''}{opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
