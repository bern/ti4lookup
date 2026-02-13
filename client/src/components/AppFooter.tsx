import { ThemeSelector, type ThemeId } from './ThemeSelector'

interface AppFooterProps {
  theme: ThemeId
  onThemeChange: (theme: ThemeId) => void
}

export function AppFooter({ theme, onThemeChange }: AppFooterProps) {
  return (
    <footer className="app-footer">
      <div className="app-footer__theme">
        <ThemeSelector value={theme} onChange={onThemeChange} />
      </div>
      <p className="app-footer__text">
        Made with ❤️ by{' '}
        <a
          href="https://github.com/bern"
          target="_blank"
          rel="noopener noreferrer"
          className="app-footer__link"
        >
          bern
        </a>
      </p>
      <p className="app-footer__text">
        Have requests or spot a typo? Let me know by opening an{' '}
        <a
          href="https://github.com/bern/ti4lookup/issues"
          target="_blank"
          rel="noopener noreferrer"
          className="app-footer__link"
        >
          Issue on Github
        </a>
      </p>
    </footer>
  )
}
