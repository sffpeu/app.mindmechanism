#!/usr/bin/env python3
"""Generate throat_ceremony.html from public/4.svg (one-off ceremony scaffold)."""
from __future__ import annotations

import copy
import re
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

SVG_NS = "http://www.w3.org/2000/svg"
CEREMONY = "#156fde"
BG = "#0d0d0d"
CX, CY = 3189, 3189


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
    s = re.sub(r"stroke:\s*#fff(?:fff)?\b", f"stroke:{CEREMONY}", s, flags=re.I)
    s = re.sub(r"stroke:\s*white\b", f"stroke:{CEREMONY}", s, flags=re.I)
    s = re.sub(r"fill:\s*white\b", f"fill:{BG}", s, flags=re.I)
    s = re.sub(r"fill:\s*#fff\b", f"fill:{BG}", s, flags=re.I)
    s = re.sub(r"fill:\s*#ffffff\b", f"fill:{BG}", s, flags=re.I)
    return s


def walk_restyle(el: ET.Element) -> None:
    st = el.attrib.get("style")
    if st is not None:
        el.set("style", fix_style(st))
    for c in el:
        walk_restyle(c)


def first_drawable(el: ET.Element) -> ET.Element | None:
    for node in el.iter():
        if node is el:
            continue
        tag = node.tag.split("}")[-1]
        if tag in ("path", "circle", "ellipse"):
            return node
    return None


def add_class_on_first_drawable(wrapper: ET.Element, cls: str) -> None:
    node = first_drawable(wrapper)
    if node is None:
        return
    prev = node.attrib.get("class", "").strip()
    node.set("class", f"{prev} {cls}".strip() if prev else cls)


def strip_ns_prefix(tag: str) -> str:
    return tag.split("}")[-1] if "}" in tag else tag


def strip_legacy_layer_ids(elem: ET.Element) -> None:
    """Remove Serif export ids from nested groups (invalid duplicate ids in HTML)."""
    for node in elem.iter():
        i = node.attrib.get("id")
        if i and (i.startswith("Layer") or i.startswith("layer")):
            del node.attrib["id"]


def count_drawables(blob: str) -> int:
    return len(re.findall(r"<(?:path|circle|ellipse)\b", blob))


def serialize_fragment(elem: ET.Element) -> str:
    ET.register_namespace("", SVG_NS)
    ET.register_namespace("xlink", "http://www.w3.org/1999/xlink")
    ET.register_namespace("serif", "http://www.serif.com/")
    xml = ET.tostring(elem, encoding="unicode", default_namespace=None)
    return xml


def build_outer(root: ET.Element) -> ET.Element:
    g = ET.Element(q("g"))
    # stray ellipse wrapper (child 1)
    ch1 = root[1]
    g.append(copy.deepcopy(ch1))
    walk_restyle(g[-1])
    # Layer-2 inside scaled wrapper (child 9)
    ch9 = root[9]
    g.append(copy.deepcopy(ch9))
    walk_restyle(g[-1])
    return g


def wrap_layer_children(
    layer: ET.Element, start: int, stop: int, add_ring: bool, add_spoke: bool
) -> ET.Element:
    wrap = ET.Element(q("g"))
    if "transform" in layer.attrib:
        wrap.set("transform", layer.attrib["transform"])
    kids = list(layer)[start:stop]
    for i, c in enumerate(kids):
        node = copy.deepcopy(c)
        walk_restyle(node)
        if add_ring:
            add_class_on_first_drawable(node, "ring")
        if add_spoke:
            add_class_on_first_drawable(node, "spoke")
        wrap.append(node)
    return wrap


def patch_center(layer6: ET.Element) -> None:
    kids = list(layer6)
    for i, w in enumerate(kids):
        node = first_drawable(w)
        if node is None:
            continue
        tag = strip_ns_prefix(node.tag)
        if i == 0 and tag == "path":
            node.set("id", "mask-circle")
        elif i == 1 and tag == "circle":
            node.set("id", "center-ring")
        elif i == 2 and tag == "path":
            node.set("id", "inner-star")
        elif i == 3 and tag == "path":
            node.set("id", "hex-inner")


def add_perimeter_classes(layer8: ET.Element) -> None:
    for w in layer8:
        node = first_drawable(w)
        if node is not None and strip_ns_prefix(node.tag) == "circle":
            prev = node.attrib.get("class", "").strip()
            node.set("class", f"{prev} perimeter-circle".strip())


def main() -> None:
    repo = Path(__file__).resolve().parents[1]
    svg_path = repo / "public" / "4.svg"
    out_arg = Path(sys.argv[1]) if len(sys.argv) > 1 else repo / "throat_ceremony.html"

    tree = ET.parse(svg_path)
    root = tree.getroot()
    by_id = {c.attrib.get("id"): c for c in root if c.attrib.get("id")}

    L4 = by_id["Layer-4"]
    L10 = by_id["Layer-10"]
    L5 = by_id["Layer-5"]
    L7 = by_id["Layer-7"]
    L8 = by_id["Layer-8"]
    L6 = by_id["Layer-6"]

    rings_wrap = wrap_layer_children(L4, 0, 8, add_ring=True, add_spoke=False)
    spokes_l4 = wrap_layer_children(L4, 8, 20, add_ring=False, add_spoke=True)

    l10 = copy.deepcopy(L10)
    walk_restyle(l10)
    del l10.attrib["id"]
    for w in list(l10):
        add_class_on_first_drawable(w, "spoke")

    l5 = copy.deepcopy(L5)
    walk_restyle(l5)
    del l5.attrib["id"]
    for w in list(l5):
        add_class_on_first_drawable(w, "petal")

    l7 = copy.deepcopy(L7)
    walk_restyle(l7)
    del l7.attrib["id"]
    for w in list(l7):
        add_class_on_first_drawable(w, "spoke")

    l8 = copy.deepcopy(L8)
    walk_restyle(l8)
    del l8.attrib["id"]
    add_perimeter_classes(l8)

    l6 = copy.deepcopy(L6)
    walk_restyle(l6)
    del l6.attrib["id"]
    patch_center(l6)

    outer = build_outer(root)
    strip_legacy_layer_ids(outer)

    # Assemble named groups (bottom → top paint order)
    pieces: list[tuple[str, ET.Element, str]] = [
        ("g-outer", outer, "stray ellipse layer + outer yantra (Layer-2)"),
        ("g-rings", rings_wrap, "concentric rings under Layer-4 transform"),
        ("g-spokes", ET.Element(q("g")), "Layer-4 radial lines + Layer-10 grid"),
        ("g-arcs", l7, "curved radial arcs"),
        ("g-perimeter", l8, "outer perimeter circles"),
        ("g-petals", l5, "lotus petals"),
        ("g-center", l6, "mask, center ring, triangle, hexagram"),
    ]

    spokes_parent = pieces[2][1]
    spokes_parent.append(spokes_l4)
    spokes_parent.append(l10)
    strip_legacy_layer_ids(rings_wrap)
    strip_legacy_layer_ids(spokes_parent)
    strip_legacy_layer_ids(l5)
    strip_legacy_layer_ids(l7)
    strip_legacy_layer_ids(l8)
    strip_legacy_layer_ids(l6)

    svg_open = (
        '<svg class="mandala" xmlns="http://www.w3.org/2000/svg" '
        'xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 6378 6378" '
        'xml:space="preserve" style="fill-rule:evenodd;clip-rule:evenodd;stroke-miterlimit:10;">'
    )

    body_parts: list[str] = [svg_open, f'    <rect width="6378" height="6378" fill="{BG}"/>']

    report_groups: list[str] = []
    for gid, frag, desc in pieces:
        xml = serialize_fragment(frag)
        n = count_drawables(xml)
        body_parts.append(f'    <g id="{gid}">\n{xml}\n    </g>')
        report_groups.append(f"  {gid}: {n} paths — {desc}")

    body_parts.append("  </svg>")

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
    #g-outer, #g-rings, #g-spokes, #g-arcs, #g-perimeter, #g-petals, #g-center {{
      transform-box: view-box;
      transform-origin: {CX}px {CY}px;
    }}
    .perimeter-circle, .petal, #center-ring, #hex-inner, #star-outer, #inner-star {{
      transform-box: fill-box;
      transform-origin: center;
    }}
  </style>
</head>
<body>
{chr(10).join(body_parts)}
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

    # stdout structure hints for agent
    full_xml = "\n".join(serialize_fragment(p[1]) for p in pieces)
    ids = re.findall(r'\bid="([^"]+)"', full_xml)
    ids = [i for i in ids if not (i.startswith("Layer") or i.startswith("layer"))]
    classes: dict[str, int] = {}
    for m in re.finditer(r'class="([^"]+)"', full_xml):
        for c in m.group(1).split():
            classes[c] = classes.get(c, 0) + 1
    print("IDS", sorted(set(ids)))
    print("CLASSES", classes)
    for line in report_groups:
        print(line)


if __name__ == "__main__":
    main()
