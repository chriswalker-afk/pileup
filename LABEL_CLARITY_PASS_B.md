# Label Clarity — Pass B: Intelligent Placement and Dimension Brackets

Pass B builds on the merged Pass A (PR #17). Its purpose is to make it easier to connect each measurement to the correct physical side, especially when multiple right triangles share a line or one edge consists of shorter sections.

## 1. Improved label positioning

The previous algorithm avoided overlapping boxes but treated a label 25 units away from its side as almost equivalent to one 250 units away. In the more advanced piles, this could create labels in otherwise empty areas without an obvious geometric connection.

The revised algorithm:

- **Protects readability first:** measurements must fit inside the diagram bounds without overlapping another measurement, including at narrow classroom display widths.
- **Places givens and the target before optional unknown tags:** their positions are reserved before the most numerous question marks are placed.
- **Prefers the natural side of an edge and shorter connections:** outward placements, proximity to the edge midpoint and low tangential drift receive lower costs.
- **Discourages confusing leaders:** long leaders receive an extra penalty if they cross other leaders, labels or different geometric edges.
- **Repairs crowded arrangements locally:** after building an initial collision-free layout, a small deterministic optimisation pass can move later labels closer without disturbing the essential measurements.
- **Uses spare tablet space only when necessary:** a distant callout is the last resort, not the standard response to a small local clash.

This arrangement is deterministic for the same puzzle and solved measurements. It does not modify any authored triangle or rectangle, and it does not enlarge or shrink the student's maths/drawing workspace.

## 2. Whole and partial lengths: accurate dimension brackets

For a mathematically authored straight-line relationship of the form

**whole length = shorter part + shorter part**

the diagram now displays a subtle bracket for the full physical extent of the whole side and separate brackets for each component.

- The **whole** side uses a darker solid measurement bracket with wider end caps.
- **Partial** lengths use lighter, fine dashed brackets and smaller end caps.
- **Overhangs** use a restrained warm-coloured bracket.
- Each bracket is calculated directly from the actual side endpoints, not from its label text or a guessed location.
- The bracket highlights or dims with the same side in Pass A's Focus mode.
- These brackets appear only where the original puzzle defines such a true length relationship. A rectangle diagonal by itself does *not* imply an artificial whole/part relationship.

The usual equal-side tick marks and right-angle indicators retain their original mathematical meanings.

## 3. Fewer permanent connectors

A permanent dashed leader is shown only when its label must be displaced beyond the immediate area of its side. When a relation has its own bracket, a distant leader attaches to that bracket instead of to an ambiguous midpoint inside several collinear segments.

Pass A's temporary side-to-chip connector is still available whenever the student hovers, taps or selects a measurement. This is the clearer way to investigate a relationship without permanently drawing dozens of connecting lines.

## 4. Interaction and accessibility safeguards

- Full **All Labels** remains available; **Focus view** is optional.
- **Locate** continues to centre a selected side while preserving zoom.
- Every side, chip and bracket uses the same unique mathematical side key.
- Brackets, leaders and all measurements remain in the delayed measurement layer and do not appear while triangles are falling.
- Decorative marks do not accept pointer events, so students can still select the actual sides.
- Replay, Auto-play, Skip, MathLive/offline input, handwriting, hints, exact surds and progress saving are unchanged.
- The layout respects reduced-motion preferences, and no new external dependencies were introduced.

## 5. Verification and review

The new tests check the real 9-puzzle geometry at four input widths, including zero label collisions, full diagram bounds, deterministic placement, correct whole/part relation classification, exact bracket endpoints and crossing-line detection.

The existing Chromium audit checks all nine puzzles at five viewport sizes and now also checks:

- The mathematical length of each visible bracket agrees with the exact underlying side.
- Every bracket has a spine and two proper end caps.
- The Focus view dims unrelated brackets just as it dims their associated labels.
- Leader counts and average label-to-side distances are recorded in the audit report.
- Both desktop and phone screenshots are captured for Twin Paths and Split & Project, in addition to the existing Acropolis and First Fall screenshots.

**Manual review sequence:** start with *Twin Paths*, then *Split & Project*, comparing whole and part lengths. Check *The Projecting Edge* for a genuine overhang, then inspect *The Acropolis* at 100% and 200% zoom. Finally, toggle Focus and All Labels, solve a side and verify that the changing label width has not introduced clipping.

## Next stage

Once Pass B is reviewed and merged, the label-clutter work should be complete. A separate optional enhancement would be a more spacious *focused mobile diagram* view for the very advanced puzzles, but that is outside this placement pass and should not alter existing default behaviour.
