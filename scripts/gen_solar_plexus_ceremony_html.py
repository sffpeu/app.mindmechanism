#!/usr/bin/env python3
"""Generate solar_plexus_ceremony.html from public/3.svg (vector solar plexus wheel).

Hub lines are clipped at the inner disc using an SVG mask so strokes do not meet at
the centre; the triangle outline is drawn above the hub fill.
"""
from __future__ import annotations

import copy
import re
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

SVG_NS = "http://www.w3.org/2000/svg"
CEREMONY = "#f7da5f"
BG = "#0d0d0d"
# Inner ellipse centre (cx=-141.732, cy=0) under matrix(0,-1,-1,0,764.41,621.983), then scale 4.16667.
HUB_CX = 764.41 * 4.16667
HUB_CY = (141.732 + 621.983) * 4.16667
HUB_R = 141.732 * 4.16667 + 2.0  # slight pad for 1px strokes


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


def strip_ns_prefix(tag: str) -> str:
    return tag.split("}")[-1] if "}" in tag else tag


def strip_legacy_layer_ids(elem: ET.Element) -> None:
    for node in elem.iter():
        i = node.attrib.get("id")
        if i and (i.startswith("Layer") or i.startswith("layer")):
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


def build_hub_mask(w: float, h: float) -> ET.Element:
    defs_el = ET.Element(q("defs"))
    mask_el = ET.SubElement(defs_el, q("mask"))
    mask_el.set("id", "hub-mask")
    mask_el.set("maskUnits", "userSpaceOnUse")
    mask_el.set("maskContentUnits", "userSpaceOnUse")
    mask_el.set("x", "0")
    mask_el.set("y", "0")
    mask_el.set("width", str(int(w)))
    mask_el.set("height", str(int(h)))
    rect_el = ET.SubElement(mask_el, q("rect"))
    rect_el.set("width", str(int(w)))
    rect_el.set("height", str(int(h)))
    rect_el.set("fill", "white")
    hole = ET.SubElement(mask_el, q("circle"))
    hole.set("cx", f"{HUB_CX:.3f}")
    hole.set("cy", f"{HUB_CY:.3f}")
    hole.set("r", f"{HUB_R:.3f}")
    hole.set("fill", "black")
    return defs_el


def tag_hub_ids(inner_disc: ET.Element, inner_ring: ET.Element, triangle: ET.Element) -> None:
    p = first_drawable(inner_disc)
    if p is not None:
        p.set("id", "mask-circle")
    e = first_drawable(inner_ring)
    if e is not None:
        e.set("id", "center-ring")
    for node in triangle.iter():
        if strip_ns_prefix(node.tag) != "path":
            continue
        d = node.attrib.get("d", "")
        if d.startswith("M0,121.183"):
            node.set("id", "inner-triangle")
            break


def main() -> None:
    repo = Path(__file__).resolve().parents[1]
    svg_path = repo / "public" / "3.svg"
    out_arg = Path(sys.argv[1]) if len(sys.argv) > 1 else repo / "solar_plexus_ceremony.html"

    tree = ET.parse(svg_path)
    root = tree.getroot()
    vb = root.attrib.get("viewBox", "0 0 6378 6378").split()
    w, h = float(vb[2]), float(vb[3])
    cx, cy = int(round(w / 2)), int(round(h / 2))

    children = list(root)
    layer5 = children[1]
    layer2 = children[2]
    layer3 = children[3]
    layer4wrap = children[4]
    layer6 = children[5]
    l2_ch = list(layer2)
    l6_ch = list(layer6)
    if len(l2_ch) < 3 or len(l6_ch) < 2:
        raise SystemExit("Unexpected Layer-2 / Layer-6 structure in 3.svg")

    hub_masked = ET.Element(q("g"))
    hub_masked.set("mask", "url(#hub-mask)")

    l5c = copy.deepcopy(layer5)
    walk_restyle(l5c)
    for g in l5c:
        add_class_on_first_drawable(g, "spoke")
    hub_masked.append(l5c)

    for c in l2_ch[:-2]:
        node = copy.deepcopy(c)
        walk_restyle(node)
        hub_masked.append(node)

    for c in l6_ch[:-1]:
        node = copy.deepcopy(c)
        walk_restyle(node)
        hub_masked.append(node)

    inner_disc = copy.deepcopy(l2_ch[-2])
    walk_restyle(inner_disc)
    inner_ring = copy.deepcopy(l2_ch[-1])
    walk_restyle(inner_ring)
    triangle_only = copy.deepcopy(l6_ch[-1])
    walk_restyle(triangle_only)

    petals = copy.deepcopy(layer3)
    walk_restyle(petals)
    offset_cluster = copy.deepcopy(layer4wrap)
    walk_restyle(offset_cluster)

    outer = ET.Element(q("g"))
    for c in children[6:]:
        node = copy.deepcopy(c)
        walk_restyle(node)
        outer.append(node)

    tag_hub_ids(inner_disc, inner_ring, triangle_only)

    g_disc = ET.Element(q("g"))
    g_disc.append(inner_disc)
    g_ring = ET.Element(q("g"))
    g_ring.append(inner_ring)
    g_petals = ET.Element(q("g"))
    g_petals.append(petals)
    g_off = ET.Element(q("g"))
    g_off.append(offset_cluster)
    g_tri = ET.Element(q("g"))
    g_tri.append(triangle_only)

    pieces: list[tuple[str, ET.Element, str]] = [
        ("g-hub-masked", hub_masked, "masked hub: Layer-5 + Layer-2 (except disc) + Layer-6 (except triangle)"),
        ("g-inner-disc", g_disc, "inner disc fill (#mask-circle)"),
        ("g-inner-ring", g_ring, "inner circle stroke (#center-ring)"),
        ("g-petals", g_petals, "Layer-3 lotus petals"),
        ("g-offset-cluster", g_off, "Layer-4 offset decorative cluster"),
        ("g-inner-triangle", g_tri, "upright triangle outline (#inner-triangle)"),
        ("g-outer-layers", outer, "peripheral geometry (layers 8–13)"),
    ]

    for _, frag, _ in pieces:
        strip_legacy_layer_ids(frag)

    defs_el = build_hub_mask(w, h)

    svg_open = (
        '<svg class="mandala" xmlns="http://www.w3.org/2000/svg" '
        'xmlns:xlink="http://www.w3.org/1999/xlink" '
        f'viewBox="{root.attrib.get("viewBox", "0 0 6378 6378")}" '
        'xml:space="preserve" style="fill-rule:evenodd;clip-rule:evenodd;stroke-miterlimit:10;">'
    )

    body: list[str] = [
        svg_open,
        f'    <rect width="{int(w)}" height="{int(h)}" fill="{BG}"/>',
        "    " + serialize_fragment(defs_el).replace("\n", "\n    "),
    ]
    report_lines: list[str] = []
    for gid, frag, desc in pieces:
        xml = serialize_fragment(frag)
        n = count_drawables(frag)
        body.append(f'    <g id="{gid}">\n{xml}\n    </g>')
        report_lines.append(f"  {gid}: {n} drawables — {desc}")

    body.append("  </svg>")

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Solar plexus ceremony</title>
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
    #g-hub-masked, #g-inner-disc, #g-inner-ring, #g-petals, #g-offset-cluster, #g-inner-triangle, #g-outer-layers {{
      transform-box: view-box;
      transform-origin: {cx}px {cy}px;
    }}
    .spoke, #center-ring, #mask-circle, #inner-triangle {{
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
    print(f"Structure report — SVG centre (inner ring): ~({HUB_CX:.1f}, {HUB_CY:.1f}); ceremony colour: {CEREMONY}")
    for line in report_lines:
        print(line)


if __name__ == "__main__":
    main()
