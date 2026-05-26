"""CLI entry: parse text with spaCy, emit Excalidraw journey + Markdown note."""

from __future__ import annotations

import argparse
import sys
from datetime import datetime
from pathlib import Path

import spacy

from constants import BASE_MAP_PATH, get_journey_dirs, get_lang_config
from descriptions import get_note_for_lang
from excalidraw_gen import write_journey_excalidraw
from mapper import build_journey
from note_gen import slug_first_four_words, write_markdown

_nlp_cache: dict[str, spacy.language.Language] = {}


def _load_model(model_name: str) -> spacy.language.Language:
    if model_name not in _nlp_cache:
        try:
            _nlp_cache[model_name] = spacy.load(model_name)
        except OSError:
            print(
                f"spaCy model '{model_name}' not found. "
                f"Install it with: python -m spacy download {model_name}",
                file=sys.stderr,
            )
            raise
    return _nlp_cache[model_name]


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
        "--lang",
        dest="lang",
        default="en",
        choices=("en", "de", "fi", "fr", "es", "it"),
        help="Language for NLP model and station descriptions (default: en).",
    )
    parser.add_argument(
        "--style",
        choices=("narrative", "table"),
        default="narrative",
        help="Markdown body style (default: narrative).",
    )
    parser.add_argument(
        "--json",
        action="store_true",
        help="Print journey JSON to stdout instead of writing files.",
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

    # Base map is only needed when writing Excalidraw files, not for --json output.
    if not args.json and not BASE_MAP_PATH.is_file():
        print(f"Base map not found: {BASE_MAP_PATH}", file=sys.stderr)
        return 1

    lang_cfg = get_lang_config(args.lang)
    try:
        nlp = _load_model(lang_cfg["spacy_model"])
    except OSError:
        return 1

    doc = nlp(text)
    lang = args.lang
    journey = build_journey(
        doc,
        lambda pos, dep, st: get_note_for_lang(lang, pos, dep, st),
        stations=lang_cfg["stations"],
        lang=lang,
        station_remap=lang_cfg.get("station_remap"),
    )

    slug = slug_first_four_words(text)
    now = datetime.now()
    exc_ts = now.strftime("%Y-%m-%d_%H-%M")
    exc_name = f"{exc_ts}_{slug}.excalidraw"
    exc_dir, md_dir = get_journey_dirs(args.lang)
    exc_dir.mkdir(parents=True, exist_ok=True)
    md_dir.mkdir(parents=True, exist_ok=True)
    exc_path = exc_dir / exc_name
    md_name = f"{now.strftime('%Y-%m-%d')}_{slug}.md"
    md_path = md_dir / md_name
    lang_prefix = f"{args.lang}/" if args.lang != "en" else ""
    exc_rel = f"journeys/{lang_prefix}{exc_name}"

    if args.json:
        import json as _json
        payload = {
            "lang": args.lang,
            "stops": [
                {
                    "token": s.token,
                    "pos": s.pos,
                    "dep": s.dep,
                    "line": s.line,
                    "stations": s.stations,
                    "note": s.note,
                    "coords": [[c[0], c[1]] for c in s.coords],
                }
                for s in journey
            ]
        }
        print(_json.dumps(payload))
        return 0

    try:
        write_journey_excalidraw(journey, exc_path)
        write_markdown(text, journey, exc_rel, args.style, md_path)
    except (OSError, ValueError, UnicodeError) as exc:
        print(str(exc), file=sys.stderr)
        return 1

    print(f"[{args.lang.upper()}] Journey written: {md_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
