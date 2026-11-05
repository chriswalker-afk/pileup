/**
 * Density-aware measurement disclosure.
 *
 * Short sides surrounded by competing triangle sides should not start
 * with overlapping question marks and a tangle of leader lines.
 * This module never hides givens, solved lengths, or target x; it only
 * suggests postponing unknown labels until the student picks a face.
 *
 * All distances are calculated from the fitted SVG geometry, not the
 * arbitrary mathematical coordinate system of a particular puzzle.
 */
const mid=(a,b)=>({x:(a.x+b.x)/2,y:(a.y+b.y)/2});
const length=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const near=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);

export function crowdedUnknownKeys(sides,xy,{
  neighborhood=105,shortEdge=115,nearbyThreshold=2
}={}){
  const items=[...sides].filter(s=>!s.suppressLabel).map(side=>{
    const a=xy(side.a),b=xy(side.b);
    return {side,key:side.key,a,b,m:mid(a,b),length:length(a,b)};
  });
  const selected=new Set();
  for(const item of items){
    if(item.side.given||item.side.isTarget)continue;
    if(item.length>=shortEdge)continue;
    // Neighbours must represent different physical sides. Two
    // descriptions of an exactly coincident edge count just once.
    const neighbours=items.filter(other=>other.key!==item.key&&
      near(item.m,other.m)<neighborhood&&
      (other.side.triangleIds||[]).some(id=>
        !(item.side.triangleIds||[]).includes(id)));
    if(neighbours.length>=nearbyThreshold)selected.add(item.key);
  }
  return selected;
}
export function compactFace(shape,shapes,xy,{
  shortEdge=125,nearbyDistance=140
}={}){
  const pts=shape.pts.map(xy);
  const minEdge=Math.min(...pts.map((a,i)=>length(a,pts[(i+1)%pts.length])));
  if(minEdge>=shortEdge)return false;
  const cent=ps=>({x:ps.reduce((n,p)=>n+p.x,0)/ps.length,
    y:ps.reduce((n,p)=>n+p.y,0)/ps.length});
  const own=cent(pts);
  const neighbours=shapes.filter(s=>s.id!==shape.id&&
    near(own,cent(s.pts.map(xy)))<nearbyDistance);
  return neighbours.length>=1;
}
