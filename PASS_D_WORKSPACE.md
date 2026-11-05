# Pass D — Single-screen layout and mathematical working

## Goal

Replace free-text working with **editable, line-by-line mathematical notation** and a **drawing pad**, while aiming to keep each main desktop screen within the viewport.

## What has been implemented

### Mathematical working

- Each selectable **unknown side**, including the target, has its own working space.
- The maths mode uses [MathLive](https://mathlive.io/mathlive/guides/getting-started/) `<math-field>` inputs, pinned to version `0.111.4` on jsDelivr.
- Lines are independently editable; students can add a line using **Enter**, `+ Add line`, or the row `+` button.
- Each line has a delete control. Deleting the final remaining line clears it rather than leaving an unusable empty editor.
- A quick-symbol strip includes squares, roots, fractions, equals, multiplication and brackets.
- MathLive supplies a virtual mathematics keyboard on supported mobile devices, and properly typeset roots, fractions, powers and equations.
- If the external MathLive library is unavailable, **the fallback is a keyboard-editable LaTeX field**, rather than an unusable custom element. The mathematics is typeset when the library becomes available on a future visit.
- The limit is 16 maths lines per side to keep the editing experience responsive.

### Freehand sketching

- Separate **Draw** tab with a canvas for finger, stylus, trackpad or mouse.
- Pen, stroke eraser, undo and clear controls.
- Eraser removes the touched pen stroke; it does **not** erase individual pixels.
- Drawing strokes are stored as normalized coordinates, not flattened screenshots, so they remain editable and scale with the canvas.
- Per-side drawings are saved locally and restored on revisit.
- Pointer capture and `touch-action:none` support pen and touch drawing without accidental page scrolling.
- Storage safeguards: at most 120 strokes, at most 420 points per stroke, compact precision to four decimals, and auto-save.

### Persistence and interaction

- Maths lines and ink are saved separately for each side and challenge in the student's browser.
- Students can switch between modes, switch sides, refresh, and return without losing their working.
- The main answer-checking form and progressively revealing hints remain intact.
- Clearing a puzzle's progress also clears its maths lines and drawings.
- Existing **free-text notes** are migrated into editable maths lines on the first visit after the update. This is a best-effort migration; prose or unconventional symbols may need tidying in MathLive.
- The website does **not** attempt automatic grading of the lines or sketch. It continues to check the selected side's numerical/exact answer only.

### One-screen desktop layout

- A redesigned homepage shows the introduction and **all six challenge cards together**, with each card showing the actual miniature geometric arrangement.
- The desktop puzzle page contains a compact title row, large SVG diagram, answer/working panel and all main controls without requiring page-level scrolling.
- The right-hand working panel can scroll internally when a student writes many lines, while the triangle pile stays visible.
- The screen targets normal desktop/laptop widths and heights, including approximately 1366×768 and 1440×900.
- On narrow tablets or phones the diagram and working area stack and the page scrolls naturally, rather than making the mathematics too small to read.
- The Ancient Greek palette, fonts and tablet identity are preserved.

## Files

- `working-space.js`: maths line model, ink vector data and interactive controls.
- `pass-d.css`: dashboard and responsive single-screen layout, maths/ink UI.
- `app.js`: working integration, save/load/migration, compact homepage.
- `index.html`: pinned MathLive script and stylesheet.
- `tests/working-space.test.mjs`: mathematical line and vector ink unit tests.
- `tests/working-ui.test.mjs`: mode switching and drawing pointer-event interaction test.
- `tests/ui-smoke.test.mjs`: existing 6-puzzle × 4-width SVG tests, plus compact homepage checks.

## QA / review

1. Open the homepage on a desktop screen around **1366×768**. The intro and all six challenge cards should be simultaneously accessible, without scrolling.
2. Open any pile. The diagram and the side work panel should remain visible as the student selects sides.
3. Select a missing side. Type `c^2=5^2+12^2` into the first maths line, add a line, then enter `c=\sqrt{169}`; confirm properly rendered powers and roots.
4. Test maths shortcuts, adding and deleting lines, and creating a new line with Enter.
5. Switch to Draw, write a few characters using mouse, stylus or touch; test the eraser, Undo, and Clear.
6. Switch to Maths lines and confirm the equations remain; return to Draw and confirm the ink remains.
7. Navigate to another unknown side and then back. Confirm both modes have retained their working for the original side.
8. Refresh the page, reopen the same side and verify local persistence.
9. Submit a correct answer. The labelled side and completion overlay should work as before.
10. Use progressive hints, view full worked solutions, and test perimeter/area extensions on the relevant puzzles.
11. Try keyboard-only navigation and the mobile virtual maths keyboard.
12. Test at 1440×900, 1366×768, and narrow/mobile widths; at small widths vertical scrolling is intentional.
13. If MathLive is blocked, verify the LaTeX fallback still accepts and saves working.

## Limitations / suggestions for a follow-up

- No shared accounts or cross-device work synchronization.
- No export of a student's handwritten or typed working yet.
- No automatic evaluation of the student's intermediate maths lines.
- A live visual browser review should confirm the exact desktop fit and MathLive rendering; automated checks alone cannot confirm pixel-perfect layout.
