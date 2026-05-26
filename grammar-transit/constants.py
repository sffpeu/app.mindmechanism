"""Grammar Transit Map geometry, theme, and per-language station config."""

from __future__ import annotations

from pathlib import Path

# ---------------------------------------------------------------------------
# English (default)
# ---------------------------------------------------------------------------

STATIONS: dict[str, dict] = {
    "S1":  {"coords": (1160, 820), "formula": "V×T",  "name": "Engine Room"},
    "S2":  {"coords": (1000, 660), "formula": "V×T",  "name": "Authority Junction"},
    "S3":  {"coords": (200,  500), "formula": "N×D",  "name": "The Gateway"},
    "S4":  {"coords": (840,  500), "formula": "N×V",  "name": "Foundation"},
    "S5":  {"coords": (1320, 980), "formula": "V×M",  "name": "Detail Engine"},
    "S6":  {"coords": (1480, 820), "formula": "T×P",  "name": "The Clock"},
    "S7":  {"coords": (840,  175), "formula": "V",    "name": "The Fork"},
    "S8L": {"coords": (100,  248), "formula": "M",    "name": "The Scale"},
    "S8R": {"coords": (1640, 1172),"formula": "M",    "name": "The Peak"},
    "S9":  {"coords": (520,  500), "formula": "N×M",  "name": "Colour Station"},
}

LINE_COLORS: dict[str, str] = {
    "V": "#e03131",
    "T": "#2f9e44",
    "N": "#1971c2",
    "M": "#fd7e14",
    "D": "#7950f2",
    "P": "#f06595",
}

LINE_LABELS: dict[str, str] = {
    "V": "V Line",
    "T": "T Line",
    "N": "N Line",
    "M": "M Line",
    "D": "D spur",
    "P": "P Line",
}

# ---------------------------------------------------------------------------
# German (de)
# Adds S10_DE (Das Kreuzungsfeld — case crossing) and S11_DE (Bahnhof Trennung
# — separable verb prefix depot). S3 (The Gateway) gains case annotation.
# ---------------------------------------------------------------------------

STATIONS_DE: dict[str, dict] = {
    **STATIONS,
    "S3":   {"coords": (200,  500), "formula": "N×D×KASUS", "name": "Das Tor"},
    "S6":   {"coords": (1480, 820), "formula": "T×P×KASUS", "name": "Die Uhr"},
    "S10":  {"coords": (360,  340), "formula": "N×KASUS",   "name": "Das Kreuzungsfeld"},
    "S11":  {"coords": (1160, 500), "formula": "V×PRÄFIX",  "name": "Bahnhof Trennung"},
}

LINE_LABELS_DE: dict[str, str] = {
    "V": "V-Linie",
    "T": "T-Linie",
    "N": "N-Linie",
    "M": "M-Linie",
    "D": "D-Abzweig",
    "P": "P-Linie",
    "K": "K-Linie",   # Kasus (case) line — new for German
}

LINE_COLORS_DE: dict[str, str] = {
    **LINE_COLORS,
    "K": "#099268",   # teal — distinct from existing lines
}

# ---------------------------------------------------------------------------
# Finnish (fi)
# S3 (The Gateway / N×D) is eliminated — Finnish has no articles.
# Adds S10_FI (Case Terminal — 15 cases), S11_FI (Harmony Gate — vowel
# harmony), S12_FI (Morpheme Stack — agglutinative suffix chains).
# The D spur is replaced by a Possession spur (PX line).
# ---------------------------------------------------------------------------

STATIONS_FI: dict[str, dict] = {
    k: v for k, v in STATIONS.items() if k != "S3"
}
STATIONS_FI.update({
    "S6":  {"coords": (1480, 820), "formula": "T×SIJAMUOTO",    "name": "Kello"},
    "S10": {"coords": (200,  500), "formula": "N×SIJAMUOTO(15)","name": "Sijapäätteiden Solmukohta"},
    "S11": {"coords": (360,  340), "formula": "VOKAALISOINTU",  "name": "Harmoniaportaali"},
    "S12": {"coords": (680,  340), "formula": "MORPH×MORPH",    "name": "Liitesilo"},
})

LINE_LABELS_FI: dict[str, str] = {
    "V": "V-linja",
    "T": "T-linja",
    "N": "N-linja",
    "M": "M-linja",
    "PX": "PX-haara",  # Possessive suffixes replace the D spur
    "P": "P-linja",
    "K": "K-linja",    # Sijamuoto (case) line
    "H": "H-linja",    # Harmonia (vowel harmony) line
}

LINE_COLORS_FI: dict[str, str] = {
    **LINE_COLORS,
    "K": "#099268",
    "H": "#f59f00",    # amber — vowel harmony line
    "PX": "#ae3ec9",   # violet — possessive
}

# ---------------------------------------------------------------------------
# French (fr) — Romance language, UD labels, gendered articles, no case inflection
# ---------------------------------------------------------------------------

LINE_LABELS_FR: dict[str, str] = {
    "V": "Ligne V",
    "T": "Ligne T",
    "N": "Ligne N",
    "M": "Ligne M",
    "D": "Embranchement D",
    "P": "Ligne P",
}

# ---------------------------------------------------------------------------
# Spanish (es) — Romance language, UD labels, pro-drop, gendered articles
# ---------------------------------------------------------------------------

LINE_LABELS_ES: dict[str, str] = {
    "V": "Línea V",
    "T": "Línea T",
    "N": "Línea N",
    "M": "Línea M",
    "D": "Ramal D",
    "P": "Línea P",
}

# ---------------------------------------------------------------------------
# Italian (it) — Romance language, UD labels, pro-drop, clitic objects
# ---------------------------------------------------------------------------

LINE_LABELS_IT: dict[str, str] = {
    "V": "Linea V",
    "T": "Linea T",
    "N": "Linea N",
    "M": "Linea M",
    "D": "Diramazione D",
    "P": "Linea P",
}

# ---------------------------------------------------------------------------
# Language registry — maps ISO 639-1 code to config bundle
# ---------------------------------------------------------------------------

LANG_CONFIG: dict[str, dict] = {
    "en": {
        "stations": STATIONS,
        "line_colors": LINE_COLORS,
        "line_labels": LINE_LABELS,
        "spacy_model": "en_core_web_sm",
        "journey_subdir": "",
        "station_remap": {},
    },
    "de": {
        "stations": STATIONS_DE,
        "line_colors": LINE_COLORS_DE,
        "line_labels": LINE_LABELS_DE,
        "spacy_model": "de_core_news_lg",
        "journey_subdir": "DE",
        "station_remap": {},
    },
    "fi": {
        "stations": STATIONS_FI,
        "line_colors": LINE_COLORS_FI,
        "line_labels": LINE_LABELS_FI,
        "spacy_model": "fi_core_news_lg",
        "journey_subdir": "FI",
        # S3 (The Gateway, N×D) does not exist in Finnish — no articles.
        # All tokens that would route there go to S10 (15-case terminal).
        "station_remap": {"S3": "S10"},
    },
    "fr": {
        "stations": STATIONS,
        "line_colors": LINE_COLORS,
        "line_labels": LINE_LABELS_FR,
        "spacy_model": "fr_core_news_lg",
        "journey_subdir": "FR",
        "station_remap": {},
    },
    "es": {
        "stations": STATIONS,
        "line_colors": LINE_COLORS,
        "line_labels": LINE_LABELS_ES,
        "spacy_model": "es_core_news_lg",
        "journey_subdir": "ES",
        "station_remap": {},
    },
    "it": {
        "stations": STATIONS,
        "line_colors": LINE_COLORS,
        "line_labels": LINE_LABELS_IT,
        "spacy_model": "it_core_news_lg",
        "journey_subdir": "IT",
        "station_remap": {},
    },
}


def get_lang_config(lang: str) -> dict:
    if lang not in LANG_CONFIG:
        raise ValueError(f"Unsupported language: {lang!r}. Supported: {list(LANG_CONFIG)}")
    return LANG_CONFIG[lang]


# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------

VAULT_ROOT = Path.home() / "Documents" / "Obsidian Vault"
BASE_MAP_PATH = VAULT_ROOT / "20 Projects" / "Grammar Transit Map" / "journeys Maps" / "Grammar Transit Map — Combined.excalidraw"
JOURNEY_EXCALIDRAW_DIR = VAULT_ROOT / "Excalidraw" / "journeys"
JOURNEY_MARKDOWN_DIR = VAULT_ROOT / "20 Projects" / "Grammar Transit Map" / "Journeys"


def get_journey_dirs(lang: str) -> tuple[Path, Path]:
    subdir = LANG_CONFIG[lang]["journey_subdir"]
    exc_dir = JOURNEY_EXCALIDRAW_DIR / subdir if subdir else JOURNEY_EXCALIDRAW_DIR
    md_dir = JOURNEY_MARKDOWN_DIR / subdir if subdir else JOURNEY_MARKDOWN_DIR
    return exc_dir, md_dir


PIN_OFFSET_STEP = 30
ROUTE_COLOR = "#ffec99"
ROUTE_STROKE_WIDTH = 6
ROUTE_OPACITY = 60
