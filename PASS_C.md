> **Historical archive.** This document describes the previous six-puzzle geometry before the 2026 architecture redesign. The answer chains below are NOT the current ones. For the nine live puzzle structures and answers, see [Puzzle Architecture Pass](PUZZLE_ARCHITECTURE_2026.md).

---

# Pass C — Curated puzzles with different overlapping relationships

## Scope and design principles

Pass C develops a library of **six original, mathematically checked piles**, without restricting all the triangles to complete, shared edges.

The primary geometric relationships now include:
- **Full shared side** between successive right triangles.
- **Inset overhang**: one side falls short of the supporting side; subtract an exposed section.
- **Projecting overhang**: an upper side extends beyond the supporting triangle; add a section.
- **One long side overlapping TWO shorter triangle sides**: a compound support must be reconstructed from two independent calculations.
- **Branching starting points**: either of two triangles can be solved first, but both results are necessary to reach the final target.
- **Matching tick marks**: equality is a real dependency; it is not a decorative marking.
- **Bridging triangle**: one triangle uses a full side which also spans two shorter sides below it.
- **Exact values**: selected puzzles end with surds rather than terminating in a whole number.

All puzzles continue to use the Ancient Greek interface, floor, replayable falling animation, side selection, checking, progressive hints and full worked solutions.

## Six authored challenges

| # | Puzzle | Geometry | Worked answer chain | Final target |
|---|---|---|---|---|
| 1 | The First Fall | 3 triangles; inset overhang, shorter-side subtraction | 20 → 15 → 8 → 10 | **10 cm** |
| 2 | The Projecting Edge | 4 triangles; projecting overhang then exact-surds chain | 20 → 24 → 10 → 26 → 5√29 | **5√29 cm** |
| 3 | Twin Paths | 3 triangles; two shorter sides cover one long side, equal-length ticks, independent starting points | 12 → 13 (equal mark) → 5 → 17 → 15 | **15 cm** |
| 4 | Split & Project | 3 triangles; two shorter sides cover one long side with one extending 2 cm beyond it | 12 → 15 → 13 → 25 → 20 | **20 cm** |
| 5 | The Geometer's Labyrinth | 5 triangles; long linked chain and surds | 20 → 24 → 10 → 2√41 → 10√2 → √281 | **√281 cm** |
| 6 | The Great Pile Up | 5 fully visible triangles; two independent support calculations converge before two upper Pythagoras steps | 17 → 5 → 12 → 13 → √205 → √230 | **√230 cm** |

The indicated steps are **one valid order**. Students can find independent sides in a different order; the app checks geometrically correct lengths rather than imposing a fixed step sequence.

### Twin Paths — extra challenges

The three right triangles meet along boundaries without overlapping interiors:
- Exterior perimeter: `15 + 8 + 13 + 5 + 13 + 12 = 66 cm`
- Total area: `½(15×8) + ½(12×5) + ½(5×12) = 120 cm²`

One 13 cm hypotenuse is given and the other is marked with matching ticks, so students must use equality to deduce the second length.

### Split & Project — extra challenges

An upper support projects **2 cm beyond** the 25 cm supporting diagonal.
- Exterior perimeter: `20 + 15 + 2 + 13 + 5 + 17 + 8 = 80 cm`
- Total area: `½(20×15) + ½(12×5) + ½(15×8) = 240 cm²`

Only Twin Paths and Split & Project currently offer perimeter and area extensions. All six piles now use non-overlapping triangle interiors; the master puzzle focuses on the more demanding linked-length chain rather than an extension.

## What has been implemented

- Dedicated `pile-variants.js` module for mathematically exact split-edge and bridging constructions.
- Six puzzle definitions with feature tags and SVG preview silhouettes in the challenge library.
- Support for equality-side groups in the mathematical dependency and checking engine.
- Conventional matching tick marks on the relevant sides in the SVG.
- Generalized diagram labels for multiple collinear part/whole relations.
- Specialized hints and full solutions for **matching marks**, **split sides**, **overhangs**, **Pythagoras addition** and **Pythagoras subtraction**.
- Optional perimeter and area tasks after a correct target answer, with independent answer checking, persisted progress and fully worked extension solutions.
- Next-challenge navigation through all six puzzles rather than alternation between two.
- `tests/curated-collection.test.mjs` including geometry, branching, collinearity and compound-shape checks.

## QA and acceptance checklist

1. Choose every puzzle from the homepage. Each card thumbnail should reflect its true geometry.
2. Confirm the stone floor and correctly located right-angle markers.
3. Let all pieces fall; ensure each piece settles in the final prescribed configuration. Replay should work.
4. Check measurements at desktop/tablet/mobile widths and ensure they never hide key right-angle marks or other labels.
5. In **Twin Paths**, identify the two matching pairs of tick marks; verify only one of the two equal hypotenuses is numerically given.
6. In **Twin Paths**, solve either initial branch first. Both should be required to find the entire 17 cm diagonal.
7. In **Split & Project**, identify the 2 cm projecting overhang and the shorter 12 and 13 cm sections composing the 25 cm diagonal.
8. Use progressive hints on each relationship type; the language should distinguish addition, subtraction, equality and Pythagoras.
9. Enter all answers in exact form where appropriate, or appropriate decimal rounding. Confirm the full worked review accurately names the step kind.
10. After solving Twin Paths and Split & Project, enter the extension answers and review the complete working. Refresh to check progress persistence.
11. Confirm that **all five triangles in The Great Pile Up are fully visible**, including complete outlines. No coloured triangle may cover another's interior.

## Automated checks

`npm run check` runs JavaScript syntax checks and all mathematical tests using Node 22. The collection test verifies the six solution chains and necessary split-side/equality relationships; legacy tests are retained.

An isolated SVG DOM simulation was also run at drawing widths 780, 440, 340 and 300 px for all six puzzles (24 combinations). In that simulation, every puzzle had its correct number of triangles and individual animation entries, no measurement rectangles overlapped or went outside the SVG, and direct submission of the target opened the completion state.

Live browser review remains worthwhile, particularly for visually dense diagrams and the true falling motion.

## Suggested next pass (Pass D)

Prioritize:
- live browser and accessibility quality audit,
- improved close-up/zoom for overlapping edges on mobile,
- classroom/projector mode and teacher controls,
- printable worksheet and worked-solution exports,
- light-touch progress review without requiring accounts.

## Visibility correction and new rule

Following classroom review, the master puzzle was rebuilt so triangles IV and V attach **outside** the preceding hypotenuses. All six puzzles are checked by `assertFullyVisiblePuzzle` and the dedicated viewport/visibility regression tests. A side may share two shorter sections, and a piece may extend beyond its support, but **no triangle may obscure any other triangle's filled interior**. The master puzzle's revised answer chain is `17, 5, 12, 13, √205, √230`.
