#!/usr/bin/env python3
"""Emit eye_draw_this.svg — four-fold mandala (8 radials, nested petals, white hub + triangle)."""
from __future__ import annotations

import math
import sys
from pathlib import Path

STROKE = "#941952"
BG = "#000000"
WHITE = "#ffffff"
W = 1000.0
CX = W / 2.0
CY = W / 2.0


def line(x1: float, y1: float, x2: float, y2: float, sw: float) -> str:
    return (
        f'<path d="M{x1:.3f},{y1:.3f}L{x2:.3f},{y2:.3f}" '
        f'style="fill:none;stroke:{STROKE};stroke-width:{sw}px;stroke-linecap:round"/>'
    )


def circle(cx: float, cy: float, r: float, sw: float) -> str:
    return (
        f'<circle cx="{cx:.3f}" cy="{cy:.3f}" r="{r:.3f}" '
        f'style="fill:none;stroke:{STROKE};stroke-width:{sw}px"/>'
    )


def transform_group(deg: float, inner: str) -> str:
    return f'<g transform="rotate({deg:.3f} {CX:.3f} {CY:.3f})">{inner}</g>'


def cardinal_petal(scale: float, sw: float) -> str:
    """One petal pointing north; stroke-only, symmetric quadratic beziers."""
    s = scale
    tip_x, tip_y = CX, CY - 382 * s
    lm_x, lm_y = CX - 168 * s, CY - 125 * s
    rm_x, rm_y = CX + 168 * s, CY - 125 * s
    bl_x, bl_y = CX - 72 * s, CY - 48 * s
    br_x, br_y = CX + 72 * s, CY - 48 * s
    d = (
        f"M{tip_x:.3f},{tip_y:.3f}"
        f"Q{lm_x:.3f},{lm_y:.3f} {bl_x:.3f},{bl_y:.3f}"
        f"L{br_x:.3f},{br_y:.3f}"
        f"Q{rm_x:.3f},{rm_y:.3f} {tip_x:.3f},{tip_y:.3f}Z"
    )
    return f'<path d="{d}" style="fill:none;stroke:{STROKE};stroke-width:{sw}px"/>'


def main() -> None:
    out = (
        Path(sys.argv[1])
        if len(sys.argv) > 1
        else Path(__file__).resolve().parents[1] / "public" / "eye_draw_this.svg"
    )

    sw_fine = 0.85
    sw_main = 1.15
    r_outer = 478.0
    r_outer2 = 492.0

    parts: list[str] = []
    parts.append(f'<rect width="{int(W)}" height="{int(W)}" style="fill:{BG}"/>')
    parts.append(circle(CX, CY, r_outer2, sw_fine * 0.7))
    parts.append(circle(CX, CY, r_outer, sw_main))

    for r in (420, 360, 300, 245, 195, 150, 115, 85):
        parts.append(circle(CX, CY, float(r), sw_fine))

    # Eight radials (every 45°)
    for k in range(8):
        ang = math.radians(45 * k)
        x2 = CX + r_outer * math.cos(ang)
        y2 = CY + r_outer * math.sin(ang)
        parts.append(line(CX, CY, x2, y2, sw_fine * 0.75))

    # Nested cardinal petals
    scales = (1.02, 0.96, 0.90, 0.84, 0.78)
    sws = (sw_fine, sw_fine, sw_fine, sw_fine, sw_main)
    for sc, swp in zip(scales, sws):
        petal = cardinal_petal(sc, swp)
        for rot in (0, 90, 180, 270):
            parts.append(transform_group(float(rot), petal))

    # Accent rings on diagonals (small circles)
    for k in range(8):
        ang = math.radians(22.5 + 45 * k)
        rad = 268.0
        sx = CX + rad * math.cos(ang)
        sy = CY + rad * math.sin(ang)
        parts.append(circle(sx, sy, 13.0, sw_fine * 0.6))
        parts.append(circle(sx, sy, 8.5, sw_fine * 0.45))

    # White hub + inverted triangle + inner horizontal
    hub_r = 38.0
    parts.append(
        f'<circle cx="{CX:.3f}" cy="{CY:.3f}" r="{hub_r:.3f}" fill="{WHITE}" stroke="none"/>'
    )
    tri_h = 34.0
    tri_w = 36.0
    apex_x, apex_y = CX, CY + tri_h * 0.48
    bx0, by0 = CX - tri_w * 0.5, CY - tri_h * 0.38
    bx1, by1 = CX + tri_w * 0.5, CY - tri_h * 0.38
    parts.append(
        f'<path d="M{apex_x:.3f},{apex_y:.3f}L{bx0:.3f},{by0:.3f}L{bx1:.3f},{by1:.3f}Z" '
        f'style="fill:none;stroke:{STROKE};stroke-width:1.6px;stroke-linejoin:miter"/>'
    )
    ix0, iy0 = CX - tri_w * 0.35, CY - tri_h * 0.22
    ix1, iy1 = CX + tri_w * 0.35, CY - tri_h * 0.22
    parts.append(line(ix0, iy0, ix1, iy1, 1.2))

    svg = (
        '<?xml version="1.0" encoding="UTF-8"?>'
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{int(W)}" height="{int(W)}" '
        f'viewBox="0 0 {int(W)} {int(W)}" style="fill-rule:evenodd;stroke-miterlimit:10">'
        f'<g id="eye-draw-this">\n' + "\n".join(parts) + "\n</g></svg>"
    )

    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(svg, encoding="utf-8")
    print(out)


if __name__ == "__main__":
    main()
