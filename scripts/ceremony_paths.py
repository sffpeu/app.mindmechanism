"""Default export location for standalone ceremony HTML (authoring on macOS)."""
from __future__ import annotations

from pathlib import Path


def closing_ceremony_dir() -> Path:
    """~/Desktop/Closing Ceremony — folder is created when a generator writes a file."""
    return Path.home() / "Desktop" / "Closing Ceremony"
