import test from "node:test";
import assert from "node:assert/strict";
import {
  buildSides, correctAnswer, exactLength, parseAnswer, puzzleIsValid,
  readySteps, sideKey, solutionSteps
} from "../puzzle-engine.js";

const p = (x, y) => ({ x, y });
function makeChain(base, legs) {
  let a = p(0, 0), b = p(base[0], 0), c = p(base[0], base[1]);
  let first = { id: "I", pts: [a,b,c], right: 1,
    givens: [{a,b,value:base[0]}, {a:b,b:c,value:base[1]}] };
  const triangles = [first];
  let previous = first, edge = {a,b:c};
  for (let i=0;i<legs.length;i++) {
    let P=edge.a,Q=edge.b, dx=Q.x-P.x,dy=Q.y-P.y;
    const length = Math.hypot(dx,dy);
    const other=previous.pts.find(z=>z!==P&&z!==Q);
    const orientation=dx*(other.y-(P.y+Q.y)/2)-dy*(other.x-(P.x+Q.x)/2);
    const sign=orientation>=0?-1:1;
    const R=p(P.x-sign*dy/length*legs[i],P.y+sign*dx/length*legs[i]);
    const next={id:["II","III","IV","V"][i],pts:[P,Q,R],right:0,
      givens:[{a:P,b:R,value:legs[i]}]};
    triangles.push(next);previous=next;edge={a:Q,b:R};
  }
  return {triangles,target:edge};
}

test("Both authored puzzle chains are mathematically valid",()=>{
  for(const [base,legs,total] of [
    [[3,4],[12,6],205],[[6,8],[5,7,9,4],271]
  ]){
    const puzzle=makeChain(base,legs);
    assert.equal(puzzleIsValid(puzzle),true);
    const sides=buildSides(puzzle);
    assert.equal(solutionSteps(puzzle,sides).length,legs.length+1);
    assert.ok(Math.abs(sides.get(sideKey(puzzle.target.a,puzzle.target.b)).length**2-total)<1e-6);
    assert.equal(readySteps(puzzle,sides,new Set()).length,1);
  }
});
test("A shared edge is one side, not two independent answers",()=>{
  const puz=makeChain([3,4],[12,6]);
  const sides=buildSides(puz);
  assert.equal(sides.size,7);
  assert.equal([...sides.values()].filter(s=>!s.given).length,3);
  const first=solutionSteps(puz,sides)[0];
  assert.equal(first.answer,"5");
  assert.equal(sides.get(first.sideKey).triangleIds.length,2);
});
test("Hints and steps support subtraction for a missing leg",()=>{
  // The second triangle has a known hypotenuse of 13 and shares the
  // unknown length 5 with the first triangle: its new leg is 12.
  const a=p(0,0), b=p(3,0),c=p(3,4);
  const r=p(-6.6,11.2);
  const puz={triangles:[
    {id:"I",pts:[a,b,c],right:1,givens:[{a,b,value:3},{a:b,b:c,value:4}]},
    {id:"II",pts:[a,c,r],right:1,givens:[{a,b:r,value:13}]}
  ],target:{a:c,b:r}};
  assert.equal(puzzleIsValid(puz),true);
  const steps=solutionSteps(puz);
  assert.equal(steps[0].answer,"5");
  assert.equal(steps[1].answer,"12");
  assert.equal(steps[1].isHypotenuse,false);
  assert.match(steps[1].equation,/−/);
});
test("Exact, equivalent and sensibly rounded answers are accepted",()=>{
  const root=Math.sqrt(205);
  for(const answer of ["√205","sqrt(205)","\\sqrt{205}","14.3","14.32","14.318","sqrt(41*5)","√(205)","14.318cm"])
    assert.equal(correctAnswer(answer,root),true,answer);
  for(const answer of ["14.2","14.31","12","abc","sqrt(-3)","0/0","1/0","14.50",""])
    assert.equal(correctAnswer(answer,root),false,answer);
  assert.equal(correctAnswer("5√5",Math.sqrt(125)),true);
  assert.equal(correctAnswer("10/2",5),true);
  assert.equal(exactLength(Math.sqrt(125)),"5√5");
});
test("Input evaluation is bounded and does not execute JavaScript",()=>{
  for(const answer of ["alert(1)","window.location","2;3","Infinity","3**4","1e900",")("])
    assert.equal(parseAnswer(answer),null,answer);
  assert.equal(parseAnswer("3^2 + 4^2"),25);
  assert.equal(parseAnswer("2√(9)"),6);
});
