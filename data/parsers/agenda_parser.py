#!/usr/bin/env python3
"""
Parse TI4 Agenda Cards HTML into CSV.

CSV columns:
- name
- type
- elect
- effect   (includes BOTH For and Against when present)
- version  (base game | pok)

Supports Chrome "view-source" saved HTML.
Skips "Twilight's Fall Variant" section.
"""

from __future__ import annotations

import argparse
import csv
import re
from pathlib import Path
from typing import Dict, List, Optional, Tuple

from bs4 import BeautifulSoup, Tag


def norm(s: str) -> str:
    s = (s or "").replace("\xa0", " ")
    return re.sub(r"\s+", " ", s).strip()


def unwrap_view_source(raw_html: str) -> BeautifulSoup:
    soup = BeautifulSoup(raw_html, "lxml")
    lines = soup.select("table td.line-content")
    if not lines:
        return soup
    rebuilt = "\n".join(l.get_text("", strip=False) for l in lines)
    return BeautifulSoup(rebuilt, "lxml")


def extract_cell_text(cell: Tag) -> str:
    for br in cell.find_all("br"):
        br.replace_with("\n")
    text = cell.get_text("\n", strip=True)
    parts = [norm(x) for x in text.split("\n") if norm(x)]
    return norm(" • ".join(parts)) if len(parts) > 1 else norm(text)


def split_for_against(text: str) -> str:
    """
    Normalize agenda effects so both FOR and AGAINST are preserved.
    """
    t = text

    for_match = re.search(r"\bfor\b[:\-]?\s*(.+?)(?=\bagainst\b|$)", t, re.I)
    against_match = re.search(r"\bagainst\b[:\-]?\s*(.+)$", t, re.I)

    parts = []
    if for_match:
        parts.append(f"FOR: {norm(for_match.group(1))}")
    if against_match:
        parts.append(f"AGAINST: {norm(against_match.group(1))}")

    if parts:
        return " | ".join(parts)

    return t  # fallback if no explicit markers


def closest_context(table: Tag) -> Tuple[str, bool, Optional[str]]:
    version = "base game"
    skip = False
    inferred_type: Optional[str] = None

    for h in table.find_all_previous(["h2", "h3", "h4"]):
        title = norm(h.get_text(" ", strip=True)).lower()

        if "twilight's fall variant" in title:
            skip = True
            break

        if "prophecy of kings" in title:
            version = "pok"

        if "law" in title and not inferred_type:
            inferred_type = "Law"
        if "directive" in title and not inferred_type:
            inferred_type = "Directive"

        if title in {"agenda cards", "agendas"}:
            break

    return version, skip, inferred_type


def parse_agendas(path: Path) -> List[Dict[str, str]]:
    soup = unwrap_view_source(path.read_text(encoding="utf-8", errors="ignore"))
    rows: List[Dict[str, str]] = []

    for table in soup.find_all("table", class_="article-table"):
        header_row = table.find("tr")
        if not header_row:
            continue

        headers = [norm(c.get_text(" ", strip=True)).lower()
                   for c in header_row.find_all(["th", "td"], recursive=False)]

        if not {"name", "effect"} <= set(headers):
            continue

        idx = {h: i for i, h in enumerate(headers)}
        i_name = idx.get("name")
        i_type = idx.get("type")
        i_elect = next((i for h, i in idx.items() if h.startswith("elect")), None)
        i_effect = next((i for h, i in idx.items() if "effect" in h), None)

        if i_name is None or i_elect is None or i_effect is None:
            continue

        version, skip, inferred_type = closest_context(table)
        if skip:
            continue

        body_rows = table.find_all("tr")[1:]

        for tr in body_rows:
            cells = tr.find_all(["td", "th"], recursive=False)
            if len(cells) <= max(i_name, i_elect, i_effect):
                continue

            name = extract_cell_text(cells[i_name])
            elect = extract_cell_text(cells[i_elect])
            raw_effect = extract_cell_text(cells[i_effect])
            effect = split_for_against(raw_effect)

            if not name:
                continue

            typ = ""
            if i_type is not None and len(cells) > i_type:
                typ = extract_cell_text(cells[i_type])
            elif inferred_type:
                typ = inferred_type

            rows.append(
                {
                    "name": name,
                    "type": typ,
                    "elect": elect,
                    "effect": effect,
                    "version": version,
                }
            )

    return rows


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("-i", "--input", default="/mnt/data/agendas.htm")
    ap.add_argument("-o", "--output", default="agendas.csv")
    args = ap.parse_args()

    data = parse_agendas(Path(args.input))

    with open(args.output, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(
            f,
            fieldnames=["name", "type", "elect", "effect", "version"],
        )
        w.writeheader()
        w.writerows(data)

    print(f"Wrote {len(data)} rows to {args.output}")


if __name__ == "__main__":
    main()
