import test from "node:test";
import assert from "node:assert/strict";
import {puzzles} from "../pile-geometry.js";
import {
  buildSides,sideKey,readySteps,solutionSteps,correctAnswer,
  exactLength,propagateRectangleSides,puzzleIsValid
} from "../puzzle-engine.js";
import {rectangleVirtualTriangles,rectangleIsValid,rectangleOppositePairs}
  from "../rectangle-math.js";
import {assertFullyVisiblePuzzle,hiddenShapePairs,fitPileInTablet}
  from "../pile-visibility.js";

const advanced=[
  ["nine-muses",9,0,"√1021"],
  ["marble-terrace",8,1,"2√38"],
  ["acropolis",10,2,"15"],
  ["great-interlock",13,0,"24"]
];
test("the advanced challenges retain their identity and shape counts",()=>{
  assert.deepEqual(puzzles.slice(6).map(p=>p.id),advanced.map(x=>x[0]));
});
for(const [id,tris,rects,answer] of advanced){
  test(id+": complete exact solution chain and visible structure",()=>{
    const p=puzzles.find(x=>x.id===id),sides=buildSides(p);
    assert.equal(p.triangles.length,tris);
    assert.equal(p.rectangles?.length||0,rects);
    assert.equal(puzzleIsValid(p),true);
    assert.equal(assertFullyVisiblePuzzle(p),true);
    assert.deepEqual(hiddenShapePairs(p),[]);
    assert.equal(exactLength(p.solution),answer);
    const steps=solutionSteps(p,sides);
    assert.equal(steps.length,[...sides.values()].filter(s=>!s.given).length);
    assert.ok(steps.some(s=>s.isTarget && s.answer===answer));
    assert.equal(correctAnswer(answer,p.solution),true);
    for(const t of p.triangles){
      const corner=t.pts[t.right],other=t.pts.filter((_,j)=>j!==t.right);
      const a={x:other[0].x-corner.x,y:other[0].y-corner.y};
      const b={x:other[1].x-corner.x,y:other[1].y-corner.y};
      assert.ok(Math.abs(a.x*b.x+a.y*b.y)<1e-7,"Not right: "+id+"/"+t.id);
    }
    const fit=fitPileInTablet(p);
    for(const shape of [...p.triangles,...(p.rectangles||[])]){
      for(const vertex of shape.pts){
        const pixel=fit.xy(vertex);
        assert.ok(pixel.x>=60&&pixel.x<=900&&pixel.y>=65&&pixel.y<=518.01,
          "Clipped: "+id+"/"+shape.id);
      }
    }
  });
}
for(const id of ["marble-terrace","acropolis"]){
  test(id+": both visible geometry and genuine rectangle-diagonal steps",()=>{
    const p=puzzles.find(x=>x.id===id),s=buildSides(p);
    assert.equal(new Set(p.fallOrder).size,p.triangles.length+p.rectangles.length);
    for(const r of p.rectangles){
      assert.ok(p.fallOrder.includes(r.id));
      assert.equal(rectangleIsValid(r),true);
      assert.equal(r.diagonals.length,1);
      assert.equal(r.suppressLabels.length,2);
      assert.equal(rectangleVirtualTriangles({rectangles:[r]}).length,2);
      for(const pair of rectangleOppositePairs(r)){
        const edges=pair.map(x=>s.get(sideKey(x.a,x.b)));
        assert.ok(Math.abs(edges[0].length-edges[1].length)<1e-8);
      }
      assert.ok(solutionSteps(p,s).some(step=>
        step.kind==="rectangle-diagonal"&&step.triangleId.startsWith(r.id)));
    }
    // Opposite edges may be carried automatically from the paired
    // rectangle side, rather than requiring a redundant answer step.
    const pairs=p.rectangles.flatMap(rect=>rectangleOppositePairs(rect));
    assert.ok(pairs.length>=2);
  });
}
test("Marble Terrace roof width requires a real rectangle diagonal",()=>{
  const p=puzzles.find(x=>x.id==="marble-terrace"),s=buildSides(p);
  const initial=readySteps(p,s,new Set());
  assert.equal(initial.some(step=>step.kind==="rectangle-diagonal"),false);
  const left=initial.find(step=>step.triangleId==="I");
  assert.ok(left&&left.answer==="5");
  const solved=new Set([left.sideKey]);
  const after=readySteps(p,s,solved);
  assert.ok(after.some(step=>step.kind==="rectangle-diagonal"&&step.answer==="12"));
  assert.equal(propagateRectangleSides(p,s,solved),1);
  assert.ok(readySteps(p,s,solved).some(step=>
    step.kind==="rectangle-diagonal"&&step.answer==="12"));
});
function canFinishWithout(puzzle,blockedRectangle){
  const sideMap=buildSides(puzzle),solved=new Set();
  for(let k=0;k<300;k++){
    propagateRectangleSides(puzzle,sideMap,solved);
    const available=readySteps(puzzle,sideMap,solved).filter(step=>
      !solved.has(step.sideKey) &&
      !(step.kind==="rectangle-diagonal"&&
        step.triangleId.startsWith(blockedRectangle)));
    if(!available.length)break;
    solved.add(available[0].sideKey);
  }
  const targetKey=sideKey(puzzle.target.a,puzzle.target.b);
  return solved.has(targetKey);
}
test("Acropolis target requires both successive diagonal calculations",()=>{
  const p=puzzles.find(x=>x.id==="acropolis");
  assert.equal(p.rectangles.length,2);
  const s=buildSides(p),steps=solutionSteps(p,s);
  assert.ok(steps.some(x=>x.kind==="rectangle-diagonal"&&x.triangleId.startsWith("R1")));
  assert.ok(steps.some(x=>x.kind==="rectangle-diagonal"&&x.triangleId.startsWith("R2")));
  assert.equal(canFinishWithout(p,"R1"),false,
    "Final roof should be blocked if left plinth is unknown");
  assert.equal(canFinishWithout(p,"R2"),false,
    "Final roof should be blocked if right plinth is unknown");
  const relation=p.lengthRelations[0];
  assert.equal(relation.parts.length,2);
  const lengths=relation.parts.map(x=>Math.hypot(x.a.x-x.b.x,x.a.y-x.b.y));
  assert.ok(Math.abs(lengths[0]-10)<1e-7);
  assert.ok(Math.abs(lengths[1]-2)<1e-7);
  assert.equal(p.equalSideGroups?.length||0,0,
    "No unattached lengths should rely on matching ticks");
  assert.ok(p.triangles.some(t=>t.id==="II"));
  assert.equal(p.overhang.value,2);
});
test("Nine Muses has one grounded base and a real 2 cm roof offset",()=>{
  const p=puzzles.find(x=>x.id==="nine-muses");
  assert.equal(p.rectangles.length,0);
  assert.equal(p.triangles.length,9);
  assert.equal(p.triangles.filter(t=>t.pts.filter(q=>q.y===0).length>=2).length,1);
  assert.equal(p.overhang.value,2);
  assert.equal(p.lengthRelations.length,1);
  assert.equal(p.equalSideGroups?.length||0,0);
  assert.ok(solutionSteps(p).filter(s=>s.kind==="pythagoras").length>=9);
  assert.ok(solutionSteps(p).some(s=>s.isTarget&&s.answer==="√1021"));
});
