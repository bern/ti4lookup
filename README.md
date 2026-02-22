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
| [action_cards.csv](client/public/action_cards.csv) | Action cards |
| [agendas.csv](client/public/agendas.csv) | Agenda cards (Edict cards) |
| [breakthroughs.csv](client/public/breakthroughs.csv) | Breakthrough cards |
| [exploration.csv](client/public/exploration.csv) | Exploration cards |
| [faction_abilities.csv](client/public/faction_abilities.csv) | Faction abilities |
| [faction_leaders.csv](client/public/faction_leaders.csv) | Faction leaders (Genomes & Paradigms) |
| [factions.csv](client/public/factions.csv) | Faction metadata |
| [galactic_events.csv](client/public/galactic_events.csv) | Galactic events |
| [legendary_planets.csv](client/public/legendary_planets.csv) | Legendary planets |
| [objectives.csv](client/public/objectives.csv) | Public & secret objectives |
| [planet_traits.csv](client/public/planet_traits.csv) | Planet traits |
| [plots.csv](client/public/plots.csv) | Plot cards |
| [promissory_notes.csv](client/public/promissory_notes.csv) | Promissory notes |
| [strategy_cards.csv](client/public/strategy_cards.csv) | Strategy cards |
| [tech_types.csv](client/public/tech_types.csv) | Tech type metadata |
| [technologies.csv](client/public/technologies.csv) | Technologies |
| [units.csv](client/public/units.csv) | Units |

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

## Credits

- Social image background: [X-ray: NASA/CXC/PSU/L.Townsley et al; Optical: UKIRT; Infrared: NASA/JPL-Caltech](https://chandra.si.edu/photo/2016/ngc6357/)
- Social image font: [Science Gothic, Designed by: Thomas Phinney, Vassil Kateliev, Brandon Buerkle (via Google Fonts)](https://fonts.google.com/specimen/Science+Gothic)
- Data sources: [AsyncTI4/TI4_map_generator_bot](https://github.com/AsyncTI4/TI4_map_generator_bot) and the [Twilight Imperium Wiki on fandom.com](https://twilight-imperium.fandom.com/wiki/Twilight_Imperium_Wiki)
- [Twilight Imperium 4th Edition](https://www.fantasyflightgames.com/en/products/twilight-imperium-fourth-edition/), property of [Fantasy Flight Games](https://www.fantasyflightgames.com/en/index/)