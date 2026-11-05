# Advanced challenges and student working — current collection

The original nine puzzles have been re-architected to make their **physical structures and mathematical strategies genuinely different**. See [Puzzle Architecture Pass](PUZZLE_ARCHITECTURE_2026.md) for the complete catalogue and acceptance criteria.

## Advanced puzzles

| Challenge | Visible shapes | Structural idea | Final exact length |
|---|---|---|---|
| The Nine Muses | 9 right triangles | One upward leaning cascade, nine indispensable steps and a real 2 cm inset | **√1021 cm** |
| The Marble Terrace | 8 right triangles + 1 rectangle | A wide ground-level rectangle supporting two staggered towers | **2√38 cm** |
| The Acropolis | 10 right triangles + 2 rectangles | Two rectangles joined in sequence, with diagonals unlocking a stepped zigzag | **15 cm** |
| The Great Interlock | 13 right triangles | Two indispensable floor supports, angled wedges, two inset offsets and a 24 cm canopy | **24 cm** |

### Nine Muses

The nine triangles now climb in a dense, leaning *continuous* stack. Starting from one 5–12–13 floor foundation, each new edge supports the next. A true 2 cm overhang on a 15 cm sloping side unlocks a 13 cm subsegment; the final calculation gives **√1021 cm**. The old three-foundation terrace and its equal-tick inference have been removed.

### Marble Terrace
A grounded rectangle is the foundation. Its 13 cm diagonal and the derived 5 cm height determine a **12 cm rooftop**. The rooftop is split into 4 cm and 8 cm portions, each supporting different staggered roof triangles; the target is **2√38 cm**.

### Acropolis

Two rectangles now form successive platforms, not disconnected piers. Rectangle R1's 13 cm diagonal gives a 12 cm width, which unlocks the 16 cm leg leading into rectangle R2. Its 20 cm diagonal in turn gives the next 12 cm roof section. Smaller wedges, a measured 2 cm offset and alternating Pythagoras steps lead to **x = 15 cm**. Both rectangle diagonals are necessary.

Opposite horizontal rectangle sides are visibly marked with matching ticks (two distinct tick groups). Rectangles are actual quadrilaterals, with right-angle marks and a diagonal; helper triangles are mathematical rather than overlapping filled artwork.

## What stays the same

The classroom workspace still supports a general scratchpad before selecting any unknown side, editable mathematical lines, handwriting with a saved pen/eraser/undo history, exact-surds input, hints, feedback, completion review, and responsive drawing-pad dimensions. Fall, Replay, Skip, Auto-play, Zoom/Fit, Focus and Locate continue to use the same true geometric SVG.

## Acceptance and release testing

- All ten puzzles must have complete, non-overlapping, mathematically correct shapes, at least one grounded support, and a real solution dependency chain.
- The advanced collection must have visually distinct silhouettes. The Nine Muses is a one-base leaning cascade, the Marble Terrace a **single rectangular platform**, the Acropolis **two consecutive diagonal-dependent platforms**, and the Great Interlock a dense leaning assembly on two mathematical foundations.
- Both rectangle diagonals must be necessary in sequence for completing the Acropolis.
- The browser workflow captures every puzzle at desktop and phone widths and verifies all ten at five widths (including 320 px), with label collision protection.
- Test geometry at ordinary and magnified views; ensure drawing/solution buttons never overlap, even on short laptops.
- Check student progress after a redesign: the unchanged two puzzles retain their saved work, while older saved progress on newly redesigned geometries must not mark unrelated lengths as solved.

Earlier exact answer chains from the six-puzzle release no longer apply to the seven re-architected puzzles. Use [current puzzle answers and structure](PUZZLE_ARCHITECTURE_2026.md).

### The Great Interlock

The tenth grand challenge is a reference-inspired original: 13 right triangles, one 24 cm horizontal roof, two 5 cm offsets, two independent bottom-up chains and matching-side ticks. See [full construction and worked solution](THE_GREAT_INTERLOCK.md).
