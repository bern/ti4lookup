import type { CardItem } from '../types'

export function makeActionCard(index: number, searchTerm = 'fixture'): CardItem {
  const number = String(index).padStart(2, '0')
  return {
    type: 'action',
    name: `Card ${number}`,
    quantity: '1',
    timing: '',
    effect: `${searchTerm} effect ${number}`,
    version: 'test',
    searchText: `${searchTerm} Card ${number}`,
  }
}

export function makeActionCards(count: number, searchTerm = 'fixture'): CardItem[] {
  return Array.from({ length: count }, (_, index) => makeActionCard(index + 1, searchTerm))
}
