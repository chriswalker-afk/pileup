# Graphics Pass B — The Geometer's Tablet and Scribe's Desk

Second Ancient Greek polish pass, on top of Graphics Pass A (PR #12) and the drawing-pad sizing correction (PR #11).

## Engraved difficulty emblems

Each challenge card receives a small vector seal alongside its existing text label. The same emblem appears in the challenge number header on the puzzle page.

| Difficulty | Symbol |
|---|---|
| Introductory | Right triangle |
| Developing / Intermediate | Two triangles |
| Advanced / Expert | Classical column |
| Master Challenge | Laurel around a triangle |
| Grand Challenge | Temple façade |

Textual difficulty labels are retained. Emblems are decorative and hidden from assistive technologies. Colours match the existing muted stone/gold/green palette.

## Geometric tablet polish

- A compass-and-triangle seal replaces the header's plain star.
- The tablet's parchment has fine corner engraving and an unobtrusive Greek-key frieze.
- The housing's finishing motif ties into the header/footer style from Graphics Pass A.
- All decorative layers ignore pointer events and remain behind the SVG puzzle, never on top of labels, marked lengths or controls.
- Shapes, falling animations, overhangs and calculation chains are unchanged.

## Scribe's drawing paper

A completely empty drawing pad shows a faint geometric construction (a right triangle, compass circles and dotted guide lines). The SVG is stored locally at assets/scribe-triangle.svg. It disappears when the pen starts drawing, remains hidden while strokes exist and returns only when the final stroke is undone, erased or cleared.

The graphic is decorative and doesn't alter student working, ink points, Undo, Maths/Draw switching or saved work. The larger pad and its containing yellow parchment behave the same way.

## Classroom constraints and manual review

- Preserve the single-screen nine-puzzle homepage and distinct real-geometry previews.
- Keep the actual mathematical diagram foremost: no hidden labels or faces.
- Do not reduce student working-space height or add extra explanatory text.
- Use no third-party image services; all graphics are inline or local SVG.
- Respect accessibility and reduced-motion settings.

Review at approximately 1366×768, then test mobile. Check each difficulty emblem, the denser Acropolis problem, the Replay/Auto/Skip controls and whether the visual ornaments block any side. Draw a stroke, switch Maths/Draw tabs, Undo the final stroke and enlarge the pad. The watermark should come and go appropriately, while the solution controls remain below the yellow working panel.

## Next graphics pass

Pass C can introduce a tasteful completion laurel, small feedback when a side is solved and a final live-browser accessibility/responsiveness audit before merging the finishing touches.
