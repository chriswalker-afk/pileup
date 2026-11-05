# Pass A — Ancient Greek prototype

## Delivered
- An Ancient Greek visual system: warm parchment, stone tablet, classical Cinzel typography, Greek-key-inspired borders, bronze accents, and muted terracotta, blue and sage triangle pieces.
- Responsive homepage with introduction, three-stage activity explanation and two selectable challenges.
- Two original interactive SVG puzzles: **The First Fall** (3 triangles) and **The Geometer's Labyrinth** (5 triangles).
- Geometry-driven falling and settling animation, with replay and skip buttons, plus reduced-motion support.
- Measurements and right-angle markers drawn as SVG elements, with click-to-focus exploration of individual triangles.
- Static GitHub Pages deployment workflow (no accounts or back-end required).

## Mathematical verification
All triangles are constructed by attaching a new perpendicular leg externally to the previous triangle's hypotenuse. Side lengths are based on Euclidean coordinates, never decorative arbitrary polygons.

**The First Fall**
- Start with a 3–4–5 triangle.
- Attach a leg of 12: new hypotenuse 13.
- Attach a leg of 6: final side x = sqrt(205) cm (approximately 14.318 cm).

**The Geometer's Labyrinth**
- Start with a 6–8–10 triangle.
- Attach perpendicular legs of 5, 7, 9 and 4 in sequence.
- Final side x = sqrt(271) cm (approximately 16.462 cm).

The programme checks right-angle dot products and given-length measurements during puzzle construction. The independent coordinate-model test was also executed before creating this branch.

## Scope boundary
Pass A is for visual and mathematical review. It intentionally does **not** check typed answers, reveal worked solutions or track student progress. Those are scheduled for Pass B.

## Deployment
The repository contains a Pages workflow publishing the root of main after merge. In repository **Settings → Pages**, select **GitHub Actions** as the build and deployment source if it is not selected already. The expected project URL after deployment is https://chriswalker-afk.github.io/pileup/ .

## Review checklist
1. Open the homepage on desktop and mobile.
2. Start each challenge; triangles should fall and settle without drifting.
3. Check the diagram's known side labels, final x and right-angle markers.
4. Replay and skip the animation.
5. Select a triangle, then clear the selection.
6. Toggle the dimension labels.
7. Confirm that reduced-motion settings skip the tumbling sequence.
8. Give feedback on Ancient Greek appearance, geometry readability and animation pacing.

## Credit
Based on the classroom activity presented at greatmathsteachingideas.com and the design credited to @mrallanmaths in the reference worksheet. All two interactive puzzles are newly authored and are not literal reproductions of the PDF.
