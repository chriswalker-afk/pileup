# Advanced challenges and expanded student working

## What has been added

The existing six puzzles remain mathematically unchanged. The collection now contains **nine** challenges, including three master-tier constructions with more triangles and genuine rectangles.

| Challenge | Visible pieces | Final exact length |
|---|---|---|
| The Nine Muses | 9 right triangles | 2√95 cm |
| The Marble Terrace | 8 right triangles + 1 rectangle | 2√102 cm |
| The Acropolis | 10 right triangles + 2 rectangles | √105 cm |

### The Nine Muses
One valid chain: **20 → 24 → 10 → 2√41 → 10√2 → √281 → 3√34 → √322 → √371 → 2√95**. There is a projecting overhang and every triangle contributes to the chain.

### The Marble Terrace
The first triangle gives a 5 cm side and a 13 cm hypotenuse, so students find its 12 cm vertical side. The attached rectangle has a 15 cm diagonal: use Pythagoras to find its **9 cm roof**, which supports the next triangle. The remaining chain is **15 → 5√10 → 5√11 → 10√3 → 4√21 → 2√93 → 2√102**.

### The Acropolis
Students use the same first rectangle, then discover a **second tilted rectangle**. Its diagonal is necessary to find a 4 cm side before they can proceed. The closing triangle sequence gives **√41 → √57 → √73 → √89 → √105**.

Rectangles are real visible shapes with right-angle markers and a dashed diagonal. Their opposite side equalities are carried across automatically once a side has been discovered; redundant side labels are suppressed to keep diagrams legible. Invisible *mathematical* right triangles help calculate the diagonals, but no coloured triangular overlays obscure the rectangles.

## Visibility and animation

The geometry validation covers all filled shapes. Triangle and rectangle interiors must never overlap, although full or partial shared sides and projecting overhangs are allowed. Every shape is fitted inside the tablet bounds. The new pieces fall in construction order, and larger piles have a faster stagger so their falling animation remains practical.

The homepage shows **nine puzzles in a 3 × 3 desktop grid**, remaining compact and using two or one column on narrower displays.

## More working space

In response to the cramped-workspace review:
- Removed the redundant final-length heading, long explanatory paragraph and triangle/given-length counts.
- Reduced space around the essential side selector, answer input and hints.
- Expanded the mathematics line editor and handwriting pad vertically inside the panel.
- Added a **general scratchpad**, usable before selecting any unknown side; this is saved separately from individual side workings.
- Kept the wide-panel toggle, saved handwritten strokes, mathematical notation and automatic checking.

## Review checklist

1. Open a challenge at 1366 × 768. The mathematical workspace should occupy most of the right panel.
2. Before selecting a side, enter calculations in the general scratchpad. Then select a side and confirm its working remains independent.
3. Enter exact surds, test the hints and full worked solutions, and refresh to confirm persistence.
4. Run the Nine Muses challenge through its nine right triangles.
5. In the Marble Terrace, use the given diagonal to calculate the 9 cm roof.
6. In the Acropolis, solve the **second** rectangle diagonal before triangle VI.
7. Replay each fall and ensure all triangle and rectangle outlines, right-angle marks and shared edges stay visible.
8. On mobile, confirm the dense dimension labels do not overlap and the workspace remains usable.

Automated tests cover the geometry, exact solution sequences, rectangle dependencies and label positioning at 780, 440, 340 and 300 px tablet widths. A live browser review is still necessary to confirm pixel-level layout and stylus behaviour.
