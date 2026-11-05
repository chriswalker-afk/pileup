# Graphics Pass A — Ancient Greek visual character

This pass makes the existing nine-puzzle homepage more visual while retaining the **single-screen desktop dashboard** and the puzzle workspace.

## What changed

### 1. Animated geometric hero
- Replaces the plain △ placeholder in the homepage introduction with a **custom vector engraving built from the actual three triangles in The First Fall**.
- Uses those triangles' true vertices, right-angle markers, Roman numerals and final `x`.
- Adds a faint circular construction instrument, fine mathematical guide lines, small decorative marks and a stone floor.
- Triangle pieces land in sequence with gentle CSS keyframe animation; the goal label appears after them.
- The hero is decorative and `aria-hidden`; the actual activity is still the interactive SVG on the puzzle page with its own **Auto**, **Replay** and **Skip** controls.
- `prefers-reduced-motion: reduce` displays the finished engraving without movement.

### 2. Real visual previews for all nine cards
- Each challenge has a thumbnail generated from **its own true triangle and rectangle coordinates**, never a repeated generic picture.
- Rectangles also show their dashed diagonals in the thumbnail.
- Adds a subtle circle/construction grid and floor in each drawing.
- A structured two-column card layout reserves real space for the thumbnail beside the title and short description.
- Crucially, **removed the accidental visual hiding of thumbnails** at laptop widths 900–1230px and on short laptop screens.
- The desktop catalogue remains 3 × 3, with existing two- and one-column layouts on narrower screens.

### 3. Small Greek architectural details across the site
- New locally stored `assets/greek-key.svg` creates a thin repeating Greek-key ornament along the header and footer.
- The seal gets a second fine engraved ring, and the header note gets a restrained geometric symbol.
- Page decorations are `pointer-events:none`, so no buttons, links, mathematical diagrams, working pads, or animations lose functionality.
- Ancient Greek parchment, muted stone/gold colours and typographic hierarchy are retained.

## Scope and constraints

- No decorative image library or remote photo assets; graphics use inline SVG and one tiny local SVG pattern.
- No extra homepage sections or vertical scrolling at ordinary desktop sizes.
- No changes to the mathematical geometry engine, puzzle answers, student work saving, progress, falling animation of the *interactive puzzles*, hint reveal or accessibility controls.
- The hero and card graphics are illustrative. They must not be selectable or confused with the student's interactive work.

## Files

- `app.js`: `homeHeroIllustration()` and enhanced `miniPreview()`.
- `pass-graphics-a.css`: new graphics and responsive sizing.
- `assets/greek-key.svg`: reusable frieze.
- `index.html`: load the new stylesheet last.
- `tests/ui-smoke.test.mjs`: verify the real three-piece hero and exact count of thumbnail polygons/rectangle diagonals across the nine challenges.
- `tests/graphics-pass-a.test.mjs`: verify responsive visibility, vector ornament and reduced-motion support.

## Suggested visual QA

1. Open the **homepage at 1366 × 768**. The full introduction, engraved hero and all nine cards should fit without page scrolling.
2. At **1024 × 768**, verify that every card has a distinct visible miniature pile. All title and Explore text should remain legible.
3. Try **1280 × 600**; even on a short laptop the hero and previews should remain visible rather than being hidden.
4. On phone and narrow tablet widths, ensure cards stack without cropping text or figures. Vertical scrolling is intentional on mobile.
5. Confirm that *The Marble Terrace* and *The Acropolis* thumbnails visibly show the rectangles and dashed diagonal(s).
6. Turn on **Reduced Motion** in the device settings: the decorative intro should appear static, not absent.
7. Open a puzzle, replay its actual falling sequence, and check the mathematical diagram and work area are unaffected.
8. Confirm Greek-key motifs appear on the site header and footer without blocking navigation or controls.

## Next graphics pass

Pass B can add a restrained ornamental tablet frame, empty-working-space watermark and differentiated difficulty emblems. Keep those changes secondary to the geometry and maths editor.
