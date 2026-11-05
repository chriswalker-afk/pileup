# Student usability and full-visibility review

This pass follows the merger of PR #5 and the classroom screenshot showing obscured triangles.

## Changes

### No hidden triangles — a mathematical design rule

- Rebuilt **The Great Pile Up**, the only puzzle whose previous geometry genuinely placed coloured triangle interiors over one another.
- The redesigned puzzle has **five separate, fully visible triangular faces**, still resting on/connected to earlier sides. Its two starting calculations converge before a two-triangle upper chain.
- Revised master solution sequence: **17 → 5 → 12 → 13 → √205 → √230 cm**.
- Added `pile-visibility.js`: a convex triangle intersection check rejects any pair of triangles whose **interiors** overlap. Precisely shared edges, two smaller edges aligned with a longer edge and overhangs are still permitted.
- Every authored puzzle is checked at construction time; a future accidentally overlapping puzzle cannot silently be published.
- The same module controls fitting the entire puzzle inside the SVG drawing tablet with generous horizontal and upper margins and the bottom triangle sitting on the floor.
- Updated the selected-side visual state so other triangles only fade slightly rather than becoming difficult to see.
- Added `tests/pile-visibility.test.mjs` to validate all six puzzles, a deliberately overlapping counterexample, and complete vertex visibility inside the drawing tablet.

### Maths working usability

- Fixed an unnecessary double inspector render when a student selects a side.
- **Revealing a hint no longer rebuilds the editor**. This keeps maths typing, drawing pad state and ink undo history intact while a clue is revealed.
- Added **More working room** / **Balanced view** toggle for wider mathematical working on desktop, with the choice remembered between visits.
- Improved maths line spacing and quick-symbol button targets.
- The working panel continues to scroll internally while the puzzle remains visible. At narrow/mobile sizes, stacking and page scrolling remain intentional.

### Drawing pad usability

- The normal drawing surface is taller; students can toggle a still larger drawing pad inside the workspace.
- Improved touch/stylus pointer handling, including coalesced pen events, single active pointer, pointer-cancellation recovery and normalized strokes.
- Ink undo is retained when switching between **Maths** and **Draw**.
- Erasing a stroke uses one undo action for an entire drag, rather than saving after each individual pointer move.
- A nonfatal save-status message says **Saved on this device** or **Not saved — browser storage full**.
- Bounds on drawing history remain in place to protect student devices.

### Small-height screens

- More compact challenge previews on short desktop/laptop screens.
- All six choices remain within the homepage dashboard on normal desktop sizes.
- Diagram, answer, hints and working stay in the same puzzle context.

## Mathematical regression

| Challenge | Revised solution chain | Triangle interiors overlap? |
|---|---|---|
| The First Fall | 20 → 15 → 8 → **10** | No |
| The Projecting Edge | 20 → 24 → 10 → 26 → **5√29** | No |
| Twin Paths | 12 → 13 → 5 → 17 → **15** | No |
| Split & Project | 12 → 15 → 13 → 25 → **20** | No |
| The Geometer's Labyrinth | 20 → 24 → 10 → 2√41 → 10√2 → **√281** | No |
| The Great Pile Up | 17 → 5 → 12 → 13 → √205 → **√230** | No |

All triangles are right-angled, with valid Pythagorean dependencies. Some different solution orders remain possible.

## Manual classroom review checklist

1. Open every puzzle and confirm that no coloured triangle covers part of another triangle.
2. Watch all pieces fall into their final arrangement. Every triangle must remain entirely inside the mathematical tablet when settled, including every vertex and edge.
3. Select a side and inspect the diagram: all nonselected triangles should remain clearly visible.
4. Verify the bottom triangle rests on the floor and the overhangs/shared side sections are labelled.
5. Use **More working room**, then switch back to **Balanced view**. The selection should persist on refresh.
6. On a small laptop, check that the six homepage choices fit within one screen, with the essential puzzle controls visible on one screen.
7. Type a few mathematical working lines, request a hint halfway through an equation, and check that the editor is not reset.
8. Draw freehand, enlarge the drawing pad, switch to Maths and back, and use Undo on the previous stroke.
9. Test stroke erasing, interrupted pen gestures and mouse/touch input where available.
10. Refresh to confirm saved working and drawing persist for each side; simulate blocked storage to check the save warning if practical.
11. Complete **The Great Pile Up** using the updated sequence: 17, 5, 12, 13, √205, √230.
12. Check both desktop and mobile layouts; the mobile page can scroll to preserve legibility.

## Automated verification

Run `npm run check` (Node 22+). The suite covers geometry correctness, mathematically solvable chains, no intersecting triangle interiors, in-bounds viewport fitting, drawing and editor state, and SVG assembly at four widths.

**Limitations:** these checks cannot establish pixel-perfect browser rendering or assess pen feel on actual hardware. A short live-browser classroom review remains the final acceptance step.
