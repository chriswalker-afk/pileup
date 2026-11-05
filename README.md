# Pythagoras Pile Up

A mathematics puzzle website with an Ancient Greek aesthetic: watch right-angled triangles land on the geometer's tablet, then discover a chain of missing lengths using Pythagoras' theorem.

## Website

[Visit the deployed website](https://chriswalker-afk.github.io/pileup/) after publishing the `main` branch with GitHub Pages (Settings → Pages → GitHub Actions).

## How students play

1. Pick a challenge. Watch the falling triangles, or skip/replay the animation.
2. Select a marked side or click a triangle to investigate it. A side shared by two triangles has one mathematical length.
3. Enter an exact length (`√205` or `sqrt(205)`) or a suitably rounded decimal.
4. Explore independently or request progressively revealing hints.
5. Find `x` to finish, then review the full worked solution.

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
- `puzzle-engine.js` — dependency graph, valid answer evaluation and worked steps
- `PASS_A.md` and `PASS_B.md` — development/review notes
- `tests/` — automated checks
- `.github/workflows/` — GitHub Pages and validation workflows

The starter library contains two original, mathematically exact puzzles. The planned Pass C adds more challenging problem types.

## Credits

Inspired by the Pythagoras Pile Up classroom activity at [Great Maths Teaching Ideas](https://www.greatmathsteachingideas.com/) and the design credited to @mrallanmaths in the reference worksheet. The website diagrams and current puzzles are original, not reproduced scans.
