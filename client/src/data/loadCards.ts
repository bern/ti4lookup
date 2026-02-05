import Papa from 'papaparse'
import type { ActionCard } from '../types'

const CSV_URL = '/action_cards.csv'

/**
 * Fetches the static CSV and parses it into typed ActionCard objects.
 * PapaParse returns string keys; we map to our strict interface.
 */
export async function loadActionCards(): Promise<ActionCard[]> {
  const res = await fetch(CSV_URL)
  if (!res.ok) throw new Error(`Failed to load CSV: ${res.status}`)
  const text = await res.text()

  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
  })

  if (parsed.errors.length > 0) {
    console.warn('CSV parse warnings:', parsed.errors)
  }

  return parsed.data.map((row) => ({
    name: row.name ?? '',
    quantity: row.quantity ?? '',
    timing: row.timing ?? '',
    effect: row.effect ?? '',
    version: row.version ?? '',
  }))
}
