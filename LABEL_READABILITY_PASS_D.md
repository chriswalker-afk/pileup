# Diagram Readability Pass D — Exact Length-to-Side Associations

## Problem

After the dependency-first redesign, the site has more small right triangles packed around shared junctions. Earlier tests prevented overlapping text boxes but did not guarantee that a student could confidently identify **which mathematical side a number referred to**.

The fix is *not* to add opaque labels or a forest of arrows. It combines exact, fine attachments, fewer initial unknowns in crowded areas, and deliberate one-tap inspection of a small face.

## At rest: quiet but unambiguous

- Every displayed measurement has a fine **tether from its actual side** to the nearest border of its label chip, plus a tiny anchor dot.
- The connection begins at the segment midpoint, the exact whole/part bracket, or (when a small label obscures the midpoint) another clear point **on that same segment**. It may not jump to an unrelated corner or side.
- All necessary **givens**, previously calculated lengths and **target x** remain visible.
- Unknown `?` labels on short sides surrounded by multiple other triangles may be postponed until the student chooses the corresponding face. Dense #7, #9 and #10 continue to use context-first labels.
- The layout optimisation penalises a side crossed by another label's attachment, and prevents clips, overlapping chips and chips sitting over their own measured line where alternative placement is available.
- One can still select every length directly through the SVG hit targets or the side chooser; postponed `?` chips do not make a mathematical step inaccessible.

## When a small triangle is selected

- Clicking or tapping a compact face opens its missing measurements and **automatically focuses that triangle**, strongly muting unrelated chips, tethers and shapes.
- Hover, keyboard focus and selection still illuminate the **full, exact measured segment and its endpoints**, not an estimated path.
- A student can use existing Zoom, Fit and Locate controls at any stage.
- **All Labels** is a genuine, explicit override: it reveals all postponed question marks and disables automatic focus. Another shape selection does not silently reactivate Focus View.
- **Focus View** restores context-first display. The choice resets when starting another puzzle, not on every click.

## QA contract

For each of the ten puzzles and five browser sizes:

1. All displayed labels stay inside the diagram without overlapping another chip or the zoom toolbar.
2. Exactly one visible tether belongs to every displayed chip.
3. Its anchor lies on its own precise side or the displayed whole/part bracket—not a nearby equal-looking side.
4. The other end touches that chip's border rather than its interior or the surrounding diagram.
5. No tether collapses to an invisible zero-length association, even for very short edges.
6. Dense diagrams reveal additional unknowns on selecting a triangle and permit a manual All Labels override.
7. Highlight and Focus do not obscure the student's working or break the existing handwritten maths editor.
8. No triangle geometry, right angles, exact mathematical lengths, progression, solutions or stored progress keys change.

### Student acceptance question

*Without hovering, can I follow a visible number to a particular full segment or clearly bracketed subsegment? If I tap a cramped small triangle, does it become obvious which lengths belong to it?*

Pass D succeeds only if both answers are yes.
