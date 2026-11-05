import test from "node:test";
import assert from "node:assert/strict";
import {puzzles,makeOverhangPile} from "../pile-geometry.js";
import {buildSides,sideKey,solutionSteps,readySteps,puzzleIsValid,correctAnswer}
  from "../puzzle-engine.js";

test("The First Fall preserves a simple, exact inset deduction",()=>{
  const first=puzzles[0],map=buildSides(first);
  assert.equal(first.overhang.value,5);
  assert.equal(first.triangles.length,3);
  assert.equal(puzzleIsValid(first),true);
  assert.equal([...map.values()].filter(x=>x.isOverhang).length,1);
  const steps=solutionSteps(first,map);
  assert.deepEqual(steps.map(x=>x.answer),["20","15","8","10"]);
  assert.deepEqual(steps.map(x=>x.kind).slice(0,2),["pythagoras","overhang"]);
  assert.match(steps[1].equation,/−/);
  assert.equal(steps.at(-1).isTarget,true);
});

test("Projecting Edge uses a different shoulder and two different upper edges",()=>{
  const project=puzzles.find(p=>p.id==="projecting-edge");
  const map=buildSides(project),steps=solutionSteps(project,map);
  assert.equal(project.triangles.length,4);
  assert.equal(project.overhang.value,4);
  assert.equal(project.architecture.family,"cantilever");
  assert.equal(puzzleIsValid(project),true);
  assert.equal(map.get(sideKey(project.overhang.a,project.overhang.b)).isOverhang,true);
  assert.ok(steps.some(x=>x.kind==="overhang"&&/ \+ /.test(x.equation)));
  assert.ok(steps.some(x=>x.isTarget&&x.answer==="5√5"));
  // The third and fourth triangles use different supporting edges
  // of II, so their additions cannot be mistaken for a repeated chain.
  const [II,III,IV]=project.triangles.slice(1);
  const secondSides=new Set([
    sideKey(II.pts[0],II.pts[1]),
    sideKey(II.pts[1],II.pts[2]),
    sideKey(II.pts[2],II.pts[0])
  ]);
  const shared=t=>[
    sideKey(t.pts[0],t.pts[1]),sideKey(t.pts[1],t.pts[2]),
    sideKey(t.pts[2],t.pts[0])
  ].filter(k=>secondSides.has(k));
  assert.equal(shared(III).length,1);
  assert.equal(shared(IV).length,1);
  assert.notEqual(shared(III)[0],shared(IV)[0]);
});

test("Split & Project only uses a visibly measured 2 cm overhang",()=>{
  const puzzle=puzzles.find(p=>p.id==="split-project"),map=buildSides(puzzle);
  const over=puzzle.extraSegments.find(s=>/OVERHANG/.test(s.label));
  assert.ok(Math.abs(over.value-2)<1e-7);
  assert.equal(map.get(sideKey(over.a,over.b)).isOverhang,true);
  assert.equal(readySteps(puzzle,map,new Set()).some(x=>x.kind==="overhang"),false,
    "The whole length must be calculated first");
  assert.ok(solutionSteps(puzzle,map).some(x=>x.kind==="overhang"&&x.answer==="11"));
  assert.ok(solutionSteps(puzzle,map).some(x=>x.isTarget&&x.answer==="√157"));
});
test("Real overhang input is validated against geometry",()=>{
  const p=makeOverhangPile({
    id:"test",title:"test",epithet:"test",difficulty:"test",description:"test",
    base:[16,12],overhang:5,upperHypotenuse:17,legs:[6],
    colors:["#aaa","#bbb","#ccc"]
  });
  p.extraSegments[0].value=7;
  assert.throws(()=>buildSides(p),/incorrect given length/i);
});
test("Exact surds and appropriate rounding remain accepted",()=>{
  assert.equal(correctAnswer("10",puzzles[0].solution),true);
  const projecting=puzzles[1];
  assert.equal(correctAnswer("5√5",projecting.solution),true);
  assert.equal(correctAnswer("sqrt(125)",projecting.solution),true);
  assert.equal(correctAnswer("11.18",projecting.solution),true);
  assert.equal(correctAnswer("11.0",projecting.solution),false);
});
