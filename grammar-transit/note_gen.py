"""Markdown journey note with YAML front matter."""

from __future__ import annotations

from datetime import date

from constants import STATIONS
from mapper import JourneyStop, line_label


def _yaml_quote_sentence(s: str) -> str:
    esc = s.replace("\\", "\\\\").replace('"', '\\"')
    return f'"{esc}"'


def slug_first_four_words(sentence: str) -> str:
    words = [w for w in sentence.strip().split() if w][:4]
    slug = "-".join("".join(ch.lower() if ch.isalnum() else "-" for ch in w).strip("-") for w in words)
    while "--" in slug:
        slug = slug.replace("--", "-")
    return slug.strip("-") or "journey"


def _flatten_stations(journey: list[JourneyStop]) -> list[str]:
    out: list[str] = []
    for stop in journey:
        out.extend(stop.stations)
    return out


def _render_stop(stop: JourneyStop) -> str:
    primary = stop.stations[0] if stop.stations else "—"
    st_name = STATIONS.get(primary, {}).get("name", primary)
    lab = line_label(stop.line)
    head = f'**"{stop.token}"** — {lab} · {st_name} ({primary})'
    if len(stop.stations) > 1:
        extra = ", ".join(
            f"{STATIONS.get(s, {}).get('name', s)} ({s})" for s in stop.stations[1:]
        )
        head += f" · also {extra}"
    note = stop.note
    return f"{head}\n{note}"


def _render_table(journey: list[JourneyStop]) -> str:
    lines = [
        "| # | Token | POS | Dep | Line | Stations | Note |",
        "|---:|:---|:---|:---|:---|:---|:---|",
    ]
    for i, stop in enumerate(journey, start=1):
        st = ", ".join(stop.stations) if stop.stations else "—"
        note = stop.note.replace("|", "\\|")
        lines.append(
            f"| {i} | {stop.token} | {stop.pos} | {stop.dep} | {stop.line} | {st} | {note} |"
        )
    return "\n".join(lines)


def write_markdown(
    sentence: str,
    journey: list[JourneyStop],
    excalidraw_rel_link: str,
    style: str,
    dest_path: Path,
) -> None:
    today = date.today().isoformat()
    stations = _flatten_stations(journey)
    stations_yaml = "[" + ", ".join(stations) + "]" if stations else "[]"
    body_log = (
        "\n\n".join(_render_stop(s) for s in journey)
        if style != "table"
        else _render_table(journey)
    )
    title = "## Journey Log" if style != "table" else "## Journey Table"
    content = f"""---
type: grammar-journey
date: {today}
sentence: {_yaml_quote_sentence(sentence)}
stations: {stations_yaml}
tags: [grammar, transit-map, sentence-analysis]
---

![[{excalidraw_rel_link}]]

{title}

{body_log}
"""
    dest_path.parent.mkdir(parents=True, exist_ok=True)
    dest_path.write_text(content, encoding="utf-8")
