import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const css=readFileSync(new URL("../pass-graphics-b.css",import.meta.url),"utf8");
const html=readFileSync(new URL("../index.html",import.meta.url),"utf8");
const watermark=readFileSync(new URL("../assets/scribe-triangle.svg",import.meta.url),"utf8");
const app=readFileSync(new URL("../app.js",import.meta.url),"utf8");

test("new graphical layer uses only local reusable vector artwork",()=>{
  assert.match(html,/<link rel="stylesheet" href="\.\/pass-graphics-b\.css">/);
  assert.match(css,/assets\/greek-key\.svg/);
  assert.match(css,/assets\/scribe-triangle\.svg/);
  assert.match(watermark,/<svg[^>]*viewBox="0 0 240 230"/);
  assert.match(watermark,/<path d="/);
  assert.ok(!watermark.includes("<script"));
  assert.ok(!css.includes("http://")&&!css.includes("https://"),
    "Decorative illustrations must not depend on external content");
});
test("five named tier emblems accompany, not replace, difficulty labels",()=>{
  assert.match(app,/function difficultyEmblem\(puzzle\)/);
  for(const tier of ["triangle","double","column","laurel","temple"]){
    assert.match(app,new RegExp(tier+':'));
    assert.match(css,new RegExp('difficulty-'+tier));
  }
  assert.match(app,/aria-hidden="true" focusable="false" viewBox="0 0 36 36"/);
  assert.match(app,/home-card-number/);
  assert.match(app,/CHALLENGE \$\{String\(index\+1\)/);
});
test("tablet ornament is visual-only and cannot steal drawing events",()=>{
  assert.match(css,/\.tablet-engraving\s*\{[^}]*pointer-events:none/);
  assert.match(app,/class="tablet-engraving" aria-hidden="true"/);
  assert.match(app,/class="tablet-seal" aria-hidden="true"/);
  assert.match(css,/#diagram\s*\{[^}]*z-index:1/);
  assert.match(css,/\.skip\s*\{z-index:3/);
  assert.match(css,/\.diagram-caption\s*\{z-index:1;pointer-events:none/);
  assert.doesNotMatch(css,/\.piece\s*\{[^}]*pointer-events:none/);
});
test("empty drawing watermark stays behind the handwriting surface",()=>{
  assert.match(css,/\.ws-ink-frame\.ws-ink-empty::before\s*\{[^}]*pointer-events:none/);
  assert.match(css,/\.ws-ink-canvas\s*\{position:relative;z-index:1/);
  assert.match(css,/\.ws-ink-frame::after\s*\{z-index:2/);
  assert.match(css,/\.ws-ink-frame\.ws-ink-empty::before[\s\S]*?opacity:\.17/);
  assert.match(css,/@media \(min-width:900px\) and \(max-height:730px\)/);
  assert.match(css,/@media \(max-width:650px\)/);
});
