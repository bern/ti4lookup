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

/**
 * Public objective (stage 1 or 2). From objectives CSV where type is "stage 1 public" or "stage 2 public".
 * Columns: name, condition, points, type, when to score, version.
 */
export interface PublicObjective {
  name: string
  condition: string
  points: string
  stage: string
  whenToScore: string
  version: string
}

/**
 * Secret objective. From objectives CSV where type is "secret".
 */
export interface SecretObjective {
  name: string
  condition: string
  points: string
  whenToScore: string
  version: string
}

/**
 * Legendary planet from CSV. Columns: name, trait, technology, resources, influence, ability, how to acquire, version.
 */
export interface LegendaryPlanet {
  name: string
  trait: string
  technology: string
  resources: string
  influence: string
  ability: string
  howToAcquire: string
  version: string
}

/**
 * Exploration card from CSV. Columns: name, type, quantity, effect, version.
 */
export interface Exploration {
  name: string
  explorationType: string
  quantity: string
  effect: string
  version: string
}

/** Combined item for search/display with searchText for Fuse. */
export type CardItem =
  | (ActionCard & { type: 'action'; searchText: string })
  | (StrategyCard & { type: 'strategy'; searchText: string })
  | (Agenda & { type: 'agenda'; searchText: string })
  | (PublicObjective & { type: 'public_objective'; searchText: string })
  | (SecretObjective & { type: 'secret_objective'; searchText: string })
  | (LegendaryPlanet & { type: 'legendary_planet'; searchText: string })
  | (Exploration & { type: 'exploration'; searchText: string })
