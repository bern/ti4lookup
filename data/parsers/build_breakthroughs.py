#!/usr/bin/env python3
"""
Build data/csv/breakthroughs.csv from async_ti4/resources/data/breakthroughs/te_breakthroughs.json.

Output columns: faction id, name, synergy, effect
- synergy: unquoted array e.g. [green,red] (BIOTIC=green, PROPULSION=blue, WARFARE=red, CYBERNETIC=yellow; NONE=empty)
- effect: text from JSON (newlines preserved)
"""
import csv
import json
from pathlib import Path

# Project root (data/parsers -> data -> project root)
REPO_ROOT = Path(__file__).resolve().parent.parent.parent
BREAKTHROUGHS_JSON = REPO_ROOT / "async_ti4" / "resources" / "data" / "breakthroughs" / "te_breakthroughs.json"
OUT_CSV = REPO_ROOT / "data" / "csv" / "breakthroughs.csv"

# JSON faction id -> our CSV faction id (from data/csv/factions.csv)
FACTION_ID_TO_CSV = {
    "letnev": "barony",
    "ghost": "ghosts",
    "l1z1x": "lizix",
    "naaz": "nra",
    "ralnel": "lizards",
}

SYNERGY_TO_COLOR = {
    "BIOTIC": "green",
    "PROPULSION": "blue",
    "WARFARE": "red",
    "CYBERNETIC": "yellow",
}


def faction_to_csv_id(faction: str) -> str:
    return FACTION_ID_TO_CSV.get(faction, faction)


def synergy_to_array(synergy: list) -> str:
    if not synergy:
        return "[]"
    if synergy == ["NONE"]:
        return "[]"
    colors = []
    for s in synergy:
        c = SYNERGY_TO_COLOR.get(s)
        if c:
            colors.append(c)
    return "[" + ",".join(colors) + "]"


def main() -> None:
    with open(BREAKTHROUGHS_JSON, encoding="utf-8") as f:
        items = json.load(f)
    if not isinstance(items, list):
        items = [items]

    rows = []
    for bt in items:
        faction_key = (bt.get("faction") or "").strip()
        if not faction_key:
            continue
        faction_id = faction_to_csv_id(faction_key)
        name = (bt.get("name") or "").strip()
        synergy_raw = bt.get("synergy") or []
        synergy_str = synergy_to_array(synergy_raw)
        text = (bt.get("text") or "").strip()
        rows.append((faction_id, name, synergy_str, text))

    rows.sort(key=lambda r: (r[0].lower(), r[1].lower()))

    OUT_CSV.parent.mkdir(parents=True, exist_ok=True)
    with open(OUT_CSV, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["faction id", "name", "synergy", "effect"])
        writer.writerows(rows)

    print(f"Wrote {len(rows)} rows to {OUT_CSV}")


if __name__ == "__main__":
    main()
