/**
 * Presentation safety for Pythagoras Pile Up.
 *
 * Triangles and rectangles may share a full edge, part of an edge,
 * or a vertex, but no filled interiors may overlap. Diagonals drawn
 * within a rectangle are mathematical construction lines, not filled
 * polygons. A single convex separating-axis test handles both shapes.
 */
import { rectangleIsValid } from "./rectangle-math.js";
const EPS=1e-8;
const difference=(a,b)=>({x:b.x-a.x,y:b.y-a.y});
const signedArea=pts=>pts.reduce((sum,a,i)=>{
  const b=pts[(i+1)%pts.length];
  return sum+a.x*b.y-a.y*b.x;
},0)/2;
const interval=(vertices,axis)=>{
  const projection=vertices.map(p=>p.x*axis.x+p.y*axis.y);
  return [Math.min(...projection),Math.max(...projection)];
};
export function polygonsOverlap(a,b,epsilon=1e-7){
  if(!a?.pts||!b?.pts||a.pts.length<3||b.pts.length<3)
    throw Error("Visibility checks require two convex shapes.");
  for(const shape of [a,b]){
    for(let i=0;i<shape.pts.length;i++){
      const edge=difference(shape.pts[i],shape.pts[(i+1)%shape.pts.length]);
      const length=Math.hypot(edge.x,edge.y);
      if(length<EPS)throw Error("A shape has a zero-length edge.");
      const axis={x:-edge.y/length,y:edge.x/length};
      const [loA,hiA]=interval(a.pts,axis),[loB,hiB]=interval(b.pts,axis);
      // Touching or coincident borders are valid. Only a positive
      // two-dimensional overlap would hide an important shape.
      if(Math.min(hiA,hiB)-Math.max(loA,loB)<=epsilon)return false;
    }
  }
  return true;
}
export function trianglesCoverEachOther(a,b,epsilon=1e-7){
  if(a?.pts?.length!==3||b?.pts?.length!==3)
    throw Error("This check expects two triangles.");
  return polygonsOverlap(a,b,epsilon);
}
export function hiddenTrianglePairs(puzzle){
  const tris=puzzle?.triangles||[];
  const collisions=[];
  for(let i=0;i<tris.length;i++)for(let j=i+1;j<tris.length;j++)
    if(trianglesCoverEachOther(tris[i],tris[j]))
      collisions.push([tris[i].id,tris[j].id]);
  return collisions;
}
export function hiddenShapePairs(puzzle){
  const shapes=[...(puzzle?.triangles||[]),...(puzzle?.rectangles||[])];
  const collisions=[];
  for(let i=0;i<shapes.length;i++)for(let j=i+1;j<shapes.length;j++)
    if(polygonsOverlap(shapes[i],shapes[j]))
      collisions.push([shapes[i].id,shapes[j].id]);
  return collisions;
}
export function assertFullyVisiblePuzzle(puzzle){
  if(!puzzle?.triangles?.length)throw Error("A puzzle must contain triangles.");
  for(const t of puzzle.triangles){
    if(t.pts.length!==3||t.pts.some(p=>!Number.isFinite(p.x)||!Number.isFinite(p.y)))
      throw Error("Triangle "+t.id+" has invalid coordinates.");
    if(Math.abs(signedArea(t.pts))<EPS)throw Error("Triangle "+t.id+" is degenerate.");
    if(t.pts.some(p=>p.y< -EPS))throw Error("Triangle "+t.id+" falls beneath the floor.");
  }
  for(const r of puzzle.rectangles||[]){
    if(!rectangleIsValid(r))throw Error("Rectangle "+r.id+" is invalid.");
    if(r.pts.some(p=>p.y< -EPS))throw Error("Rectangle "+r.id+" falls beneath the floor.");
  }
  const collisions=hiddenShapePairs(puzzle);
  if(collisions.length){
    throw Error("Hidden shapes in "+puzzle.id+": "+collisions.map(pair=>pair.join(" & ")).join(", "));
  }
  return true;
}
/**
 * Fit every triangle and rectangle inside the drawing tablet with
 * safe margins. A shared floor remains at world y=0.
 */
export function fitPileInTablet(puzzle,{width=960,height=590,floorY=518}={}){
  assertFullyVisiblePuzzle(puzzle);
  const shapes=[...puzzle.triangles,...(puzzle.rectangles||[])];
  const pts=shapes.flatMap(t=>t.pts);
  const left=Math.min(...pts.map(p=>p.x));
  const right=Math.max(...pts.map(p=>p.x));
  const bottom=Math.min(...pts.map(p=>p.y));
  const top=Math.max(...pts.map(p=>p.y));
  const span=Math.max(right-left,EPS),rise=Math.max(top-bottom,EPS);
  const horizontalMargin=Math.max(60,width*.087);
  const upperMargin=Math.max(65,height*.15);
  const scale=Math.min((width-horizontalMargin*2)/span,(floorY-upperMargin)/rise);
  const offsetX=(width-span*scale)/2-left*scale;
  const xy=p=>({x:offsetX+p.x*scale,y:floorY-(p.y-bottom)*scale});
  const converted=pts.map(xy);
  if(converted.some(p=>p.x<horizontalMargin-.1||p.x>width-horizontalMargin+.1||
    p.y<upperMargin-.1||p.y>floorY+.1)){
    throw Error("A piece could be cropped by the tablet.");
  }
  return {width,height,floorY,scale,xy};
}
