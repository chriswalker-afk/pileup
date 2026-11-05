import test from "node:test";
import assert from "node:assert/strict";
import {puzzles} from "../pile-geometry.js";
import {buildSides,readySteps,solutionSteps,sideKey,
  exactLength,propagateRectangleSides,puzzleIsValid} from "../puzzle-engine.js";
import {assertFullyVisiblePuzzle,hiddenShapePairs} from "../pile-visibility.js";

const changed=[
  ["split-project",4,0,"√157"],
  ["great-pile",6,0,"24"],
  ["nine-muses",9,0,"√1021"],
  ["acropolis",10,2,"15"]
];
const near=(a,b)=>Math.abs(a-b)<1e-6;
const distance=side=>Math.hypot(side.a.x-side.b.x,side.a.y-side.b.y);

/** Simulate classroom progress, but prohibit a particular piece's
 * calculation. If x remains possible, that piece is mathematical
 * decoration rather than an essential step in the stated puzzle. */
function canReachTarget(puzzle,blocked){
  const map=buildSides(puzzle),known=new Set();
  for(let iteration=0;iteration<500;iteration++){
    propagateRectangleSides(puzzle,map,known);
    const options=readySteps(puzzle,map,known).filter(step=>
      !known.has(step.sideKey)&&
      !(blocked&&step.triangleId===blocked)&&
      !(blocked?.startsWith("R")&&step.triangleId.startsWith(blocked+"-DIAG-"))
    );
    if(!options.length)break;
    known.add(options[0].sideKey);
  }
  return known.has(sideKey(puzzle.target.a,puzzle.target.b));
}
for(const [id,count,rectangles,target] of changed){
  test(id+": correct right angles, fully visible contact and exact x",()=>{
    const p=puzzles.find(p=>p.id===id);
    assert.equal(p.triangles.length,count);
    assert.equal(p.rectangles.length,rectangles);
    assert.equal(assertFullyVisiblePuzzle(p),true);
    assert.deepEqual(hiddenShapePairs(p),[]);
    assert.equal(puzzleIsValid(p),true);
    assert.equal(exactLength(p.solution),target);
    assert.ok(solutionSteps(p).some(step=>step.isTarget&&step.answer===target));
    assert.equal(new Set(p.fallOrder).size,count+rectangles);
  });
  test(id+": every triangle is required to calculate x",()=>{
    const p=puzzles.find(p=>p.id===id);
    assert.equal(canReachTarget(p,""),true);
    for(const t of p.triangles){
      assert.equal(canReachTarget(p,t.id),false,
        id+" can skip triangle "+t.id+" and still find x");
    }
  });
  test(id+": exactly one valid starting calculation, no unexplained equalities",()=>{
    const p=puzzles.find(p=>p.id===id),s=buildSides(p);
    const initial=readySteps(p,s,new Set());
    assert.equal(initial.length,1,id+" should have a traceable entry route");
    assert.equal(initial[0].isTarget,false);
    for(const group of p.equalSideGroups||[]){
      assert.ok(group.length>=2);
      const lengths=group.map(distance);
      assert.ok(lengths.every(x=>near(x,lengths[0])));
      assert.ok(group.every(v=>s.has(sideKey(v.a,v.b))),
        "Matching marks must correspond to actual displayed sides");
    }
  });
}
test("all three offset challenges show exactly the measured 2 cm part",()=>{
  for(const id of ["split-project","nine-muses","acropolis"]){
    const p=puzzles.find(p=>p.id===id),r=p.lengthRelations[0];
    assert.equal(p.lengthRelations.length,1);
    assert.ok(near(p.overhang.value,2));
    assert.equal(r.parts.length,2);
    assert.ok(near(distance(r.whole),r.parts.map(distance).reduce((a,b)=>a+b,0)));
    assert.ok(near(distance(r.parts[1]),2));
    const given=p.extraSegments.find(x=>/OVERHANG/.test(x.label));
    assert.ok(given&&near(given.value,2));
    assert.ok(solutionSteps(p).some(step=>step.kind==="overhang"));
  }
});
test("two rectangle diagonal calculations lie on one indispensable Acropolis chain",()=>{
  const p=puzzles.find(p=>p.id==="acropolis"),steps=solutionSteps(p);
  assert.equal(p.rectangles.length,2);
  for(const r of p.rectangles){
    assert.ok(steps.some(s=>s.kind==="rectangle-diagonal"&&s.triangleId.startsWith(r.id)));
    assert.equal(canReachTarget(p,r.id),false,
      r.id+" must be completed before the final target becomes possible");
  }
  assert.equal(p.equalSideGroups.length,2,
    "Horizontal opposite rectangle edges must be visibly ticked");
  const first=steps.findIndex(s=>s.triangleId.startsWith("R1"));
  const second=steps.findIndex(s=>s.triangleId.startsWith("R2"));
  assert.ok(first>=0&&second>first,"Rectangle steps must occur in order");
});
test("nothing marked equal on the replacements is a non-geometric coincidence",()=>{
  for(const id of ["split-project","great-pile","nine-muses"]){
    const p=puzzles.find(p=>p.id===id);
    assert.equal(p.equalSideGroups?.length||0,0,
      "No distant same-length sides should be silently equated");
  }
});
