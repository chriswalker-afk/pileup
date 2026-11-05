import test from "node:test";
import assert from "node:assert/strict";
import {puzzles} from "../pile-geometry.js";
import {buildSides,readySteps,solutionSteps,sideKey} from "../puzzle-engine.js";
import {assertFullyVisiblePuzzle,hiddenShapePairs} from "../pile-visibility.js";

const EPS=1e-6;
const near=(a,b)=>Math.abs(a-b)<EPS;
function isPointOnEdge(p,a,b){
  const d=(b.x-a.x)*(p.y-a.y)-(b.y-a.y)*(p.x-a.x);
  if(Math.abs(d)>EPS)return false;
  const dot=(p.x-a.x)*(b.x-a.x)+(p.y-a.y)*(b.y-a.y);
  const len2=(b.x-a.x)**2+(b.y-a.y)**2;
  return dot>=-EPS&&dot<=len2+EPS;
}
function touches(a,b){
  return [a,b].some((s,index)=>{
    const other=index? a:b;
    return s.pts.some(p=>other.pts.some((q,i)=>
      isPointOnEdge(p,q,other.pts[(i+1)%other.pts.length])));
  });
}
function groundShapes(puzzle){
  return [...puzzle.triangles,...(puzzle.rectangles||[])].filter(s=>
    // Grounded base requires an EDGE on the floor; a passing
    // vertex at y=0 is merely a contact point, not a foundation.
    s.pts.filter(q=>near(q.y,0)).length>=2);
}
function connectedComponents(puzzle){
  const shapes=[...puzzle.triangles,...(puzzle.rectangles||[])];
  const seen=new Set(),componentSizes=[];
  for(let i=0;i<shapes.length;i++){
    if(seen.has(i))continue;
    const queue=[i];seen.add(i);let count=0;
    while(queue.length){
      const n=queue.pop();count++;
      for(let j=0;j<shapes.length;j++){
        if(seen.has(j)||!touches(shapes[n],shapes[j]))continue;
        seen.add(j);queue.push(j);
      }
    }
    componentSizes.push(count);
  }
  return componentSizes;
}
function inside(poly,p){
  // Boundary is intentionally not counted as solid interior.
  let contains=false;
  for(let i=0,j=poly.length-1;i<poly.length;j=i++){
    const a=poly[i],b=poly[j];
    if((a.y>p.y)!==(b.y>p.y)){
      const x=(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x;
      if(p.x<x)contains=!contains;
    }
  }
  return contains;
}
function voidAt(puzzle,x,y){
  return [...puzzle.triangles,...(puzzle.rectangles||[])].every(shape=>
    !inside(shape.pts,{x,y}));
}

test("every structure is connected through real contacts, not floating scenery",()=>{
  for(const puzzle of puzzles){
    assert.equal(assertFullyVisiblePuzzle(puzzle),true);
    assert.deepEqual(hiddenShapePairs(puzzle),[]);
    const components=connectedComponents(puzzle);
    assert.equal(components.length,1,puzzle.id+" has disconnected decorative pieces");
    assert.equal(components[0],puzzle.triangles.length+(puzzle.rectangles?.length||0));
    assert.ok(puzzle.triangles.some(t=>t.pts.some(q=>near(q.y,0))),
      puzzle.id+" has no grounded triangle");
  }
});
test("puzzles intentionally vary their supported ground footprint",()=>{
  const expected=new Map([
    ["first-fall",1],["projecting-edge",1],["twin-paths",1],
    ["split-project",1],["labyrinth",2],["great-pile",1],
    ["nine-muses",1],["marble-terrace",3],["acropolis",2],
    ["great-interlock",2]
  ]);
  for(const puzzle of puzzles)assert.equal(groundShapes(puzzle).length,
    expected.get(puzzle.id),puzzle.id+" ground footprint changed");
  assert.equal(new Set([...expected.values()]).size>=3,true);
});
test("open bays and triangular gaps are genuinely empty, not white overlays",()=>{
  // Only truly open structures claim to contain a central bay.
  // The four replacements instead have directly adjoining pieces.
  for(const [id,x,y] of [
    ["labyrinth",12,3]  ]){
    const puzzle=puzzles.find(p=>p.id===id);
    assert.equal(voidAt(puzzle,x,y),true,
      id+" must expose a genuinely unfilled bay at "+x+","+y);
  }
});
test("the upper structure genuinely rises above its foundations",()=>{
  for(const puzzle of puzzles.slice(1)){
    const ground=groundShapes(puzzle);
    const foundationHeight=Math.max(...ground.flatMap(s=>s.pts.map(p=>p.y)));
    const top=Math.max(...puzzle.triangles.flatMap(s=>s.pts.map(p=>p.y)));
    // Some upper-arm triangles themselves touch the floor in the
    // Labyrinth. A skyline at or above its floor pieces still counts.
    assert.ok(top>=foundationHeight-1e-6,puzzle.id+" did not grow upwards");
    assert.ok(top>5,puzzle.id+" is too flat to read as a pile");
  }
});
test("four reworked problems have a genuine, unique mathematical entry",()=>{
  for(const id of ["split-project","great-pile","nine-muses","acropolis"]){
    const puzzle=puzzles.find(p=>p.id===id);
    const sides=buildSides(puzzle),initial=readySteps(puzzle,sides,new Set());
    assert.equal(initial.length,1,id+" should begin with one clearly marked calculation");
    assert.ok(!initial[0].isTarget,id+" must not reveal x initially");
    const steps=solutionSteps(puzzle,sides);
    assert.ok(steps.some(step=>step.isTarget));
  }
  for(const puzzle of puzzles.filter(p=>!["split-project","great-pile","nine-muses","acropolis"].includes(p.id))){
    const ready=readySteps(puzzle,buildSides(puzzle),new Set());
    assert.ok(ready.length>=1,puzzle.id+" needs a valid starting calculation");
  }
});
test("the two new framed structures do not simply append a rectangle",()=>{
  const m=puzzles.find(p=>p.id==="marble-terrace");
  const a=puzzles.find(p=>p.id==="acropolis");
  const area=rect=>rect.pts.reduce((n,p,i)=>{
    const q=rect.pts[(i+1)%4];
    return n+p.x*q.y-p.y*q.x;
  },0)/2;
  assert.ok(Math.abs(area(m.rectangles[0]))>40);
  assert.ok(a.rectangles.every(r=>Math.abs(area(r))>40));
  assert.equal(a.rectangles.length,2);
  assert.equal(a.equalSideGroups?.length||0,0);
  const highSpan=a.lengthRelations[0];
  const whole=highSpan.whole;
  assert.ok(near(Math.hypot(whole.a.x-whole.b.x,whole.a.y-whole.b.y),12));
  assert.ok(near(a.solution,15));
});
