import test from "node:test";
import assert from "node:assert/strict";
import {crowdedUnknownKeys,compactFace} from "../label-density.js";
import {puzzles} from "../pile-geometry.js";
import {buildSides} from "../puzzle-engine.js";
import {fitPileInTablet} from "../pile-visibility.js";

const p=(x,y)=>({x,y}),xy=v=>v;
const side=(key,a,b,triangleIds,extra={})=>({key,a,b,triangleIds,...extra});

test("local density postpones only unknown labels on short, competing edges",()=>{
  const sides=[
    side("a",p(0,0),p(40,0),["I"]),
    side("b",p(0,0),p(0,45),["II"]),
    side("c",p(10,10),p(50,10),["III"]),
    side("given",p(11,10),p(52,10),["IV"],{given:true}),
    side("target",p(13,13),p(50,13),["V"],{isTarget:true}),
    side("far",p(400,400),p(430,400),["VI"]),
    side("long",p(0,0),p(200,0),["VII"])
  ];
  const crowd=crowdedUnknownKeys(sides,xy);
  assert.ok(crowd.has("a"));
  assert.ok(crowd.has("b"));
  assert.ok(crowd.has("c"));
  assert.ok(!crowd.has("given"),"Never defer a given length");
  assert.ok(!crowd.has("target"),"Never defer x");
  assert.ok(!crowd.has("far"),"Uncrowded small length stays visible");
  assert.ok(!crowd.has("long"),"A long length need not be deferred");
});
test("two short sides of the same triangle alone are not a crowded cluster",()=>{
  const sides=[
    side("a",p(0,0),p(35,0),["I"]),
    side("b",p(0,0),p(0,45),["I"]),
    side("c",p(0,45),p(35,0),["I"])
  ];
  assert.equal(crowdedUnknownKeys(sides,xy).size,0);
});
test("tapping a genuinely compact triangle can isolate its own lengths",()=>{
  const I={id:"I",pts:[p(0,0),p(50,0),p(0,60)]};
  const II={id:"II",pts:[p(0,60),p(45,60),p(0,100)]};
  const distant={id:"III",pts:[p(700,700),p(850,700),p(700,900)]};
  assert.ok(compactFace(I,[I,II,distant],xy));
  assert.ok(compactFace(II,[I,II,distant],xy));
  assert.equal(compactFace(distant,[I,II,distant],xy),false);
});
test("every one of the ten real puzzles remains safe for exact density assessment",()=>{
  assert.equal(puzzles.length,10);
  for(const puzzle of puzzles){
    const sides=buildSides(puzzle);
    const fit=fitPileInTablet(puzzle);
    const crowd=crowdedUnknownKeys(sides.values(),fit.xy);
    for(const key of crowd){
      const side=sides.get(key);
      assert.ok(side&&!side.given&&!side.isTarget&&!side.suppressLabel);
    }
    for(const shape of [...puzzle.triangles,...(puzzle.rectangles||[])]){
      assert.equal(typeof compactFace(shape,
        [...puzzle.triangles,...(puzzle.rectangles||[])],fit.xy),"boolean");
    }
  }
});
