# Puzzle Architecture — Ten Distinct Mathematical Constructions

Updated 9 November 2026. See [Challenge Design Standard](CHALLENGE_DESIGN_STANDARD.md) for the current classroom-informed pedagogical rules. See [DEPENDENCY_REDESIGN_2026.md](DEPENDENCY_REDESIGN_2026.md) for the dependency-first corrections to challenges 4, 6, 7 and 9.

Each puzzle uses true, non-overlapping right triangles (and, where specified, actual rectangles). A student must derive the next required side using a shared geometric edge, a visibly marked whole/part relationship, or the diagonal of a rectangle. Coincidentally equal but geometrically separate sides are **not** assumed to be interchangeable.

| # | Puzzle | Faces | Structural identity | Final x |
|---|---|---|---|---|
| 01 | The First Fall | 3 triangles | Introductory single rise with inset | **10 cm** |
| 02 | The Projecting Edge | 4 triangles | Cantilever with two upper arms | **5√5 cm** |
| 03 | Twin Paths | 3 triangles | Two short roofs share a longer diagonal; tick marks | **15 cm** |
| 04 | Split & Project | 4 triangles | Compact folded staircase with a 2 cm exposed overhang | **√157 cm** |
| 05 | The Geometer's Labyrinth | 5 triangles | Two routes rejoin around a genuine triangular opening | **15 cm** |
| 06 | The Great Pile Up | 6 triangles | Six-face zigzag with an optional shorter route; four checks can reach x | **24 cm** |
| 07 | The Nine Muses | 9 triangles | Tall left-leaning cascade with one exact 2 cm inset | **√521 cm** |
| 08 | The Marble Terrace | 8 triangles + 1 rectangle | A rectangular platform, two base supports and a seven-check route | **2√38 cm** |
| 09 | The Acropolis | 10 triangles + 2 rectangles | Two **successive** rectangular steps, then a leaning canopy | **15 cm** |
| 10 | The Great Interlock | 13 triangles | Two independent rooted routes through an interlocking crowd | **24 cm** |

## Classroom-led design revision — 9 November

The previous strict rule that *every triangle must be indispensable* was counterproductive for route-choice puzzles. **Great Pile Up** now labels an additional genuine 8 cm side on triangle II, so triangle III is a valid entry point and the student can reach x in four checked lengths. The optional lower route is still mathematically sound. **Nine Muses** retains its nine-face geometry but replaces repeated reverse triples with √481, 20 and finally √521. These two changed geometries use new progress namespaces. Marble Terrace keeps its geometry and progress storage, but now offers a seven-check route goal, because one upper branch is optional.

See [Challenge Design Standard](CHALLENGE_DESIGN_STANDARD.md). Correct geometry, shared-length markings, full visibility and complete worked solutions remain required. A unique starting calculation and a compulsory contribution from every face no longer are.

## Key corrections to the former two-peak puzzles

The former Split & Project, Great Pile Up, Nine Muses and Acropolis were visually connected but depended on visually ambiguous spanning or matching edges. Their entire geometry, targets, givens and dependency routes have now changed.

- **4:** One clear start, four connected triangles, a marked 2 cm short segment and a real 13 → 11 subtraction.
- **6:** One floor foundation and a genuine zigzag: no triangle is suspended across two disconnected tips.
- **7:** Nine steps climb from one grounded triangle. The 2 cm overhang is an actual subsegment of a 15 cm edge, not a visual approximation.
- **9:** The first rectangle's diagonal unlocks a connecting triangle, which unlocks the second diagonal. The two platforms are *consecutive* rather than separated by an open bay; both calculations are required.

No special same-length tick inference is required for #4, #6 or #7: required lengths are physically shared edges. #9 shows **two matching-mark groups on the opposite horizontal sides** of the two rectangles; all equalities are mathematically real.

## Student interface and saved work

Dense structures #7, #9 and #10 show givens and the target initially, revealing other unknown labels for the selected triangle or once solved. Students can still click any side or use the side dropdown; Zoom, Fit, Focus view, Locate and diagram trace remain available.

The four re-authored puzzles use `pileup-architecture-v2-<id>` as their browser-local progress key, preventing earlier solved lengths from being misapplied. The other six puzzles retain their existing saved-work keys.

## Mathematical and browser quality gates

- Every face has actual right-angle geometry and no polygon interior overlaps.
- All ten structures remain connected, with real floor support and correctly positioned given/overhang lengths.
- Dependency tests still require every triangle for #4, #7 and #9. For #6, a shortest-route test proves a four-check shortcut while blocking the two lower optional pieces. For #8, a separate route test proves a seven-check path that bypasses the optional left tower.
- For #9, blocking either rectangle-diagonal calculation must also prevent x.
- The Chrome audit renders all ten puzzles at five viewport widths and checks clipping, measurement-chip overlaps, dimension brackets, saved work, and the existing interaction controls.

The older geometry and target answers in historical passes were valid for their former versions only; this document describes the current ten-puzzle set.
