import test from "node:test";
import assert from "node:assert/strict";
import {puzzles} from "../pile-geometry.js";
import {buildSides,readySteps,solutionSteps,sideKey,exactLength,puzzleIsValid}
  from "../puzzle-engine.js";
import {assertFullyVisiblePuzzle,hiddenShapePairs,fitPileInTablet}
  from "../pile-visibility.js";

const puzzle=puzzles.find(p=>p.id==="great-interlock");
const EPS=1e-6;
const near=(a,b)=>Math.abs(a-b)<EPS;
const distance=s=>Math.hypot(s.a.x-s.b.x,s.a.y-s.b.y);

function canFinishWithRootBlocked(id){
  const sides=buildSides(puzzle),solved=new Set();
  for(let i=0;i<250;i++){
    const ready=readySteps(puzzle,sides,solved).filter(x=>
      !solved.has(x.sideKey)&&x.triangleId!==id);
    if(!ready.length)break;
    solved.add(ready[0].sideKey);
  }
  return solved.has(sideKey(puzzle.target.a,puzzle.target.b));
}

test("tenth challenge is one original, fully visible dense right-triangle pile",()=>{
  assert.ok(puzzle);
  assert.equal(puzzles.length,10);
  assert.equal(puzzle.triangles.length,13);
  assert.equal(puzzle.rectangles.length,0);
  assert.equal(new Set(puzzle.triangles.map(t=>t.id)).size,13);
  assert.equal(new Set(puzzle.fallOrder).size,13);
  assert.equal(assertFullyVisiblePuzzle(puzzle),true);
  assert.deepEqual(hiddenShapePairs(puzzle),[]);
  assert.equal(puzzleIsValid(puzzle),true);
  assert.equal(exactLength(puzzle.solution),"24");
  assert.ok(near(distance(puzzle.target),24));
  assert.ok(near(puzzle.target.a.y,puzzle.target.b.y),
    "The roof question must be the broad horizontal edge.");
  const fit=fitPileInTablet(puzzle);
  for(const t of puzzle.triangles)for(const q of t.pts){
    const a=fit.xy(q);
    assert.ok(a.x>=60&&a.x<=900&&a.y>=65&&a.y<=518.01);
  }
});
test("two true ground foundations and a non-vertex bearing point",()=>{
  const grounded=puzzle.triangles.filter(t=>t.pts.filter(q=>near(q.y,0)).length>=2);
  assert.deepEqual(grounded.map(t=>t.id),["XII","XI"]);
  const foot=puzzle.triangles.find(t=>t.id==="XII");
  const wing=puzzle.triangles.find(t=>t.id==="IX");
  const top=foot.pts[2],a=wing.pts[2],b=wing.pts[0];
  const scalar=((top.x-a.x)*(b.x-a.x)+(top.y-a.y)*(b.y-a.y))/
    ((b.x-a.x)**2+(b.y-a.y)**2);
  assert.ok(scalar>0&&scalar<1);
  assert.ok(near(top.x,a.x+(b.x-a.x)*scalar));
  assert.ok(near(top.y,a.y+(b.y-a.y)*scalar));
});
test("two small offsets and a split final 25 cm diagonal are exactly aligned",()=>{
  assert.deepEqual(puzzle.lengthRelations.map(r=>Math.round(distance(r.whole))),[17,13,25]);
  assert.deepEqual(puzzle.lengthRelations.map(r=>
    r.parts.map(part=>Math.round(distance(part)))),[[12,5],[8,5],[10,15]]);
  assert.equal(puzzle.extraSegments.length,2);
  assert.ok(puzzle.extraSegments.every(s=>near(s.value,5)));
  assert.equal(puzzle.equalSideGroups.length,2);
  const sides=buildSides(puzzle);
  for(const group of puzzle.equalSideGroups){
    assert.equal(group.length,2);
    assert.ok(near(distance(group[0]),distance(group[1])));
    assert.ok(group.every(s=>sides.has(sideKey(s.a,s.b))));
  }
  assert.ok(readySteps(puzzle,sides,new Set()).some(s=>s.triangleId==="XI"));
  assert.ok(readySteps(puzzle,sides,new Set()).some(s=>s.triangleId==="XII"));
  assert.ok(!readySteps(puzzle,sides,new Set()).some(s=>s.isTarget));
  const steps=solutionSteps(puzzle,sides);
  assert.ok(steps.some(s=>s.kind==="equal"));
  assert.ok(steps.some(s=>s.kind==="overhang"));
  assert.ok(steps.some(s=>s.kind==="split"));
  assert.ok(steps.some(s=>s.isTarget&&s.answer==="24"));
});
test("both floor calculations are indispensable to the 24 cm roof",()=>{
  assert.equal(canFinishWithRootBlocked("XI"),false,
    "Blocking the right foundation must block the final target.");
  assert.equal(canFinishWithRootBlocked("XII"),false,
    "Blocking the left foundation must block the final target.");
  assert.equal(canFinishWithRootBlocked(""),true);
});
