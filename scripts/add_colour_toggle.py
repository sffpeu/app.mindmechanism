#!/usr/bin/env python3
"""
Adds COLOUR / MONO toggle to all 9 individual clock pages (app/0 through app/8).

Changes per page:
  1. Add `colourMode` state after `showCeremony` state line
  2. Update Image src to be conditional (colour SVG vs mono imageUrl)
  3. Update Image className to be conditional (strip dark:invert etc. in colour mode)
  4. Add ColourToggle button fixed bottom-4 left-4 z-[999]
"""

import re
from pathlib import Path

BASE = Path('/Users/seanfortune/Documents/1M3v.1.0/app-mindmechanism')

# Pages 0–5 use clock0.imageUrl … clock5.imageUrl
# Pages 6–8 use currentClockSettings.imageUrl
# We normalise by building the src expression per page.

def colour_svg(index: int) -> str:
    return f'/clock_{index + 1}_colour.svg'

def process_page(index: int):
    path = BASE / f'app/{index}/page.tsx'
    content = path.read_text()

    # ── 1. Determine the imageUrl variable name used on this page ──────────
    if index <= 5:
        var_name = f'clock{index}.imageUrl'
    else:
        var_name = 'currentClockSettings.imageUrl'

    # ── 2. Add colourMode state after showCeremony state ─────────────────
    old_state = "  const [showCeremony, setShowCeremony] = useState(false)"
    new_state = (
        "  const [showCeremony, setShowCeremony] = useState(false)\n"
        "  const [colourMode, setColourMode] = useState<'colour' | 'mono'>('mono')"
    )
    if "colourMode" in content:
        print(f"  [skip state] page {index} already has colourMode")
    elif old_state not in content:
        print(f"  [WARN] page {index}: showCeremony state line not found verbatim")
    else:
        content = content.replace(old_state, new_state, 1)
        print(f"  [ok] page {index}: colourMode state added")

    # ── 3. Replace Image src + className block ────────────────────────────
    old_image = (
        f'                    src={{{var_name}}}\n'
        f'                    alt="Clock Face {index}"\n'
        f'                    layout="fill"\n'
        f'                    objectFit="cover"\n'
        f'                    className="rounded-full dark:invert [&_*]:fill-current [&_*]:stroke-none [&_*]:stroke-[0.5]"'
    )
    # Pages 6-8 use a template literal for alt
    old_image_template = (
        f'                    src={{{var_name}}}\n'
        f'                    alt={{`Clock Face ${{CLOCK_INDEX + 1}}`}}\n'
        f'                    layout="fill"\n'
        f'                    objectFit="cover"\n'
        f'                    className="rounded-full dark:invert [&_*]:fill-current [&_*]:stroke-none [&_*]:stroke-[0.5]"'
    )
    alt_str = f'"Clock Face {index}"' if index <= 5 else "{`Clock Face ${CLOCK_INDEX + 1}`}"
    new_image = (
        f'                    src={{colourMode === \'colour\' ? \'/clock_{index + 1}_colour.svg\' : {var_name}}}\n'
        f'                    alt={alt_str}\n'
        f'                    layout="fill"\n'
        f'                    objectFit="cover"\n'
        f'                    className={{colourMode === \'colour\' ? "rounded-full" : "rounded-full dark:invert [&_*]:fill-current [&_*]:stroke-none [&_*]:stroke-[0.5]"}}\n'
        f'                    style={{{{colourMode === \'colour\' ? {{ mixBlendMode: \'screen\' }} : {{}}}}}}'
    )

    if f'colourMode === \'colour\'' in content:
        print(f"  [skip image] page {index}: image already updated")
    elif old_image in content:
        content = content.replace(old_image, new_image, 1)
        print(f"  [ok] page {index}: image block updated (direct alt)")
    elif old_image_template in content:
        content = content.replace(old_image_template, new_image, 1)
        print(f"  [ok] page {index}: image block updated (template alt)")
    else:
        print(f"  [WARN] page {index}: image block not found verbatim — check manually")

    # ── 4. Add ColourToggle button before closing </ProtectedRoute> ───────
    # Insert just before the final </ProtectedRoute> tag
    toggle_already = 'setColourMode(' in content or 'ColourToggle' in content
    if toggle_already:
        print(f"  [skip toggle] page {index}: toggle already present")
    else:
        # Find the MandalaCeremony block closing area, then the closing </div> chain
        # We'll insert the toggle button INSIDE the outermost page wrapper,
        # just before </ProtectedRoute>
        toggle_jsx = (
            '\n      {/* COLOUR / MONO toggle */}\n'
            '      <button\n'
            '        onClick={() => setColourMode(m => m === \'colour\' ? \'mono\' : \'colour\')}\n'
            '        className="fixed bottom-4 left-4 z-[999] flex items-center gap-0 rounded-full border border-white/20 bg-black/60 backdrop-blur-sm text-[10px] font-medium tracking-widest text-white/70 overflow-hidden select-none"\n'
            '        aria-label="Toggle colour mode"\n'
            '      >\n'
            '        <span className={`px-3 py-1.5 transition-colors ${\n'
            "          colourMode === 'colour' ? 'bg-white/20 text-white' : 'text-white/40'\n"
            '        }`}>COLOUR</span>\n'
            '        <span className={`px-3 py-1.5 transition-colors ${\n'
            "          colourMode === 'mono' ? 'bg-white/20 text-white' : 'text-white/40'\n"
            '        }`}>MONO</span>\n'
            '      </button>\n'
        )
        # Insert before </ProtectedRoute>
        if '</ProtectedRoute>' in content:
            content = content.replace('</ProtectedRoute>', toggle_jsx + '    </ProtectedRoute>', 1)
            print(f"  [ok] page {index}: toggle button inserted")
        else:
            print(f"  [WARN] page {index}: </ProtectedRoute> not found")

    path.write_text(content)
    print(f"  [saved] page {index}")

if __name__ == '__main__':
    for i in range(9):
        print(f"\nProcessing page {i}…")
        process_page(i)
    print("\nDone.")
