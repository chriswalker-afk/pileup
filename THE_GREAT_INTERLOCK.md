# The Great Interlock — Tenth Puzzle

An original 13-triangle Pythagoras pile inspired by the irregular, brightly
interlocked *structure* of the supplied Pythagorean Stack reference. This is
not a trace or mathematical copy of the source.

## What makes it distinctive

- **A wide horizontal roof target**, rather than another rising diagonal.
- **Thirteen non-overlapping right triangles**, with genuinely different
  orientations, long swept wings, a dense collection of smaller wedges,
  short straight-line offsets, and an open central void.
- **Two grounded triangles**; the left one meets the slanted side of a
  supporting wedge at an interior point, not just a pre-existing corner.
- **Two independent and indispensable calculation routes.** Neither
  foundation may be omitted to solve the target.
- **Two measured 5 cm offsets** on separate slanted edges. They combine
  with 12 cm and 8 cm sections to form 17 cm and 13 cm hypotenuses.
- **Two upper roof sections**, 10 cm and 15 cm, form a single 25 cm
  diagonal. A final 7–24–25 right triangle gives the **24 cm roof**.

## Fully worked mathematical logic

### Left-hand route
1. Left foundation: 15² + 20² = 25², so from its given base 15 and hypotenuse 25 the upright is **20 cm**.
2. Matching tick marks transfer the 20 cm length to the hypotenuse of the long left wedge.
3. That wedge's given leg is 16, so its shared leg is √(20²−16²) = **12 cm**.
4. The adjacent 5–12–13 triangle gives a shared diagonal of **13 cm**.
5. Subtract its 5 cm perpendicular leg: √(13²−5²) = **12 cm** along the next 12 cm section.
6. Add the measured 5 cm offset to get a whole length of **17 cm**.
7. The 8–15–17 triangle gives **8 cm**; combined with the given 6 cm leg, the upper left roof has hypotenuse **10 cm**.

### Right-hand route
1. Right foundation: from base 8 and hypotenuse 17, upright √(17²−8²) = **15 cm**.
2. Tick marks transfer 15 cm to the long right wedge.
3. Its hypotenuse is given as 17, so its adjoining shared leg is **8 cm**.
4. The 6–8–10 wedge produces **10 cm**; removing the next 6 cm perpendicular yields **8 cm**.
5. The right 5 cm offset extends that to a **13 cm** hypotenuse.
6. The 5–12–13 right triangle yields **12 cm**; with the upper 9 cm leg, the upper right roof has hypotenuse **15 cm**.

### Rejoin at the summit
- The top supporting diagonal is 10 + 15 = **25 cm**.
- The top right triangle has perpendicular height 7 cm.
- Therefore x = √(25²−7²) = **24 cm**.

The student can also start from the right-hand support and solve the two
routes in either order. The solution engine marks exact lengths and
matching-side deductions as normal interactive steps.

## Review before merging

Open `#great-interlock` in a PR preview. Check the silhouette against
the supplied photograph: broad roof, dense upper junctions, alternating
wedges and two floor supports. Try 100%/200% zoom and Focus for the
crowded centre. Hover several short offset labels to confirm exact side
traces, then use the full worked solution and verify x = 24 cm.

The Playwright browser audit must check all **ten** challenges at five
viewport sizes; screenshots should include both desktop and phone
versions of this puzzle. Real-device review is still useful before
classroom deployment.
