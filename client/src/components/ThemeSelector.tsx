export type ThemeId = 'light' | 'dark' | 'hylar' | 'gashlai' | 'void'

export const THEME_OPTIONS: { id: ThemeId; label: string }[] = [
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
  { id: 'hylar', label: 'Hylar' },
  { id: 'gashlai', label: 'Gashlai' },
  { id: 'void', label: 'Void' },
]

interface ThemeSelectorProps {
  value: ThemeId
  onChange: (theme: ThemeId) => void
}

export function ThemeSelector({ value, onChange }: ThemeSelectorProps) {
  return (
    <select
      className="theme-select"
      value={value}
      onChange={(e) => onChange(e.target.value as ThemeId)}
      aria-label="Theme"
    >
      {THEME_OPTIONS.map((opt) => (
        <option key={opt.id} value={opt.id}>
          {opt.label}
        </option>
      ))}
    </select>
  )
}
