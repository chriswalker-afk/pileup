/**
 * Constraint-led dimension placement. Avoid overlap first; prefer nearby
 * sides and clear leaders second. All coordinates remain in the SVG's
 * existing mathematical coordinate system, independent of zoom.
 */
const EPS=1e-8, INF=Number.POSITIVE_INFINITY;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const diff=(a,b)=>({x:b.x-a.x,y:b.y-a.y});
const mid=(a,b)=>({x:(a.x+b.x)/2,y:(a.y+b.y)/2});
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const dot=(a,b)=>a.x*b.x+a.y*b.y;
function rect(pos,w,h){
  return {left:pos.x-w/2,right:pos.x+w/2,top:pos.y-h/2,bottom:pos.y+h/2};
}
function overlap(a,b,padding=4){
  const x=Math.min(a.right+padding,b.right)-Math.max(a.left-padding,b.left);
  const y=Math.min(a.bottom+padding,b.bottom)-Math.max(a.top-padding,b.top);
  return x>0&&y>0?x*y:0;
}
function cross(a,b,c){
  return (b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
}
export function segmentsCross(a,b,c,d){
  const p=cross(a,b,c),q=cross(a,b,d);
  const r=cross(c,d,a),s=cross(c,d,b);
  return p*q<-EPS&&r*s<-EPS;
}
function crossesBox(a,b,box){
  if([a,b].some(p=>p.x>=box.left&&p.x<=box.right&&
    p.y>=box.top&&p.y<=box.bottom))return true;
  const tl={x:box.left,y:box.top},tr={x:box.right,y:box.top};
  const bl={x:box.left,y:box.bottom},br={x:box.right,y:box.bottom};
  return segmentsCross(a,b,tl,tr)||segmentsCross(a,b,tr,br)||
    segmentsCross(a,b,br,bl)||segmentsCross(a,b,bl,tl);
}
function candidatePositions(entry){
  const center=mid(entry.ends.a,entry.ends.b);
  const d=diff(entry.ends.a,entry.ends.b);
  const length=Math.max(EPS,Math.hypot(d.x,d.y));
  const tangent={x:d.x/length,y:d.y/length};
  const perpendicular={x:-tangent.y,y:tangent.x};
  const own=entry.owner||{x:center.x,y:center.y-10};
  const inward=dot(diff(center,own),perpendicular)>0;
  let toward=inward?-1:1;
  if(entry.relationKind==="part")toward=inward?1:-1;
  if(entry.isOverhang) toward=dot(diff(center,own),perpendicular)>=0?1:-1;
  if(entry.isFloor)toward=perpendicular.y>0?-1:1;
  const normal={x:perpendicular.x*toward,y:perpendicular.y*toward};
  const offsets=entry.relationKind?[24,33,43,57,76,98,125,153,190,235]:
    [20,28,38,51,68,88,110,139,176,222];
  const along=[0,-17,17,-34,34,-51,51,-72,72,-95,95,-123,123,-154,154];
  const result=[];
  for(const flip of [1,-1])for(const n of offsets)for(const t of along){
    result.push({
      pos:{x:center.x+normal.x*flip*n+tangent.x*t,
        y:center.y+normal.y*flip*n+tangent.y*t},
      center,n,t,flip:flip<0
    });
  }
  return result;
}
function score(entry,option,placed,edges,bounds){
  const {pos,center,n,t,flip}=option;
  const box=rect(pos,entry.width,entry.height);
  const horizontal=entry.width/2+bounds.marginX;
  if(pos.x<horizontal||pos.x>bounds.width-horizontal||
    pos.y<bounds.minY+entry.height/2||
    pos.y>bounds.floorY-entry.height/2)return INF;
  const d=distance(pos,center);
  // The original scoring barely penalised a long displaced label.
  // Adjacency now matters, once box collisions have been excluded.
  let value=d*1.12+Math.abs(t)*.62+(flip?35:0)+Math.max(0,n-40)*.42;
  const leader=d>68?{a:center,b:pos}:null;
  if(leader){
    value+=42+(d-68)*.45;
    for(const edge of edges){
      if(edge.key!==entry.key&&segmentsCross(leader.a,leader.b,edge.a,edge.b))
        value+=46;
    }
  }
  for(const other of placed){
    const covered=overlap(box,other.rect);
    if(covered>0)value+=500000+covered*120;
    if(leader&&other.lead&&segmentsCross(leader.a,leader.b,other.lead.a,other.lead.b))
      value+=115;
    if(leader&&crossesBox(leader.a,leader.b,other.rect))value+=175;
    if(other.lead&&crossesBox(other.lead.a,other.lead.b,box))value+=175;
  }
  return value;
}
function fallbackCandidates(entry,bounds){
  const center=mid(entry.ends.a,entry.ends.b);
  const result=[];
  const left=entry.width/2+bounds.marginX;
  for(let y=bounds.minY+entry.height/2;y<=bounds.floorY-entry.height/2;y+=27){
    for(let x=left;x<=bounds.width-left;x+=24){
      const pos={x,y},r=distance(pos,center);
      result.push({pos,center,n:r,t:r,flip:true});
    }
  }
  return result;
}
function choose(entry,placed,edges,bounds){
  let chosen=null,best=INF;
  function search(candidates){
    for(const option of candidates){
      const cost=score(entry,option,placed,edges,bounds);
      if(cost+EPS<best){chosen=option;best=cost;}
    }
  }
  search(entry.candidates);
  // Unanchored empty-space callouts are a last resort, not the usual
  // answer to one competing label near a crowded triangle.
  if(!chosen||best>=500000)search(fallbackCandidates(entry,bounds));
  if(!chosen){
    const center=mid(entry.ends.a,entry.ends.b);
    chosen={center,pos:{x:clamp(center.x,entry.width/2+bounds.marginX,
      bounds.width-entry.width/2-bounds.marginX),
      y:clamp(center.y,bounds.minY+entry.height/2,
        bounds.floorY-entry.height/2)},flip:false,n:0,t:0};
  }
  const d=distance(chosen.pos,chosen.center),side=diff(entry.ends.a,entry.ends.b);
  const len=Math.max(EPS,Math.hypot(side.x,side.y));
  const nx=-side.y/len,ny=side.x/len;
  const sign=dot(diff(chosen.center,chosen.pos),{x:nx,y:ny})>=0?1:-1;
  return {key:entry.key,pos:chosen.pos,nx:nx*sign,ny:ny*sign,
    distance:d,needsLeader:d>68,
    rect:rect(chosen.pos,entry.width,entry.height),
    lead:d>68?{a:chosen.center,b:chosen.pos}:null,
    penalty:best};
}
/**
 * Priority order is established by the caller: known lengths and the
 * final target take earlier, less obstructed positions than unknowns.
 */
export function layoutMeasurements(entries,options={}){
  const bounds={width:options.width||960,floorY:options.floorY||518,
    minY:options.minY??36,marginX:options.marginX??23};
  const edges=options.shapeEdges||entries.map(e=>({...e.ends,key:e.key}));
  const ready=entries.map(e=>({...e,candidates:candidatePositions(e)}));
  const placed=[];
  for(const entry of ready)placed.push(choose(entry,placed,edges,bounds));
  // Move later labels closer when a different placement is better.
  // Preserve collision-free solutions when performing local repairs.
  for(let pass=0;pass<2;pass++)for(let i=ready.length-1;i>=0;i--){
    const rest=placed.filter((_,j)=>i!==j),next=choose(ready[i],rest,edges,bounds);
    const old=placed[i];
    const oldClash=rest.some(p=>overlap(old.rect,p.rect,0)>0);
    const newClash=rest.some(p=>overlap(next.rect,p.rect,0)>0);
    if(!newClash||oldClash)placed[i]=next;
  }
  return new Map(placed.map(p=>[p.key,p]));
}
/**
 * Brackets run from the actual two side endpoints, with clear caps.
 * Whole-span brackets are further from the edge than part brackets.
 * They share the same measurement visibility and focus state.
 */
export function dimensionBracket(a,b,{nx,ny},kind="part"){
  if(distance(a,b)<EPS)return null;
  const length=Math.hypot(nx,ny)||1,ux=nx/length,uy=ny/length;
  const offset=kind==="whole"?19:kind==="overhang"?16:12;
  const cap=kind==="whole"?7:5;
  const start={x:a.x+ux*offset,y:a.y+uy*offset};
  const end={x:b.x+ux*offset,y:b.y+uy*offset};
  const capA=[{x:start.x-ux*cap,y:start.y-uy*cap},
    {x:start.x+ux*cap,y:start.y+uy*cap}];
  const capB=[{x:end.x-ux*cap,y:end.y-uy*cap},
    {x:end.x+ux*cap,y:end.y+uy*cap}];
  return {start,end,capA,capB,kind,mid:mid(start,end)};
}
export function classifyRelationSides(relations,keyFor){
  const result=new Map();
  for(const relation of relations||[]){
    const whole=keyFor(relation.whole.a,relation.whole.b);
    result.set(whole,"whole");
    for(const segment of relation.parts){
      const key=keyFor(segment.a,segment.b);
      if(result.get(key)!=="whole")result.set(key,"part");
    }
  }
  return result;
}
export function placementStats(placements){
  const list=[...placements.values()];
  let collisions=0;
  for(let i=0;i<list.length;i++)for(let j=i+1;j<list.length;j++){
    if(overlap(list[i].rect,list[j].rect,0)>0)collisions++;
  }
  return {labels:list.length,collisions,
    meanAnchorDistance:list.length?
      list.reduce((n,p)=>n+p.distance,0)/list.length:0,
    longLeaders:list.filter(p=>p.needsLeader).length};
}
