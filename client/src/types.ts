/**
 * Action card row from CSV. Columns: name, quantity, timing, effect, version.
 */
export interface ActionCard {
  name: string
  quantity: string
  timing: string
  effect: string
  version: string
}

/**
 * Strategy card row from CSV. Columns: name, initative, primary, secondary, color, version.
 */
export interface StrategyCard {
  name: string
  initiative: string
  primary: string
  secondary: string
  color: string
  version: string
}

/**
 * Agenda row from CSV. Columns: name, type, elect, effect, version, removed in pok.
 * We use agendaType for the CSV "type" (e.g. Law) so "type" can be the CardItem discriminator.
 */
export interface Agenda {
  name: string
  agendaType: string
  elect: string
  effect: string
  version: string
  removedInPok: string
}

/** Combined item for search/display: action, strategy, or agenda with searchText for Fuse. */
export type CardItem =
  | (ActionCard & { type: 'action'; searchText: string })
  | (StrategyCard & { type: 'strategy'; searchText: string })
  | (Agenda & { type: 'agenda'; searchText: string })
