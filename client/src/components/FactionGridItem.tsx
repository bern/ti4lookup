import type { Faction } from '../data/loadCards'

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
      <button
        type="button"
        className={`faction-grid__btn ${portraitMode ? 'faction-grid__btn--portrait' : 'faction-grid__btn--symbol'}`}
        onClick={() => onOpenFaction(faction.id)}
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
      </button>
      {portraitMode && <span className="faction-grid__label faction-grid__label--below">{faction.name}</span>}
    </div>
  )
}
