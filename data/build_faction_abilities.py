#!/usr/bin/env python3
"""
Build data/csv/faction_abilities.csv from data/csv/factions.csv and
async_ti4/resources/data/abilities.

Sources: base.json, pok.json, te_abilities.json; other.json only for keleres.

Output columns: faction id, name, text
Text = concatenation of permanentEffect and/or (window + ". " + windowEffect).
"""
import csv
import json
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
FACTIONS_CSV = REPO_ROOT / "data" / "csv" / "factions.csv"
ABILITIES_DIR = REPO_ROOT / "async_ti4" / "resources" / "data" / "abilities"
OUT_CSV = REPO_ROOT / "data" / "csv" / "faction_abilities.csv"

# Only these files are used; other.json is used only for faction "keleres"
ABILITY_SOURCES = [
    ("base.json", None),           # all factions in file
    ("pok.json", None),            # all factions in file
    ("te_abilities.json", None),   # all factions in file
    ("other.json", "keleres"),     # only keleres
]

# Faction id in our CSV -> faction id(s) used in ability JSON files
FACTION_ID_TO_ABILITY_IDS = {
    "barony": ["letnev"],
    "ghosts": ["ghost"],
    "lizix": ["l1z1x"],
    "nra": ["naaz"],
    "lizards": ["ralnel"],
}


def get_ability_faction_ids(csv_faction_id: str) -> list[str]:
    """Return list of faction ids to look for in ability JSON (our id + any aliases)."""
    aliases = FACTION_ID_TO_ABILITY_IDS.get(csv_faction_id)
    if aliases is not None:
        return aliases
    return [csv_faction_id]


def ability_text(ab: dict) -> str:
    """Build effect text from permanentEffect and/or window + windowEffect."""
    parts = []
    if ab.get("permanentEffect"):
        parts.append(ab["permanentEffect"].strip())
    window = ab.get("window", "").strip()
    window_effect = ab.get("windowEffect", "").strip()
    if window and window_effect:
        parts.append(f"{window}. {window_effect}")
    elif window:
        parts.append(window)
    elif window_effect:
        parts.append(window_effect)
    return " ".join(parts)


def main() -> None:
    # Load faction ids from our CSV (column "id" is index 1)
    faction_ids: list[str] = []
    with open(FACTIONS_CSV, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            faction_ids.append(row["id"].strip())

    # Build lookup: ability-file faction id -> our CSV faction id
    ability_faction_to_our_id: dict[str, str] = {}
    for our_id in faction_ids:
        for aid in get_ability_faction_ids(our_id):
            ability_faction_to_our_id[aid] = our_id

    # Load abilities only from configured sources
    all_abilities: list[dict] = []
    for filename, faction_filter in ABILITY_SOURCES:
        jpath = ABILITIES_DIR / filename
        if not jpath.exists():
            continue
        with open(jpath, encoding="utf-8") as f:
            data = json.load(f)
        items = data if isinstance(data, list) else [data]
        for ab in items:
            if faction_filter is not None and ab.get("faction") != faction_filter:
                continue
            all_abilities.append(ab)

    # Collect rows: (our faction id, ability name, text) for abilities that belong to our factions
    rows: list[tuple[str, str, str]] = []
    seen: set[tuple[str, str]] = set()  # (faction_id, ability id) to dedupe
    for ab in all_abilities:
        faction_key = ab.get("faction")
        if not faction_key:
            continue
        our_id = ability_faction_to_our_id.get(faction_key)
        if our_id is None:
            continue
        ab_id = ab.get("id", "")
        name = (ab.get("name") or "").strip()
        text = ability_text(ab)
        key = (our_id, ab_id)
        if key in seen:
            continue
        seen.add(key)
        rows.append((our_id, name, text))

    # Sort by faction id then name
    rows.sort(key=lambda r: (r[0].lower(), r[1].lower()))

    # Write CSV
    OUT_CSV.parent.mkdir(parents=True, exist_ok=True)
    with open(OUT_CSV, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["faction id", "name", "text"])
        writer.writerows(rows)

    print(f"Wrote {len(rows)} rows to {OUT_CSV}")


if __name__ == "__main__":
    main()
