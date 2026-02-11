import type { Faction } from '../data/loadCards'

const IMAGES_BASE = import.meta.env.BASE_URL + 'images'

interface FactionSetupCardProps {
  faction: Faction
  techNameToColor: Map<string, string>
}

/** Parse starting technologies string into prefix (e.g. "Choose 1 of:") and list of tech names. */
function parseStartingTechs(raw: string): { prefix: string; techNames: string[] } {
  const s = (raw ?? '').trim()
  if (!s) return { prefix: '', techNames: [] }
  const chooseMatch = /^Choose\s+\d+\s+of\s*:\s*/i.exec(s) || /^Choose\s+\d+\s*:\s*of\s*/i.exec(s)
  if (chooseMatch) {
    const prefix = chooseMatch[0]
    const rest = s.slice(prefix.length).trim()
    const techNames = rest.split(',').map((t) => t.trim()).filter(Boolean)
    return { prefix, techNames }
  }
  if (s.includes(',')) {
    const techNames = s.split(',').map((t) => t.trim()).filter(Boolean)
    return { prefix: '', techNames }
  }
  return { prefix: '', techNames: s ? [s] : [] }
}

export function FactionSetupCard({ faction, techNameToColor }: FactionSetupCardProps) {
  const hasFleet = Boolean(faction.startingFleet?.trim())
  const hasTech = Boolean(faction.startingTechnologies?.trim())
  const { prefix, techNames } = parseStartingTechs(faction.startingTechnologies ?? '')

  const renderTechContent = () => {
    if (techNames.length === 0) {
      return <p className="result-row__effect">{faction.startingTechnologies}</p>
    }
    return (
      <p className="result-row__effect">
        {prefix}
        {techNames.map((name, i) => {
          const color = techNameToColor.get(name) ?? techNameToColor.get(name.replace(/\s*Ω+\s*$/, ''))
          return (
            <span key={i} className="result-row__faction-setup-tech">
              {i > 0 ? ', ' : ''}
              {name}
              {color && (
                <img
                  src={`${IMAGES_BASE}/${color}.png`}
                  alt=""
                  className="result-row__icon result-row__icon--inline"
                  aria-hidden
                />
              )}
            </span>
          )
        })}
      </p>
    )
  }

  return (
    <article className="result-row result-row--faction-setup">
      <header className="result-row__header">
        <div className="result-row__header-content result-row__header-content--faction-setup">
          <img
            src={`${IMAGES_BASE}/${faction.id}.png`}
            alt=""
            className="result-row__faction-setup-image"
          />
          <span className="result-row__name">{faction.name}</span>
        </div>
      </header>
      {(hasFleet || hasTech) && (
        <div className="result-row__faction-setup-body">
          {hasFleet && (
            <>
              <p className="result-row__label">Starting Fleet</p>
              <p className="result-row__effect">{faction.startingFleet}</p>
            </>
          )}
          {hasFleet && hasTech && <div style={{ marginBottom: '1em' }} />}
          {hasTech && (
            <>
              <p className="result-row__label">Starting Technologies</p>
              {renderTechContent()}
            </>
          )}
        </div>
      )}
      <footer className="result-row__footer">
        <span className="result-row__category">Faction Setup • {faction.name}</span>
        <span className="result-row__images">
          <img src={`${IMAGES_BASE}/${faction.id}.png`} alt="" className="result-row__icon" />
        </span>
      </footer>
    </article>
  )
}
