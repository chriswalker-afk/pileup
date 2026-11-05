import test from "node:test";
import assert from "node:assert/strict";
import { puzzles } from "../pile-geometry.js";
import { buildSides, sideKey } from "../puzzle-engine.js";
import { newZoom, zoomAt, zoomViewBox } from "../diagram-zoom.js";
import { labelsForShape, centreSideAtZoom, sideExtent } from "../label-clarity.js";

test("each of nine piles focuses only its own annotated piece sides",()=>{
  for(const puzzle of puzzles){
    const map=buildSides(puzzle);
    const all=[...puzzle.triangles,...(puzzle.rectangles||[])];
    for(const shape of all){
      const focused=labelsForShape(map,shape.id);
      const actual=[...map.values()].filter(side=>
        !side.suppressLabel && side.triangleIds.includes(shape.id));
      assert.deepEqual([...focused].sort(),actual.map(s=>s.key).sort(),
        "Incorrect focus side membership in "+puzzle.id+" / "+shape.id);
      assert.ok(focused.size>0,"No selectable sides for "+shape.id);
      for(const key of focused)assert.equal(map.has(key),true);
    }
    assert.equal(labelsForShape(map,null).size,0);
    assert.equal(labelsForShape(map,"not-a-real-piece").size,0);
  }
});

test("every visible rectangle edge and diagonal can be included in focus",()=>{
  for(const puzzle of puzzles){
    for(const rect of puzzle.rectangles||[]){
      const sides=buildSides(puzzle),focus=labelsForShape(sides,rect.id);
      for(let i=0;i<rect.pts.length;i++){
        const key=sideKey(rect.pts[i],rect.pts[(i+1)%rect.pts.length]);
        const entry=sides.get(key);
        if(entry&&!entry.suppressLabel)assert.ok(focus.has(key),
          "Rectangle side omitted from focus: "+puzzle.id+" "+rect.id);
      }
      for(const diagonal of rect.diagonals||[]){
        const key=sideKey(diagonal.a,diagonal.b);
        const entry=sides.get(key);
        if(entry&&!entry.suppressLabel)assert.ok(focus.has(key),
          "Rectangle diagonal omitted from focus: "+puzzle.id+" "+rect.id);
      }
    }
  }
});

test("locate centers a side without changing 200% zoom",()=>{
  const before=zoomAt(newZoom(960,590),2);
  const result=centreSideAtZoom(before,{x:450,y:260},{x:470,y:320});
  assert.equal(result.scale,2);
  assert.equal(result.width,960);
  assert.equal(result.height,590);
  const window=zoomViewBox(result);
  assert.equal(window.x+window.width/2,460);
  assert.equal(window.y+window.height/2,290);
});

test("locate clamps to edges, never looking outside the original pile",()=>{
  const before=zoomAt(newZoom(960,590),4);
  for(const [a,b] of [
    [{x:0,y:0},{x:20,y:12}],
    [{x:940,y:560},{x:960,y:590}],
    [{x:5,y:570},{x:15,y:580}]
  ]){
    const z=centreSideAtZoom(before,a,b),v=zoomViewBox(z);
    assert.equal(z.scale,4);
    assert.ok(z.x>=0&&z.y>=0);
    assert.ok(v.x+v.width<=960+1e-8&&v.y+v.height<=590+1e-8);
  }
  assert.deepEqual(zoomViewBox(centreSideAtZoom(newZoom(960,590),
    {x:940,y:560},{x:960,y:590})),{x:0,y:0,width:960,height:590});
});

test("highlighted segments use the actual two endpoints, not the label position",()=>{
  const a={x:120,y:250},b={x:360,y:70};
  const e=sideExtent(a,b);
  assert.equal(e.midX,240);
  assert.equal(e.midY,160);
  assert.equal(e.length,300);
});
