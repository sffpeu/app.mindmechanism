#!/usr/bin/env python3
"""
Patch all nine clock pages (app/0 – app/8):
  - Remove the fixed top-4 left-4 broadcast cluster div
  - Replace with createPortal into #dock-broadcast-slot in AppDock
"""

import re
import os

BASE = "/Users/seanfortune/Documents/1M3v.1.0/app-mindmechanism/app"

for i in range(9):
    path = os.path.join(BASE, str(i), "page.tsx")
    with open(path, "r") as f:
        content = f.read()

    # Pattern to match the fixed broadcast div (clockIndex differs per page)
    old = (
        f'        {{user?.uid && (\n'
        f'          <div className={{cn("fixed top-4 left-4 z-50 transition-opacity duration-700", isIdle && "opacity-0 pointer-events-none")}}>\n'
        f'            <SessionPresenceBroadcast\n'
        f'              uid={{user.uid}}\n'
        f'              clockIndex={{{i}}}\n'
        f'              clockHex={{clockHex}}\n'
        f'              durationMins={{duration != null ? Math.round(duration / 60) : null}}\n'
        f'            />\n'
        f'          </div>\n'
        f'        )}}'
    )

    new = (
        f'        {{user?.uid && mounted && createPortal(\n'
        f'          <SessionPresenceBroadcast\n'
        f'            uid={{user.uid}}\n'
        f'            clockIndex={{{i}}}\n'
        f'            clockHex={{clockHex}}\n'
        f'            durationMins={{duration != null ? Math.round(duration / 60) : null}}\n'
        f'          />,\n'
        f'          document.getElementById(\'dock-broadcast-slot\') ?? document.body\n'
        f'        )}}'
    )

    if old in content:
        content = content.replace(old, new)
        with open(path, "w") as f:
            f.write(content)
        print(f"✓ Patched app/{i}/page.tsx")
    else:
        print(f"✗ Pattern not found in app/{i}/page.tsx — manual check needed")

print("\nDone.")
