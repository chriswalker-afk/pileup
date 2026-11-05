import test from "node:test";
import assert from "node:assert/strict";
import { puzzles } from "../pile-geometry.js";
import {
  buildSides,sideKey,readySteps,solutionSteps,correctAnswer,
  exactLength,propagateRectangleSides,puzzleIsValid
} from "../puzzle-engine.js";
import {
  rectangleVirtualTriangles,rectangleIsValid,rectangleOppositePairs
} from "../rectangle-math.js";
import {
  assertFullyVisiblePuzzle,hiddenShapePairs,fitPileInTablet
} from "../pile-visibility.js";

const expected=[
  ["nine-muses",9,0,"2√95",
    ["20","24","10","2√41","10√2","√281","3√34","√322","√371","2√95"]],
  ["marble-terrace",8,1,"2√102",
    ["12","9","15","5√10","5√11","10√3","4√21","2√93","2√102","9","12"]],
  ["acropolis",10,2,"√105",
    ["12","9","15","5√10","5√11","10√3","4","9","12","10√3","4",
      "√41","√57","√73","√89","√105"]]
];
test("three advanced puzzles follow the six original challenges",()=>{
  assert.equal(puzzles.length,9);
  assert.deepEqual(puzzles.slice(6).map(p=>p.id),expected.map(x=>x[0]));
});
for(const [id,triangles,rectangles,target,chain] of expected){
  test(id+": complete exact solution chain and visible multi-piece construction",()=>{
    const p=puzzles.find(p=>p.id===id),sides=buildSides(p);
    assert.equal(p.triangles.length,triangles);
    assert.equal(p.rectangles?.length||0,rectangles);
    assert.equal(puzzleIsValid(p),true);
    assert.equal(assertFullyVisiblePuzzle(p),true);
    assert.deepEqual(hiddenShapePairs(p),[]);
    assert.equal(exactLength(p.solution),target);
    const steps=solutionSteps(p,sides);
    assert.deepEqual(steps.map(s=>s.answer),chain);
    assert.equal(steps.length,[...sides.values()].filter(side=>!side.given).length);
    assert.ok(steps.some(step=>step.isTarget && step.answer===target));
    assert.equal(correctAnswer(target,p.solution),true);
    assert.ok(correctAnswer(Number(p.solution.toPrecision(3)).toString(),p.solution));
    for(const t of p.triangles){
      const k=t.right,a=t.pts[(k+1)%3],b=t.pts[(k+2)%3],o=t.pts[k];
      const dot=(a.x-o.x)*(b.x-o.x)+(a.y-o.y)*(b.y-o.y);
      assert.ok(Math.abs(dot)<1e-7,"Right angle failed for triangle "+t.id);
    }
    const fit=fitPileInTablet(p);
    for(const piece of [...p.triangles,...(p.rectangles||[])]){
      for(const vertex of piece.pts){
        const point=fit.xy(vertex);
        assert.ok(point.x>=60&&point.x<=900&&point.y>=65&&point.y<=518,
          "Piece "+piece.id+" would be cropped.");
      }
    }
  });
}
for(const id of ["marble-terrace","acropolis"]){
  test(id+": rectangles provide actual Pythagoras dependencies",()=>{
    const p=puzzles.find(x=>x.id===id),sides=buildSides(p);
    for(const rect of p.rectangles){
      assert.equal(rectangleIsValid(rect),true);
      assert.equal(rect.diagonals.length,1);
      const [a,b]=rect.diagonals[0].a&&
        [rect.diagonals[0].a,rect.diagonals[0].b];
      const diagonal=Math.hypot(a.x-b.x,a.y-b.y);
      assert.ok(Math.abs(rect.givens[0].value-diagonal)<1e-8);
      assert.equal(rectangleVirtualTriangles({rectangles:[rect]}).length,2);
      for(const pair of rectangleOppositePairs(rect)){
        const s=pair.map(edge=>sides.get(sideKey(edge.a,edge.b)));
        assert.ok(Math.abs(s[0].length-s[1].length)<1e-8);
      }
      assert.equal(rect.suppressLabels.length,2);
    }
    assert.ok(solutionSteps(p,sides).some(step=>step.kind==="rectangle-diagonal"));
    assert.ok(solutionSteps(p,sides).some(step=>step.kind==="rectangle-opposite"));
    assert.equal(new Set(p.fallOrder).size,p.triangles.length+p.rectangles.length);
    assert.equal(p.fallOrder[0],"I");
    assert.equal(p.fallOrder[1],"R1");
    for(const rect of p.rectangles)assert.ok(p.fallOrder.includes(rect.id));
  });
}
test("the first rectangle's diagonal must be used to obtain its roof",()=>{
  const p=puzzles.find(x=>x.id==="marble-terrace"),sides=buildSides(p);
  const initial=readySteps(p,sides,new Set());
  assert.equal(initial.filter(x=>x.kind==="rectangle-diagonal").length,0);
  const first=initial.find(x=>x.triangleId==="I");
  assert.ok(first && first.answer==="12");
  const solved=new Set([first.sideKey]);
  const ready=readySteps(p,sides,solved);
  assert.ok(ready.some(x=>x.kind==="rectangle-diagonal"&&x.answer==="9"));
  assert.equal(ready.some(x=>x.triangleId==="II"),false);
  // Opposite rectangle sides are automatically revealed when their
  // matching edge is established (no repetitive answer submissions).
  assert.equal(propagateRectangleSides(p,sides,solved),1);
  const roof=ready.find(x=>x.answer==="9"&&x.kind==="rectangle-diagonal");
  solved.add(roof.sideKey);
  assert.equal(propagateRectangleSides(p,sides,solved),1);
  assert.ok(readySteps(p,sides,solved).some(x=>x.triangleId==="II"&&x.answer==="15"));
});
test("a second diagonal is required to continue The Acropolis",()=>{
  const p=puzzles.find(x=>x.id==="acropolis"),sides=buildSides(p);
  const sequence=solutionSteps(p,sides);
  const index=sequence.findIndex(step=>step.kind==="rectangle-diagonal"&&step.triangleId.startsWith("R2"));
  assert.ok(index>4);
  const earlier=new Set(sequence.slice(0,index).map(step=>step.sideKey));
  const available=readySteps(p,sides,earlier);
  assert.ok(available.some(step=>step.kind==="rectangle-diagonal"&&step.triangleId.startsWith("R2")&&step.answer==="4"));
  const future=p.triangles.find(t=>t.id==="VI");
  const needed=new Set([
    sideKey(future.pts[0],future.pts[1]),
    sideKey(future.pts[1],future.pts[2]),
    sideKey(future.pts[2],future.pts[0])
  ]);
  assert.ok(available.every(step=>!needed.has(step.sideKey) || step.kind==="rectangle-diagonal"),
    "Rectangle VI should not be immediately solvable before its frame is measured.");
});
test("the nine-muse construction contains no rectangles or hidden faces",()=>{
  const p=puzzles.find(x=>x.id==="nine-muses");
  assert.ok(!p.rectangles?.length);
  assert.equal(p.triangles.length,9);
  assert.deepEqual(hiddenShapePairs(p),[]);
  assert.equal(solutionSteps(p).filter(x=>x.kind==="pythagoras").length,9);
});
