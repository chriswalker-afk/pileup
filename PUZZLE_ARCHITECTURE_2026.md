# Puzzle Architecture Pass — Ten Distinct Structures

Current puzzle reference: 5 November 2026. This document supersedes the earlier six-puzzle and advanced-puzzle answer lists.

## Distinct challenges

| # | Challenge | Visible pieces | Architectural idea | Main mathematical reasoning | Final x |
|---|---|---|---|---|---|
| 01 | The First Fall | 3 triangles | One simple rising spine and inset | Pythagoras, then subtract an overhang | **10 cm** |
| 02 | The Projecting Edge | 4 triangles | Wide cantilever and two different upper arms | Add a 4 cm projection, then subtract squares | **5√5 cm** |
| 03 | Twin Paths | 3 triangles | Two shorter roofs cover one long diagonal | Two starting points and matching tick marks | **15 cm** |
| 04 | Split & Project | 3 triangles | Two floor piers, an empty bay and projecting beam | Foundation subtraction, equal spans, 3 cm overhang | **17 cm** |
| 05 | The Geometer's Labyrinth | 5 triangles | Triangular opening with branches meeting at the roof | Find 7 cm and 5 cm along independent paths; add to 12 cm | **15 cm** |
| 06 | The Great Pile Up | 5 triangles | Open bridge on two supports, then a rising asymmetric roof | Bridge Pythagoras and two further roof deductions | **√230 cm** |
| 07 | The Nine Muses | 9 triangles | Three ground foundations, two terraces and a high crown | Separate roof routes joined by matching lengths | **√274 cm** |
| 08 | The Marble Terrace | 8 triangles + 1 rectangle | One broad rectangle platform with two staggered ridges | Diagonal gives a 12 cm roof; split into 4 and 8 | **2√38 cm** |
| 09 | The Acropolis | 10 triangles + 2 rectangles | Two independent plinths and a high horizontal bridge | Both diagonal results give two 12 cm halves, then 7–24–25 | **25 cm** |
| 10 | The Great Interlock | 13 triangles | Dense alternating wedges, two real floor supports, twin inset offsets and one broad canopy | Two independent roots unlock 10 + 15 = 25, then 7–24–25 | **24 cm** |

## Key design principles

**Variety:** no two puzzles use the same topology identifier or foundation arrangement. First Fall and Twin Paths remain intentionally unchanged; eight other puzzles have genuinely new coordinates, relationships and silhouettes.

**Grounded, upward-growing pieces:** all filled shapes are authentic right triangles/rectangles. Some puzzles have multiple ground edges; some sit at supported corners, and gaps beneath beams are truly empty. No coloured shape may obscure another's interior.

**Real mathematical dependencies:** all labelled measurements correspond to true geometry. The engine uses Pythagoras, equal ticks, shared straight-line parts and actual rectangle diagonals. The Grand Challenge cannot reach its target without both rectangle-diagonal calculations.

**Readable interface:** all diagrams use the same geometric SVG for homepage miniatures and individual puzzles. Existing Replay, Auto-play, Skip, zoom, Fit, Focus view, Locate, dimension brackets, handwriting, hints, and checking work with the new shapes.

**Saved progress:** First Fall and Twin Paths preserve their existing browser-local progress. The seven redesigned puzzles use a new versioned progress key; earlier saved work remains stored separately on the device and is not incorrectly mapped to changed lengths.

## Suggested acceptance review

1. Compare First Fall and Projecting Edge: the second has a projecting shoulder and two upper arms, not another longer chain.
2. Compare Twin Paths and Split & Project: one base with two upper pieces versus two grounded piers separated by an open bay.
3. Compare Labyrinth and Great Pile Up: a triangular arch where branches meet versus a beam over a genuine full gap.
4. Examine Nine Muses: three foundations, two joined terraces and a final upward crown.
5. Examine Marble Terrace and Acropolis: one rectangular platform versus two separate plinths whose diagonal results both matter.
6. On 320–390 px screens, test labels, Focus, Locate and zoom on Acropolis.
7. Check the new exact answers above, full worked solutions, and correctly delayed labels during Replay.

## Verification

New architecture tests check connected physical contacts, multiple ground footprints, true open bays, upward growth, nontrivial starting choices and unique topology names. Existing visibility and Pythagoras tests verify every corner and result. Rectangle tests specifically prove the Acropolis final side is unobtainable when either diagonal calculation is withheld.

The permanent browser audit checks all ten puzzle SVGs, interaction, saved working, zoom and handwriting at five screen sizes, and archives screenshots as GitHub Actions artifacts.

Historical PASS_C.md and earlier geometry notes describe the previous puzzle generation; this document and the current code are authoritative for these nine revised problems.

## Tenth challenge: reference-inspired interlocking composition

[The Great Interlock](THE_GREAT_INTERLOCK.md) is an original 13-triangle construction closer to the dense Pythagorean Stack reference. It has a broad horizontal target, two 5 cm offsets, 10 cm and 15 cm upper segments, and two true foundations whose calculations are individually required for x = 24 cm. It does not reuse the source diagram's exact positions or answer.
