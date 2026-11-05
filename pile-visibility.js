/**
 * Presentation safety for Pythagoras Pile Up.
 *
 * Two fully painted triangles may share an edge or vertex, but their
 * filled interiors MUST NOT overlap. This is a geometry rule, not a
 * visual opacity workaround: translucent overlays still hide maths.
 */
const EPS=1e-8;
const difference=(a,b)=>({x:b.x-a.x,y:b.y-a.y});
const area2=pts=>{
  const [a,b,c]=pts;
  return (b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
};
function interval(vertices,axis){
  const projection=vertices.map(p=>p.x*axis.x+p.y*axis.y);
  return [Math.min(...projection),Math.max(...projection)];
}
export function trianglesCoverEachOther(a,b,epsilon=1e-7){
  if(!a?.pts || !b?.pts || a.pts.length!==3 || b.pts.length!==3)
    throw Error("Visibility checks require two triangles.");
  for(const tri of [a,b]){
    for(let i=0;i<3;i++){
      const p=tri.pts[i],q=tri.pts[(i+1)%3];
      const edge=difference(p,q),length=Math.hypot(edge.x,edge.y);
      if(length<EPS)throw Error("A triangle has a zero-length edge.");
      const axis={x:-edge.y/length,y:edge.x/length};
      const [loA,hiA]=interval(a.pts,axis),[loB,hiB]=interval(b.pts,axis);
      // If projections touch or separate on ANY axis then no positive
      // area overlap exists. Shared exact sides are perfectly valid.
      if(Math.min(hiA,hiB)-Math.max(loA,loB)<=epsilon)return false;
    }
  }
  return true;
}
export function hiddenTrianglePairs(puzzle){
  const triangles=puzzle?.triangles||[];
  const collisions=[];
  for(let i=0;i<triangles.length;i++)for(let j=i+1;j<triangles.length;j++){
    if(trianglesCoverEachOther(triangles[i],triangles[j])){
      collisions.push([triangles[i].id,triangles[j].id]);
    }
  }
  return collisions;
}
export function assertFullyVisiblePuzzle(puzzle){
  if(!puzzle?.triangles?.length)throw Error("A puzzle must contain triangles.");
  for(const t of puzzle.triangles){
    if(t.pts.length!==3 || t.pts.some(p=>!Number.isFinite(p.x)||!Number.isFinite(p.y)))
      throw Error("Triangle "+t.id+" has invalid coordinates.");
    if(Math.abs(area2(t.pts))<EPS)throw Error("Triangle "+t.id+" is degenerate.");
    if(t.pts.some(p=>p.y< -EPS))throw Error("Triangle "+t.id+" falls beneath the floor.");
  }
  const overlaps=hiddenTrianglePairs(puzzle);
  if(overlaps.length){
    throw Error("Hidden triangles in "+puzzle.id+": "+overlaps.map(p=>p.join(" & ")).join(", "));
  }
  return true;
}
/**
 * All polygon vertices are deliberately mapped inside a safe zone.
 * The bounds are used by both the SVG renderer and automated tests.
 * floorY is shared with the stone-floor line and must stay visible.
 */
export function fitPileInTablet(puzzle,{width=960,height=590,floorY=518}={}){
  assertFullyVisiblePuzzle(puzzle);
  const pts=puzzle.triangles.flatMap(t=>t.pts);
  const left=Math.min(...pts.map(p=>p.x));
  const right=Math.max(...pts.map(p=>p.x));
  const bottom=Math.min(...pts.map(p=>p.y));
  const top=Math.max(...pts.map(p=>p.y));
  const span=Math.max(right-left,EPS);
  const rise=Math.max(top-bottom,EPS);
  const horizontalMargin=Math.max(60,width*.087);
  const upperMargin=Math.max(65,height*.15);
  const scale=Math.min((width-horizontalMargin*2)/span,(floorY-upperMargin)/rise);
  const offsetX=(width-span*scale)/2-left*scale;
  const xy=p=>({x:offsetX+p.x*scale,y:floorY-(p.y-bottom)*scale});
  const converted=pts.map(xy);
  if(converted.some(p=>p.x<horizontalMargin-.1||p.x>width-horizontalMargin+.1||
    p.y<upperMargin-.1||p.y>floorY+.1)){
    throw Error("Triangle could be cropped by the tablet.");
  }
  return {width,height,floorY,scale,xy};
}
