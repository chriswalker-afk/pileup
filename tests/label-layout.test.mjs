import test from "node:test";
import assert from "node:assert/strict";
import {puzzles} from "../pile-geometry.js";
import {fitPileInTablet} from "../pile-visibility.js";
import {buildSides,exactLength,sideKey} from "../puzzle-engine.js";
import {
  layoutMeasurements,dimensionBracket,classifyRelationSides,
  placementStats,segmentsCross,labelTether
} from "../label-layout.js";

const near=(a,b,eps=1e-6)=>assert.ok(Math.abs(a-b)<eps,
  "Expected "+a+" close to "+b);

test("the bracket caps identify exact whole and partial edge extents",()=>{
  const a={x:10,y:20},b={x:110,y:20};
  const part=dimensionBracket(a,b,{nx:0,ny:-1},"part");
  const whole=dimensionBracket(a,b,{nx:0,ny:-1},"whole");
  near(part.start.x,10);near(part.end.x,110);
  near(part.start.y,8);near(whole.start.y,1);
  assert.deepEqual(part.mid,{x:60,y:8});
  assert.equal(part.capA.length,2);
  assert.equal(whole.capB.length,2);
  near(whole.capA[0].y,8);near(whole.capA[1].y,-6);
  const zero=dimensionBracket(a,a,{nx:1,ny:0},"part");
  assert.equal(zero,null);
  const above=dimensionBracket(a,b,{nx:0,ny:1},"overhang");
  near(above.start.y,36);
});

test("all ten sides and brackets have a deterministic edge-bound physical pointer",()=>{
  const entry={key:"ab",ends:{a:{x:100,y:120},b:{x:220,y:120}},
    width:58,height:24,owner:{x:160,y:175}};
  const chosen={pos:{x:160,y:90}};
  const tether=labelTether(entry,chosen);
  assert.deepEqual(tether.anchor,{x:160,y:120});
  near(tether.end.x,160);near(tether.end.y,102);
  near(tether.length,18);
  const bracket={x:160,y:100}; // inside the chip; must not hide the endpoint.
  assert.deepEqual(labelTether(entry,chosen,bracket),tether);
  const outside={x:160,y:114};
  const bracketTether=labelTether(entry,chosen,outside);
  near(bracketTether.anchor.y,114);
  near(bracketTether.end.y,102);
  assert.ok(bracketTether.length>0);
});

test("relation metadata distinguishes the complete side and each part",()=>{
  const rel=[{
    whole:{a:{x:0,y:0},b:{x:10,y:0}},
    parts:[
      {a:{x:0,y:0},b:{x:4,y:0}},
      {a:{x:4,y:0},b:{x:10,y:0}}
    ]
  }];
  const result=classifyRelationSides(rel,(a,b)=>a.x+"-"+b.x);
  assert.equal(result.get("0-10"),"whole");
  assert.equal(result.get("0-4"),"part");
  assert.equal(result.get("4-10"),"part");
  assert.equal(result.size,3);
});

test("proper leader crossings do not misidentify adjacent endpoints",()=>{
  assert.ok(segmentsCross(
    {x:0,y:0},{x:10,y:10},{x:0,y:10},{x:10,y:0}));
  assert.equal(segmentsCross(
    {x:0,y:0},{x:10,y:10},{x:10,y:10},{x:20,y:0}),false);
  assert.equal(segmentsCross(
    {x:0,y:0},{x:10,y:0},{x:0,y:1},{x:10,y:1}),false);
});

test("simple sides get local labels, without collisions or long leaders",()=>{
  const descriptors=[
    {key:"a",ends:{a:{x:100,y:140},b:{x:240,y:140}},owner:{x:170,y:210},width:56,height:24},
    {key:"b",ends:{a:{x:360,y:140},b:{x:500,y:140}},owner:{x:430,y:210},width:56,height:24},
    {key:"c",ends:{a:{x:620,y:140},b:{x:760,y:140}},owner:{x:690,y:210},width:56,height:24}
  ];
  const p=layoutMeasurements(descriptors,{width:960,floorY:518});
  const stats=placementStats(p);
  assert.equal(stats.labels,3);
  assert.equal(stats.collisions,0);
  assert.equal(stats.longLeaders,0);
  assert.ok(stats.meanAnchorDistance<50,stats.meanAnchorDistance.toString());
  assert.deepEqual([...p.keys()],["a","b","c"]);
  assert.deepEqual([...layoutMeasurements(descriptors).values()].map(x=>x.pos),
    [...p.values()].map(x=>x.pos),"Placement must be deterministic");
});

test("all ten authored piles stay bounded and collision-free at classroom widths",()=>{
  for(const puzzle of puzzles){
    const sides=buildSides(puzzle);
    const {width,height,floorY,xy}=fitPileInTablet(puzzle);
    const parts=[...puzzle.triangles,...(puzzle.rectangles||[])];
    const owners=parts.map(shape=>({
      id:shape.id,
      position:xy({
        x:shape.pts.reduce((n,p)=>n+p.x,0)/shape.pts.length,
        y:shape.pts.reduce((n,p)=>n+p.y,0)/shape.pts.length
      })
    }));
    const relation=classifyRelationSides(puzzle.lengthRelations,sideKey);
    for(const availableWidth of [780,440,340,300]){
      const ratio=Math.max(.32,Math.min(
        availableWidth/width,
        Math.min(490,Math.max(340,availableWidth*590/960))/height
      ));
      const dense=parts.length>=8;
      const fontSize=dense?Math.min(31,Math.max(12,11/ratio)):
        Math.min(31,Math.max(15,12/ratio));
      const heightOfLabel=fontSize+11;
      const list=[...sides.values()].filter(s=>!s.suppressLabel);
      list.sort((a,b)=>Number(b.given)-Number(a.given)||
        Number(b.isOverhang)-Number(a.isOverhang)||
        Number(b.isTarget)-Number(a.isTarget)||
        b.length-a.length);
      const descriptors=list.map(side=>{
        const label=side.given?exactLength(side.length)+" cm":side.isTarget?"x":"?";
        return {
          key:side.key,ends:{a:xy(side.a),b:xy(side.b)},
          width:Math.max(fontSize+12,label.length*fontSize*.56+15),
          height:heightOfLabel,
          owner:owners.find(x=>side.triangleIds.includes(x.id))?.position||
            owners[0].position,
          isFloor:side.key===sideKey(puzzle.floor.a,puzzle.floor.b),
          isOverhang:side.isOverhang,
          relationKind:relation.get(side.key)||null
        };
      });
      const p=layoutMeasurements(descriptors,{
        width,floorY,minY:36,marginX:23,
        shapeEdges:[...sides.values()].map(s=>({
          a:xy(s.a),b:xy(s.b),key:s.key
        }))
      });
      const stats=placementStats(p);
      // Every chip has an actual pointer anchored at the exact
      // measured midpoint and ending at the chip border.
      for(const item of p.values()){
        const desc=descriptors.find(d=>d.key===item.key);
        assert.ok(desc,"No matching side for "+item.key);
        const a=desc.ends.a,b=desc.ends.b,anchor=item.tether.anchor;
        const dx=b.x-a.x,dy=b.y-a.y,apx=anchor.x-a.x,apy=anchor.y-a.y;
        assert.ok(Math.abs(dx*apy-dy*apx)<1e-4,
          "The stem's anchor must lie ON its exact geometric side");
        const length2=dx*dx+dy*dy,projection=(apx*dx+apy*dy)/length2;
        assert.ok(projection>=-1e-6&&projection<=1+1e-6,
          "The anchor extends past its own measured side");
        assert.ok(item.tether.length>1,
          "Missing visible association for "+puzzle.id+" at "+availableWidth+"px");
        const e=item.tether.end,r=item.rect;
        const onBorder=(Math.abs(e.x-r.left)<1e-6||
          Math.abs(e.x-r.right)<1e-6||
          Math.abs(e.y-r.top)<1e-6||
          Math.abs(e.y-r.bottom)<1e-6)&&
          e.x>=r.left-1e-6&&e.x<=r.right+1e-6&&
          e.y>=r.top-1e-6&&e.y<=r.bottom+1e-6;
        assert.ok(onBorder,
          "Attachment missed chip border in "+puzzle.id+" at "+availableWidth+"px");
      }
      assert.equal(stats.labels,descriptors.length);
      assert.equal(stats.collisions,0,
        "Clashing labels on "+puzzle.id+" at "+availableWidth+"px");
      for(const item of p.values()){
        assert.ok(Number.isFinite(item.pos.x)&&Number.isFinite(item.pos.y));
        assert.ok(item.rect.left>=23-1e-6&&item.rect.right<=937+1e-6,
          "Horizontal clipped label on "+puzzle.id);
        assert.ok(item.rect.top>=36-1e-6&&item.rect.bottom<=floorY+1e-6,
          "Vertical clipped label on "+puzzle.id);
      }
    }
  }
});
