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

The library contains **six** original, mathematically exact puzzles including inset and projecting overhangs, one long side covering two shorter sides, independent branches, matching equal-length ticks, exact surds and compound-shape extensions. See [`PASS_C.md`](PASS_C.md) for mathematical answers and QA requirements.

## Credits

Inspired by the Pythagoras Pile Up classroom activity at [Great Maths Teaching Ideas](https://www.greatmathsteachingideas.com/) and the design credited to @mrallanmaths in the reference worksheet. The website diagrams and current puzzles are original, not reproduced scans.

## Working and layouts

The homepage shows all six puzzles beside the introduction on a typical desktop screen. Individual puzzle screens keep the tablet and working panel visible simultaneously, with internal scrolling for longer workings. On phones and narrow tablets the layout stacks to preserve legibility.

Each side has **maths lines** (MathLive input with roots, fractions and powers) and a **drawing pad** (pen, stroke eraser, undo, clear). Work is stored locally per side in the browser. The old free-text textarea has been replaced; previously saved text is migrated to maths lines when possible. MathLive is loaded from a pinned CDN version, with a basic LaTeX input fallback if the CDN is unavailable.
