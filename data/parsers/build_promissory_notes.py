#!/usr/bin/env python3
"""
Build data/csv/promissory_notes.csv from async_ti4/resources/data/promissory_notes.

Sources: promissory_notes.json, thunders_edge.json

Output columns: name, faction id, effect, version
Version: base game, pok, codex 1/2/3/4, or thunders edge
"""
import csv
import json
from pathlib import Path

# Project root (data/parsers -> data -> project root)
REPO_ROOT = Path(__file__).resolve().parent.parent.parent
PROMISSORY_DIR = REPO_ROOT / "async_ti4" / "resources" / "data" / "promissory_notes"
SOURCES = [
    ("promissory_notes.json", None),
    ("thunders_edge.json", None),
]
OUT_CSV = REPO_ROOT / "data" / "csv" / "promissory_notes.csv"

# JSON faction id -> our CSV faction id (from data/csv/factions.csv)
FACTION_ID_TO_CSV = {
    "letnev": "barony",
    "ghost": "ghosts",
    "l1z1x": "lizix",
    "naaz": "nra",
    "ralnel": "lizards",
    "keleresa": "keleres",
    "keleresm": "keleres",
    "keleresx": "keleres",
}

SOURCE_TO_VERSION = {
    "base": "base game",
    "pok": "pok",
    "codex1": "codex 1",
    "codex2": "codex 2",
    "codex3": "codex 3",
    "codex4": "codex 4",
    "thunders_edge": "thunders edge",
}


def faction_to_csv_id(faction: str) -> str:
    return FACTION_ID_TO_CSV.get(faction, faction)


def source_to_version(source: str) -> str:
    return SOURCE_TO_VERSION.get((source or "").strip().lower(), source or "")


def main() -> None:
    seen: set[tuple[str, str, str, str]] = set()
    rows: list[tuple[str, str, str, str]] = []

    for filename, _ in SOURCES:
        path = PROMISSORY_DIR / filename
        if not path.exists():
            continue
        with open(path, encoding="utf-8") as f:
            items = json.load(f)
        if not isinstance(items, list):
            items = [items]

        for pn in items:
            name = (pn.get("name") or "").strip()
            faction_key = (pn.get("faction") or "").strip()
            if not name or not faction_key:
                continue
            faction_id = faction_to_csv_id(faction_key)
            text = (pn.get("text") or "").strip()
            source = (pn.get("source") or "").strip()
            version = source_to_version(source)
            key = (name, faction_id, text, version)
            if key in seen:
                continue
            seen.add(key)
            rows.append((name, faction_id, text, version))

    rows.sort(key=lambda r: (r[3], r[1].lower(), r[0].lower()))

    OUT_CSV.parent.mkdir(parents=True, exist_ok=True)
    with open(OUT_CSV, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["name", "faction id", "effect", "version"])
        writer.writerows(rows)

    print(f"Wrote {len(rows)} rows to {OUT_CSV}")


if __name__ == "__main__":
    main()
