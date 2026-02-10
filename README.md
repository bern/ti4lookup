# TI4 Lookup

## What is this?

TI4 Lookup is a lightweight, fast component lookup for **Twilight Imperium 4th Edition** and its expansions. Search and browse action cards, strategy cards, agendas, objectives, faction abilities, technologies, exploration cards, and more, all from a browser.

## Motivation

I wanted to make this because all of the existing solutions for component lookup are too slow. Googling "lightwave ti4" brings up a host of fan content and low-resolution pictures. My girlfriend keeps asking what the primary of Warfare is and it takes way too long for me to find something to show her. I wanted something built for speed: minimal dependencies, fast fuzzy search, and instant filtering by expansion and faction.

## Offline

A service worker precaches the app shell (HTML, JS, CSS), all CSVs, and images. Load the app once while online, then it works offline.

## CSVs

| File | Description |
|------|-------------|
| [action_cards.csv](data/csv/action_cards.csv) | Action cards |
| [agendas.csv](data/csv/agendas.csv) | Agenda cards |
| [breakthroughs.csv](data/csv/breakthroughs.csv) | Breakthrough cards |
| [exploration.csv](data/csv/exploration.csv) | Exploration cards |
| [faction_abilities.csv](data/csv/faction_abilities.csv) | Faction abilities |
| [faction_leaders.csv](data/csv/faction_leaders.csv) | Faction leaders |
| [factions.csv](data/csv/factions.csv) | Faction metadata |
| [galactic_events.csv](data/csv/galactic_events.csv) | Galactic events |
| [legendary_planets.csv](data/csv/legendary_planets.csv) | Legendary planets |
| [objectives.csv](data/csv/objectives.csv) | Public & secret objectives |
| [planet_traits.csv](data/csv/planet_traits.csv) | Planet traits |
| [plots.csv](data/csv/plots.csv) | Plot cards |
| [promissory_notes.csv](data/csv/promissory_notes.csv) | Promissory notes |
| [strategy_cards.csv](data/csv/strategy_cards.csv) | Strategy cards |
| [tech_types.csv](data/csv/tech_types.csv) | Tech type metadata |
| [technologies.csv](data/csv/technologies.csv) | Technologies |

## App File Structure

```
client/
├── index.html
├── package.json
├── public/
│   ├── *.csv              # Data files (see table above)
│   └── images/            # Faction icons, tech colors, planet traits
├── src/
│   ├── App.tsx            # Root, routing, expansion filter
│   ├── main.tsx           # Entry point
│   ├── index.css          # Global styles
│   ├── types.ts           # TypeScript types
│   ├── components/
│   │   ├── AppFooter.tsx
│   │   ├── ExpansionSelector.tsx
│   │   ├── ResultRow.tsx
│   │   ├── ResultsList.tsx
│   │   ├── SearchInput.tsx
│   │   └── ThemeSelector.tsx
│   ├── data/
│   │   └── loadCards.ts   # CSV loading, parsing, CardItem assembly
│   ├── search/
│   │   └── useFuseSearch.ts # Fuse.js search, partitionByType
│   └── views/
│       ├── HomeView.tsx   # Categories, faction grid
│       ├── SearchView.tsx # Search results
│       └── CategoryView.tsx # Single-category browse
└── vite.config.ts
```
