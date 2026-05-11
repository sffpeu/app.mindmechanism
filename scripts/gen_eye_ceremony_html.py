#!/usr/bin/env python3
"""Build eye_ceremony.html from public/clock_7_colour.svg.

Default write: ~/Desktop/Closing Ceremony/eye_ceremony.html — pass argv[1] for another path.

Strokes #552d8e and rgb(35,31,32) (etc.) → #941952. White fills in the source SVG → page
fill for knockouts. clock_7_colour.svg has no filled hub disc; we append a white disc and
downward triangle after restyle so the centre matches your reference (triangle in #941952).
"""
from __future__ import annotations

import copy
import re
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

from ceremony_paths import closing_ceremony_dir

SVG_NS = "http://www.w3.org/2000/svg"
CEREMONY = "#941952"
BG = "#000000"


def q(tag: str) -> str:
    return f"{{{SVG_NS}}}{tag}"


def fix_style(style: str | None) -> str | None:
    if not style:
        return style
    s = style
    s = re.sub(
        r"stroke:\s*rgb\s*\(\s*35\s*,\s*31\s*,\s*32\s*\)",
        f"stroke:{CEREMONY}",
        s,
        flags=re.I,
    )
    s = re.sub(r"stroke:\s*#3c6db5\b", f"stroke:{CEREMONY}", s, flags=re.I)
    s = re.sub(r"stroke:\s*#552d8e\b", f"stroke:{CEREMONY}", s, flags=re.I)
    s = re.sub(r"stroke:\s*#fff(?:fff)?\b", f"stroke:{CEREMONY}", s, flags=re.I)
    s = re.sub(r"stroke:\s*white\b", f"stroke:{CEREMONY}", s, flags=re.I)
    s = re.sub(r"fill:\s*white\b", f"fill:{BG}", s, flags=re.I)
    s = re.sub(r"fill:\s*#fff\b", f"fill:{BG}", s, flags=re.I)
    s = re.sub(r"fill:\s*#ffffff\b", f"fill:{BG}", s, flags=re.I)
    s = re.sub(
        r"fill:\s*rgb\s*\(\s*255\s*,\s*255\s*,\s*255\s*\)",
        f"fill:{BG}",
        s,
        flags=re.I,
    )
    return s


def walk_restyle(el: ET.Element) -> None:
    st = el.attrib.get("style")
    if st is not None:
        el.set("style", fix_style(st))
    for c in el:
        walk_restyle(c)


def strip_ns_prefix(tag: str) -> str:
    return tag.split("}")[-1] if "}" in tag else tag


def strip_legacy_layer_ids(elem: ET.Element) -> None:
    for node in elem.iter():
        i = node.attrib.get("id")
        if i and (
            i.startswith("Layer")
            or i.startswith("layer")
            or i == "spokes-16"
        ):
            del node.attrib["id"]


def count_drawables(elem: ET.Element) -> int:
    n = 0
    for node in elem.iter():
        if strip_ns_prefix(node.tag) in ("path", "circle", "ellipse", "rect"):
            n += 1
    return n


def hub_center_from_radials(eye_wrap: ET.Element, vb_w: float, vb_h: float) -> tuple[float, float]:
    for ch in eye_wrap:
        if strip_ns_prefix(ch.tag) != "path":
            continue
        d = ch.attrib.get("d", "")
        m = re.match(r"^M\s*([\d.]+)\s*,\s*([\d.]+)", d)
        if m:
            return float(m.group(1)), float(m.group(2))
    return vb_w / 2.0, vb_h / 2.0


def append_hub_disc_and_triangle(
    eye_wrap: ET.Element, hx: float, hy: float, hub_r: float = 118.0
) -> None:
    """Bright white hub disc over the crossing (after line art); downward triangle in ceremony stroke."""
    disc = ET.Element(q("circle"))
    disc.set("cx", f"{hx:.3f}")
    disc.set("cy", f"{hy:.3f}")
    disc.set("r", f"{hub_r:.1f}")
    disc.set("style", f"fill:#ffffff;stroke:none")
    eye_wrap.append(disc)

    tri_h = 52.0
    tri_w = 62.0
    apex_y = hy + tri_h * 0.55
    base_y = hy - tri_h * 0.42
    tri_d = (
        f"M{hx:.3f},{apex_y:.3f}"
        f"L{hx - tri_w * 0.5:.3f},{base_y:.3f}"
        f"L{hx + tri_w * 0.5:.3f},{base_y:.3f}Z"
    )
    tri = ET.Element(q("path"))
    tri.set("d", tri_d)
    tri.set(
        "style",
        f"fill:none;fill-rule:nonzero;stroke:{CEREMONY};stroke-width:5px;stroke-linejoin:miter",
    )
    eye_wrap.append(tri)


def serialize_fragment(elem: ET.Element) -> str:
    ET.register_namespace("", SVG_NS)
    ET.register_namespace("xlink", "http://www.w3.org/1999/xlink")
    ET.register_namespace("serif", "http://www.serif.com/")
    return ET.tostring(elem, encoding="unicode")


def main() -> None:
    repo = Path(__file__).resolve().parents[1]
    svg_path = repo / "public" / "clock_7_colour.svg"
    out_arg = (
        Path(sys.argv[1])
        if len(sys.argv) > 1
        else closing_ceremony_dir() / "eye_ceremony.html"
    )

    tree = ET.parse(svg_path)
    root = tree.getroot()
    vb = root.attrib.get("viewBox", "0 0 3297 3295").split()
    w, h = float(vb[2]), float(vb[3])

    ceremony = copy.deepcopy(root)
    original_children = list(ceremony)
    for c in original_children:
        ceremony.remove(c)

    rect_el = ET.Element(q("rect"))
    rect_el.set("width", str(int(w)))
    rect_el.set("height", str(int(h)))
    rect_el.set("fill", BG)
    ceremony.insert(0, rect_el)

    eye_wrap = ET.Element(q("g"))
    eye_wrap.set("id", "g-eye")
    for c in original_children:
        eye_wrap.append(c)
    ceremony.append(eye_wrap)

    walk_restyle(ceremony)
    strip_legacy_layer_ids(ceremony)

    hx, hy = hub_center_from_radials(eye_wrap, w, h)
    append_hub_disc_and_triangle(eye_wrap, hx, hy)

    cx, cy = int(round(hx)), int(round(hy))

    prev_cls = ceremony.attrib.get("class", "").strip()
    ceremony.set("class", f"{prev_cls} mandala".strip() if prev_cls else "mandala")

    svg_inner = serialize_fragment(ceremony)
    n_draw = count_drawables(eye_wrap)

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Eye ceremony</title>
  <style>
    html, body {{
      margin: 0;
      height: 100%;
      background: {BG};
    }}
    body {{
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100vw;
      height: 100vh;
      overflow: hidden;
    }}
    svg.mandala {{
      width: 100vh;
      height: 100vh;
      display: block;
    }}
    #g-eye {{
      transform-box: view-box;
      transform-origin: {cx}px {cy}px;
    }}
  </style>
</head>
<body>
{svg_inner}
  <script src="https://cdnjs.cloudflare.com/ajax/libs/animejs/3.2.1/anime.min.js"></script>
  <script>
  // ANIMATION PLACEHOLDER — Claude writes this block
  </script>
</body>
</html>
"""

    out_arg.parent.mkdir(parents=True, exist_ok=True)
    out_arg.write_text(html, encoding="utf-8")
    print(out_arg)
    print(f"  g-eye: {n_draw} drawables (paths/circles/ellipses/rects in mandala subtree)")


if __name__ == "__main__":
    main()
