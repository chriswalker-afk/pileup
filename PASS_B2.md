# Diagram refinement — compact labels, falling animation and true overhangs

This change follows PR #2 and the screenshot review.

## What changed

- **Real stacked geometry:** only the bottom triangle has an edge on a horizontal stone floor. Upper triangles join existing edges; they no longer all pivot around a ground vertex.
- **Deliberate overhang:** the second triangle shares just part of the bottom hypotenuse. The leftover section has a numerical label, an offset measurement bracket, and a straight-line relation in the mathematics engine.
- **Less trivial chains:** the upper triangle's hypotenuse is given; the unknown shorter side requires subtracting squares. The overhang must be subtracted as a separate calculation before this can be found.
- **Smaller labels:** rendering now uses a fixed 960×590 SVG presentation coordinate system instead of raw mathematical units. Measurement tags scale to approximately 12px on desktop, with responsive sizing on narrow displays.
- **Collision-aware placement:** dimension labels are individually positioned, with leader lines distinguishing full and partial lengths on a common straight line.
- **Sequential falls:** the bottom piece falls onto the floor first; later pieces tumble in with staggered timing and a bounce. The animation runs through the Web Animations API with a CSS fallback.
- **Visible replay:** toolbar contains **REPLAY FALL**, plus Skip Animation. Reduced-motion preferences still bypass the initial fall.
- **Maths and feedback:** the dependency engine handles whole = short segment + overhang. Solution reviews and hints distinguish the overhang subtraction step from applications of Pythagoras.

## Exact sequences

### The First Fall (3 triangles)
1. Bottom hypotenuse: √(16²+12²) = **20 cm**.
2. Shorter straight section: 20 − 5 = **15 cm**.
3. Triangle II missing shorter side: √(17²−15²) = **8 cm**.
4. Triangle III final target: √(8²+6²) = **10 cm**.

### The Geometer's Labyrinth (5 triangles)
1. Bottom hypotenuse: √(24²+18²) = **30 cm**.
2. Shorter straight section: 30 − 6 = **24 cm**.
3. Triangle II missing shorter side: √(26²−24²) = **10 cm**.
4. Triangle III hypotenuse: √(10²+8²) = **2√41 cm**.
5. Triangle IV hypotenuse: √((2√41)²+6²) = **10√2 cm**.
6. Triangle V final target: √((10√2)²+9²) = **√281 cm**.

Both puzzles are drawn to scale and checked for exact right angles and matching given lengths.

## Review checklist

1. Open each puzzle on the website after merging; confirm the bottom triangle's horizontal edge touches the stone floor.
2. Watch at normal motion settings. The pieces should fall individually from above, land with a subtle bounce, and reveal the labels after the last one arrives.
3. Click **REPLAY FALL**; the sequence should restart.
4. Confirm the **5 cm** / **6 cm** overhang is visible as a bracket along the shared straight line.
5. Check that the whole hypotenuse and its shorter overlapping part have distinct labels/leader lines.
6. Click every unknown side and try the exact answers in the chains above.
7. Request hints for the straight-line subtraction step and for triangle II's shorter-side subtraction.
8. Test mobile and keyboard navigation. The latest layout simulation checks at widths of 780px, 440px, 340px, and 300px reported no overlapping label rectangles.
9. Check reduced-motion preference; the scene should start with the assembled diagram, but Replay remains available.

## Tested

- Geometry construction and solution-chain invariants were executed on both new puzzles.
- The SVG assembly was simulated with a DOM stub: 3 and 5 triangle pieces; label boxes remained in bounds and non-overlapping at desktop, tablet and mobile widths.
- Every piece was assigned its own staggered Web Animations API entry in the simulation; skip cancelled playback cleanly.
- Exact, rounded and direct final-target submission were covered in prior Pass B tests.
- The CI workflow also runs the new geometry-specific tests.
