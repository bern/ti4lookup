import type { Faction } from '../data/loadCards'
import { locationToPath } from '../routes'

const IMAGES_BASE = import.meta.env.BASE_URL + 'images'

interface FactionGridItemProps {
  faction: Faction
  portraitMode: boolean
  onOpenFaction: (factionId: string) => void
}

export function FactionGridItem({ faction, portraitMode, onOpenFaction }: FactionGridItemProps) {
  const imgSrc = portraitMode
    ? `${IMAGES_BASE}/${faction.id}_portrait.png`
    : `${IMAGES_BASE}/${faction.id}.png`

  return (
    <div className="faction-grid__item">
      <a
        className={`faction-grid__btn ${portraitMode ? 'faction-grid__btn--portrait' : 'faction-grid__btn--symbol'}`}
        href={locationToPath({ view: 'search', factionFilter: faction.id })}
        onClick={(event) => {
          if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
          event.preventDefault()
          onOpenFaction(faction.id)
        }}
        aria-label={`View cards for ${faction.name}`}
      >
        {portraitMode ? (
          <img
            src={imgSrc}
            alt={`${faction.name} portrait`}
            className="faction-grid__portrait"
          />
        ) : (
          <>
            <span className="faction-grid__label">{faction.name}</span>
            <span className="faction-grid__symbol-area">
              <img
                src={imgSrc}
                alt={`${faction.name} logo`}
                className="faction-grid__img"
              />
            </span>
          </>
        )}
      </a>
      {portraitMode && <span className="faction-grid__label faction-grid__label--below">{faction.name}</span>}
    </div>
  )
}
