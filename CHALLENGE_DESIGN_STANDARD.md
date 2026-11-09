# Pythagoras Pile-Up — Challenge Design Standard

Adopted 9 November 2026 after student feedback (6 November). This supersedes the **pedagogical** assumptions in earlier dependency-first and puzzle-architecture passes. The earlier mathematical/diagram integrity rules still apply.

## What students told us

Several students found the site text-heavy and the side-selection mechanics difficult; that is addressed separately in PR #24. Students also said the challenges became easy or boring after several questions, despite appreciating the falling assembly animation and the way connected triangles made the concept visible. This pass addresses the *mathematical tasks*, not the visual polish.

## Non-negotiable standards

1. Every triangle is truly right-angled. Every given length, equal mark, shared segment, split/overhang and rectangle diagonal is mathematically correct.
2. All authored faces are visible, connect physically, and never hide one another's interiors. A puzzle still has real floor support. Intentional empty spaces are actual spaces.
3. The stated goal x has at least one complete, justified solution from information **visible to the student**. Never rely on an unmarked coincidence of lengths.
4. Hints and worked solutions must describe the current geometry. Calculations involving new surds must remain valid and the exact-answer parser must accept them.
5. At school laptop and phone sizes, distinguish labels, lines and the selected side. Extra mechanical complexity must not come at the cost of readability or a complicated new instruction panel.
6. Geometry revisions must use a new local-storage progress namespace so answers to old coordinates are not silently reused.

## Standards deliberately retired

- **Every single face must be essential to x.** A route-choice problem *should* contain optional calculations; those faces remain useful as practice or as a longer alternative route.
- **Exactly one starting calculation.** Multiple mathematically valid entries can make planning and insight more important than following a deterministic chain.
- **More triangles always means harder.** Difficulty is about relationships, decisions and the need to reason—not a face count or repeated triple calculation.
- **Every unknown must be checked before a student wins.** Solving x by a shorter, justified route is valid. Students can review the remaining sides afterward.

Tests should establish mathematical integrity, genuine pathways, and the intended challenge mechanic instead of locking in those retired assumptions as global laws.

## Five challenge patterns

| Pattern | Educational move | Examples |
|---|---|---|
| Learn the chain | Apply the theorem and transfer a shared length | The First Fall |
| Relate and interpret | Combine a full/part edge, overhang, matching marks or rectangle | Projecting Edge, Twin Paths, Split & Project, Marble Terrace |
| Combine branches | Find two independent supports that must meet at x | Geometer's Labyrinth, Great Interlock |
| Choose a route | Notice an unnecessary calculation and find x more efficiently | Great Pile Up |
| Sustained reasoning | Work through several *varied* deductions with changing algebraic complexity | Nine Muses, Acropolis |

A new collection should include multiple patterns. Two successive puzzles should not feel like the same method with more triangles.

## Current implementation

**Challenge 6 — Great Pile Up:** a second authentic 8 cm given makes triangle III immediately ready; students may solve x in **four checked lengths** rather than always completing six steps. The full foundation route is still valid. "Find a start" can reveal the middle entry, but does not automatically fill the answer. The completion modal reports the number of lengths checked and a best-on-device route score. This is about *fewer on-screen checks*, not proof of how much handwritten working was done.

**Challenge 7 — Nine Muses:** the last three faces no longer repeat the inverse 16–30–34 triple. Instead, after recovering 16, the student obtains **√481**, then finds **20** using subtraction of 9², and reaches **x = √521 cm**. Earlier geometrically essential steps and the exact 2 cm inset are unchanged.

**Challenges 1–5 and 8–10:** original mathematically correct geometry retained in this pass; each now has a distinct one-line reasoning goal. The next design audit should focus first on extending the number of *meaningful choices* in the longer rectangle and interlock challenges, not simply adding extra triangles.

## Release checks

- All existing validity, visibility and five-screen-width browser checks must pass.
- A shortest-route test must confirm the Great Pile Up target can be reached in **exactly four** checked lengths and still has a valid full route.
- The Nine Muses tested solution must contain **√481 → 20 → √521** in its final steps.
- Check the in-game route instruction, "Find a start" choice, remaining optional triangles, completion route message, restart/persisted working, and calculator/root input.
- Do a short classroom trial and compare: instructions understood on first view; students report making genuine decisions; fewer questions described as repetitive; no regression in tapping/zooming/label legibility.

## Design review checklist for future puzzles

Before adding or rebuilding a puzzle, ask: What new decision will the student make? Why is that decision useful mathematically? Are any repetitive inverse triples intentional, or just filler? Can x be justified along every intended route? Will one concise prompt be sufficient? Can the student identify and select the necessary side on a small screen? Is the resulting solution shorter and more insightful—or merely longer?
