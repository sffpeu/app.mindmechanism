"""Build journey-layer Excalidraw JSON on top of a copied base map."""

from __future__ import annotations

import copy
import json
import random
from pathlib import Path
from typing import Any

from constants import (
    JOURNEY_EXCALIDRAW_DIR,
    BASE_MAP_PATH,
    LINE_COLORS,
    ROUTE_COLOR,
    ROUTE_OPACITY,
    ROUTE_STROKE_WIDTH,
)
from mapper import JourneyStop, polyline_points


def _nonce() -> int:
    return random.randint(1, 2**31 - 1)


def _el_id() -> str:
    return f"journey_{random.randint(0, 16**8):08x}"


def _line_element(points_abs: list[tuple[int, int]]) -> dict[str, Any] | None:
    if len(points_abs) < 2:
        return None
    xs = [int(p[0]) for p in points_abs]
    ys = [int(p[1]) for p in points_abs]
    min_x, min_y = min(xs), min(ys)
    points = [[float(px - min_x), float(py - min_y)] for px, py in points_abs]
    width = max(max(xs) - min_x, 1.0)
    height = max(max(ys) - min_y, 1.0)
    return {
        "type": "line",
        "version": 1,
        "versionNonce": _nonce(),
        "isDeleted": False,
        "id": _el_id(),
        "fillStyle": "solid",
        "strokeWidth": ROUTE_STROKE_WIDTH,
        "strokeStyle": "solid",
        "roughness": 1,
        "opacity": ROUTE_OPACITY,
        "angle": 0,
        "x": float(min_x),
        "y": float(min_y),
        "strokeColor": ROUTE_COLOR,
        "backgroundColor": "transparent",
        "width": width,
        "height": height,
        "seed": _nonce(),
        "groupIds": ["grammar-journey-route"],
        "frameId": None,
        "roundness": None,
        "boundElements": None,
        "updated": 1,
        "link": None,
        "locked": False,
        "startBinding": None,
        "endBinding": None,
        "lastCommittedPoint": None,
        "startArrowhead": None,
        "endArrowhead": None,
        "points": points,
    }


def _rounded_rect(x: float, y: float, w: float, h: float, bg: str, gid: str) -> dict[str, Any]:
    eid = _el_id()
    return {
        "type": "rectangle",
        "version": 1,
        "versionNonce": _nonce(),
        "isDeleted": False,
        "id": eid,
        "fillStyle": "solid",
        "strokeWidth": 1,
        "strokeStyle": "solid",
        "roughness": 1,
        "opacity": 100,
        "angle": 0,
        "x": x,
        "y": y,
        "strokeColor": "#1e1e1e",
        "backgroundColor": bg,
        "width": w,
        "height": h,
        "seed": _nonce(),
        "groupIds": [gid],
        "frameId": None,
        "roundness": {"type": 3},
        "boundElements": None,
        "updated": 1,
        "link": None,
        "locked": False,
    }


def _text_element(
    x: float,
    y: float,
    w: float,
    h: float,
    text: str,
    font_size: int,
    gid: str,
    color: str = "#1e1e1e",
) -> dict[str, Any]:
    tid = _el_id()
    return {
        "type": "text",
        "version": 1,
        "versionNonce": _nonce(),
        "isDeleted": False,
        "id": tid,
        "fillStyle": "solid",
        "strokeWidth": 1,
        "strokeStyle": "solid",
        "roughness": 1,
        "opacity": 100,
        "angle": 0,
        "x": x,
        "y": y,
        "strokeColor": color,
        "backgroundColor": "transparent",
        "width": w,
        "height": h,
        "seed": _nonce(),
        "groupIds": [gid],
        "frameId": None,
        "roundness": None,
        "boundElements": None,
        "updated": 1,
        "link": None,
        "locked": False,
        "fontSize": font_size,
        "fontFamily": 1,
        "text": text,
        "textAlign": "center",
        "verticalAlign": "middle",
        "containerId": None,
        "originalText": text,
        "lineHeight": 1.25,
    }


def _append_journey_layer(elements: list[Any], journey: list[JourneyStop]) -> None:
    pts = polyline_points(journey)
    line_el = _line_element(pts)
    if line_el:
        elements.append(line_el)

    for idx, stop in enumerate(journey, start=1):
        if not stop.coords:
            continue
        cx, cy = stop.coords[0]
        pin_x = float(cx + 38)
        pin_y = float(cy - 18)
        gid = f"grammar-journey-pin-{idx}"
        label = stop.token.replace("\n", " ")
        fs = 14
        tw = max(len(label) * fs * 0.55, 36.0)
        th = 26.0
        bg = LINE_COLORS.get(stop.line, "#868e96")
        rect = _rounded_rect(pin_x, pin_y, tw, th, bg, gid)
        elements.append(rect)
        tx = "#ffffff" if stop.line in ("V", "D", "N") else "#1e1e1e"
        elements.append(
            _text_element(
                pin_x + 4,
                pin_y + 2,
                tw - 8,
                th - 4,
                label,
                fs,
                gid,
                color=tx,
            )
        )
        num_gid = f"grammar-journey-num-{idx}"
        elements.append(
            _text_element(
                pin_x - 22,
                pin_y + 4,
                18,
                18,
                str(idx),
                12,
                num_gid,
                color="#868e96",
            )
        )


def write_journey_excalidraw(journey: list[JourneyStop], dest_path: Path) -> None:
    raw = json.loads(BASE_MAP_PATH.read_text(encoding="utf-8"))
    data = copy.deepcopy(raw)
    if not isinstance(data, dict) or "elements" not in data:
        raise ValueError("Base Excalidraw file is missing an 'elements' array.")
    elements = data["elements"]
    if not isinstance(elements, list):
        raise ValueError("Base Excalidraw 'elements' must be a list.")
    _append_journey_layer(elements, journey)
    dest_path.parent.mkdir(parents=True, exist_ok=True)
    dest_path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
