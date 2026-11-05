import test from "node:test";
import assert from "node:assert/strict";
import {
  emptyWorking,sanitizeWorking,appendLine,removeLine,setLine,
  addStroke,eraseAt,distanceToSegment,MAX_MATH_LINES,MAX_STROKES
} from "../working-space.js";

test("working is mathematical lines plus vector ink, with no free-text notes",()=>{
  const w=emptyWorking();
  assert.equal(w.tab,"math");
  assert.equal(w.lines.length,1);
  assert.equal(w.lines[0].latex,"");
  assert.deepEqual(w.strokes,[]);
  assert.equal("notes" in w,false);
});
test("a student can type one mathematical step per line, add and remove steps",()=>{
  const w=emptyWorking(),first=w.lines[0].id;
  assert.equal(setLine(w,first,"c^2 = 5^2 + 12^2"),true);
  const second=appendLine(w,first);
  assert.ok(second);
  assert.equal(setLine(w,second,"c = \\sqrt{169}"),true);
  assert.deepEqual(w.lines.map(x=>x.latex),["c^2 = 5^2 + 12^2","c = \\sqrt{169}"]);
  assert.equal(removeLine(w,first),true);
  assert.deepEqual(w.lines.map(x=>x.latex),["c = \\sqrt{169}"]);
  assert.equal(removeLine(w,second),true);
  assert.deepEqual(w.lines.map(x=>x.latex),[""]);
  assert.equal(setLine(w,"not-a-line","x=3"),false);
});
test("line limit is bounded and each line is sanitised for storage",()=>{
  const w=emptyWorking();
  for(let i=1;i<MAX_MATH_LINES;i++)assert.ok(appendLine(w));
  assert.equal(w.lines.length,MAX_MATH_LINES);
  assert.equal(appendLine(w),false);
  const restored=sanitizeWorking({
    tab:"unknown",lines:Array.from({length:50},(_,i)=>({id:"a"+i,latex:"a".repeat(600)})),
    strokes:null
  });
  assert.equal(restored.tab,"math");
  assert.equal(restored.lines.length,MAX_MATH_LINES);
  assert.ok(restored.lines.every(x=>x.latex.length<=260));
});
test("pen strokes remain editable, serializable and normalized",()=>{
  const w=emptyWorking();
  assert.equal(addStroke(w,{width:3,points:[[.1,.2],[.5,.6],[.9,.8]]}),true);
  assert.equal(w.strokes.length,1);
  const saved=JSON.stringify(w);
  const restored=sanitizeWorking(JSON.parse(saved));
  assert.deepEqual(restored.strokes,w.strokes);
  restored.tab="ink";
  assert.equal(sanitizeWorking(restored).tab,"ink");
});
test("eraser removes strokes crossing the stylus position",()=>{
  const w=emptyWorking();
  addStroke(w,{width:2,points:[[.1,.1],[.9,.9]]});
  addStroke(w,{width:2,points:[[.1,.9],[.3,.9]]});
  assert.ok(distanceToSegment([.5,.51],[.1,.1],[.9,.9])<.02);
  assert.equal(eraseAt(w,[.5,.51],.03),1);
  assert.equal(w.strokes.length,1);
  assert.deepEqual(w.strokes[0].points,[[.1,.9],[.3,.9]]);
  assert.equal(eraseAt(w,[.51,.5],.03),0);
});
test("invalid strokes and oversized drawing histories are bounded",()=>{
  const restored=sanitizeWorking({
    strokes:[{width:999,points:[[-10,100],[.5,.4],[NaN,0]]}]
  });
  assert.deepEqual(restored.strokes[0].points,[[0,1],[.5,.4]]);
  assert.equal(restored.strokes[0].width,8);
  const w=emptyWorking();
  for(let i=0;i<MAX_STROKES+17;i++)addStroke(w,{width:2,points:[[i/400,.5]]});
  assert.equal(w.strokes.length,MAX_STROKES);
});
