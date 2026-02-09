#!/usr/bin/env python3
"""
Build data/csv/faction_leaders.csv from async_ti4/resources/data/leaders.

Sources: pok.json, te_leaders.json only.

Output columns: faction id, type, name, unlock condition, ability name, ability, version
- type: agent, commander, or hero
- ability name: hero abilities only (abilityName from JSON); empty for agent/commander
- ability: abilityWindow concatenated with abilityText
- version: pok, codex 1/2/3, or thunders edge (from source: pok -> pok, thunders_edge -> thunders edge)
"""
import csv
import json
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
LEADERS_DIR = REPO_ROOT / "async_ti4" / "resources" / "data" / "leaders"
OUT_CSV = REPO_ROOT / "data" / "csv" / "faction_leaders.csv"

LEADER_SOURCES = [
    "pok.json",
    "te_leaders.json",
]

# Leader file faction id -> our CSV faction id (from data/csv/factions.csv)
FACTION_ID_TO_CSV = {
    "letnev": "barony",
    "ghost": "ghosts",
    "l1z1x": "lizix",
    "naaz": "nra",
    "ralnel": "lizards",
}

SOURCE_TO_VERSION = {
    "pok": "pok",
    "thunders_edge": "thunders edge",
}


def faction_to_csv_id(leader_faction: str) -> str:
    """Map leader JSON faction id to our factions.csv id."""
    return FACTION_ID_TO_CSV.get(leader_faction, leader_faction)


def leader_effect(leader: dict) -> str:
    """Concatenate abilityWindow with abilityText."""
    window = (leader.get("abilityWindow") or "").strip()
    text = (leader.get("abilityText") or "").strip()
    if not window and not text:
        return ""
    if not window:
        return text
    if not text:
        return window
    if window.endswith(":") or window.endswith(" "):
        return window + " " + text.strip()
    return window + " " + text


def source_to_version(source: str) -> str:
    """Map JSON source to version string."""
    return SOURCE_TO_VERSION.get(source, source.replace("_", " "))


def main() -> None:
    rows: list[tuple[str, str, str, str, str, str, str]] = []

    for filename in LEADER_SOURCES:
        jpath = LEADERS_DIR / filename
        if not jpath.exists():
            continue
        with open(jpath, encoding="utf-8") as f:
            data = json.load(f)
        leaders = data if isinstance(data, list) else [data]
        for leader in leaders:
            faction_key = leader.get("faction")
            if not faction_key:
                continue
            faction_id = faction_to_csv_id(faction_key)
            leader_type = (leader.get("type") or "").strip().lower()
            if leader_type not in ("agent", "commander", "hero"):
                continue
            name = (leader.get("name") or "").strip()
            unlock = (leader.get("unlockCondition") or "").strip()
            ability_name = (leader.get("abilityName") or "").strip() if leader_type == "hero" else ""
            ability = leader_effect(leader)
            version = source_to_version(leader.get("source") or "")
            rows.append((faction_id, leader_type, name, unlock, ability_name, ability, version))

    rows.sort(key=lambda r: (r[0].lower(), r[1], r[2].lower()))

    OUT_CSV.parent.mkdir(parents=True, exist_ok=True)
    with open(OUT_CSV, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["faction id", "type", "name", "unlock condition", "ability name", "ability", "version"])
        writer.writerows(rows)

    print(f"Wrote {len(rows)} rows to {OUT_CSV}")


if __name__ == "__main__":
    main()
