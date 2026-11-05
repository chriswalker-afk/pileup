# Label Clarity — Pass A

This pass improves how students identify the **exact segment described by a measurement**, particularly in advanced piles with overlapping full and partial lengths.

## The three interactions

**1. Point at a side or measurement.** When the pointer is over a label or its side, the exact segment is traced in muted amber with small endpoint markers. A temporary dashed line joins the measurement chip to the midpoint of the segment. The same behaviour works by keyboard-focus on a labelled length. Selecting a length keeps the corresponding segment highlighted.

**2. Turn on FOCUS VIEW.** This compact toggle sits alongside **Choose a side to investigate** in the working panel. Once a student selects a side or clicks a triangle/rectangle, the selected shape's annotated sides remain prominent and unrelated labels fade. Dimmed labels are still selectable, so Focus never locks the student into one method or problem-solving order. Select ALL LABELS to restore the complete diagram immediately. A new challenge always starts with All labels, not Focus.

**3. Use LOCATE.** When zoomed into an advanced diagram, the LOCATE button alongside the side selector brings the selected physical length into the visible SVG viewing window. It keeps the current zoom level (for example, 200%) and works for collinear split sides and rectangles. On phones, LOCATE also scrolls to the diagram. LOCATE is disabled when no side is selected.

## Deliberate constraints

- All mathematical points, triangle/rectangle sizes, unknown counts and solutions remain exactly as authored.
- Labels are **not repositioned in Pass A**. That will be addressed separately in Pass B, with prioritisation, bracket improvements and a new layout scoring system.
- The falling animation still delays all measurements and equality ticks until the pieces have landed. The highlighting traces and temporary connectors sit inside the same delayed measurement layer.
- The workspace does not gain another permanent information box. Focus sits beside the existing selector heading and Locate shares the selector row.
- Hover is optional; selecting by tap, clicking an edge, keyboard-focus and the existing side selector work without it.
- Focus affects presentation only, and is not saved in student mathematical progress.
- Trace strokes do not intercept mouse/stylus clicks, and the original SVG side-hit regions remain intact.
- Zoom, pan, Fit, replay, automatic falling, Show/Hide Measurements, mathematical input, handwriting, hints, extension tasks and correct-answer checking remain available.

## Tests and device review

- `tests/label-clarity.test.mjs`: mathematical side membership across all nine puzzles and their rectangles; preserving 200–400% zoom while locating a length.
- `scripts/browser-audit.mjs`: tests label-to-segment identity, hover, focus and Locate on the Acropolis at 1366×768, 1024×640, 768×1024, 390×844 and 320×568, as well as all existing visual and mathematical checks.
- The browser audit runs against the local GitHub PR build, while GitHub Pages will update only after merge.

**Suggested manual checks:** on The Acropolis, enable Focus and choose a triangle to confirm the right subset is prominent. Zoom into a distant edge, press LOCATE and check that the same magnification is retained. On Twin Paths, inspect a shared long side and the shorter aligned section to ensure the amber endpoint markers clearly distinguish them. Verify the drawing pad is not reduced on short laptops and that iOS touch input can still select sides.

## Next pass

Pass B should improve the automatic positioning algorithm: prefer close-to-side placement, introduce clearer dimension brackets where a long side includes smaller pieces, prevent leader crossings where possible, and retest all labels at phone, tablet and desktop widths.
