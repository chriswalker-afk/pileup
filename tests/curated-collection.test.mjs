import test from "node:test";
import assert from "node:assert/strict";
import {puzzles} from "../pile-geometry.js";
import {
  buildSides,sideKey,readySteps,solutionSteps,puzzleIsValid,
  exactLength,correctAnswer
} from "../puzzle-engine.js";
import {hiddenShapePairs,fitPileInTablet} from "../pile-visibility.js";

const expected=[
  ["first-fall",3,0,"10","single-rise-inset"],
  ["projecting-edge",4,0,"5√5","cantilever-with-two-arms"],
  ["twin-paths",3,0,"15","single-base-two-part-cover"],
  ["split-project",3,0,"17","split-foundations-cantilever"],
  ["labyrinth",5,0,"15","forked-arch-rejoining-roof"],
  ["great-pile",5,0,"√230","open-bridge-rising-peak"],
  ["nine-muses",9,0,"√274","three-foundation-twin-terrace"],
  ["marble-terrace",8,1,"2√38","rectangle-platform-stepped-ridges"],
  ["acropolis",10,2,"25","two-plinths-grand-arch"]
];
const EPS=1e-7;
const d=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const near=(a,b)=>Math.abs(a-b)<EPS;
const pointKey=p=>p.x.toFixed(6)+","+p.y.toFixed(6);
test("nine authored puzzle identities are distinct, not renamed chains",()=>{
  assert.deepEqual(puzzles.map(p=>p.id),expected.map(x=>x[0]));
  assert.equal(new Set(puzzles.map(p=>p.id)).size,9);
  assert.equal(new Set(puzzles.map(p=>p.topology)).size,9);
  assert.equal(new Set(puzzles.map(p=>p.architecture?.family)).size,9);
  for(const puzzle of puzzles){
    assert.ok(puzzle.tags.length>=2,puzzle.id+" tags");
    assert.ok(puzzle.architecture.summary);
    assert.ok(puzzle.architecture.features.length>=3);
    assert.ok(!/Long chain/i.test(puzzle.tags.join(" ")),puzzle.id);
  }
});
for(const [id,count,rectangleCount,result,topology] of expected){
  test(id+": exact right triangles, complete deductions and uncropped silhouette",()=>{
    const puzzle=puzzles.find(p=>p.id===id);
    assert.equal(puzzle.triangles.length,count);
    assert.equal(puzzle.rectangles?.length||0,rectangleCount);
    assert.equal(puzzle.topology,topology);
    assert.equal(puzzleIsValid(puzzle),true);
    assert.deepEqual(hiddenShapePairs(puzzle),[]);
    assert.equal(exactLength(puzzle.solution),result);
    const map=buildSides(puzzle);
    const steps=solutionSteps(puzzle,map);
    assert.equal(steps.length,[...map.values()].filter(s=>!s.given).length);
    assert.ok(steps.some(s=>s.isTarget&&s.answer===result),"No supported target "+id);
    assert.equal(correctAnswer(result,puzzle.solution),true);
    const fitted=fitPileInTablet(puzzle);
    for(const shape of [...puzzle.triangles,...puzzle.rectangles||[]]){
      for(const pt of shape.pts){
        const xy=fitted.xy(pt);
        assert.ok(xy.x>=60&&xy.x<=900&&xy.y>=65&&xy.y<=518.01,
          id+" would clip a shape");
      }
    }
  });
}
test("The First Fall remains a gentle, 4-step introductory path",()=>{
  const p=puzzles[0];
  assert.deepEqual(solutionSteps(p).map(s=>s.answer),["20","15","8","10"]);
  assert.equal(p.overhang.value,5);
  assert.equal(p.architecture.family,"single rising spine");
});
test("Twin Paths retains real matching ticks and both starting calculations",()=>{
  const p=puzzles[2],s=buildSides(p);
  assert.equal(p.equalSideGroups.length,1);
  const [a,b]=p.equalSideGroups[0].map(d=>s.get(sideKey(d.a,d.b)));
  assert.ok(near(a.length,b.length));
  assert.ok(a.given&&!b.given);
  const ready=readySteps(p,s,new Set());
  assert.ok(ready.some(x=>x.kind==="equal"&&x.answer==="13"));
  assert.ok(ready.some(x=>x.kind==="pythagoras"&&x.answer==="12"));
  assert.equal(p.extensions.find(x=>x.id==="perimeter").value,66);
  assert.equal(p.extensions.find(x=>x.id==="area").value,120);
});
test("Split & Project has two real floor piers and a measurable 3cm projection",()=>{
  const p=puzzles[3],s=buildSides(p);
  assert.equal(p.triangles.filter(t=>t.pts.some(x=>near(x.y,0))).length,2);
  const projected=p.extraSegments.find(x=>/OVERHANG/.test(x.label));
  const foundation=p.extraSegments.find(x=>/FOUNDATION/.test(x.label));
  assert.equal(projected.value,3);
  assert.equal(foundation.value,27);
  assert.ok(s.get(sideKey(projected.a,projected.b)).isOverhang);
  assert.ok(!s.get(sideKey(foundation.a,foundation.b)).isOverhang);
  assert.equal(p.lengthRelations.length,3);
  assert.equal(p.equalSideGroups.length,1);
  const steps=solutionSteps(p,s);
  assert.ok(steps.some(x=>x.kind==="equal"));
  assert.ok(steps.some(x=>x.kind==="overhang"));
  assert.ok(steps.find(x=>x.isTarget));
});
test("Labyrinth really re-joins two individually calculable branches",()=>{
  const p=puzzles[4],map=buildSides(p),rel=p.lengthRelations[0];
  const whole=map.get(sideKey(rel.whole.a,rel.whole.b));
  assert.ok(near(whole.length,12));
  assert.deepEqual(rel.parts.map(s=>Math.round(d(s.a,s.b))).sort((a,b)=>a-b),[5,7]);
  assert.equal(p.triangles.filter(t=>t.pts.some(z=>near(z.y,0))).length,4);
  const initial=readySteps(p,map,new Set());
  assert.ok(initial.filter(x=>x.kind==="pythagoras").length>=2);
});
test("The Great Pile Up leaves a genuine open bridge under its upper beam",()=>{
  const p=puzzles[5],pieces=p.triangles;
  assert.equal(pieces.filter(t=>t.pts.some(z=>near(z.y,0))).length,2);
  // The support tips share an elevation but there is no filled
  // polygon beneath their connecting bridge in the middle bay.
  const left=pieces[0].pts[2],right=pieces[1].pts[2];
  assert.ok(near(left.y,right.y)&&right.x-left.x>10);
  assert.ok(pieces[2].pts.some(z=>pointKey(z)===pointKey(left)));
  assert.ok(pieces[2].pts.some(z=>pointKey(z)===pointKey(right)));
  assert.equal(p.extensions,undefined);
});
test("The Nine Muses has three ground pieces and two joined roof terraces",()=>{
  const p=puzzles[6];
  assert.equal(p.triangles.filter(t=>t.pts.some(z=>near(z.y,0))).length,3);
  assert.equal(p.equalSideGroups.length,2);
  assert.ok(p.triangles[8].pts.some(x=>x.y>30));
});
test("Both rectangle puzzles are architecturally different from each other",()=>{
  const marble=puzzles[7],acropolis=puzzles[8];
  assert.equal(marble.rectangles[0].pts.filter(z=>near(z.y,0)).length,2);
  assert.equal(acropolis.rectangles.length,2);
  assert.equal(marble.lengthRelations.length,1);
  assert.equal(acropolis.lengthRelations.length,1);
  assert.ok(marble.triangles.length!==acropolis.triangles.length);
  assert.notEqual(marble.topology,acropolis.topology);
});
