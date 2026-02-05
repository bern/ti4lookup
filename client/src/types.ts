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

/** Combined item for search/display: action or strategy card with searchText for Fuse. */
export type CardItem =
  | (ActionCard & { type: 'action'; searchText: string })
  | (StrategyCard & { type: 'strategy'; searchText: string })
