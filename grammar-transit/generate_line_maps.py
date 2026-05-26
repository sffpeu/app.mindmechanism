"""Generate individual Grammar Transit line maps as Excalidraw files.

Layout rules (tube-map style):
  - Odd-indexed stations: label ABOVE the line
  - Even-indexed stations: label BELOW the line
  - Word name is the primary label (large, line colour)
  - Usage note is secondary (small, grey)
  - Section headings sit well clear of the station labels
  - Lines bend at 45° with a diagonal step between rows

Font: Helvetica (fontFamily 2).
Output: ~/Documents/Obsidian Vault/Excalidraw/lines/
"""

from __future__ import annotations

import json
import random
from pathlib import Path

VAULT = Path.home() / "Documents" / "Obsidian Vault"
OUTPUT_DIR = VAULT / "Excalidraw" / "lines"
BG = "#f5f0e8"

LINE_COLORS = {
    "N": "#1971c2",
    "V": "#c92a2a",
    "M": "#e67700",
    "T": "#2b8a3e",
    "D": "#6741d9",
    "P": "#a61e4d",
}

HELVETICA = 2


def _nonce() -> int:
    return random.randint(1, 2**31 - 1)


def _id() -> str:
    return f"{random.randint(0, 16**8):08x}"


def seg(x1: float, y1: float, x2: float, y2: float, color: str, width: int = 6) -> dict:
    dx, dy = x2 - x1, y2 - y1
    return {
        "type": "line", "version": 1, "versionNonce": _nonce(), "isDeleted": False,
        "id": _id(), "fillStyle": "solid", "strokeWidth": width, "strokeStyle": "solid",
        "roughness": 0, "opacity": 100, "angle": 0,
        "x": float(x1), "y": float(y1), "strokeColor": color,
        "backgroundColor": "transparent",
        "width": max(abs(dx), 1.0), "height": max(abs(dy), 1.0),
        "seed": _nonce(), "groupIds": [], "frameId": None, "roundness": None,
        "boundElements": None, "updated": 1, "link": None, "locked": False,
        "startBinding": None, "endBinding": None, "lastCommittedPoint": None,
        "startArrowhead": None, "endArrowhead": None,
        "points": [[0.0, 0.0], [float(dx), float(dy)]],
    }


def circle(cx: float, cy: float, r: float, stroke: str,
           fill: str = BG, sw: int = 2) -> dict:
    return {
        "type": "ellipse", "version": 1, "versionNonce": _nonce(), "isDeleted": False,
        "id": _id(), "fillStyle": "solid", "strokeWidth": sw, "strokeStyle": "solid",
        "roughness": 0, "opacity": 100, "angle": 0,
        "x": float(cx - r), "y": float(cy - r),
        "strokeColor": stroke, "backgroundColor": fill,
        "width": float(r * 2), "height": float(r * 2),
        "seed": _nonce(), "groupIds": [], "frameId": None, "roundness": None,
        "boundElements": None, "updated": 1, "link": None, "locked": False,
    }


def txt(cx: float, y: float, content: str, size: int = 13,
        color: str = "#1e1e1e", w: float | None = None) -> dict:
    width = w or max(len(content) * size * 0.58, 60.0)
    h = float(size * 1.6)
    return {
        "type": "text", "version": 1, "versionNonce": _nonce(), "isDeleted": False,
        "id": _id(), "fillStyle": "solid", "strokeWidth": 1, "strokeStyle": "solid",
        "roughness": 0, "opacity": 100, "angle": 0,
        "x": float(cx - width / 2), "y": float(y),
        "strokeColor": color, "backgroundColor": "transparent",
        "width": width, "height": h,
        "seed": _nonce(), "groupIds": [], "frameId": None, "roundness": None,
        "boundElements": None, "updated": 1, "link": None, "locked": False,
        "fontSize": size, "fontFamily": HELVETICA,
        "text": content, "textAlign": "center", "verticalAlign": "middle",
        "containerId": None, "originalText": content, "lineHeight": 1.25,
    }


def cap(x: float, y: float, color: str) -> dict:
    return seg(x, y - 14, x, y + 14, color, width=5)


# ── Core station renderer ─────────────────────────────────────────────────────

def station(els: list, x: float, y: float,
            name: str, note: str, color: str,
            above: bool,
            interchange: bool = False,
            ic: str | None = None,
            name_size: int = 17,
            ref: str | None = None) -> None:
    """
    Place a station circle with name + note on alternating sides of the line.

    above=True  → name & note go above the circle
    above=False → name & note go below the circle
    ic label always appears on the OPPOSITE side from the text (maximises clarity).
    ref is a small coded reference (e.g. N4, V7) placed on the opposite side from name.
    """
    r = 15 if interchange else 9
    sw = 3 if interchange else 2
    els.append(circle(x, y, r, color, sw=sw))

    if above:
        # note (grey) sits furthest from line; name sits closest above circle
        els.append(txt(x, y - r - 46, note, 11, "#777777", w=280))
        els.append(txt(x, y - r - 24, name, name_size, color, w=260))
        # ref + interchange tag below (ref closest, then ic)
        if ref:
            els.append(txt(x, y + r + 8,  ref, 9, color, w=30))
        if ic:
            els.append(txt(x, y + r + (22 if ref else 10), f"⇕  {ic}", 11, "#aaaaaa", w=200))
    else:
        # name sits closest below circle; note sits further down
        els.append(txt(x, y + r + 8,  name, name_size, color, w=260))
        els.append(txt(x, y + r + 30, note, 11, "#777777", w=280))
        # ref + interchange tag above (ref closest, then ic)
        if ref:
            els.append(txt(x, y - r - 16, ref, 9, color, w=30))
        if ic:
            els.append(txt(x, y - r - (28 if ref else 14), f"⇕  {ic}", 11, "#aaaaaa", w=200))


def write(elements: list, name: str) -> None:
    data = {
        "type": "excalidraw", "version": 2,
        "source": "https://excalidraw.com",
        "elements": elements,
        "appState": {"gridSize": None, "viewBackgroundColor": BG},
        "files": {},
    }
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    p = OUTPUT_DIR / name
    p.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"  ✓  {p.name}")


# ── Two-row line builder helper ───────────────────────────────────────────────

def two_row_line(els: list, color: str,
                 r1y: float, row1: list[tuple],
                 r2y: float, row2: list[tuple],
                 gap: float,
                 r1_offset: int = 0,
                 prefix: str | None = None,
                 start: int = 1) -> None:
    """
    Draw a two-row line with a 45° diagonal step between them.
    Each tuple in row1/row2: (x, name, note [, ic_label])
    r1_offset: index offset for alternating above/below across rows.
    prefix/start: if given, add coded reference labels (e.g. N1, V7) to each dot.
    """
    last_x = row1[-1][0]
    step_x1 = last_x + gap
    step_x2 = step_x1 + (r2y - r1y)   # 45° diagonal

    # Row 1 track
    els.append(seg(row1[0][0] - gap, r1y, step_x1, r1y, color))
    els.append(cap(row1[0][0] - gap, r1y, color))

    # Diagonal step
    els.append(seg(step_x1, r1y, step_x2, r2y, color))

    # Row 2 track
    end_x = row2[-1][0] + gap
    els.append(seg(step_x2, r2y, end_x, r2y, color))
    els.append(cap(end_x, r2y, color))

    # Row 1 stations
    for i, entry in enumerate(row1):
        x, name, note = entry[0], entry[1], entry[2]
        ic = entry[3] if len(entry) > 3 else None
        above = ((i + r1_offset) % 2 == 0)
        ref = f"{prefix}{start + i}" if prefix else None
        station(els, x, r1y, name, note, color, above=above, ic=ic, ref=ref)

    # Row 2 stations — continue the alternating index
    offset2 = r1_offset + len(row1)
    r2_start_num = start + len(row1)
    for i, entry in enumerate(row2):
        x, name, note = entry[0], entry[1], entry[2]
        ic = entry[3] if len(entry) > 3 else None
        above = ((i + offset2) % 2 == 0)
        ref = f"{prefix}{r2_start_num + i}" if prefix else None
        station(els, x, r2y, name, note, color, above=above, ic=ic, ref=ref)


# ─────────────────────────────────────────────────────────────────────────────
# P LINE  ·  Preposition
# ─────────────────────────────────────────────────────────────────────────────
def build_p_line() -> None:
    color = LINE_COLORS["P"]
    GAP = 160
    r1y, r2y = 280, 520

    row1 = [
        (100,  "in",      "inside a space or period  ·  in the room, in March"),
        (260,  "on",      "on a surface or schedule  ·  on the table, on Monday"),
        (420,  "at",      "a specific point  ·  at the station, at noon, at risk"),
        (580,  "to",      "direction toward  ·  to London, to the office, to me"),
        (740,  "of",      "belonging, composition  ·  the roof of the house"),
        (900,  "by",      "beside · via · agent  ·  by the door, by train, by hand"),
        (1060, "for",     "purpose or duration  ·  for this reason, for three hours"),
        (1220, "from",    "origin point  ·  from home, from memory, from scratch"),
    ]

    step = (r2y - r1y)
    row2_start = row1[-1][0] + GAP + step
    row2 = [
        (row2_start,            "with",    "accompaniment or means  ·  with care, with a team"),
        (row2_start + GAP,      "about",   "concerning  ·  about the plan, about time"),
        (row2_start + GAP * 2,  "after",   "later in time  ·  after lunch, after the meeting"),
        (row2_start + GAP * 3,  "before",  "earlier in time  ·  before noon, before the exam"),
        (row2_start + GAP * 4,  "during",  "throughout a period  ·  during the night, during class"),
        (row2_start + GAP * 5,  "through", "from one side to the other  ·  through the tunnel"),
        (row2_start + GAP * 6,  "between", "separating two  ·  between us, between 9 and 5"),
        (row2_start + GAP * 7,  "over",    "above or exceeding  ·  over the hill, over budget"),
    ]

    els: list = []
    two_row_line(els, color, r1y, row1, r2y, row2, GAP, prefix="P", start=1)
    els.append(txt((row1[0][0] + row2[-1][0]) / 2, 60,
                   "P  LINE  ·  PREPOSITION", 28, color, w=520))
    write(els, "Grammar Transit — P Line.excalidraw")


# ─────────────────────────────────────────────────────────────────────────────
# D LINE  ·  Determiner
# Three rows: Articles → Demonstratives → Possessives & Quantifiers
# ─────────────────────────────────────────────────────────────────────────────
def build_d_line() -> None:
    color = LINE_COLORS["D"]
    GAP = 160
    r1y, r2y, r3y = 280, 520, 760

    row1 = [
        (100, "the",   "the definite article  ·  refers to something specific and known"),
        (260, "a",     "indefinite  ·  any one member of a class  ·  a plan, a team"),
        (420, "an",    "indefinite before a vowel sound  ·  an idea, an hour, an heir"),
    ]

    step1 = r2y - r1y
    r2_start = row1[-1][0] + GAP + step1
    row2 = [
        (r2_start,            "this",  "singular, near  ·  this book, this idea, this moment"),
        (r2_start + GAP,      "that",  "singular, distant  ·  that building, that decision"),
        (r2_start + GAP * 2,  "these", "plural, near  ·  these pages, these results, these people"),
        (r2_start + GAP * 3,  "those", "plural, distant  ·  those years, those concerns"),
    ]

    step2 = r3y - r2y
    r3_start = row2[-1][0] + GAP + step2
    row3 = [
        (r3_start,            "my",    "1st person singular  ·  my idea, my responsibility"),
        (r3_start + GAP,      "your",  "2nd person  ·  your work, your decision, your call"),
        (r3_start + GAP * 2,  "his",   "3rd person masc.  ·  his report, his approach"),
        (r3_start + GAP * 3,  "her",   "3rd person fem.  ·  her plan, her team, her position"),
        (r3_start + GAP * 4,  "their", "3rd person plural  ·  their proposal, their view"),
        (r3_start + GAP * 5,  "every", "each individual in a group  ·  every option, every word"),
        (r3_start + GAP * 6,  "each",  "one at a time  ·  each step, each member, each line"),
        (r3_start + GAP * 7,  "some",  "an unspecified amount  ·  some time, some evidence"),
    ]

    els: list = []

    # Row 1 track
    els.append(seg(row1[0][0] - GAP, r1y, row1[-1][0] + GAP, r1y, color))
    els.append(cap(row1[0][0] - GAP, r1y, color))

    # Step 1
    step1_x1 = row1[-1][0] + GAP
    step1_x2 = step1_x1 + step1
    els.append(seg(step1_x1, r1y, step1_x2, r2y, color))

    # Row 2 track
    els.append(seg(step1_x2, r2y, row2[-1][0] + GAP, r2y, color))

    # Step 2
    step2_x1 = row2[-1][0] + GAP
    step2_x2 = step2_x1 + step2
    els.append(seg(step2_x1, r2y, step2_x2, r3y, color))

    # Row 3 track
    r3_end = row3[-1][0] + GAP
    els.append(seg(step2_x2, r3y, r3_end, r3y, color))
    els.append(cap(r3_end, r3y, color))

    # Stations
    for i, (x, name, note) in enumerate(row1):
        station(els, x, r1y, name, note, color, above=(i % 2 == 0), ref=f"D{i + 1}")

    offset2 = len(row1)
    for i, (x, name, note) in enumerate(row2):
        station(els, x, r2y, name, note, color, above=((i + offset2) % 2 == 0),
                ref=f"D{offset2 + i + 1}")

    offset3 = offset2 + len(row2)
    for i, (x, name, note) in enumerate(row3):
        station(els, x, r3y, name, note, color, above=((i + offset3) % 2 == 0),
                ref=f"D{offset3 + i + 1}")

    # Section labels — safely clear of station text
    els.append(txt(260,   r1y - 110, "ARTICLES",                      13, "#cccccc", w=200))
    els.append(txt(r2_start + GAP * 1.5, r2y - 110, "DEMONSTRATIVES", 13, "#cccccc", w=240))
    els.append(txt(r3_start + GAP * 3.5, r3y - 110, "POSSESSIVES  &  QUANTIFIERS",
                   13, "#cccccc", w=320))

    mid = (row1[0][0] + row3[-1][0]) / 2
    els.append(txt(mid, 60, "D  LINE  ·  DETERMINER", 28, color, w=520))

    write(els, "Grammar Transit — D Line.excalidraw")


# ─────────────────────────────────────────────────────────────────────────────
# V LINE  ·  Verb
# Row 1: Auxiliaries & Modals (individual words)
# Row 2: Main verb forms
# ─────────────────────────────────────────────────────────────────────────────
def build_v_line() -> None:
    color = LINE_COLORS["V"]
    GAP = 160
    r1y, r2y = 280, 520

    row1 = [
        (100,  "will",   "future intention or prediction  ·  I will present the report"),
        (260,  "would",  "conditional or past habit  ·  she would always ask first"),
        (420,  "can",    "ability or permission  ·  he can see the problem clearly"),
        (580,  "could",  "past ability or polite request  ·  could you clarify that"),
        (740,  "may",    "possibility or formal permission  ·  it may work, you may proceed"),
        (900,  "might",  "weaker possibility  ·  she might attend, that might be correct"),
        (1060, "shall",  "formal future or strong intention  ·  we shall proceed"),
        (1220, "should", "expectation or advice  ·  you should review this first"),
        (1380, "must",   "strong obligation or certainty  ·  you must sign off on this"),
        (1540, "have",   "perfect aspect marker  ·  have decided, has presented, had run"),
        (1700, "be",     "passive or continuous marker  ·  is being reviewed, was sent"),
        (1860, "do",     "emphasis, negation, questions  ·  do you agree, I do support it"),
    ]

    step = r2y - r1y
    r2_start = row1[-1][0] + GAP + step
    row2 = [
        (r2_start,            "simple present",      "runs · decides · presents · agrees"),
        (r2_start + GAP,      "simple past",         "ran · decided · presented · agreed"),
        (r2_start + GAP * 2,  "present perfect",     "has run · has decided · has presented"),
        (r2_start + GAP * 3,  "past perfect",        "had run · had decided · had presented"),
        (r2_start + GAP * 4,  "future simple",       "will run · will decide · will present"),
        (r2_start + GAP * 5,  "present continuous",  "is running · is deciding · is presenting"),
        (r2_start + GAP * 6,  "past continuous",     "was running · was deciding · was presenting"),
        (r2_start + GAP * 7,  "passive voice",       "is presented · was decided · has been reviewed"),
        (r2_start + GAP * 8,  "infinitive",          "to run · to decide · to present · to agree"),
        (r2_start + GAP * 9,  "gerund",              "running · deciding · presenting · agreeing"),
    ]

    els: list = []
    two_row_line(els, color, r1y, row1, r2y, row2, GAP, prefix="V", start=1)

    els.append(txt(980,   r1y - 110, "AUXILIARIES  &  MODALS",  13, "#cccccc", w=300))
    els.append(txt(r2_start + GAP * 4.5, r2y - 110, "MAIN VERB FORMS", 13, "#cccccc", w=260))

    mid = (row1[0][0] + row2[-1][0]) / 2
    els.append(txt(mid, 60, "V  LINE  ·  VERB", 28, color, w=420))

    write(els, "Grammar Transit — V Line.excalidraw")


# ─────────────────────────────────────────────────────────────────────────────
# M LINE  ·  Modifier
# Row 1: Adjective types  |  Row 2: Adverb types
# ─────────────────────────────────────────────────────────────────────────────
def build_m_line() -> None:
    color = LINE_COLORS["M"]
    GAP = 180
    r1y, r2y = 280, 520

    row1 = [
        (100,  "attributive",   "before the noun  ·  a clear strategy, the senior manager"),
        (280,  "predicate",     "after a copula  ·  the plan is clear, she seems confident"),
        (460,  "comparative",   "degree raised  ·  clearer, more formal, better, faster"),
        (640,  "superlative",   "highest degree  ·  clearest, most formal, best, fastest"),
        (820,  "participial",   "verb form acting as adj  ·  a written report, a growing team"),
        (1000, "compound",      "two roots joined  ·  well-known, long-term, high-level"),
    ]

    step = r2y - r1y
    r2_start = row1[-1][0] + GAP + step
    row2 = [
        (r2_start,            "manner",    "how the action happens  ·  formally, quickly, carefully"),
        (r2_start + GAP,      "frequency", "how often  ·  always, usually, often, sometimes, rarely"),
        (r2_start + GAP * 2,  "degree",    "how much  ·  very, quite, extremely, too, enough"),
        (r2_start + GAP * 3,  "place",     "where  ·  here, there, nearby, abroad, inside, outside"),
        (r2_start + GAP * 4,  "time",      "when (sentence level)  ·  now, then, soon, already, still"),
        (r2_start + GAP * 5,  "viewpoint", "speaker stance  ·  frankly, honestly, ideally, technically"),
    ]

    els: list = []
    two_row_line(els, color, r1y, row1, r2y, row2, GAP, prefix="M", start=1)

    els.append(txt(550,   r1y - 110, "ADJECTIVES",  13, "#cccccc", w=200))
    els.append(txt(r2_start + GAP * 2.5, r2y - 110, "ADVERBS", 13, "#cccccc", w=180))

    mid = (row1[0][0] + row2[-1][0]) / 2
    els.append(txt(mid, 60, "M  LINE  ·  MODIFIER", 28, color, w=480))

    write(els, "Grammar Transit — M Line.excalidraw")


# ─────────────────────────────────────────────────────────────────────────────
# N LINE  ·  Noun
# Row 1: Noun types  |  Row 2: Noun roles in the clause
# ─────────────────────────────────────────────────────────────────────────────
def build_n_line() -> None:
    color = LINE_COLORS["N"]
    GAP = 200
    r1y, r2y = 280, 520

    row1 = [
        (100,  "proper noun",    "a unique named entity  ·  London, Shakespeare, Tuesday"),
        (300,  "common noun",    "a general category  ·  manager, report, idea, system"),
        (500,  "abstract noun",  "no physical form  ·  freedom, justice, strategy, clarity"),
        (700,  "mass noun",      "uncountable  ·  information, advice, water, equipment"),
        (900,  "compound noun",  "two roots fused  ·  database, feedback, deadline, workload"),
        (1100, "collective noun","a group as one  ·  team, committee, board, fleet, audience"),
    ]

    step = r2y - r1y
    r2_start = row1[-1][0] + GAP + step
    row2 = [
        (r2_start,            "subject",              "who or what acts  ·  The manager presented the report"),
        (r2_start + GAP,      "direct object",        "receives the action  ·  She submitted the proposal"),
        (r2_start + GAP * 2,  "indirect object",      "secondary recipient  ·  He gave the team the feedback"),
        (r2_start + GAP * 3,  "predicate nominative", "equated to subject via be  ·  She is the director"),
        (r2_start + GAP * 4,  "object of preposition","after a preposition  ·  in the meeting, by the team"),
        (r2_start + GAP * 5,  "appositive",           "renames alongside  ·  the CEO, a founder, renames"),
    ]

    els: list = []
    two_row_line(els, color, r1y, row1, r2y, row2, GAP, prefix="N", start=1)

    els.append(txt(600,   r1y - 110, "NOUN TYPES",  13, "#cccccc", w=220))
    els.append(txt(r2_start + GAP * 2.5, r2y - 110,
                   "NOUN ROLES  IN  THE  CLAUSE", 13, "#cccccc", w=340))

    mid = (row1[0][0] + row2[-1][0]) / 2
    els.append(txt(mid, 60, "N  LINE  ·  NOUN", 28, color, w=420))

    write(els, "Grammar Transit — N Line.excalidraw")


# ─────────────────────────────────────────────────────────────────────────────
# T LINE  ·  Time
# Row 1: Tense constructions  |  Row 2: Temporal adverbials
# ─────────────────────────────────────────────────────────────────────────────
def build_t_line() -> None:
    color = LINE_COLORS["T"]
    GAP = 180
    r1y, r2y = 280, 520

    row1 = [
        (100,  "simple present",      "present fact or habit  ·  She runs the team"),
        (280,  "simple past",         "completed action  ·  They decided yesterday"),
        (460,  "future with will",    "prediction or plan  ·  We will respond on Monday"),
        (640,  "present perfect",     "past with present relevance  ·  She has arrived"),
        (820,  "past perfect",        "before another past event  ·  He had already left"),
        (1000, "present continuous",  "in progress right now  ·  They are reviewing the draft"),
        (1180, "future continuous",   "in progress at a future time  ·  will be running"),
    ]

    step = r2y - r1y
    r2_start = row1[-1][0] + GAP + step
    row2 = [
        (r2_start,            "now",       "the present moment  ·  decide now, what is needed now"),
        (r2_start + GAP,      "then",      "at that time  ·  it was different then, then she left"),
        (r2_start + GAP * 2,  "soon",      "in the near future  ·  they will respond soon"),
        (r2_start + GAP * 3,  "already",   "earlier than expected  ·  she has already left"),
        (r2_start + GAP * 4,  "still",     "continuing longer than expected  ·  still waiting"),
        (r2_start + GAP * 5,  "yet",       "up to now (negatives, questions)  ·  not finished yet"),
        (r2_start + GAP * 6,  "tomorrow",  "the next day  ·  present it tomorrow, meet tomorrow"),
        (r2_start + GAP * 7,  "yesterday", "the previous day  ·  filed yesterday, decided yesterday"),
    ]

    els: list = []
    two_row_line(els, color, r1y, row1, r2y, row2, GAP, prefix="T", start=1)

    els.append(txt(640,   r1y - 110, "TENSE CONSTRUCTIONS",    13, "#cccccc", w=280))
    els.append(txt(r2_start + GAP * 3.5, r2y - 110, "TEMPORAL ADVERBIALS", 13, "#cccccc", w=260))

    mid = (row1[0][0] + row2[-1][0]) / 2
    els.append(txt(mid, 60, "T  LINE  ·  TIME", 28, color, w=400))

    write(els, "Grammar Transit — T Line.excalidraw")


if __name__ == "__main__":
    print("Generating Grammar Transit line maps …")
    build_p_line()
    build_d_line()
    build_v_line()
    build_m_line()
    build_n_line()
    build_t_line()
    print("Done.")
