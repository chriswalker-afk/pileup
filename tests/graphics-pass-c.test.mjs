import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const app=readFileSync(new URL("../app.js",import.meta.url),"utf8");
const css=readFileSync(new URL("../pass-graphics-c.css",import.meta.url),"utf8");
const html=readFileSync(new URL("../index.html",import.meta.url),"utf8");

test("completion laurel is genuine, static inline SVG with no external images",()=>{
  const a=app.indexOf("function completionLaurel(){");
  const b=app.indexOf("function difficultyEmblem(puzzle){",a);
  assert.ok(a>=0&&b>a,"Completion artist function missing");
  const getLaurel=new Function(app.slice(a,b)+"\nreturn completionLaurel;");
  const svg=getLaurel()();
  assert.match(svg,/^<svg class="completion-laurel" viewBox="0 0 180 130"/);
  assert.match(svg,/aria-hidden="true"/);
  assert.match(svg,/class="completion-laurel-branches"/);
  assert.match(svg,/class="completion-laurel-seal"/);
  assert.equal((svg.match(/<ellipse /g)||[]).length,16,
    "Balanced laurel should have eight leaves on each side");
  assert.equal((svg.match(/<circle /g)||[]).length,5);
  assert.doesNotMatch(svg,/<script|<foreignObject|https?:\/\//i);
  assert.match(app,/class="completion-crest">\\?\$\{completionLaurel\(\)\}/);
});

test("correct answers illuminate only the freshly solved side once",()=>{
  assert.match(app,/let pendingDiscoveredKey=null;/);
  assert.match(app,/const discoveredNow=pendingDiscoveredKey;\s*pendingDiscoveredKey=null;/);
  assert.match(app,/if\(discoveredNow===side\.key\)classes\.push\("just-discovered"\);/);
  assert.match(app,/"data-side-key":side\.key/);
  assert.match(app,/pendingDiscoveredKey=side\.key;/);
  assert.match(app,/saveProgress\(\);\s*renderDiagram\(false\);/);
  assert.match(app,/classList\.add\("progress-advanced"\)/);
  assert.match(app,/pendingDiscoveredKey=null;\s*loadProgress\(\)/);
  assert.match(css,/#diagram svg \.side-chip\.just-discovered rect/);
  assert.match(css,/@keyframes side-discovered-glow/);
  assert.match(css,/@keyframes progress-discovery-glow/);
});

test("screen readers receive concise, meaningful status without reannouncing the editor",()=>{
  assert.match(app,/id="progress-announcement" class="screenreader-only" role="status" aria-live="polite" aria-atomic="true"/);
  assert.doesNotMatch(app,/id="inspector" aria-live="polite"/);
  assert.match(app,/announcement\.textContent=\(side\.isTarget\?"Final length solved: ":"Length discovered: "\)/);
  assert.match(app,/Matching rectangle lengths added automatically/);
  assert.match(app,/document\.getElementById\("side-select"\)\?\.focus/);
  assert.match(css,/\.screenreader-only\s*\{/);
  assert.match(app,/aria-labelledby="completion-heading" aria-describedby="completion-subtitle"/);
  assert.match(app,/dialog\.querySelector\("#completion-review"\)\?\.focus/);
  assert.match(app,/id="worked-solution-heading" tabindex="-1"/);
  assert.match(app,/panel\.querySelector\("#worked-solution-heading"\)\?\.focus/);
  assert.match(app,/class="hint-content" role="status" aria-live="polite"/);
  assert.match(app,/clue\.setAttribute\("aria-live","polite"\)/);
});

test("modal stays scrollable and useful on narrow and short screens",()=>{
  assert.match(html,/<link rel="stylesheet" href="\.\/pass-graphics-c\.css">/);
  assert.match(css,/\.completion-dialog\s*\{[^}]*max-height:min\(94dvh,680px\)/);
  assert.match(css,/\.completion-dialog\s*\{[^}]*overflow-y:auto/);
  assert.match(css,/@media\(max-width:520px\)/);
  assert.match(css,/@media\(max-height:630px\)/);
  assert.match(css,/\.completion-controls button\{min-height:44px/);
  assert.match(css,/\.completion-dialog button:focus-visible/);
  assert.match(css,/#diagram svg \.side-chip:focus-visible rect/);
  assert.match(css,/body\[data-view="puzzle"\] \.side button:focus-visible/);
  assert.match(css,/\.completion-overline/);
  assert.match(css,/\.completion-inner \.completion-answer/);
  for(const id of ["completion-review","completion-extra","completion-other","completion-close"]){
    assert.match(app,new RegExp('id="'+id+'"'),"Required action "+id+" must stay visible");
  }
});

test("motion is respectful and graphics do not obscure maths or pen working",()=>{
  const reduced=css.slice(css.indexOf("@media(prefers-reduced-motion:reduce)"));
  assert.match(reduced,/side-chip\.just-discovered rect/);
  assert.match(reduced,/\.completion-laurel-branches/);
  assert.match(reduced,/animation:none!important/);
  assert.match(reduced,/transform:none!important/);
  assert.doesNotMatch(css,/\.ws-ink-frame\s*\{/);
  assert.doesNotMatch(css,/\.ws-ink-canvas\s*\{/);
  assert.doesNotMatch(css,/#diagram svg \.piece\s*\{/);
  assert.doesNotMatch(css,/pointer-events:\s*auto/);
});
