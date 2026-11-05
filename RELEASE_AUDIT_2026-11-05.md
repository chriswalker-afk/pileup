# Pythagoras Pile Up — release usability and visual audit

**Date:** 5 November 2026  
**Code under review:** GitHub pull request #15, branch `audit-real-browser-nine-puzzles`  
**Audit environment:** Google Chrome 156, Ubuntu GitHub Actions runner; local HTTP serving the current pull-request code  
**Result:** **62 / 62 browser checks passed**, plus the existing repository mathematics and JavaScript checks.

## Coverage

The automated audit uses actual browser layout and user interaction, not only the synthetic DOM tests used in the earlier development passes.

| Viewport | Dimensions | Homepage | Nine puzzle layouts | Drawing canvas |
|---|---:|---|---|---|
| Desktop | 1366 × 768 | Pass | All pass | Regular and larger pad pass |
| Short laptop | 1024 × 640 | Pass | All pass | Regular and larger pad pass |
| Tablet | 768 × 1024 | Pass | All pass | Regular and larger pad pass |
| Phone | 390 × 844 | Pass | All pass | Regular and larger pad pass |
| Small phone | 320 × 568 | Pass | All pass | Regular and larger pad pass |

This is **45 individual puzzle/viewport checks**, five homepage checks, five drawing/workspace checks, and seven extra interaction checks. The site includes six earlier puzzles plus The Nine Muses, The Marble Terrace and The Acropolis.

### Tested and passing

- All nine geometries are present, with the expected rectangles in the final two advanced challenges.
- No polygon or dimension label extends outside the SVG tablet at the five measured widths.
- No dimension-label bounding boxes overlap by more than the browser audit's 1.5 px tolerance.
- Matching equal-length ticks are present in Twin Paths.
- No whole-page horizontal scrolling on home or puzzle screens.
- All nine home cards have distinct genuine puzzle previews; card text and thumbnails remain inside their allocated areas.
- Drawing paper fully contains the ink canvas at both pad sizes. Solution/Reset controls follow the parchment and can be reached by scrolling the inspector when necessary.
- Maths mode returns to the flexible working layout after switching from Draw.
- Automatic falling on the initial puzzle, Replay, Skip, and the delayed appearance and visibility toggle of labels/ticks.
- Correct target value opens the accessible completion dialog; the laurel art stays inside its allocated space, separate from the heading.
- Full worked solution can be accessed from the completed puzzle.
- A hint does not destroy typed mathematical working; a correctly found intermediate length highlights and produces a concise accessible progress announcement.
- Typed maths and drawing strokes are retained across a page refresh.
- The reduced-motion default is respected and the explicit Auto ON preference works in the current and following puzzles.
- The completion dialog's final action is reachable at 390 × 844 and 320 × 568.

The repository's existing `npm run check` also passes, covering exact-length calculations, right angles, shapes that do not obscure each other, and the previously authored tests.

## Real defects found and fixed in PR #15

### 1. Mobile challenge cards were effectively three columns — high priority

**Before:** A late `pass-graphics-a.css` rule overrode the earlier phone grid and forced nine cards into three narrow columns. The 390 px browser measured one card at roughly 114 px wide, causing clipped titles and a thumbnail outside its card. This occurred at both phone widths.

**Fix:** Restore two columns for 561–899 px and one column at 560 px and below; keep the three-column desktop gallery. All mobile cards now display text and graphics without clipping.

### 2. Drawing parchment overflow on short laptops — high priority

**Before:** In drawing mode, the inspector's flex layout sometimes allocated less height to the mount than its contained parchment and canvas required. The Reveal Full Solution / Start Again actions consequently appeared over the bottom of the drawing region. This was reproducible at 1024 × 640, and also occasionally at desktop height.

**Fix:** Switch the inspector to normal block flow **only in Draw mode**, restore the original flex layout for Maths, and cleanly remove the class when the editor unmounts. The inspector remains independently scrollable on desktop. Both drawing heights now contain the entire canvas and leave controls below it.

### 3. The completion laurel covered its own heading — medium priority

**Before:** The inline SVG wreath could spill beyond its reserved crest area, visually overlapping “The pile is solved.” The original visual check missed this because it only tested whether the dialog opened.

**Fix:** Bound the SVG to its reserved illustration region, clip excess, and maintain an explicit gap before the heading. New browser assertions check the actual artwork and title positions on desktop and the two phone sizes.

## Browser evidence

The Browser and visual usability audit GitHub Action produces:
- `report.json` containing each check and measured metrics.
- Full-page PNG screenshots of the desktop and phone homepages, The First Fall, The Acropolis, both drawing sizes, the short-laptop pad, and the solved completion dialog.
- A temporary GitHub Actions artifact called `pileup-browser-audit` for each run (14-day retention).

**Final passing run:** https://github.com/chriswalker-afk/pileup/actions/runs/41991534218  
**Screenshots and JSON artifact:** https://github.com/chriswalker-afk/pileup/actions/runs/41991534218/artifacts/13398641763

## Remaining review notes (not blocking in Chromium)

1. **The Acropolis is dense on a phone.** No side label technically overlaps or leaves the diagram, but 10 triangles, two rectangles and many measurements create significant visual complexity. An optional “focus on one calculation” mode could make very advanced puzzles easier to navigate on narrow devices.
2. **Offline maths input was verified.** The audit intentionally blocked outside resources to check the native LaTeX fallback when MathLive and web fonts do not load. The CDN-hosted MathLive experience and final font metrics require a separate connected-browser check.
3. **Actual iOS/Safari, screen readers and real stylus input were not physically tested.** Responsive Chrome emulation covers dimensions and touch viewport characteristics, but does not replace Apple Pencil/iPadOS, VoiceOver, or an actual mobile classroom session.
4. **The branch was tested with a local HTTP server.** GitHub Pages deployment/caching and network availability remain separate from browser correctness.

## Reproduce

Open a PR to trigger the permanent audit workflow, or run **Browser and visual usability audit** manually in GitHub Actions after the PR is merged.

For a local Chromium installation and Node 22:

```bash
npm install --no-save playwright-core@1.56.1
python3 -m http.server 4173
# In another terminal:
CHROME_PATH=/usr/bin/google-chrome node scripts/browser-audit.mjs
```

Screenshots and detailed JSON are written to `audit-artifacts/`. The audit exits with an error when any measured release check fails.

## Release recommendation

**Ready for review and merge** based on the passing Chromium audit. After PR #15 merges and GitHub Pages publishes, manually check the live website on an iPhone and (if available) an iPad with stylus. If those pass, the visual redesign can be considered complete and future passes can focus on mathematical learning rather than graphical polish.
