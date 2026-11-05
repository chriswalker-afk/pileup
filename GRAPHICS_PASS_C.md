# Graphics Pass C — Completion and discovery feedback

This pass builds on merged Graphics Pass B (PR #13), finishing the Ancient Greek visual identity without compromising the maths workspace.

## Completion: a geometer's laurel

The previous single-character celebration is replaced by an original SVG laurel wreath encircling a right-triangle seal.

- Sixteen symmetrical leaves, muted stone-coloured stars and a Pythagorean triangle.
- A restrained entrance animation on successful completion; entirely static for reduced-motion users.
- Native dialog semantics: the SVG is decorative, with an accessible textual title and description.
- Exact final answer and hints-used count remain prominent.
- All four paths remain: review solution, perimeter/area extensions where available, next challenge and return to the pile.
- The dialog is internally scrollable on small or short screens, with visible keyboard focus on actionable controls.

The graphic only appears on a correctly submitted final answer. It does not overlay the working space during normal solving.

## A clearer newly discovered side

After a correct intermediate-length submission:

- The specific measurement label briefly glows green and returns to its ordinary solved appearance.
- The existing progress meter receives a short, complementary highlight.
- A compact confirmed-value panel replaces the selected side's answer form.
- Focus returns to the side selector for continued keyboard navigation.
- The animation is one-time per answer. Returning to a solved side does not trigger another animation.
- Incorrect-answer feedback and existing answer parsing are unchanged.

## Accessibility and lesson-time constraints

- A stable, concise live status announces each new length, the length found and the updated progress.
- Auto-revealed equal opposite rectangle sides are mentioned when relevant.
- The complete editor is no longer a live region, avoiding repetitive announcements.
- Completion art is hidden from screen readers; the meaningful title and mathematical result remain.
- Prefers-reduced-motion disables the completion wreath animation and solved-side glows but retains every action.
- The separate falling-puzzle Auto-play preference is unchanged.
- All nine puzzles, their overhangs and rectangles, answer tolerances, drawing pad, maths-line editor and browser-local saving are unchanged.
- The homepage and the single-screen work-focused layout are preserved.
- No external image, tracking, sound, confetti or animation library dependency is introduced.

## Automated verification

Updated SVG smoke tests confirm the dialog artwork, accessible description, status region and the review/extension/next/return controls. The new Graphics Pass C tests verify the actual original vector artwork, one-shot solution highlight, meaningful status text, responsive dialog rules and reduced-motion behaviour.

The existing mathematics, triangle/rectangle visibility, 9-puzzle by 4-width SVG checks, and drawing workspace tests remain.

## Suggested live-browser acceptance

1. At 1366 by 768, enter a correct intermediate length. Its label should briefly highlight without obscuring any other label; the progress count increases.
2. Solve a final target: verify the laurel, exact value, hint count and all enabled completion buttons.
3. On a narrow mobile device, the completion dialog must scroll so its last button remains reachable.
4. Repeat at a very short laptop viewport, and with reduced-motion enabled.
5. Test the keyboard: submit an answer, choose another side, enter the final answer, navigate the modal and return.
6. Confirm that Replay Fall, Auto-play, Skip, maths-line editor, drawing pad, larger pad and the rectangle problems still work.

## After Pass C

Merge the review PR after checks pass, then carry out a cross-device visual acceptance pass. Once the actual display and stylus interaction are confirmed, the initial graphics redesign is complete.
