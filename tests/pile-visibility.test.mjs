import test from "node:test";
import assert from "node:assert/strict";
import { puzzles } from "../pile-geometry.js";
import {
  assertFullyVisiblePuzzle, hiddenTrianglePairs, hiddenShapePairs, polygonsOverlap,
  trianglesCoverEachOther, fitPileInTablet
} from "../pile-visibility.js";

test("all nine puzzles have visible, non-overlapping triangles and rectangles",()=>{
  assert.equal(puzzles.length,9);
  for(const puzzle of puzzles){
    assert.equal(assertFullyVisiblePuzzle(puzzle),true,puzzle.id);
    assert.deepEqual(hiddenTrianglePairs(puzzle),[],puzzle.id);
    assert.deepEqual(hiddenShapePairs(puzzle),[],puzzle.id);
  }
});
test("the redesigned master pile has five distinct faces and no overlaps",()=>{
  const master=puzzles.find(p=>p.id==="great-pile");
  assert.equal(master.triangles.length,5);
  assert.deepEqual(hiddenTrianglePairs(master),[]);
  const ids=master.triangles.map(t=>t.id);
  assert.deepEqual(ids,["I","II","III","IV","V"]);
});
test("shared edges and touching corners are valid; overlapping faces are rejected",()=>{
  const A={id:"I",pts:[{x:0,y:0},{x:4,y:0},{x:4,y:3}]};
  const B={id:"II",pts:[{x:0,y:0},{x:4,y:3},{x:0,y:4}]};
  const overlapping={id:"III",pts:[{x:2,y:.5},{x:5,y:1},{x:3,y:3}]};
  const triangleOnFloor={id:"IV",pts:[{x:0,y:0},{x:4,y:0},{x:0,y:3}]};
  assert.equal(trianglesCoverEachOther(A,B),false);
  assert.equal(trianglesCoverEachOther(A,triangleOnFloor),true);
  assert.equal(trianglesCoverEachOther(A,overlapping),true);
  assert.throws(()=>assertFullyVisiblePuzzle({id:"invalid",triangles:[A,overlapping]}),/Hidden shapes/);
  assert.throws(()=>assertFullyVisiblePuzzle({id:"below-floor",triangles:[
    {id:"I",pts:[{x:0,y:-2},{x:5,y:0},{x:0,y:5}]}
  ]}),/beneath the floor/);
});
test("all triangle and rectangle vertices fit inside the tablet",()=>{
  const width=960,height=590,floorY=518;
  for(const puzzle of puzzles){
    const fit=fitPileInTablet(puzzle,{width,height,floorY});
    const screenPoints=[...puzzle.triangles,...(puzzle.rectangles||[])].flatMap(t=>t.pts.map(fit.xy));
    for(const point of screenPoints){
      assert.ok(point.x>=60 && point.x<=width-60,puzzle.id+" x="+point.x);
      assert.ok(point.y>=65 && point.y<=floorY+.1,puzzle.id+" y="+point.y);
    }
    const floorPoints=[fit.xy(puzzle.floor.a),fit.xy(puzzle.floor.b)];
    assert.ok(floorPoints.every(p=>Math.abs(p.y-floorY)<1e-7),
      puzzle.id+" should rest on the floor");
  }
});
test("a deliberately obscured new triangle cannot be added to the collection",()=>{
  const clean=puzzles[0],mutated={...clean,triangles:[
    ...clean.triangles,
    {...clean.triangles[0],id:"DUPLICATE"}
  ]};
  assert.deepEqual(hiddenTrianglePairs(mutated)[0],["I","DUPLICATE"]);
  assert.throws(()=>fitPileInTablet(mutated),/Hidden shapes/);
});
