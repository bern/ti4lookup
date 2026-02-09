#!/usr/bin/env python3
"""
Build data/csv/technologies.csv from async_ti4/resources/data/technologies.

Sources: pok.json, te_techs.json only.

Output columns: name, faction id, type, unit, prerequisites, effect, version
- type: unit upgrade, green, red, blue, or yellow (from types: UNITUPGRADE, BIOTIC, WARFARE, PROPULSION, CYBERNETIC)
- unit: empty by default (reserved for unit upgrade techs)
- prerequisites: array string, e.g. [blue,blue,yellow] for requirements "BBY"
- effect: text
- version: from source (base->base game, pok->pok, codex1->codex 1, thunders_edge->thunders edge, etc.)
"""
import csv
import json
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
TECH_DIR = REPO_ROOT / "async_ti4" / "resources" / "data" / "technologies"
OUT_CSV = REPO_ROOT / "data" / "csv" / "technologies.csv"

TECH_SOURCES = [
    "pok.json",
    "te_techs.json",
]

# JSON type -> output type (user: unit upgrade, green, red, blue, yellow)
TYPE_MAP = {
    "UNITUPGRADE": "unit upgrade",
    "BIOTIC": "green",
    "WARFARE": "red",
    "PROPULSION": "blue",
    "CYBERNETIC": "yellow",
    "NONE": "unit upgrade",
}

# Requirements letter -> color name for prerequisites array
REQ_LETTER_MAP = {
    "B": "blue",
    "G": "green",
    "R": "red",
    "Y": "yellow",
}

# Leader file faction id -> our CSV faction id (from data/csv/factions.csv)
FACTION_ID_TO_CSV = {
    "letnev": "barony",
    "ghost": "ghosts",
    "l1z1x": "lizix",
    "naaz": "nra",
    "ralnel": "lizards",
}


def requirements_to_prereq_array(requirements: str) -> str:
    """Convert e.g. 'BBY' or 'GYR' to array string [blue,blue,yellow] (unquoted elements)."""
    if not requirements or not isinstance(requirements, str):
        return "[]"
    arr = []
    for c in requirements.upper():
        color = REQ_LETTER_MAP.get(c)
        if color:
            arr.append(color)
    return "[" + ",".join(arr) + "]"


def tech_type(types_list: list) -> str:
    """Map first type from JSON to output type string."""
    if not types_list:
        return ""
    t = (types_list[0] or "").strip().upper()
    return TYPE_MAP.get(t, t.lower() if t else "")


def faction_to_csv_id(faction: str) -> str:
    """Map tech JSON faction id to our factions.csv id."""
    if not faction:
        return ""
    return FACTION_ID_TO_CSV.get(faction.strip().lower(), faction.strip())


def source_to_version(source: str) -> str:
    """Map JSON source to version string."""
    if not source:
        return ""
    s = source.strip().lower()
    if s == "base":
        return "base game"
    if s == "thunders_edge":
        return "thunders edge"
    if s.startswith("codex"):
        return f"codex {s[5:]}" if len(s) > 5 else s  # codex1 -> codex 1
    return s


def main() -> None:
    rows: list[tuple[str, str, str, str, str, str, str]] = []

    for filename in TECH_SOURCES:
        jpath = TECH_DIR / filename
        if not jpath.exists():
            continue
        with open(jpath, encoding="utf-8") as f:
            data = json.load(f)
        techs = data if isinstance(data, list) else [data]
        for tech in techs:
            name = (tech.get("name") or "").strip()
            faction_key = tech.get("faction")
            faction_id = faction_to_csv_id(faction_key) if faction_key else ""
            types_list = tech.get("types") or []
            t = tech_type(types_list)
            unit = ""  # default empty
            requirements = tech.get("requirements") or ""
            prerequisites = requirements_to_prereq_array(requirements)
            effect = (tech.get("text") or "").strip()
            version = source_to_version(tech.get("source") or "")
            rows.append((name, faction_id, t, unit, prerequisites, effect, version))

    rows.sort(key=lambda r: (r[1].lower(), r[2].lower(), r[0].lower()))

    OUT_CSV.parent.mkdir(parents=True, exist_ok=True)
    with open(OUT_CSV, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["name", "faction id", "type", "unit", "prerequisites", "effect", "version"])
        writer.writerows(rows)

    print(f"Wrote {len(rows)} rows to {OUT_CSV}")


if __name__ == "__main__":
    main()
