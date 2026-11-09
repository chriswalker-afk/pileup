import test from "node:test";
import assert from "node:assert/strict";
import { puzzles } from "../pile-geometry.js";
import { buildSides, sideKey, readySteps, solutionSteps, puzzleIsValid, propagateRectangleSides } from "../puzzle-engine.js";
import { hiddenShapePairs } from "../pile-visibility.js";

/** Finds a truly minimal number of checked lengths, rather than
 * confusing "all displayed sides" with "sides needed to reach x".
 * Only called for the six-face route puzzle (small finite state space). */
function minimumChecks(puzzle,blocked=new Set()) {
  const sides=buildSides(puzzle);
  const target=sideKey(puzzle.target.a,puzzle.target.b);
  const queue=[[]],visited=new Set([""]);
  for(let index=0;index<queue.length;index++){
    const known=queue[index],set=new Set(known);
    propagateRectangleSides(puzzle,sides,set); // automatic, no check charged
    if(set.has(target))return {checks:known.length,states:queue.length};
    const options=readySteps(puzzle,sides,set);
    for(const step of options){
      if(set.has(step.sideKey)||blocked.has(step.triangleId))continue;
      const next=[...known,step.sideKey].sort(),key=next.join(";");
      if(visited.has(key))continue;
      visited.add(key);queue.push(next);
      assert.ok(queue.length<150000,"Search should not expand unexpectedly");
    }
  }
  return null;
}

test("every puzzle has a short distinct reasoning objective, not a generic instruction",()=>{
  assert.equal(puzzles.length,10);
  assert.equal(new Set(puzzles.map(p=>p.designBrief)).size,10);
  for(const puzzle of puzzles){
    assert.ok(puzzle.designBrief.length<95,puzzle.id+" prompt too verbose");
    assert.equal(puzzleIsValid(puzzle),true);
    assert.deepEqual(hiddenShapePairs(puzzle),[]);
  }
});

test("Great Pile Up is a genuine choice problem: x requires just four checks",()=>{
  const puzzle=puzzles.find(p=>p.id==="great-pile");
  assert.equal(puzzle.routeChallenge?.par,4);
  const ready=readySteps(puzzle,buildSides(puzzle),new Set());
  assert.ok(ready.some(step=>step.triangleId==="I"));
  assert.ok(ready.some(step=>step.triangleId==="III"));
  const optimum=minimumChecks(puzzle);
  assert.ok(optimum);
  assert.equal(optimum.checks,4);
  const noFoundations=minimumChecks(puzzle,new Set(["I","II"]));
  assert.ok(noFoundations,"Optional lower triangles must not be prerequisites");
  assert.equal(noFoundations.checks,4);
  assert.equal(minimumChecks(puzzle,new Set(["III"])),null,
    "The middle route must still involve genuine calculations");
  assert.equal(solutionSteps(puzzle).at(-1).answer,"24");
});

test("Nine Muses replaces two repetitive inverse triples with new surd reasoning",()=>{
  const puzzle=puzzles.find(p=>p.id==="nine-muses");
  const steps=solutionSteps(puzzle);
  const byTriangle=id=>steps.find(step=>step.triangleId===id);
  assert.equal(byTriangle("VII")?.answer,"√481");
  assert.equal(byTriangle("VIII")?.answer,"20");
  assert.equal(byTriangle("IX")?.answer,"√521");
  assert.equal(puzzle.overhang.value,2);
  assert.ok(steps.filter(step=>step.kind==="pythagoras").length>=9);
});

test("Marble Terrace has a meaningful seven-check route with an optional peak",()=>{
  const puzzle=puzzles.find(p=>p.id==="marble-terrace");
  assert.equal(puzzle.routeChallenge?.par,7);
  assert.ok(readySteps(puzzle,buildSides(puzzle),new Set()).some(s=>s.triangleId==="II"));
  const optimum=minimumChecks(puzzle);
  assert.ok(optimum);
  assert.equal(optimum.checks,7);
  // The decorative left upper tower is mathematically sound, but not a
  // mandatory part of the route to x.
  const skippingLeft=minimumChecks(puzzle,new Set(["V","VII"]));
  assert.ok(skippingLeft);
  assert.equal(skippingLeft.checks,7);
});
