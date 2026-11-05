import { zoomViewBox } from "./diagram-zoom.js";

/**
 * Identify the annotated sides belonging to one piece, without
 * changing mathematical side lengths or geometry.
 * A side may belong to multiple triangles or rectangles.
 */
export function labelsForShape(sideMap,shapeId){
  if(!shapeId)return new Set();
  return new Set([...sideMap.values()]
    .filter(side=>!side.suppressLabel && side.triangleIds.includes(shapeId))
    .map(side=>side.key));
}

/** Retain the current magnification while bringing a side to centre. */
export function centreSideAtZoom(zoom,a,b){
  const box=zoomViewBox(zoom);
  const midX=(a.x+b.x)/2,midY=(a.y+b.y)/2;
  const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
  return {
    ...zoom,
    x:clamp(midX-box.width/2,0,zoom.width-box.width),
    y:clamp(midY-box.height/2,0,zoom.height-box.height)
  };
}

/** Return the side's complete physical extent, not merely its label. */
export function sideExtent(a,b){
  const midX=(a.x+b.x)/2,midY=(a.y+b.y)/2;
  return {midX,midY,length:Math.hypot(b.x-a.x,b.y-a.y)};
}
