#!/usr/bin/env python3
"""
Parse TI4 Exploration + Relics from a Fandom wiki "view-source" saved HTML.

Output CSV columns:
name,type,quantity,effect,version

Types: red, green, blue, frontier, relic
Versions: pok, codex 1/2/3/4, thunders edge
"""

from __future__ import annotations

import argparse
import csv
import re
from dataclasses import dataclass
from pathlib import Path
from typing import List, Optional, Tuple

from bs4 import BeautifulSoup, Tag


@dataclass
class Row:
    name: str
    card_type: str
    quantity: int
    effect: str
    version: str


_WS_RE = re.compile(r"\s+")


def norm(s: str) -> str:
    s = (s or "").replace("\xa0", " ")
    return _WS_RE.sub(" ", s).strip()


def rebuild_underlying_html(view_source_html: str) -> str:
    """
    Reconstruct actual HTML from browser view-source wrapper:
    <td class="line-content"> contains one source line as text.
    """
    soup = BeautifulSoup(view_source_html, "lxml")
    cells = soup.select("td.line-content")
    if not cells:
        return view_source_html
    return "\n".join(c.get_text("", strip=False) for c in cells)


def find_root(soup: BeautifulSoup) -> Tag:
    root = soup.select_one("div.mw-parser-output")
    if isinstance(root, Tag):
        return root
    if isinstance(soup.body, Tag):
        return soup.body
    return soup


def classify_heading(text: str) -> Tuple[Optional[str], Optional[str]]:
    t = norm(text).lower()

    version: Optional[str] = None
    if "thunder" in t and "edge" in t:
        version = "thunders edge"
    m = re.search(r"\bcodex\s*(?:volume\s*)?(\d)\b", t)
    if m:
        version = f"codex {m.group(1)}"
    if "prophecy of kings" in t:
        version = version or "pok"

    card_type: Optional[str] = None
    if "industrial exploration" in t:
        card_type = "green"
    elif "hazardous exploration" in t:
        card_type = "red"
    elif "cultural exploration" in t:
        card_type = "blue"
    elif "frontier" in t and "exploration" in t:
        card_type = "frontier"
    elif "relic" in t:
        card_type = "relic"

    return card_type, version


def table_has_numeric_qty_3col(table: Tag) -> bool:
    """Detect 3-col deck tables: name | qty | effect with qty numeric."""
    for tr in table.find_all("tr"):
        tds = tr.find_all("td", recursive=False)
        if len(tds) >= 3:
            qty = norm(tds[1].get_text(" ", strip=True))
            if re.fullmatch(r"\d+", qty):
                name = norm(tds[0].get_text(" ", strip=True))
                effect = norm(tds[2].get_text(" ", strip=True))
                if name and effect:
                    return True
    return False


def table_has_2col_name_effect(table: Tag) -> bool:
    """Detect 2-col tables: name | effect (used by relics on this page)."""
    for tr in table.find_all("tr"):
        tds = tr.find_all("td", recursive=False)
        if len(tds) == 2:
            name = norm(tds[0].get_text(" ", strip=True))
            effect = norm(tds[1].get_text(" ", strip=True))
            if name and effect:
                return True
    return False


def parse_3col_table(table: Tag, card_type: str, version: str) -> List[Row]:
    out: List[Row] = []
    for tr in table.find_all("tr"):
        tds = tr.find_all("td", recursive=False)
        if len(tds) < 3:
            continue
        name = norm(tds[0].get_text(" ", strip=True))
        qty_txt = norm(tds[1].get_text(" ", strip=True))
        effect = norm(tds[2].get_text(" ", strip=True))
        if not re.fullmatch(r"\d+", qty_txt):
            continue
        if not name or not effect:
            continue
        out.append(Row(name=name, card_type=card_type, quantity=int(qty_txt), effect=effect, version=version))
    return out


def parse_2col_table_as_relics(table: Tag, version: str) -> List[Row]:
    """
    Relic tables here are: name | effect, no quantity column.
    Set quantity=1 for each relic.
    """
    out: List[Row] = []
    for tr in table.find_all("tr"):
        tds = tr.find_all("td", recursive=False)
        if len(tds) != 2:
            continue
        name = norm(tds[0].get_text(" ", strip=True))
        effect = norm(tds[1].get_text(" ", strip=True))
        if not name or not effect:
            continue
        out.append(Row(name=name, card_type="relic", quantity=1, effect=effect, version=version))
    return out


def parse_exploration(path: Path) -> List[Row]:
    raw = path.read_text(encoding="utf-8", errors="ignore")
    rebuilt = rebuild_underlying_html(raw)
    soup = BeautifulSoup(rebuilt, "lxml")
    root = find_root(soup)

    current_version = "pok"  # exploration is introduced with PoK
    current_type: Optional[str] = None

    rows: List[Row] = []

    for el in root.descendants:
        if not isinstance(el, Tag):
            continue

        if el.name in ("h2", "h3", "h4"):
            headline = el.find("span", class_="mw-headline")
            heading_text = norm(headline.get_text(" ", strip=True)) if headline else norm(el.get_text(" ", strip=True))
            new_type, new_version = classify_heading(heading_text)
            if new_version:
                current_version = new_version
            if new_type:
                current_type = new_type

        if el.name == "table":
            classes = el.get("class") or []
            if "article-table" not in classes:
                continue
            if current_type is None:
                continue

            # Exploration decks: 3 columns with numeric quantity
            if table_has_numeric_qty_3col(el):
                rows.extend(parse_3col_table(el, current_type, current_version))
                continue

            # Relics (your PoK relic section): 2 columns (name/effect), qty=1
            if current_type == "relic" and table_has_2col_name_effect(el):
                rows.extend(parse_2col_table_as_relics(el, current_version))
                continue

    return rows


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("-i", "--input", default="/mnt/data/exploration.html")
    ap.add_argument("-o", "--output", default="exploration.csv")
    args = ap.parse_args()

    data = parse_exploration(Path(args.input))

    with open(args.output, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["name", "type", "quantity", "effect", "version"])
        for r in data:
            w.writerow([r.name, r.card_type, r.quantity, r.effect, r.version])

    print(f"Wrote {len(data)} rows -> {args.output}")


if __name__ == "__main__":
    main()
