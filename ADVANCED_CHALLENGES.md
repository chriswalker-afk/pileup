# Advanced challenges and student working — current collection

The nine puzzles have been re-architected to make their **physical structures and mathematical strategies genuinely different**. See [Puzzle Architecture Pass](PUZZLE_ARCHITECTURE_2026.md) for the complete catalogue and acceptance criteria.

## Advanced puzzles

| Challenge | Visible shapes | Structural idea | Final exact length |
|---|---|---|---|
| The Nine Muses | 9 right triangles | Three foundations, two parallel middle terraces, matching lengths and an upper crown | **√274 cm** |
| The Marble Terrace | 8 right triangles + 1 rectangle | A wide ground-level rectangle supporting two staggered towers | **2√38 cm** |
| The Acropolis | 10 right triangles + 2 rectangles | Two independent plinths, separated by an open bay, joining into a high bridge | **25 cm** |

### Nine Muses
Three foundation triangles support twin roof routes. Further outside triangles rise independently, and matched lengths reconnect their upper tips beneath a final crown. This is a layered arrangement, **not a fan rooted at one ground vertex**.

### Marble Terrace
A grounded rectangle is the foundation. Its 13 cm diagonal and the derived 5 cm height determine a **12 cm rooftop**. The rooftop is split into 4 cm and 8 cm portions, each supporting different staggered roof triangles; the target is **2√38 cm**.

### Acropolis
Two **separate rectangular plinths** each contribute an essential diagonal deduction. Their roof widths are each 12 cm; matching marks carry those lengths to the two halves of the 24 cm upper bridge. A 7 cm upright completes the 7–24–25 right triangle. Removing **either** rectangle diagonal leaves the final target inaccessible in the dependency engine.

Rectangles are actual quadrilaterals with visible edges, right-angle marks and a diagonal; the invisible helper triangles are mathematical, not overlapping coloured artwork. Redundant opposite-length labels are suppressed or propagated when their equalities are established.

## What stays the same

The classroom workspace still supports a general scratchpad before selecting any unknown side, editable mathematical lines, handwriting with a saved pen/eraser/undo history, exact-surds input, hints, feedback, completion review, and responsive drawing-pad dimensions. Fall, Replay, Skip, Auto-play, Zoom/Fit, Focus and Locate continue to use the same true geometric SVG.

## Acceptance and release testing

- All nine puzzles must have complete, non-overlapping, mathematically correct shapes, at least one grounded support, and a real solution dependency chain.
- The advanced collection must have visually distinct silhouettes. The Nine Muses is a terraced three-foundation pile, the Marble Terrace a **single rectangular platform**, and the Acropolis **two separate plinths**.
- Both rectangle diagonals must be necessary for completing the Acropolis.
- The browser workflow captures every puzzle at desktop and phone widths and verifies all nine at five widths (including 320 px), with label collision protection.
- Test geometry at ordinary and magnified views; ensure drawing/solution buttons never overlap, even on short laptops.
- Check student progress after a redesign: the unchanged two puzzles retain their saved work, while older saved progress on newly redesigned geometries must not mark unrelated lengths as solved.

Earlier exact answer chains from the six-puzzle release no longer apply to the seven re-architected puzzles. Use [current puzzle answers and structure](PUZZLE_ARCHITECTURE_2026.md).
