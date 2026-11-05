# Pass B — Interactive solving experience

## Delivered

- **Student-directed route:** students can click any marked side, select it from an accessible dropdown, or click a triangle. Shared sides are represented once mathematically and light up in both adjacent triangles.
- **Answer checking:** accepts integer values, exact surds such as `√205` or `5√5`, typed `sqrt(205)`, fractions, and correctly rounded decimal answers (3 significant figures or 2+ decimal places). A small safe expression parser is used: no `eval` or executable user input.
- **Non-linear solving:** any correct missing side can be submitted at any time, even when earlier lengths have not been recorded. Students may find `x` directly on paper and enter it without unlocking artificial steps.
- **Contextual feedback:** wrong answers prompt a reassessment of the hypotenuse or the required addition/subtraction of squares. Wrong entries do not erase work.
- **Four levels of clues:** where to start; known lengths; equation; result. If the chosen side is not currently solvable, clues identify an earlier available step instead of automatically revealing unrelated values.
- **Working notes:** optional free-text notes for each side, saved in local browser storage. These are not an equation editor.
- **Progress saving:** discovered lengths, notes and hint usage are saved per puzzle in the browser. Students can explicitly reset a puzzle.
- **Completion:** submitting a correct final `x` displays the completion overlay, whether or not previous answers were entered.
- **Review:** a full worked solution in one valid dependency order, with click-to-locate individual steps, available on request and after completion.
- **Accessibility:** keyboard-activated sides/triangles, a conventional select menu as an alternative to SVG hotspots, responsive fields and status messages. The existing reduced-motion behaviour is maintained.

## How to test manually

1. Open the live site after merging; choose **The First Fall**.
2. Skip or finish the animation. Choose the first missing hypotenuse (triangle I); submit `5`. It should appear on the diagram.
3. Choose the unknown side in triangle II; submit `13`.
4. Select target `x` in triangle III; submit `√205`, `sqrt(205)`, `14.3`, or `14.32`. It should be accepted, and the completion dialog should appear.
5. Reset, enter `√205` for `x` **before** intermediate sides: this must also complete the challenge.
6. Try an incorrect answer, then reveal each of the four clues, ensuring the last clue is optional.
7. Add notes in **My Working**, refresh, return to the puzzle and confirm they persist.
8. Open the full worked solution; use **Locate** on a step to highlight the associated side and triangles.
9. Try **The Geometer's Labyrinth**. Its valid exact route is `10`, `5√5`, `√174`, `√255`, then `√271`.
10. Test on mobile and by keyboard, and test reduced-motion preferences.

## Technical structure

- `index.html` — original Greek-styled page and base CSS, now referencing the ES modules.
- `pass-b.css` — solving panel, SVG hit areas, hint/review states and completion dialog.
- `app.js` — existing geometry and rendering, plus interaction, persistence and view logic.
- `puzzle-engine.js` — DOM-free side/dependency model, safe answer parser, exact formatting and solution generation.
- `tests/puzzle-engine.test.mjs` — automated geometry, subtraction, surd and answer-validation tests.
- `.github/workflows/check.yml` — CI for JavaScript syntax and the mathematics test suite.

Run `npm run check` with Node 22 or later.

## Planned Pass C

A larger curated puzzle collection, particularly **shorter-side subtraction**, branching pathways, equal-length markings and multi-part perimeter/area extensions. The two Pass A puzzles are unchanged mathematically in Pass B; both are hypotenuse-focused. The engine already supports subtraction when required by the geometry.

## Known limitations

- The site uses static local browser storage only. Nothing synchronises between devices or classrooms.
- Working is stored as text rather than typeset mathematics.
- There is no automated puzzle generation, teacher editor, login or leaderboard.
- Visual inspection on a live browser remains important before merging.
