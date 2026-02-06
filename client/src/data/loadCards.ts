import Papa from 'papaparse'
import type { ActionCard, StrategyCard, Agenda, CardItem } from '../types'

const ACTION_CSV_URL = '/action_cards.csv'
const STRATEGY_CSV_URL = '/strategy_cards.csv'
const AGENDAS_CSV_URL = '/agendas.csv'

function parseCsv<T>(url: string, mapRow: (row: Record<string, string>) => T): Promise<T[]> {
  return fetch(url)
    .then((res) => {
      if (!res.ok) throw new Error(`Failed to load CSV: ${url} — ${res.status}`)
      return res.text()
    })
    .then((text) => {
      const parsed = Papa.parse<Record<string, string>>(text, {
        header: true,
        skipEmptyLines: true,
      })
      if (parsed.errors.length > 0) console.warn('CSV parse warnings:', parsed.errors)
      return parsed.data.map(mapRow)
    })
}

/**
 * Fetches and parses action cards CSV into typed ActionCard[].
 */
export async function loadActionCards(): Promise<ActionCard[]> {
  return parseCsv(ACTION_CSV_URL, (row) => ({
    name: row.name ?? '',
    quantity: row.quantity ?? '',
    timing: row.timing ?? '',
    effect: row.effect ?? '',
    version: row.version ?? '',
  }))
}

/**
 * Fetches and parses strategy cards CSV into typed StrategyCard[].
 * CSV column is "initative"; we map to initiative.
 */
export async function loadStrategyCards(): Promise<StrategyCard[]> {
  return parseCsv(STRATEGY_CSV_URL, (row) => ({
    name: row.name ?? '',
    initiative: row.initative ?? row.initiative ?? '',
    primary: row.primary ?? '',
    secondary: row.secondary ?? '',
    color: row.color ?? '',
    version: row.version ?? '',
  }))
}

/**
 * Fetches and parses agendas CSV into typed Agenda[].
 * CSV column "removed in pok" is mapped to removedInPok.
 */
export async function loadAgendas(): Promise<Agenda[]> {
  return parseCsv(AGENDAS_CSV_URL, (row) => ({
    name: row.name ?? '',
    agendaType: row.type ?? '',
    elect: row.elect ?? '',
    effect: row.effect ?? '',
    version: row.version ?? '',
    removedInPok: row['removed in pok'] ?? '',
  }))
}

/**
 * Loads action cards, strategy cards, and agendas; returns a combined CardItem[] for search/display.
 */
export async function loadAllCards(): Promise<CardItem[]> {
  const [actionCards, strategyCards, agendas] = await Promise.all([
    loadActionCards(),
    loadStrategyCards(),
    loadAgendas(),
  ])
  const actionItems: CardItem[] = actionCards.map((c) => ({
    type: 'action',
    ...c,
    searchText: [c.name, c.effect, c.timing, c.version].filter(Boolean).join(' '),
  }))
  const strategyItems: CardItem[] = strategyCards.map((c) => ({
    type: 'strategy',
    ...c,
    searchText: [c.name, c.primary, c.secondary, c.color, c.version].filter(Boolean).join(' '),
  }))
  const agendaItems: CardItem[] = agendas.map((c) => ({
    ...c,
    type: 'agenda',
    searchText: [c.name, c.agendaType, c.elect, c.effect, c.version].filter(Boolean).join(' '),
  }))
  return [...actionItems, ...strategyItems, ...agendaItems]
}
