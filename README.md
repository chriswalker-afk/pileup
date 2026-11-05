# Pythagoras Pile Up

A mathematics puzzle website with an Ancient Greek aesthetic: watch right-angled triangles land on the geometer's tablet, then discover a chain of missing lengths using Pythagoras' theorem.

## Website

[Visit the deployed website](https://chriswalker-afk.github.io/pileup/) after publishing the `main` branch with GitHub Pages (Settings → Pages → GitHub Actions).

## How students play

1. Pick a challenge. Watch the falling triangles, or skip/replay the animation.
2. Select a marked side or click a triangle to investigate it. A side shared by two triangles has one mathematical length.
3. Enter an exact length (`√281` or `sqrt(281)`) or a suitably rounded decimal.
4. Record your reasoning as properly typeset mathematical lines or draw directly onto the sketch pad. Explore independently or request progressively revealing hints.
5. Find `x` to finish, then review the full worked solution. Two puzzles also unlock perimeter and area extensions.

Any correct length can be entered, in any order; students may solve the puzzle on paper and enter the final answer directly.

## Run locally

The website is a static site with native ES modules and no installation or build step. Serve the repository directory locally rather than opening `index.html` directly with the `file://` protocol:

```bash
python3 -m http.server 8000
```

Open `http://localhost:8000`.

To verify the mathematical engine and JavaScript syntax (Node 22+):

```bash
npm run check
```

## Project files

- `index.html` — base Ancient Greek interface
- `pass-b.css` — student-solving UI styles
- `app.js` — frontend geometry, interactions, progress and animations
- `puzzle-engine.js` — dependency graph, equal-length marks, valid answer evaluation and worked steps
- `pile-geometry.js` — curated puzzle catalogue with overhang layouts
- `pile-variants.js` — precise split-edge and bridging arrangements
- `pass-c.css` — collection preview and extension styling
- `working-space.js` — line-by-line maths editor and drawing pad
- `pass-d.css` — compact, responsive single-screen layouts and working UI
- `PASS_A.md`, `PASS_B.md`, `PASS_B2.md`, `PASS_C.md`, and `PASS_D_WORKSPACE.md` — development/review notes
- `tests/` — automated checks
- `.github/workflows/` — GitHub Pages and validation workflows

The library contains **nine** original, mathematically exact puzzles including inset and projecting overhangs, one long side covering two shorter sides, independent branches, matching equal-length ticks, exact surds and compound-shape extensions. See [`PASS_C.md`](PASS_C.md) for mathematical answers and QA requirements.

## Credits

Inspired by the Pythagoras Pile Up classroom activity at [Great Maths Teaching Ideas](https://www.greatmathsteachingideas.com/) and the design credited to @mrallanmaths in the reference worksheet. The website diagrams and current puzzles are original, not reproduced scans.

## Working and layouts

The homepage shows all nine puzzles beside the introduction on a typical desktop screen, with one-column cards on phones. Individual puzzle screens keep the tablet and working panel visible simultaneously, with internal scrolling for longer workings. On phones and narrow tablets the layout stacks to preserve legibility.

Each side has **maths lines** (MathLive input with roots, fractions and powers) and a **drawing pad** (pen, stroke eraser, undo, clear). Work is stored locally per side in the browser. The old free-text textarea has been replaced; previously saved text is migrated to maths lines when possible. MathLive is loaded from a pinned CDN version, with a basic LaTeX input fallback if the CDN is unavailable.

## Full-triangle visibility and usability

**Every triangle must be entirely visible.** Shared edges, split sides and overhangs are allowed, but triangle interiors may never cover each other. A geometry guard checks every authored challenge and fits it inside the tablet viewport. The master puzzle now ends at **√230 cm** with five visible triangles.

Students can switch between a compact or wider working panel on desktop, enlarge the drawing pad, and reveal hints without resetting their maths or ink. See [`USABILITY_PASS.md`](USABILITY_PASS.md) for the detailed QA checklist.

## Advanced puzzles and student workspace

Three harder problems extend the catalogue: **The Nine Muses** (9 triangles), **The Marble Terrace** (8 triangles + rectangle) and **The Acropolis** (10 triangles + two rectangles). Rectangles contribute mathematical reasoning through their diagonals and equal opposite sides. See [Advanced challenges](ADVANCED_CHALLENGES.md) for the answer chains and testing checklist.

The student panel prioritises maths lines and handwriting rather than explanatory text. A general scratchpad is available before choosing a side, with separate per-side working saved locally.


## Automatic falling animation

A puzzle normally **animates as soon as it opens**, with labels appearing after the final triangle or rectangle settles. Use **Replay Fall** to watch the construction again or **Skip Animation** to show the finished puzzle immediately.

If your device requests **reduced motion**, the site initially respects that preference and shows the assembled pile. The tablet toolbar displays **AUTO OFF**. Click or tap it once to enable **AUTO ON** for this website; your choice is saved in this browser, and every subsequently opened puzzle will begin falling automatically. Turning AUTO OFF stops automatic falling while leaving the manual Replay control available. The selection also works across page refreshes.

The first-fall completion timer starts **only after the first animation frame**. This prevents opening a puzzle in a background tab from silently finishing its animation before you view it.


## Drawing-pad sizing

In **Draw** mode, the yellow parchment grows to contain the entire freehand canvas, including when **Larger pad** is selected. The **Reveal Full Solution** and **Start Again** controls follow it in the normal layout; they are never covered by the canvas. On short desktop screens, scroll **inside the right-hand inspector** to reach those controls. On phones, the page scrolls normally. Switching back to **Maths** restores the flexible line-by-line workspace without losing saved drawing strokes.

## Graphics — Pass A

The homepage includes an animated Ancient Greek-style geometric engraving **drawn from the actual First Fall triangles** and a miniature picture of **each of the nine real puzzle arrangements**. The gallery diagrams remain visible at compact laptop widths rather than disappearing. A lightweight Greek-key SVG frieze ties together the header and footer across pages. Decorative animation respects reduced-motion settings, independently of the interactive puzzle's falling animation.

See [GRAPHICS_PASS_A.md](GRAPHICS_PASS_A.md) for the design decisions, test coverage and visual review checklist.

## Graphics — Pass B

Puzzle pages now carry engraved difficulty seals, a Greek-key tablet frame and a faint geometric watermark **only when the drawing pad is empty**. The illustration disappears as soon as drawing starts and returns when the last stroke is removed. Decoration sits behind the interactive diagram and does not capture mouse or touch input. See [Graphics Pass B](GRAPHICS_PASS_B.md) for design and QA notes.

## Graphics — Pass C

A completed pile now reveals an Ancient Greek laurel-and-Pythagoras seal, with the exact final answer and the existing review/extension/next-pile controls. Correct intermediate lengths briefly illuminate their own label, advance the progress meter and announce the new discovery through a concise screen-reader status. Effects respect reduced-motion settings and leave the working area unchanged. See [Graphics Pass C](GRAPHICS_PASS_C.md) for details and an acceptance checklist.

## Browser release audit (5 November 2026)

The site includes a real-Chromium browser audit across **five screen sizes**, testing all **nine puzzles**, the homepage, drawing pad, autoplay, exact-answer completion, saved working and reduced-motion settings. The audit found and fixed the mobile challenge-gallery column bug, short-laptop drawing parchment overflow, and completion-wreath/title overlap.

**Final verified result: 62 of 62 browser checks passed**, in addition to `npm run check`. See [Release audit and review notes](RELEASE_AUDIT_2026-11-05.md) for a full coverage matrix, fixes, screenshots and remaining iOS/stylus test limitations.
