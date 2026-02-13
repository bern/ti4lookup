import { useCallback, useState } from 'react'
import JSZip from 'jszip'
import { ThemeSelector, type ThemeId } from './ThemeSelector'

const csvModules = import.meta.glob<string>('/public/*.csv', { query: '?raw', import: 'default' })

interface AppFooterProps {
  theme: ThemeId
  onThemeChange: (theme: ThemeId) => void
}

export function AppFooter({ theme, onThemeChange }: AppFooterProps) {
  const [downloading, setDownloading] = useState(false)

  const handleDownloadZip = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault()
    if (downloading) return
    setDownloading(true)
    try {
      const zip = new JSZip()
      await Promise.all(
        Object.entries(csvModules).map(async ([path, load]) => {
          const name = path.split('/').pop() ?? ''
          const text = await load()
          zip.file(name, text)
        })
      )
      const blob = await zip.generateAsync({ type: 'blob' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'ti4_data.zip'
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Failed to create zip:', err)
    } finally {
      setDownloading(false)
    }
  }, [downloading])

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
      <p className="app-footer__text">
        Want to play with the data?{' '}
        <a
          href="#"
          className="app-footer__link"
          onClick={handleDownloadZip}
        >
          Click to download
        </a>
      </p>
    </footer>
  )
}
