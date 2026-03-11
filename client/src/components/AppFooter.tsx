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
        </a>, contributions from{' '}
        <a
          href="https://github.com/scharney"
          target="_blank"
          rel="noopener noreferrer"
          className="app-footer__link"
        >scharney</a>
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
      <div className="app-footer__disclaimer">
        <p className="app-footer__text">
          TI4 Lookup is a fan project and is not affiliated with{' '}
          <a
            href="https://www.fantasyflightgames.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="app-footer__link"
          >
            Fantasy Flight Games®
          </a>
        </p>
        <p className="app-footer__text">
          This tool is for reference only. It is not a substitute for owning{' '}
          <a
            href="https://www.fantasyflightgames.com/en/products/twilight-imperium-fourth-edition/"
            target="_blank"
            rel="noopener noreferrer"
            className="app-footer__link">
              Twilight Imperium 4th Edition
          </a>
        </p>
      </div>
    </footer>
  )
}
