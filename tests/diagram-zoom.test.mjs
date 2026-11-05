import test from "node:test";
import assert from "node:assert/strict";
import {ZOOM_LEVELS,MAX_ZOOM,newZoom,zoomViewBox,zoomAt,zoomStep,
  panPixels,pointerAnchor} from "../diagram-zoom.js";

const close=(a,b,epsilon=1e-7)=>assert.ok(Math.abs(a-b)<epsilon,
  "Expected "+a+" to equal "+b);

test("fit zoom shows the unchanged full diagram with exact mathematical positions",()=>{
  const s=newZoom(960,590);
  assert.deepEqual(zoomViewBox(s),{x:0,y:0,width:960,height:590});
  assert.equal(s.scale,1);
  assert.equal(zoomStep(s,-1).scale,1);
  assert.equal(zoomAt(s,0).scale,1);
});

test("plus/minus steps are predictable and bounded between 100% and 400%",()=>{
  let s=newZoom();
  for(let i=1;i<ZOOM_LEVELS.length;i++){
    s=zoomStep(s,1);
    close(s.scale,ZOOM_LEVELS[i]);
    const b=zoomViewBox(s);
    close(b.width,960/s.scale);
    close(b.height,590/s.scale);
    assert.ok(b.x>=0&&b.y>=0);
  }
  assert.equal(s.scale,MAX_ZOOM);
  s=zoomStep(s,1);
  assert.equal(s.scale,4);
  for(let i=ZOOM_LEVELS.length-2;i>=0;i--){
    s=zoomStep(s,-1);
    close(s.scale,ZOOM_LEVELS[i]);
  }
  assert.deepEqual(zoomViewBox(s),{x:0,y:0,width:960,height:590});
});

test("pointer anchored zoom retains the same logical point when away from bounds",()=>{
  const s=newZoom(960,590);
  const before=zoomViewBox(s);
  const zoomed=zoomAt(s,2,.35,.4);
  const after=zoomViewBox(zoomed);
  close(before.x+.35*before.width,after.x+.35*after.width);
  close(before.y+.4*before.height,after.y+.4*after.height);
});

test("panning respects SVG aspect ratio, bounds and fit mode",()=>{
  const s=zoomAt(newZoom(960,590),2);
  const original=zoomViewBox(s);
  // 960x590 SVG displayed in a 740x460 viewport: correctly
  // convert CSS pixels to viewBox units using uniform meet scaling.
  const moved=panPixels(s,95,-60,740,460);
  const box=zoomViewBox(moved);
  assert.ok(box.x<original.x && box.y>original.y);
  assert.ok(box.x>=0&&box.y>=0&&box.x+box.width<=960+1e-5);
  assert.ok(box.y+box.height<=590+1e-5);
  let edge=panPixels(moved,100000,-100000,740,460);
  close(edge.x,0);close(edge.y,590-590/2);
  edge=panPixels(edge,-100000,100000,740,460);
  close(edge.x,960-960/2);close(edge.y,0);
  assert.deepEqual(zoomViewBox(zoomAt(edge,1)),
    {x:0,y:0,width:960,height:590});
  assert.deepEqual(panPixels(newZoom(),1000,1000,740,460),newZoom());
});

test("pointer coordinates handle SVG meet letterboxing without drifting",()=>{
  const s=zoomAt(newZoom(960,590),2);
  const rect={left:110,top:20,width:780,height:450};
  const {u,v}=pointerAnchor(s,rect,rect.left+rect.width/2,
    rect.top+rect.height/2);
  close(u,.5);close(v,.5);
  const left=pointerAnchor(s,rect,rect.left,rect.top);
  assert.ok(left.u>=0&&left.v>=0);
  const right=pointerAnchor(s,rect,10000,10000);
  assert.deepEqual(right,{u:1,v:1});
});

test("zoom accepts imprecise wheel scaling, then steps towards standard levels",()=>{
  let s=zoomAt(newZoom(),1.68,.75,.3);
  close(s.scale,1.68);
  close(zoomStep(s,1).scale,2);
  close(zoomStep(s,-1).scale,1.5);
  s=zoomAt(s,100);
  close(s.scale,4);
  s=zoomAt(s,-10);
  assert.deepEqual(zoomViewBox(s),{x:0,y:0,width:960,height:590});
});

test("invalid dimensions throw, and nonsensical interaction numbers are clamped",()=>{
  assert.throws(()=>newZoom(0,500),/Invalid diagram/);
  assert.throws(()=>newZoom(960,-1),/Invalid diagram/);
  const a=zoomAt(newZoom(),NaN);
  close(a.scale,1);
  const b=zoomAt(newZoom(),2,-10,10);
  assert.ok(b.x>=0&&b.y>=0);
});
