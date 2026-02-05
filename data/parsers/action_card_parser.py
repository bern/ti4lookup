#!/usr/bin/env python3
"""
Parse Twilight Imperium action cards tables from a saved HTML page and output CSV.

Handles two cases:
1) Normal saved HTML (tables exist normally in DOM)
2) "View Source" saved HTML where the entire page source is wrapped in a <table>
   with td.line-number / td.line-content (Chrome-style)

Output columns:
name, quantity, timing (Play), effect, version

Skips the table(s) under the "Twilight's Fall Variant" section.
"""

from __future__ import annotations

import argparse
import csv
import re
from pathlib import Path
from typing import Dict, List, Optional

from bs4 import BeautifulSoup, Tag


def norm(s: str) -> str:
    return re.sub(r"\s+", " ", (s or "")).strip()


def unwrap_view_source_if_needed(soup: BeautifulSoup) -> BeautifulSoup:
    """
    If this HTML is a browser "view-source" wrapper, reconstruct the original HTML
    from td.line-content cells and re-parse it.
    """
    line_cells = soup.select("table td.line-content")
    if not line_cells:
        return soup  # normal page

    # Rebuild original HTML source (preserve line breaks)
    reconstructed = "\n".join(cell.get_text("", strip=False) for cell in line_cells)
    return BeautifulSoup(reconstructed, "lxml")


def heading_to_version(text: str) -> Optional[str]:
    t = norm(text).lower()

    # Skip section trigger
    if "twilight" in t and "fall" in t and "variant" in t:
        return "__SKIP__"

    # Versions (robust matching)
    if "prophecy of kings" in t:
        return "pok"
    if re.search(r"\bcodex\s*(i|1)\b", t):
        return "codex 1"
    if re.search(r"\bthunder.?s edge\b", t):
        return "thunders edge"
    if "twilight imperium" in t and "fourth edition" in t:
        return "base game"
    if "base" in t and "game" in t:
        return "base game"

    return None


def find_main_content_root(soup: BeautifulSoup) -> Tag:
    root = soup.select_one("div.mw-parser-output")
    if isinstance(root, Tag):
        return root
    if isinstance(soup.body, Tag):
        return soup.body
    raise RuntimeError("Could not find a usable content root in the HTML.")


def extract_table_rows(table: Tag, version: str) -> List[Dict[str, str]]:
    header_tr = table.find("tr")
    if not isinstance(header_tr, Tag):
        return []

    header_cells = header_tr.find_all(["th", "td"], recursive=False)
    headers = [norm(c.get_text(" ", strip=True)).lower() for c in header_cells]

    def col_idx(wants: tuple[str, ...]) -> Optional[int]:
        for i, h in enumerate(headers):
            for w in wants:
                if w in h:
                    return i
        return None

    i_name = col_idx(("name",))
    i_qty = col_idx(("number in deck", "quantity", "number"))
    i_play = col_idx(("play",))
    i_effect = col_idx(("effect",))

    if None in (i_name, i_qty, i_play, i_effect):
        return []  # not the right kind of table

    rows: List[Dict[str, str]] = []
    for tr in table.find_all("tr")[1:]:
        cells = tr.find_all(["td", "th"], recursive=False)
        if not cells:
            continue

        max_i = max(i_name, i_qty, i_play, i_effect)  # type: ignore[arg-type]
        if len(cells) <= max_i:
            continue

        name = norm(cells[i_name].get_text(" ", strip=True))  # type: ignore[index]
        qty_raw = norm(cells[i_qty].get_text(" ", strip=True))  # type: ignore[index]
        timing = norm(cells[i_play].get_text(" ", strip=True))  # type: ignore[index]
        effect = norm(cells[i_effect].get_text(" ", strip=True))  # type: ignore[index]

        if not name:
            continue

        m = re.search(r"\d+", qty_raw)
        quantity = m.group(0) if m else qty_raw

        rows.append(
            {
                "name": name,
                "quantity": quantity,
                "timing": timing,
                "effect": effect,
                "version": version,
            }
        )

    return rows


def parse_action_cards(html_path: Path) -> List[Dict[str, str]]:
    soup = BeautifulSoup(html_path.read_text(encoding="utf-8", errors="ignore"), "lxml")
    soup = unwrap_view_source_if_needed(soup)

    root = find_main_content_root(soup)

    current_version: Optional[str] = None
    skip_mode = False
    results: List[Dict[str, str]] = []

    for node in root.descendants:
        if not isinstance(node, Tag):
            continue

        if node.name in ("h2", "h3", "h4"):
            v = heading_to_version(node.get_text(" ", strip=True))
            if v == "__SKIP__":
                skip_mode = True
                current_version = None
            elif v:
                skip_mode = False
                current_version = v
            continue

        if node.name == "table" and "article-table" in (node.get("class") or []):
            if skip_mode or not current_version:
                continue
            results.extend(extract_table_rows(node, current_version))

    return results


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("html", type=Path, help="Path to saved action_cards.htm")
    ap.add_argument(
        "-o",
        "--out",
        type=Path,
        default=Path("action_cards.csv"),
        help="Output CSV path (default: action_cards.csv)",
    )
    args = ap.parse_args()

    rows = parse_action_cards(args.html)

    fieldnames = ["name", "quantity", "timing", "effect", "version"]
    with args.out.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        w.writerows(rows)

    print(f"Wrote {len(rows)} rows to {args.out}")


if __name__ == "__main__":
    main()
