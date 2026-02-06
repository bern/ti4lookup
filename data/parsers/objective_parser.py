#!/usr/bin/env python3
"""
Parse TI4 Objectives from a Fandom "view-source" saved HTML file into CSV.

Input:  objectives.html (view-source wrapper)
Output: objectives.csv

Columns:
name, condition, points, type, when to score, version
"""

from __future__ import annotations

import argparse
import csv
import re
from dataclasses import dataclass
from pathlib import Path
from typing import List, Optional

from bs4 import BeautifulSoup, Tag


@dataclass
class ObjectiveRow:
    name: str
    condition: str
    points: str
    obj_type: str              # stage 1 public | stage 2 public | secret
    when_to_score: str         # status phase | action phase | agenda phase
    version: str               # base game | pok


def norm(s: str) -> str:
    s = (s or "").replace("\xa0", " ")
    return re.sub(r"\s+", " ", s).strip()


def unwrap_view_source(raw_html: str) -> str:
    """
    Chrome 'view-source' saves wrap each line in <td class="line-content"> with tags escaped.
    We rebuild the original HTML by concatenating those line-content cells.
    """
    soup = BeautifulSoup(raw_html, "lxml")
    cells = soup.select("td.line-content")
    if not cells:
        return raw_html
    return "\n".join(c.get_text("", strip=False) for c in cells)


def main_content_root(soup: BeautifulSoup) -> Tag:
    root = soup.select_one("div.mw-parser-output")
    if isinstance(root, Tag):
        return root
    # fallback
    if isinstance(soup.body, Tag):
        return soup.body
    raise RuntimeError("Could not find main content root.")


def looks_like_objectives_table(table: Tag) -> bool:
    """
    Objectives tables are typically article-table with columns:
    Name | Condition | Points
    Data rows contain numeric points in the last column.
    """
    for tr in table.find_all("tr"):  # NOTE: not recursive=False (tbody exists)
        tds = tr.find_all("td", recursive=False)
        if len(tds) >= 3:
            pts = norm(tds[2].get_text(" ", strip=True))
            if re.fullmatch(r"\d+", pts):
                name = norm(tds[0].get_text(" ", strip=True))
                cond = norm(tds[1].get_text(" ", strip=True))
                if name and cond:
                    return True
    return False


def parse_objectives(html_path: Path) -> List[ObjectiveRow]:
    raw = html_path.read_text(encoding="utf-8", errors="ignore")
    rebuilt = unwrap_view_source(raw)
    soup = BeautifulSoup(rebuilt, "lxml")
    root = main_content_root(soup)

    current_type: Optional[str] = None
    current_when = "status phase"
    current_version = "base game"

    rows: List[ObjectiveRow] = []

    for el in root.descendants:
        if not isinstance(el, Tag):
            continue

        # Update context from headings
        if el.name in ("h2", "h3", "h4"):
            sp = el.find("span", class_="mw-headline")
            hid = sp.get("id") if sp else None
            if not hid:
                continue

            # Objective type sections
            if "Stage_I_Objectives" in hid:
                current_type = "stage 1 public"
                current_when = "status phase"
            elif "Stage_II_Objectives" in hid:
                current_type = "stage 2 public"
                current_when = "status phase"
            elif "Secret_Objectives" in hid:
                current_type = "secret"
                current_when = "status phase"

            # Timing subsections (mostly under Secret Objectives)
            elif hid == "Action_Phase":
                current_when = "action phase"
            elif hid == "Agenda_Phase":
                current_when = "agenda phase"
            elif hid == "Status_Phase":
                current_when = "status phase"

            # Version subsections (these appear multiple times: ..._2, ..._3, etc.)
            # Treat any "Twilight_Imperium_Fourth_Edition*" as base game
            # and any "Prophecy_of_Kings_Expansion*" as PoK.
            if hid.startswith("Twilight_Imperium_Fourth_Edition"):
                current_version = "base game"
            elif hid.startswith("Prophecy_of_Kings_Expansion"):
                current_version = "pok"

        # Parse tables
        if el.name == "table":
            table = el

            # Focus only on the main wiki tables
            classes = table.get("class") or []
            if "article-table" not in classes:
                continue
            if current_type is None:
                continue
            if not looks_like_objectives_table(table):
                continue

            # Get all TRs (thead + tbody). Skip header row if it looks like headers.
            trs = table.find_all("tr")
            for tr in trs[1:]:
                tds = tr.find_all("td", recursive=False)
                if len(tds) < 3:
                    continue

                name = norm(tds[0].get_text(" ", strip=True))
                condition = norm(tds[1].get_text(" ", strip=True))
                points = norm(tds[2].get_text(" ", strip=True))

                if not name or not condition:
                    continue
                if not re.fullmatch(r"\d+", points):
                    continue

                rows.append(
                    ObjectiveRow(
                        name=name,
                        condition=condition,
                        points=points,
                        obj_type=current_type,
                        when_to_score=current_when,
                        version=current_version,
                    )
                )

    return rows


def run() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("-i", "--input", default="/mnt/data/objectives.html", help="Path to objectives.html")
    ap.add_argument("-o", "--output", default="objectives.csv", help="Output CSV path")
    args = ap.parse_args()

    data = parse_objectives(Path(args.input))

    with open(args.output, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["name", "condition", "points", "type", "when to score", "version"])
        for r in data:
            w.writerow([r.name, r.condition, r.points, r.obj_type, r.when_to_score, r.version])

    print(f"Wrote {len(data)} rows to {args.output}")


if __name__ == "__main__":
    run()
