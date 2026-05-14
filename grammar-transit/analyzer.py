"""CLI entry: parse text with spaCy, emit Excalidraw journey + Markdown note."""

from __future__ import annotations

import argparse
import sys
from datetime import datetime
from pathlib import Path

import spacy

from constants import BASE_MAP_PATH, JOURNEY_EXCALIDRAW_DIR, JOURNEY_MARKDOWN_DIR
from descriptions import get_note
from excalidraw_gen import write_journey_excalidraw
from mapper import build_journey
from note_gen import slug_first_four_words, write_markdown

nlp = spacy.load("en_core_web_sm")


def _read_input(args: argparse.Namespace) -> str:
    if args.file is not None:
        return Path(args.file).read_text(encoding="utf-8").strip()
    if args.text is not None:
        return args.text.strip()
    raise ValueError("No input text provided.")


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Grammar Transit Map sentence analyzer.")
    parser.add_argument("text", nargs="?", default=None, help="Sentence or paragraph to analyze.")
    parser.add_argument("--file", dest="file", default=None, help="Read input from a UTF-8 text file.")
    parser.add_argument(
        "--style",
        choices=("narrative", "table"),
        default="narrative",
        help="Markdown body style (default: narrative).",
    )
    args = parser.parse_args(argv)

    if args.file and args.text:
        print("Pass either a positional sentence or --file, not both.", file=sys.stderr)
        return 1
    if not args.file and args.text is None:
        print("Provide a positional sentence or --file.", file=sys.stderr)
        return 1

    try:
        text = _read_input(args)
    except OSError as exc:
        print(f"Could not read input: {exc}", file=sys.stderr)
        return 1
    except ValueError as exc:
        print(str(exc), file=sys.stderr)
        return 1

    if not text:
        print("Input is empty.", file=sys.stderr)
        return 1

    if not BASE_MAP_PATH.is_file():
        print(f"Base map not found: {BASE_MAP_PATH}", file=sys.stderr)
        return 1

    doc = nlp(text)
    journey = build_journey(doc, lambda pos, dep, st: get_note(pos, dep, st))

    slug = slug_first_four_words(text)
    now = datetime.now()
    exc_ts = now.strftime("%Y-%m-%d_%H-%M")
    exc_name = f"{exc_ts}_{slug}.excalidraw"
    exc_path = JOURNEY_EXCALIDRAW_DIR / exc_name
    md_name = f"{now.strftime('%Y-%m-%d')}_{slug}.md"
    md_path = JOURNEY_MARKDOWN_DIR / md_name
    exc_rel = f"journeys/{exc_name}"

    try:
        write_journey_excalidraw(journey, exc_path)
        write_markdown(text, journey, exc_rel, args.style, md_path)
    except (OSError, ValueError, UnicodeError) as exc:
        print(str(exc), file=sys.stderr)
        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
