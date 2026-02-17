#!/usr/bin/env node
/**
 * Generates sitemap.xml from factions.csv and known routes.
 * Run before build so sitemap is included in dist.
 */
import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const BASE_URL = 'https://ti4lookup.com'

const CATEGORY_SLUGS = [
  'action_cards',
  'agendas',
  'strategy_cards',
  'public_objectives',
  'secret_objectives',
  'legendary_planets',
  'exploration',
  'relics',
  'faction_abilities',
  'faction_leaders',
  'promissory_notes',
  'breakthroughs',
  'technologies',
  'galactic_events',
  'units',
]

function escapeXml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function urlEntry(loc, changefreq = 'weekly', priority = '0.8') {
  return `  <url>
    <loc>${escapeXml(loc)}</loc>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`
}

function getFactionIds() {
  const csvPath = join(__dirname, '../public/factions.csv')
  const csv = readFileSync(csvPath, 'utf-8')
  const lines = csv.trim().split('\n').slice(1)
  return lines.map((line) => line.split(',')[1]?.trim()).filter(Boolean)
}

const urls = []

// Home
urls.push(urlEntry(`${BASE_URL}/`, 'weekly', '1.0'))

// Search
urls.push(urlEntry(`${BASE_URL}/search`, 'weekly', '0.9'))

// Factions
for (const id of getFactionIds()) {
  urls.push(urlEntry(`${BASE_URL}/factions/${encodeURIComponent(id)}`, 'weekly', '0.8'))
}

// Categories
for (const slug of CATEGORY_SLUGS) {
  urls.push(urlEntry(`${BASE_URL}/categories/${slug}`, 'weekly', '0.8'))
}

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>
`

const outPath = join(__dirname, '../public/sitemap.xml')
writeFileSync(outPath, sitemap)
console.log(`Wrote sitemap.xml with ${urls.length} URLs`)
