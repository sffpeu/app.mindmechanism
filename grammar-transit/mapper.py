"""Token → station mapping and journey assembly."""

from __future__ import annotations

from dataclasses import dataclass, field

from constants import LINE_LABELS, PIN_OFFSET_STEP, STATIONS

# Map language-specific dependency labels to the English UD labels used in map_token.
# German uses Stuttgart Tiger Treebank labels; Finnish uses TDT labels.
_DEP_NORMALISE: dict[str, dict[str, str]] = {
    "de": {
        "sb": "nsubj",     # Subjekt → subject
        "oa": "obj",       # Akkusativobjekt → direct object
        "da": "iobj",      # Dativobjekt → indirect object
        "pd": "attr",      # Prädikativ → predicate attribute
        "mo": "advmod",    # Modifikator → adverbial modifier
        "nk": "det",       # Nominalkerndependenz → determiner/modifier
        "pg": "nmod",      # Genitivattribut → nominal modifier
        "ep": "expl",      # Expletiv → expletive
        "svp": "svp",      # Separated verb prefix (kept as-is — new DE station)
        "cd": "cc",        # Konjunktdependenz → coordinating conjunction
        "cj": "conj",      # Konjunkt → conjunct
        "rc": "relcl",     # Relativsatz → relative clause
        "oc": "ccomp",     # Objekt-Komplement → clausal complement
        "app": "appos",    # Apposition
    },
    "fi": {
        "nsubj:cop": "nsubj",   # Copula subject
        "obj": "obj",           # Already UD
        "obl": "obl",           # Oblique (covers many Finnish case uses)
        "nmod:poss": "nmod",    # Possessive modifier
        "case": "prep",         # Case marker (postposition)
    },
    # FR/ES/IT all use standard UD labels from their spaCy models.
    # Only enhanced UD subtypes that differ from the base label need mapping.
    "fr": {
        "nsubj:pass": "nsubjpass",  # Passive subject
        "expl:subj": "expl",        # Impersonal expletive subject
        "obj:agent": "obj",         # Agent in passive (via par/de)
        "obl:agent": "obl",         # Oblique agent
        "obl:mod": "advmod",        # Oblique modifier acting as adverbial
    },
    "es": {
        "nsubj:pass": "nsubjpass",  # Passive subject
        "obj:agent": "obj",         # Agent in passive
        "obl:agent": "obl",         # Oblique agent
        "obl:mod": "advmod",        # Oblique modifier
        "iobj:agent": "iobj",       # Indirect object agent
    },
    "it": {
        "nsubj:pass": "nsubjpass",  # Passive subject
        "expl:impers": "expl",      # Impersonal si
        "expl:pass": "expl",        # Passive si
        "obj:agent": "obj",         # Agent in passive
        "obl:agent": "obl",         # Oblique agent
        "clit:obj": "obj",          # Clitic direct object
        "clit:iobj": "iobj",        # Clitic indirect object
    },
}


def normalise_dep(dep: str, lang: str) -> str:
    mapping = _DEP_NORMALISE.get(lang, {})
    return mapping.get(dep, dep)


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


def map_token_with_dep(token, dep: str) -> list[str]:
    """Returns station IDs using a pre-normalised dependency label."""
    pos = token.pos_

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
        # Separable verb prefix check (German)
        if any(c.dep_ == "svp" for c in token.children):
            stations.append("S11")
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

    if pos == "NUM":
        if dep in ("nummod", "quantmod"):
            return ["S3"]
        return ["S8L"]

    return []


def primary_line_for_token_with_dep(token, dep: str, stations: list[str]) -> str:
    """Single line key using a pre-normalised dep label."""
    pos = token.pos_

    if pos == "DET":
        return "D"
    if pos in ("NOUN", "PROPN"):
        if dep == "npadvmod":
            return "T"
        return "N"
    if pos == "VERB":
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

    if pos == "NUM":
        if dep in ("nummod", "quantmod"):
            return ["S3"]
        return ["S8L"]

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


def build_journey(
    doc,
    describe_fn,
    stations: dict[str, dict] | None = None,
    lang: str = "en",
    station_remap: dict[str, str] | None = None,
) -> list[JourneyStop]:
    """Ordered journey stops (non-punctuation tokens). describe_fn(pos, dep, stations) -> note str.

    Pass ``stations`` to use a language-specific station map instead of the English default.
    Pass ``lang`` to apply language-specific dependency label normalisation.
    Pass ``station_remap`` to redirect station IDs (e.g. Finnish S3 → S10).
    """
    station_map = stations if stations is not None else STATIONS
    remap = station_remap or {}
    out: list[JourneyStop] = []
    stack: dict[str, int] = {}

    for token in doc:
        if token.is_punct or token.is_space:
            continue
        norm_dep = normalise_dep(token.dep_, lang)
        raw_stations = map_token_with_dep(token, norm_dep)
        token_stations = [remap.get(s, s) for s in raw_stations]
        line = primary_line_for_token_with_dep(token, norm_dep, token_stations)
        note = describe_fn(token.pos_, token.dep_, tuple(token_stations))
        coords: list[tuple[int, int]] = []
        for sid in token_stations:
            base = station_map.get(sid, {}).get("coords")
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
                stations=token_stations,
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
