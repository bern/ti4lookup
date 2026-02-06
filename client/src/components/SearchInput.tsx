import { useEffect, useRef } from 'react'

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  autoFocus?: boolean
  'aria-label'?: string
  /** Called on blur and Enter key (e.g. to save as recent search). */
  onCommit?: (value: string) => void
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'Search…',
  autoFocus = false,
  'aria-label': ariaLabel = 'Search',
  onCommit,
}: SearchInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus()
  }, [autoFocus])

  return (
    <input
      ref={inputRef}
      type="search"
      className="search-input"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={() => onCommit?.(value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onCommit?.(value)
      }}
      placeholder={placeholder}
      aria-label={ariaLabel}
    />
  )
}
