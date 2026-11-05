import test from "node:test";
import assert from "node:assert/strict";
import { puzzles } from "../pile-geometry.js";
import {
  buildSides, sideKey, readySteps, solutionSteps, puzzleIsValid,
  exactLength, correctAnswer
} from "../puzzle-engine.js";

const expected=[
  ["first-fall",3,["20","15","8","10"]],
  ["projecting-edge",4,["20","24","10","26","5√29"]],
  ["twin-paths",3,["12","13","5","17","15"]],
  ["split-project",3,["12","15","13","25","20"]],
  ["labyrinth",5,["20","24","10","2√41","10√2","√281"]],
  ["great-pile",5,["12","5","17","15","5√13","5√14"]]
];

test("Six different authored challenges are available",()=>{
  assert.equal(puzzles.length,expected.length);
  assert.deepEqual(puzzles.map(p=>p.id),expected.map(p=>p[0]));
  assert.ok(puzzles.every(p=>Array.isArray(p.tags)&&p.tags.length>0));
  assert.equal(new Set(puzzles.map(p=>p.id)).size,puzzles.length);
});
for(const [id,n,chain] of expected){
  test(id+": exact geometry and fully solvable dependency chain",()=>{
    const puzzle=puzzles.find(p=>p.id===id);
    assert.ok(puzzle);
    assert.equal(puzzle.triangles.length,n);
    assert.equal(puzzleIsValid(puzzle),true);
    assert.equal(puzzle.floor.a.y,0);
    assert.equal(puzzle.floor.b.y,0);
    assert.ok(puzzle.triangles.every(t=>t.pts.every(vertex=>vertex.y>=-1e-8)));
    const sides=buildSides(puzzle);
    const steps=solutionSteps(puzzle,sides);
    assert.deepEqual(steps.map(s=>s.answer),chain);
    assert.ok(steps.at(-1)?.isTarget);
    assert.equal(steps.at(-1).answer,exactLength(puzzle.solution));
    assert.equal(steps.length,[...sides.values()].filter(s=>!s.given).length);
    assert.equal(correctAnswer(steps.at(-1).answer,puzzle.solution),true);
  });
}
const mag=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const wedge=(a,b,c)=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
function onSegment(p,a,b){
  if(Math.abs(wedge(a,b,p))>1e-7)return false;
  const f=(p.x-a.x)*(b.x-a.x)+(p.y-a.y)*(b.y-a.y);
  return f>=-1e-7&&f<=mag(a,b)**2+1e-7;
}
for(const id of ["twin-paths","split-project","great-pile"]){
  test(id+": one long edge spans TWO independently owned triangle edges",()=>{
    const puzzle=puzzles.find(p=>p.id===id);
    const whole=puzzle.spanHighlight.whole;
    const parts=puzzle.spanHighlight.parts;
    assert.equal(parts.length,2);
    assert.ok(parts.every(part=>onSegment(part.a,whole.a,whole.b)));
    // The projecting part can extend past the end of the long edge.
    assert.ok(parts.every(part=>Math.abs(wedge(whole.a,whole.b,part.b))<1e-7));
    assert.ok(mag(parts[0].a,parts[0].b)>1);
    assert.ok(mag(parts[1].a,parts[1].b)>1);
    assert.equal(sideKey(parts[0].b,parts[1].a).split("|").length,2);
    // The two supporting edges belong to different triangles.
    const sideMap=buildSides(puzzle);
    const owners=parts.map(part=>sideMap.get(sideKey(part.a,part.b)).triangleIds);
    assert.ok(owners[0].includes("II"));
    assert.ok(owners[1].includes("III"));
  });
}
test("Matching tick marks are a real mathematical dependency, not decoration",()=>{
  const puzzle=puzzles.find(p=>p.id==="twin-paths");
  assert.equal(puzzle.equalSideGroups.length,1);
  const sides=buildSides(puzzle);
  const matching=puzzle.equalSideGroups[0].map(desc=>sides.get(sideKey(desc.a,desc.b)));
  assert.equal(matching[0].length,matching[1].length);
  assert.equal(matching[0].given,true);
  assert.equal(matching[1].given,false);
  const initial=readySteps(puzzle,sides,new Set());
  assert.ok(initial.some(step=>step.kind==="equal"&&step.answer==="13"));
  assert.ok(initial.some(step=>step.kind==="pythagoras"&&step.answer==="12"));
  assert.ok(initial.length>=2);
});
test("Branching project challenge has two independent mathematical starting points",()=>{
  const puzzle=puzzles.find(p=>p.id==="split-project");
  const initial=readySteps(puzzle,buildSides(puzzle),new Set());
  assert.equal(initial.filter(step=>step.kind==="pythagoras").length,2);
  assert.ok(initial.some(step=>step.answer==="12"));
  assert.ok(initial.some(step=>step.answer==="15"));
});
test("Projected and inset overhangs represent different straight-line operations",()=>{
  const first=solutionSteps(puzzles[0]).find(step=>step.kind==="overhang");
  const second=solutionSteps(puzzles[1]).find(step=>step.kind==="overhang");
  assert.match(first.equation,/−/);
  assert.match(second.equation,/\+/);
  assert.ok(puzzles[3].extraSegments[0].label.includes("OVERHANG"));
});
function triArea(t){
  const [a,b,c]=t.pts;
  return Math.abs(wedge(a,b,c))/2;
}
test("The split-edge extension values agree with the geometry",()=>{
  for(const [id,perimeter,area,supportShared] of [
    ["twin-paths",66,120,17],
    ["split-project",80,240,25]
  ]){
    const puzzle=puzzles.find(p=>p.id===id);
    assert.equal(puzzle.triangles.length,3);
    const items=puzzle.extensions;
    assert.equal(items.find(x=>x.id==="perimeter").value,perimeter);
    assert.equal(items.find(x=>x.id==="area").value,area);
    const areaSum=puzzle.triangles.reduce((s,t)=>s+triArea(t),0);
    assert.ok(Math.abs(areaSum-area)<1e-8);
    const rawPerimeter=puzzle.triangles.reduce((sum,t)=>{
      const [a,b,c]=t.pts;
      return sum+mag(a,b)+mag(b,c)+mag(c,a);
    },0);
    assert.ok(Math.abs(rawPerimeter-2*supportShared-perimeter)<1e-7);
  }
});
test("Bridge puzzle introduces an edge owned by multiple triangles",()=>{
  const puzzle=puzzles.find(p=>p.id==="great-pile"),sides=buildSides(puzzle);
  const support=sides.get(sideKey(puzzle.spanHighlight.whole.a,puzzle.spanHighlight.whole.b));
  assert.ok(support.triangleIds.includes("I"));
  assert.ok(support.triangleIds.includes("IV"));
  assert.equal(puzzle.extensions,undefined); // Avoid treating overlapping polygons as additive areas.
});
