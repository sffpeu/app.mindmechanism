"""Token → station mapping and journey assembly."""

from __future__ import annotations

from dataclasses import dataclass, field

from constants import LINE_LABELS, PIN_OFFSET_STEP, STATIONS


def _morph_first(token, feature: str) -> str | None:
    raw = token.morph.get(feature)
    if raw is None:
        return None
    if isinstance(raw, (list, tuple)):
        return str(raw[0]) if raw else None
    s = str(raw)
    if "," in s:
        return s.split(",")[0].strip()
    return s.strip() or None


def map_token(token) -> list[str]:
    """Returns one or more station IDs for a spaCy token."""
    pos = token.pos_
    dep = token.dep_

    if pos == "DET":
        return ["S3"]

    if pos in ("NOUN", "PROPN"):
        if dep == "npadvmod":
            return ["S6"]
        stations: list[str] = []
        if dep in ("nsubj", "nsubjpass"):
            stations.append("S4")
        else:
            stations.append("S3")
        if any(c.pos_ == "ADJ" for c in token.children):
            stations.append("S9")
        return stations

    if pos == "VERB":
        stations = ["S1"]
        vf = _morph_first(token, "VerbForm")
        if vf in ("Inf", "Ger"):
            stations.append("S7")
        if any(c.pos_ == "ADV" for c in token.children):
            stations.append("S5")
        return stations

    if pos == "AUX":
        return ["S2"]

    if pos == "ADJ":
        deg = _morph_first(token, "Degree")
        if deg == "Cmp":
            return ["S8L"]
        if deg == "Sup":
            return ["S8R"]
        return ["S9"]

    if pos == "ADV":
        if dep == "advmod" and token.head.pos_ == "VERB":
            return ["S5"]
        return ["S6"]

    if pos == "ADP":
        return ["S6"]

    return []


def primary_line_for_token(token, stations: list[str]) -> str:
    """Single line key for coloring and narrative (V, T, N, M, D, P)."""
    pos = token.pos_
    dep = token.dep_

    if pos == "DET":
        return "D"
    if pos in ("NOUN", "PROPN"):
        if dep == "npadvmod":
            return "T"
        return "N"
        return "V"
    if pos == "AUX":
        return "V"
    if pos == "ADJ":
        return "M"
    if pos == "ADV":
        if dep == "advmod" and token.head.pos_ == "VERB":
            return "M"
        return "T"
    if pos == "ADP":
        return "P"
    if stations:
        # Fallback from first station formula heuristics
        formula = STATIONS.get(stations[0], {}).get("formula", "")
        if "D" in formula and pos == "PRON":
            return "N"
        if "P" in formula:
            return "P"
        if "V" in formula:
            return "V"
        if "N" in formula:
            return "N"
        if "M" in formula:
            return "M"
    return "V"


def line_label(line: str) -> str:
    return LINE_LABELS.get(line, line)


@dataclass
class JourneyStop:
    token: str
    pos: str
    dep: str
    line: str
    stations: list[str]
    note: str
    coords: list[tuple[int, int]] = field(default_factory=list)


def build_journey(doc, describe_fn) -> list[JourneyStop]:
    """Ordered journey stops (non-punctuation tokens). describe_fn(pos, dep, stations) -> note str."""
    out: list[JourneyStop] = []
    stack: dict[str, int] = {}

    for token in doc:
        if token.is_punct or token.is_space:
            continue
        stations = map_token(token)
        line = primary_line_for_token(token, stations)
        note = describe_fn(token.pos_, token.dep_, tuple(stations))
        coords: list[tuple[int, int]] = []
        for sid in stations:
            base = STATIONS.get(sid, {}).get("coords")
            if not base:
                continue
            bx, by = int(base[0]), int(base[1])
            idx = stack.get(sid, 0)
            stack[sid] = idx + 1
            coords.append((bx, by + idx * PIN_OFFSET_STEP))
        out.append(
            JourneyStop(
                token=token.text,
                pos=token.pos_,
                dep=token.dep_,
                line=line,
                stations=stations,
                note=note,
                coords=coords,
            )
        )
    return out


def polyline_points(journey: list[JourneyStop]) -> list[tuple[int, int]]:
    """Ordered absolute canvas points for the route (station visits in sentence order)."""
    pts: list[tuple[int, int]] = []
    for stop in journey:
        for c in stop.coords:
            pts.append(c)
    return pts
