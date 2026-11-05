# Dependency-first redesign — puzzles 4, 6, 7 and 9

## Classroom goal

The four reference pictures show why a Pythagoras *pile up* should feel like a geometric argument, not several triangles positioned near one another. Each newly found length must be a legitimate input to a subsequent, visibly connected step. The replacement diagrams avoid the former "one triangle bridging two peaks" device.

**No unexplained equal lengths:** a reused measurement must either be literally the same shared segment, follow from an indicated rectangle, or be related by a measured collinear whole-and-parts bracket. Only the successive rectangles in #9 need matching-side tick marks; both are drawn.

### Challenge 4 — Split & Project
**Shape:** four coloured triangles fold back and forth from one 3–4–5 floor piece. The final cap sits along **part** of a sloping roof rather than covering it perfectly.

**Main solution route (cm):**
1. Triangle I: 3² + 4² = 5²; shared hypotenuse **5**.
2. Triangle II: hypotenuse 13, shared leg 5; missing leg √(13² − 5²) = **12**.
3. Triangle III: legs 12 and 5; hypotenuse **13**.
4. Clearly marked overhang 2 on that edge; the next triangle uses 13 − 2 = **11**.
5. Triangle IV: x² = 11² + 6²; **x = √157 cm**.

No hidden matching sides; every transfer is a physically identical segment.

### Challenge 6 — Great Pile Up
**Shape:** six alternating triangles form a broad zigzag and an asymmetric upper roof, not a bridge between separate supports.

**Main solution route (cm):**
1. 8 and 6 give diagonal **10**.
2. 10 and 6 give leg **8**.
3. 8 and 15 give diagonal **17**.
4. 17 and 8 give leg **15**.
5. 15 and 20 give diagonal **25**.
6. 25 and 7 give final leg **x = 24 cm**.

Each unknown is the geometric edge used by the immediately following triangle. The alternation of adding and subtracting squares is deliberate.

### Challenge 7 — The Nine Muses
**Shape:** a nine-face cascade leans up and left, like the taller reference example. One small, explicit offset creates a real whole/part decision.

**Main solution route (cm):**
1. 12 and 5 → **13**.
2. 13 and 5 → **12**.
3. 12 and 9 → **15**.
4. Marked offset: 15 − 2 = **13**.
5. 13 and 5 → **12**.
6. 12 and 16 → **20**.
7. 20 and 12 → **16**.
8. 16 and 30 → **34**.
9. 34 and 16 → **30**.
10. 30 and 11 → **x = √1021 cm**.

The subtraction is an actual collinear 2 cm segment; no step presumes an equality that the diagram does not show.

### Challenge 9 — The Acropolis
**Shape:** a compound staircase, with two real rectangular platforms connected *in sequence*, followed by a variety of small wedges. There is no unsupported upper beam.

**Main solution route (cm):**
1. Triangle I: hypotenuse 13 and floor leg 12 → height **5**.
2. Rectangle R1: diagonal 13 and height 5 → width **12**.
3. Triangle II: hypotenuse 20 and shared width 12 → upright **16**.
4. Rectangle R2: diagonal 20 and shared height 16 → roof width **12**.
5. Triangle III: 12 and 5 → **13**.
6. Triangle IV: 13 and 5 → **12**.
7. Measured inset: 12 − 2 = **10**.
8. Triangle V: 10 and 6 → **√136**.
9. Triangle VI: √136 and 10 → **6**.
10. Triangle VII: 6 and 8 → **10**.
11. Triangle VIII: 10 and 6 → **8**.
12. Triangle IX: 8 and 15 → **17**.
13. Triangle X: 17 and 8 → **x = 15 cm**.

Both diagonal calculations are indispensable. The marked equality groups are on actual opposite horizontal sides of R1 and R2; no tick is drawn for unrelated equal numbers.

## Tests and review

- `tests/reworked-dependencies.test.mjs` checks every individual triangle is indispensable to x, the two Acropolis rectangle diagonals are both required, the 2 cm offset endpoints are exact, and all matching marks refer to real equal edges.
- The normal geometry/visibility tests check right angles, uncropped pieces, physical connections and zero hidden polygons.
- `scripts/browser-audit.mjs` exercises all ten challenges at five viewport sizes and saves desktop/phone screenshots. For crowded puzzles, click a piece to reveal its relevant unknowns, then use Focus and Locate while zoomed.
- Saved work for only these four puzzles uses new progress keys. Previously saved data is retained separately rather than applied to new geometry.

Keep the pull request unmerged until the four silhouettes, the marked relationships and the complete worked solutions pass both automated and human review.
