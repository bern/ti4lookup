/** Shown while the search debounce catches up to the latest keystroke. */
export function SearchSpinner() {
  return (
    <p className="search-spinner" role="status" aria-live="polite">
      <span className="search-spinner__icon" aria-hidden />
      Searching…
    </p>
  )
}
