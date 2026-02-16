# TI4 Action Card Lookup

Minimal React app for fuzzy-searching Twilight Imperium 4 Action Cards. No backend; CSV is loaded in the browser and searched with Fuse.js.

## Run

Requires Node 18+ (Vite 5).

```bash
npm install
npm run dev
```

Then open the URL shown (e.g. http://localhost:5173).

### Node version

**Node 18 or newer is required.** Vite 5 and its toolchain use modern syntax (e.g. `??=`). If you see:

```text
SyntaxError: Unexpected token '??='
```

your Node is too old. Check with `node -v` and upgrade (e.g. [nodejs.org](https://nodejs.org/) or `nvm install 20` then `nvm use 20`).

## CSV format

The app expects a CSV at **`/public/data/action_cards.csv`** with these columns (header row required):

| Column   | Description                    |
|----------|--------------------------------|
| `name`   | Card name                      |
| `quantity` | Number in deck (e.g. 1 or 4) |
| `timing` | When the card can be played    |
| `effect` | Card effect text               |
| `version`| e.g. "base game" or expansion  |

- Use a header row: `name,quantity,timing,effect,version`
- If a value contains commas, wrap it in double quotes.
- Empty lines are skipped.

## How search works

- **Fuse.js** fuzzy-matches your query across `name`, `effect`, `timing`, and `version`.
- **Name** matches are weighted highest, then effect, timing, and version.
- Results are limited to the top 50 matches; the query is debounced by ~200 ms.
- If the search box is empty, all cards are shown, sorted A–Z by name.

## Adding more cards

1. Edit `public/data/action_cards.csv` (or replace it with your own CSV).
2. Keep the same header row and column order.
3. Reload the app; the new data is loaded on startup.

No build step is required for CSV changes when using `npm run dev`; a refresh is enough.