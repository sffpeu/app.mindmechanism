#!/usr/bin/env python3
"""Generate root_ceremony.html from public/1.svg (Root wheel, route /0, clockSettings[0]).

Keeps the entire Layer-17 subtree intact (avoids misaligned node clusters). Applies an
SVG hub mask so strokes do not meet at the centre; the central triangle outline is
drawn above the masked content.

In the source artwork, filled shapes (often white) stacked above strokes are the
intended way to hide construction lines. The ceremony restyle maps those fills to the
page background (#0d0d0d). Where the vector has no such fills (e.g. 1.svg is all
fill:none today), the hub mask approximates the same effect for spokes.

Do not peel inner paths into a separate group: duplicates + mask interaction made
larger centre regions disappear. Keep one masked Layer-17 clone (minus triangle only)
and tune the hub hole size instead.

The overlay triangle must wrap with Layer-17’s root scale (4.16667); the branch only
has a translate — without the parent scale it draws ~¼ size off the hub (black disc, no triangles).

Default output: ~/Desktop/Closing Ceremony/root_ceremony.html (override with argv[1]).
"""
from __future__ import annotations

import copy
import re
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

from ceremony_paths import closing_ceremony_dir

SVG_NS = "http://www.w3.org/2000/svg"
CEREMONY = "#fd290a"
BG = "#0d0d0d"
# Hub at square centre (Layer-17 local → world via S). Black mask hole = transparent.
# Use a *small* radius only to clip crossing spokes; a large radius wipes the inner
# lotus / diamond (same colour as page → looks “missing”).
S = 4.16667
HUB_CX = 764.41 * S
HUB_CY = 765.716 * S
HUB_R_LOCAL = 46.0  # layer units; ~195px world — clears hub without eating the diamond
HUB_R = HUB_R_LOCAL * S + 4.0

TRIANGLE_D_PREFIX = "M0,70.433L40.664,0"


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
    # Author knockouts: solid fills (often white) stacked above strokes to hide construction.
    # Map to page fill so they still read as “holes” on dark ceremony backgrounds.
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
        if i and (i.startswith("Layer") or i.startswith("layer") or i in ("_1", "1")):
            del node.attrib["id"]


def count_drawables(elem: ET.Element) -> int:
    n = 0
    for node in elem.iter():
        if strip_ns_prefix(node.tag) in ("path", "circle", "ellipse", "rect"):
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


def find_triangle_branch(layer17: ET.Element) -> ET.Element | None:
    """Direct child <g> of Layer-17 that holds the central triangle path."""
    for ch in list(layer17):
        for node in ch.iter():
            if strip_ns_prefix(node.tag) != "path":
                continue
            d = node.attrib.get("d", "")
            if d.startswith(TRIANGLE_D_PREFIX):
                return ch
    return None


def tag_triangle_id(branch: ET.Element) -> None:
    for node in branch.iter():
        if strip_ns_prefix(node.tag) != "path":
            continue
        d = node.attrib.get("d", "")
        if d.startswith(TRIANGLE_D_PREFIX):
            node.set("id", "inner-triangle")
            return


def main() -> None:
    repo = Path(__file__).resolve().parents[1]
    svg_path = repo / "public" / "1.svg"
    out_arg = (
        Path(sys.argv[1])
        if len(sys.argv) > 1
        else closing_ceremony_dir() / "root_ceremony.html"
    )

    tree = ET.parse(svg_path)
    root = tree.getroot()
    vb = root.attrib.get("viewBox", "0 0 6378 6378").split()
    w, h = float(vb[2]), float(vb[3])
    cx, cy = int(round(w / 2)), int(round(h / 2))

    children = list(root)
    if not children:
        raise SystemExit("Empty SVG")
    layer17 = children[0]

    tri_src = find_triangle_branch(layer17)
    if tri_src is None:
        raise SystemExit("Could not find central triangle path in 1.svg")

    masked_body = copy.deepcopy(layer17)
    walk_restyle(masked_body)
    tri_branch = find_triangle_branch(masked_body)
    if tri_branch is None:
        raise SystemExit("Triangle missing in copy")
    masked_body.remove(tri_branch)

    tri_branch_inner = copy.deepcopy(tri_src)
    walk_restyle(tri_branch_inner)
    tag_triangle_id(tri_branch_inner)

    # The triangle <g> only has translate(764.77,731.6); Layer-17's scale(4.16667) must apply
    # or the path lands ~4× too small and away from the hub — reads as a black hole with no triangles.
    tri_scaled = ET.Element(q("g"))
    l17_tf = layer17.attrib.get("transform")
    if l17_tf:
        tri_scaled.set("transform", l17_tf)
    tri_scaled.append(tri_branch_inner)

    hub_masked = ET.Element(q("g"))
    hub_masked.set("mask", "url(#hub-mask)")
    hub_masked.append(masked_body)

    g_tri = tri_scaled

    pieces: list[tuple[str, ET.Element, str]] = [
        ("g-hub-masked", hub_masked, "full Layer-17 minus triangle, hub mask"),
        ("g-inner-triangle", g_tri, "triangle outline above hub (#inner-triangle)"),
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
  <title>Root ceremony</title>
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
    #g-hub-masked, #g-inner-triangle {{
      transform-box: view-box;
      transform-origin: {cx}px {cy}px;
    }}
    #inner-triangle {{
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
    print(
        f"Structure report — hub mask: centre (~{HUB_CX:.1f}, {HUB_CY:.1f}), "
        f"r≈{HUB_R:.1f} world (~{HUB_R_LOCAL:g} local); ceremony: {CEREMONY}"
    )
    for line in report_lines:
        print(line)


if __name__ == "__main__":
    main()
