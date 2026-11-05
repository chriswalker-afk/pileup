import test from "node:test";
import assert from "node:assert/strict";
import { puzzles,makeOverhangPile } from "../pile-geometry.js";
import {
  buildSides,sideKey,solutionSteps,readySteps,
  puzzleIsValid,correctAnswer
} from "../puzzle-engine.js";

const cases=[
  {id:"first-fall",triangles:3,overhang:5,unknown:4,
    chain:["20","15","8","10"],target:10},
  {id:"labyrinth",triangles:5,overhang:4,unknown:6,
    chain:["20","24","10","2√41","10√2","√281"],target:Math.sqrt(281)}
];
for(const expected of cases){
  test(expected.id+" is an exact, grounded, solvable overhang pile",()=>{
    const puzzle=puzzles.find(p=>p.id===expected.id);
    assert.ok(puzzle);
    assert.equal(puzzle.triangles.length,expected.triangles);
    assert.equal(puzzle.overhang.value,expected.overhang);
    assert.equal(puzzle.floor.a.y,0);
    assert.equal(puzzle.floor.b.y,0);
    assert.ok(puzzle.triangles[0].pts.some(z=>z.y===0));
    assert.ok(puzzle.triangles.slice(2).every(t=>t.pts.every(z=>z.y>0)),
      "upper triangles must truly rest on other triangles");
    assert.equal(puzzleIsValid(puzzle),true);
    const sides=buildSides(puzzle);
    const unknown=[...sides.values()].filter(s=>!s.given);
    assert.equal(unknown.length,expected.unknown);
    const measured=[...sides.values()].filter(s=>s.isOverhang);
    assert.equal(measured.length,1);
    assert.equal(measured[0].length,expected.overhang);
    const steps=solutionSteps(puzzle,sides);
    assert.deepEqual(steps.map(s=>s.answer),expected.chain);
    assert.equal(steps[0].kind,"pythagoras");
    assert.equal(steps[1].kind,"overhang");
    assert.match(steps[1].equation,expected.id==="first-fall"?/−/:/\+/);
    assert.equal(steps[2].isHypotenuse,false);
    assert.match(steps[2].equation,/−/);
    assert.equal(steps.at(-1).isTarget,true);
    assert.ok(Math.abs(steps.at(-1).length-expected.target)<1e-8);
  });
}

test("Overhang is necessary in the dependency chain",()=>{
  const puzzle=puzzles[0],sides=buildSides(puzzle);
  const solved=new Set();
  let ready=readySteps(puzzle,sides,solved);
  assert.equal(ready.length,1);
  assert.equal(ready[0].triangleId,"I");
  solved.add(ready[0].sideKey);
  ready=readySteps(puzzle,sides,solved);
  assert.equal(ready.length,1);
  assert.equal(ready[0].kind,"overhang");
  assert.equal(ready[0].answer,"15");
  solved.add(ready[0].sideKey);
  ready=readySteps(puzzle,sides,solved);
  assert.equal(ready.length,1);
  assert.equal(ready[0].triangleId,"II");
  assert.equal(ready[0].answer,"8");
});
test("Either exact or appropriately rounded final answer is accepted",()=>{
  assert.equal(correctAnswer("10",puzzles[0].solution),true);
  assert.equal(correctAnswer("√281",puzzles.find(p=>p.id==="labyrinth").solution),true);
  assert.equal(correctAnswer("sqrt(281)",puzzles[1].solution),true);
  assert.equal(correctAnswer("16.8",puzzles[1].solution),true);
  assert.equal(correctAnswer("16.76",puzzles[1].solution),true);
  assert.equal(correctAnswer("16.7",puzzles[1].solution),false);
});
test("Invalid straight-line segment measurement is rejected",()=>{
  const puzzle=makeOverhangPile({
    id:"test",title:"test",epithet:"test",difficulty:"test",description:"test",
    base:[16,12],overhang:5,upperHypotenuse:17,legs:[6],
    colors:["#aaa","#bbb","#ccc"]
  });
  puzzle.extraSegments[0].value=7;
  assert.throws(()=>buildSides(puzzle),/incorrect given length/i);
});
