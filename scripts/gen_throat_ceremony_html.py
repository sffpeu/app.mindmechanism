#!/usr/bin/env python3
"""Generate throat_ceremony.html from public/clock_5.svg (Throat wheel on route /4).

White (or rgb(255,255,255)) filled knockouts in the SVG stay knockouts on dark pages
via fix_style mapping fills to the page background.
"""
from __future__ import annotations

import copy
import re
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

SVG_NS = "http://www.w3.org/2000/svg"
CEREMONY = "#156fde"
BG = "#0d0d0d"


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
    s = re.sub(r"stroke:\s*#fff(?:fff)?\b", f"stroke:{CEREMONY}", s, flags=re.I)
    s = re.sub(r"stroke:\s*white\b", f"stroke:{CEREMONY}", s, flags=re.I)
    # Solid fills used in-source to cover unwanted strokes (often white) → page fill on dark theme.
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
        if i and (i.startswith("Layer") or i.startswith("layer") or i == "_5"):
            del node.attrib["id"]


def first_drawable(el: ET.Element) -> ET.Element | None:
    for node in el.iter():
        if node is el:
            continue
        tag = strip_ns_prefix(node.tag)
        if tag in ("path", "circle", "ellipse"):
            return node
    return None


def add_class_on_first_drawable(wrapper: ET.Element, cls: str) -> None:
    node = first_drawable(wrapper)
    if node is None:
        return
    prev = node.attrib.get("class", "").strip()
    node.set("class", f"{prev} {cls}".strip() if prev else cls)


def count_drawables(elem: ET.Element) -> int:
    n = 0
    for node in elem.iter():
        if strip_ns_prefix(node.tag) in ("path", "circle", "ellipse"):
            n += 1
    return n


def serialize_fragment(elem: ET.Element) -> str:
    ET.register_namespace("", SVG_NS)
    ET.register_namespace("xlink", "http://www.w3.org/1999/xlink")
    ET.register_namespace("serif", "http://www.serif.com/")
    return ET.tostring(elem, encoding="unicode")


def wrap_with_main_transform(
    main: ET.Element, start: int, stop: int, add_ring: bool, add_spoke: bool, add_petal: bool
) -> ET.Element:
    wrap = ET.Element(q("g"))
    if "transform" in main.attrib:
        wrap.set("transform", main.attrib["transform"])
    for c in list(main)[start:stop]:
        node = copy.deepcopy(c)
        walk_restyle(node)
        if add_ring:
            add_class_on_first_drawable(node, "ring")
        if add_spoke:
            add_class_on_first_drawable(node, "spoke")
        if add_petal:
            add_class_on_first_drawable(node, "petal")
        wrap.append(node)
    return wrap


def under_main_transform(main: ET.Element, inner: ET.Element) -> ET.Element:
    """Apply the Serif root _5 matrix so inner coords match other ceremony layers."""
    out = ET.Element(q("g"))
    if "transform" in main.attrib:
        out.set("transform", main.attrib["transform"])
    out.append(inner)
    return out


def split_glyph_iris(main: ET.Element) -> tuple[ET.Element, ET.Element, ET.Element]:
    """Group 89: first 16 children = perimeter glyphs; rest = inner iris; child 90 = stray.

    Returned groups carry only the inner T4 matrix; caller must wrap with under_main_transform.
    """
    g89 = list(main)[89]
    ch = list(g89)
    tr = g89.attrib.get("transform", "")

    per = ET.Element(q("g"))
    per.set("transform", tr)
    for c in ch[:16]:
        node = copy.deepcopy(c)
        walk_restyle(node)
        add_class_on_first_drawable(node, "perimeter-circle")
        per.append(node)

    iris = ET.Element(q("g"))
    iris.set("transform", tr)
    for c in ch[16:]:
        node = copy.deepcopy(c)
        walk_restyle(node)
        iris.append(node)

    stray_inner = ET.Element(q("g"))
    stray_inner.append(copy.deepcopy(list(main)[90]))
    walk_restyle(stray_inner[-1])
    return per, iris, stray_inner


def tag_flower_ids(elem: ET.Element) -> None:
    seen_mask = False
    seen_ring = False
    for node in elem.iter():
        if strip_ns_prefix(node.tag) != "path":
            continue
        d = node.attrib.get("d", "")
        st = node.attrib.get("style", "")
        if not seen_mask and "fill:#0d0d0d" in st and "M0,-31.603" in d:
            node.set("id", "mask-circle")
            seen_mask = True
        elif not seen_ring and "fill:none" in st and "M0,-31.603" in d and "ZM" in d:
            node.set("id", "center-ring")
            seen_ring = True
        if seen_mask and seen_ring:
            break


def tag_triangle_ids(elem: ET.Element) -> None:
    seen_w = False
    seen_s = False
    for node in elem.iter():
        if strip_ns_prefix(node.tag) != "path":
            continue
        d = node.attrib.get("d", "")
        st = node.attrib.get("style", "")
        if not seen_w and "fill:#0d0d0d" in st and "68.55" in d:
            node.set("id", "mask-triangle")
            seen_w = True
        elif not seen_s and "fill:none" in st and "68.55" in d:
            node.set("id", "inner-star")
            seen_s = True
        if seen_w and seen_s:
            break


def main() -> None:
    repo = Path(__file__).resolve().parents[1]
    svg_path = repo / "public" / "clock_5.svg"
    out_arg = Path(sys.argv[1]) if len(sys.argv) > 1 else repo / "throat_ceremony.html"

    tree = ET.parse(svg_path)
    root = tree.getroot()
    vb = root.attrib.get("viewBox", "0 0 3544 3544").split()
    w, h = float(vb[2]), float(vb[3])
    cx, cy = int(round(w / 2)), int(round(h / 2))

    main = list(root)[0]

    rings = wrap_with_main_transform(main, 0, 3, True, False, False)
    spokes = wrap_with_main_transform(main, 3, 19, False, True, False)
    web = wrap_with_main_transform(main, 19, 35, False, True, False)
    petals = wrap_with_main_transform(main, 35, 51, False, False, True)

    flower = ET.Element(q("g"))
    if "transform" in main.attrib:
        flower.set("transform", main.attrib["transform"])
    fol = ET.Element(q("g"))
    fol.set("id", "flower-of-life")
    for i in range(51, 87):
        node = copy.deepcopy(list(main)[i])
        walk_restyle(node)
        add_class_on_first_drawable(node, "ring")
        fol.append(node)
    flower.append(fol)
    tag_flower_ids(fol)

    center = wrap_with_main_transform(main, 87, 89, False, False, False)
    tag_triangle_ids(center)

    per_inner, iris_inner, stray_inner = split_glyph_iris(main)
    per_g = under_main_transform(main, per_inner)
    iris_g = under_main_transform(main, iris_inner)
    stray_g = under_main_transform(main, stray_inner)

    # Lotus first, then outer nodes on top of it; triangle and tail follow (see clock_5 indices 51–90).
    pieces: list[tuple[str, ET.Element, str]] = [
        ("g-rings", rings, "outer ellipse + two ring paths"),
        ("g-spokes", spokes, "16 primary radials"),
        ("g-web", web, "16 chord / web lines"),
        ("g-petals", petals, "16 lotus petal outlines"),
        ("g-flower", flower, "overlapping annuli / circles (#flower-of-life)"),
        ("g-perimeter", per_g, "16 outer glyph disks"),
        ("g-iris", iris_g, "nested iris / sunburst circles"),
        ("g-center", center, "triangle mask + outline"),
        ("g-stray", stray_g, "single small ellipse (export tail)"),
    ]

    for _, frag, _ in pieces:
        strip_legacy_layer_ids(frag)

    svg_open = (
        '<svg class="mandala" xmlns="http://www.w3.org/2000/svg" '
        'xmlns:xlink="http://www.w3.org/1999/xlink" '
        f'viewBox="{root.attrib.get("viewBox", "0 0 3544 3544")}" '
        'xml:space="preserve" style="fill-rule:evenodd;clip-rule:evenodd;stroke-miterlimit:10;">'
    )

    body: list[str] = [svg_open, f'    <rect width="{int(w)}" height="{int(h)}" fill="{BG}"/>']
    report_lines: list[str] = []
    for gid, frag, desc in pieces:
        xml = serialize_fragment(frag)
        n = count_drawables(frag)
        body.append(f'    <g id="{gid}">\n{xml}\n    </g>')
        report_lines.append(f"  {gid}: {n} paths — {desc}")

    body.append("  </svg>")

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Throat ceremony</title>
  <style>
    html, body {{
      margin: 0;
      height: 100%;
      background: #0d0d0d;
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
    #g-rings, #g-spokes, #g-web, #g-petals, #g-flower, #g-perimeter, #g-iris, #g-center, #g-stray {{
      transform-box: view-box;
      transform-origin: {cx}px {cy}px;
    }}
    .perimeter-circle, .petal, #center-ring, #mask-circle, #mask-triangle, #hex-inner, #star-outer, #inner-star {{
      transform-box: fill-box;
      transform-origin: center;
    }}
  </style>
</head>
<body>
{chr(10).join(body)}
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
    for line in report_lines:
        print(line)


if __name__ == "__main__":
    main()
