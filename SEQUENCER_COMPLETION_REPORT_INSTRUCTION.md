# Cursor Completion Report Instruction

When you have finished executing SEQUENCER_BUILD_BRIEF.md, output a completion report in the following format exactly. Do not summarise — be specific.

---

## MM Personal Sequencer — Build Completion Report

### Files Created
List every file created. For each:
- Full path relative to project root
- Status: COMPLETE / PARTIAL / SKIPPED
- If PARTIAL or SKIPPED: one sentence explaining why

### Files Modified
List every file modified. For each:
- Full path
- What was changed (one line)

### TypeScript Compilation
Run: `npx tsc --noEmit`
Report the result:
- PASS — no errors
- FAIL — paste all errors in full

### Hard Constraints Check
For each constraint in SEQUENCER_BUILD_BRIEF.md, confirm MET or state VIOLATED with the file and line where the violation occurs:

1. No arbitrary frequency input — 
2. No AI-generated sequences — 
3. No voice/microphone input — 
4. IPA is freeform text only — 
5. Grid is horizontal, time left-to-right — 
6. Step cells show node identity — 
7. Syllable distribution uses | delimiters — 
8. Drone samples are short bursts not loops — 
9. requestAnimationFrame for timing not setInterval — 
10. Existing tone hooks not modified — 

### Deviations from Brief
List anything you built differently from the specification, and why.
If none: state "None."

### Outstanding Items
List anything you were unable to complete or that requires human decision.
If none: state "None."

---

Output this report as your final message when the build is complete.
