"""Hardcoded Grammar Transit Map geometry and theme."""

from __future__ import annotations

from pathlib import Path

STATIONS: dict[str, dict] = {
    "S1": {"coords": (600, 610), "formula": "V×T", "name": "Engine Room"},
    "S2": {"coords": (600, 450), "formula": "V×T×R", "name": "Authority Junction"},
    "S3": {"coords": (240, 870), "formula": "N×D", "name": "The Gateway"},
    "S4": {"coords": (600, 870), "formula": "N×V", "name": "Foundation"},
    "S5": {"coords": (600, 330), "formula": "V×M", "name": "Detail Engine"},
    "S6": {"coords": (840, 610), "formula": "T×P×M", "name": "The Clock"},
    "S7": {"coords": (600, 1040), "formula": "V×V", "name": "The Fork"},
    "S8L": {"coords": (250, 190), "formula": "M×M", "name": "The Scale"},
    "S8R": {"coords": (960, 190), "formula": "M×M", "name": "The Peak"},
    "S9": {"coords": (420, 870), "formula": "N×M", "name": "Colour Station"},
}

# Grammatical line keys for pins and narrative (V, T, N, M, D, P).
LINE_COLORS: dict[str, str] = {
    "V": "#e03131",
    "T": "#2f9e44",
    "N": "#1971c2",
    "M": "#fd7e14",
    "D": "#7950f2",
    "P": "#f06595",
}

# Short labels used in the journey log header (before the middle dot).
LINE_LABELS: dict[str, str] = {
    "V": "V Line",
    "T": "T Line",
    "N": "N Line",
    "M": "M Line",
    "D": "D spur",
    "P": "P Line",
}

VAULT_ROOT = Path.home() / "Documents" / "Obsidian Vault"
BASE_MAP_PATH = VAULT_ROOT / "Excalidraw" / "Grammar Transit Map.excalidraw"
JOURNEY_EXCALIDRAW_DIR = VAULT_ROOT / "Excalidraw" / "journeys"
JOURNEY_MARKDOWN_DIR = VAULT_ROOT / "20 Projects" / "Grammar Transit Map" / "Journeys"

PIN_OFFSET_STEP = 30
ROUTE_COLOR = "#ffec99"
ROUTE_STROKE_WIDTH = 6
ROUTE_OPACITY = 60
