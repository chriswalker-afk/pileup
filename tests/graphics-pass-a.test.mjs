import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const css=readFileSync(new URL("../pass-graphics-a.css",import.meta.url),"utf8");
const html=readFileSync(new URL("../index.html",import.meta.url),"utf8");
const frieze=readFileSync(new URL("../assets/greek-key.svg",import.meta.url),"utf8");

test("Greek meander loads as reusable local vector art in all site views",()=>{
  assert.match(html,/<link rel="stylesheet" href="\.\/pass-graphics-a\.css">/);
  assert.match(css,/header::after/);
  assert.match(css,/footer::before/);
  assert.match(css,/url\("\.\/assets\/greek-key\.svg"\)/);
  assert.match(frieze,/<svg[^>]*viewBox="0 0 64 12"/);
  assert.match(frieze,/<path d="/);
  assert.ok(!frieze.includes("<script"));
});
test("home artwork remains visible on desktop, short laptops and mobile",()=>{
  assert.match(css,/\.home-story-art\s*\{[^}]*display:flex!important/);
  assert.match(css,/@media\s*\(min-width:900px\) and \(max-height:760px\)/);
  assert.match(css,/@media\s*\(min-width:900px\) and \(max-height:630px\)/);
  assert.match(css,/@media\s*\(max-width:899px\)/);
  assert.match(css,/@media\s*\(max-width:560px\)/);
  assert.match(css,/\.hero-fall-svg \.hero-falling-piece/);
  assert.match(css,/@keyframes hero-triangle-land/);
});
test("all nine true-geometry thumbnails stay visible on compact laptops",()=>{
  assert.match(css,/\.home-challenge-card \.mini-pile\s*\{[^}]*display:block!important/);
  const compact=css.slice(css.indexOf('@media (min-width:900px) and (max-width:1230px)'));
  assert.match(compact,/\.home-challenge-card \.mini-pile\{display:block!important/);
  const short=css.slice(css.indexOf('@media (min-width:900px) and (max-height:760px)'));
  assert.match(short,/\.home-challenge-card \.mini-pile\{display:block!important/);
  assert.match(css,/\.mini-rectangle-diagonal/);
  assert.match(css,/grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
});
test("decorative motion respects reduced-motion while interactive puzzle animation remains independent",()=>{
  const reduced=css.slice(css.lastIndexOf("@media (prefers-reduced-motion:reduce)"));
  assert.match(reduced,/\.hero-fall-svg \.hero-falling-piece/);
  assert.match(reduced,/animation:none!important/);
  assert.doesNotMatch(css,/#diagram svg\.animating/);
  assert.doesNotMatch(css,/\.piece\{animation/);
});
