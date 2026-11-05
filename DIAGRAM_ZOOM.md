# Diagram magnification and movement

All nine geometric puzzles now have a compact zoom toolbar on the tablet. The controls are intentionally separate from the student's working/handwriting area.

## How to use

| Action | Mouse / trackpad | Touch / stylus | Keyboard |
|---|---|---|---|
| Zoom in or out | Select **+** or **−** | Tap **+** or **−** | Tab to either button and press Enter/Space |
| Return to full puzzle | Select **FIT** | Tap **FIT** | Tab to FIT and press Enter/Space |
| Move around while enlarged | Click and drag the diagram | Drag the magnified diagram | Focus the SVG diagram and use arrow keys |
| Zoom near an interesting part | **Ctrl/Command + scroll** over the diagram | Two-finger pinch after first using + | Use the zoom buttons |

The level indicator shows 100%, 125%, 150%, 200%, 250%, 300% or 400%, with intermediate levels possible through touch pinch. **100%** always means the original fitted diagram; pressing FIT also centres the entire pile.

## Interaction principles

- Zoom never changes a single triangle, rectangle, right-angle mark, given length, surd or Pythagoras solution.
- Internally, the app adjusts only the parent SVG **viewBox**, so geometry remains vector-sharp and clickable.
- When an answer is entered, a side chosen, hints revealed, or Replay Fall used, the current magnification remains in effect. The *next* puzzle starts in full (100%) view.
- At 100% magnification, one-finger scrolling over a diagram is normal page scrolling. After zooming in, dragging the diagram pans within the cropped view. Students can still tap a side to choose it.
- Zoom and pan are bounded. Students cannot zoom below 100% or beyond 400%, or drag an enlarged image completely outside the tablet.
- Ctrl/Command plus mouse wheel is an optional shortcut, not the only way to magnify. Ordinary wheel scrolling is left for page navigation.
- All controls are labelled for screen readers and have visible keyboard focus. Motion preferences do not affect the ability to magnify.
- The zoom toolbar is placed above the diagram content near the bottom-right; it does not enlarge the tablet or take away mathematical working space.
- The original Replay, Auto On/Off, Hide Measurements, Skip, drawing-pad controls and full worked solutions are unchanged.

## Quality checks

`tests/diagram-zoom.test.mjs` checks the bounded geometry of zooming, panning and resetting using pure calculations. Standard `npm run check` verifies the new JS file as well as all existing mathematical tests.

`scripts/browser-audit.mjs` (GitHub's **Browser and visual usability audit**) also verifies the zoom controls at desktop, small laptop, tablet, phone and small phone widths: they must stay inside the tablet and not cover a measurement label at 100%; zoom must magnify the real SVG; dragging must move its viewing window; side selection must not reset zoom; FIT must restore the original 960×590 view.

## Suggested classroom-device review

1. On the **Acropolis** (10 triangles and 2 rectangles), zoom to 200–300%. Drag to inspect a small pair of sides, select a measurement, and return to Fit. Make sure dimension labels grow and remain aligned with their segments.
2. On a phone, use the **+**, **−** and **Fit** controls. Confirm you can still scroll the page from outside the magnified diagram.
3. Try a touch-enabled device or stylus, including dragging while magnified. Touch-screen gestures may vary between operating systems.
4. Replay the falling shapes while magnified, then Skip: the original labels and equality ticks should reappear correctly.

A Chrome browser automation pass is not the same as a real Safari/Apple Pencil acceptance test. Device-specific verification remains recommended before classroom rollout.
