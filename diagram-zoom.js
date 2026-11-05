/**
 * Accessible diagram magnification independent of puzzle mathematics.
 *
 * Zoom changes only the SVG viewBox: shapes/labels remain crisp and
 * unchanged, so the fall animation, SVG hit targets and stored
 * mathematical working are preserved.
 */
export const ZOOM_LEVELS=Object.freeze([1,1.25,1.5,2,2.5,3,4]);
export const MAX_ZOOM=ZOOM_LEVELS.at(-1);
const limit=(value,min,max)=>Math.min(max,Math.max(min,value));
const numeric=(value,fallback)=>Number.isFinite(value)?value:fallback;

export function newZoom(width=960,height=590){
  if(!(width>0&&height>0))throw Error("Invalid diagram dimensions");
  return {width,height,scale:1,x:0,y:0};
}
export function zoomViewBox(state){
  return {
    x:state.x,y:state.y,
    width:state.width/state.scale,
    height:state.height/state.scale
  };
}
/** Anchor fractions are inside the presently visible diagram, 0..1. */
export function zoomAt(state,target,anchorU=.5,anchorV=.5){
  const scale=limit(numeric(target,1),1,MAX_ZOOM);
  const before=zoomViewBox(state);
  const visibleWidth=state.width/scale;
  const visibleHeight=state.height/scale;
  const u=limit(numeric(anchorU,.5),0,1),v=limit(numeric(anchorV,.5),0,1);
  const x=limit(before.x+u*before.width-u*visibleWidth,0,state.width-visibleWidth);
  const y=limit(before.y+v*before.height-v*visibleHeight,0,state.height-visibleHeight);
  return {...state,scale,x,y};
}
export function zoomStep(state,direction){
  const levels=ZOOM_LEVELS;
  const target=direction>0?
    levels.find(level=>level>state.scale+1e-4)??MAX_ZOOM:
    [...levels].reverse().find(level=>level<state.scale-1e-4)??1;
  return zoomAt(state,target);
}
/** Convert a screen drag into a bounded viewBox translation. */
export function panPixels(state,deltaX,deltaY,pixelWidth,pixelHeight){
  if(state.scale<=1)return zoomAt(state,1);
  const vb=zoomViewBox(state);
  const unit=Math.min(
    Math.max(1,pixelWidth)/vb.width,
    Math.max(1,pixelHeight)/vb.height
  );
  return {
    ...state,
    x:limit(vb.x-numeric(deltaX,0)/unit,0,state.width-vb.width),
    y:limit(vb.y-numeric(deltaY,0)/unit,0,state.height-vb.height)
  };
}
/**
 * Pointer position expressed as fractions inside displayed SVG viewBox.
 * Accounts for the centering of SVG's preserveAspectRatio meet behaviour.
 */
export function pointerAnchor(state,rect,clientX,clientY){
  const vb=zoomViewBox(state);
  const unit=Math.min(Math.max(1,rect.width)/vb.width,
    Math.max(1,rect.height)/vb.height);
  const padX=(rect.width-vb.width*unit)/2;
  const padY=(rect.height-vb.height*unit)/2;
  return {
    u:limit((clientX-rect.left-padX)/(vb.width*unit),0,1),
    v:limit((clientY-rect.top-padY)/(vb.height*unit),0,1)
  };
}
/**
 * Interaction handler: one-finger/mouse drag pans only when magnified,
 * Ctrl/Meta+wheel zooms near the pointer; in zoomed mode two fingers
 * pinch. At 100%, page touch-scrolling is left to the browser.
 *
 * Side clicks and keyboard navigation remain functional: moving more
 * than 5px suppresses the click after the gesture.
 */
export function connectZoomGestures(svg,getState,apply){
  const pointers=new Map();
  let dragged=false,suppressClick=false,pinch=null;
  const clear=()=>{pointers.clear();pinch=null;dragged=false;svg.classList.remove("zoom-panning");};
  const down=event=>{
    if(getState().scale<=1||event.pointerType==="mouse"&&event.button!==0)return;
    pointers.set(event.pointerId,{x:event.clientX,y:event.clientY,startX:event.clientX,startY:event.clientY});
    if(pointers.size===2){
      const [a,b]=[...pointers.values()];
      pinch={distance:Math.hypot(a.x-b.x,a.y-b.y),scale:getState().scale,
        x:(a.x+b.x)/2,y:(a.y+b.y)/2};
    }
  };
  const move=event=>{
    const pointer=pointers.get(event.pointerId);
    if(!pointer)return;
    const deltaX=event.clientX-pointer.x,deltaY=event.clientY-pointer.y;
    pointer.x=event.clientX;pointer.y=event.clientY;
    if(pointers.size===2){
      const [a,b]=[...pointers.values()];
      const distance=Math.hypot(a.x-b.x,a.y-b.y);
      if(pinch&&pinch.distance>1&&distance>1){
        event.preventDefault();
        const midpoint={x:(a.x+b.x)/2,y:(a.y+b.y)/2};
        const rect=svg.getBoundingClientRect();
        const {u,v}=pointerAnchor(getState(),rect,midpoint.x,midpoint.y);
        apply(zoomAt(getState(),pinch.scale*distance/pinch.distance,u,v));
        pinch={...pinch,scale:getState().scale,distance};
        dragged=true;suppressClick=true;
      }
      return;
    }
    if(Math.hypot(pointer.x-pointer.startX,pointer.y-pointer.startY)>5 || dragged){
      event.preventDefault();
      dragged=true;suppressClick=true;
      svg.classList.add("zoom-panning");
      svg.setPointerCapture?.(event.pointerId);
      const rect=svg.getBoundingClientRect();
      apply(panPixels(getState(),deltaX,deltaY,rect.width,rect.height));
    }
  };
  const up=event=>{
    pointers.delete(event.pointerId);
    try{if(svg.hasPointerCapture?.(event.pointerId))svg.releasePointerCapture(event.pointerId);}catch(_){}
    if(pointers.size<2)pinch=null;
    if(pointers.size===0){
      svg.classList.remove("zoom-panning");
      dragged=false;
      // Don't suppress an unrelated next click when the gesture
      // ended without the browser synthesizing a click.
      setTimeout(()=>{suppressClick=false;},120);
    }
  };
  const click=event=>{
    if(!suppressClick)return;
    suppressClick=false;
    event.preventDefault();
    event.stopImmediatePropagation?.();
    event.stopPropagation();
  };
  const wheel=event=>{
    if(!(event.ctrlKey||event.metaKey))return;
    event.preventDefault();
    const current=getState();
    const {u,v}=pointerAnchor(current,svg.getBoundingClientRect(),event.clientX,event.clientY);
    const next=zoomStep(current,event.deltaY<0?1:-1);
    apply(zoomAt(current,next.scale,u,v));
  };
  const key=event=>{
    if(event.target!==svg||getState().scale<=1)return;
    const dx=event.key==="ArrowLeft"?42:event.key==="ArrowRight"?-42:0;
    const dy=event.key==="ArrowUp"?42:event.key==="ArrowDown"?-42:0;
    if(!dx&&!dy)return;
    event.preventDefault();
    const rect=svg.getBoundingClientRect();
    apply(panPixels(getState(),dx,dy,rect.width,rect.height));
  };
  svg.addEventListener("pointerdown",down);
  svg.addEventListener("pointermove",move);
  svg.addEventListener("pointerup",up);
  svg.addEventListener("pointercancel",up);
  svg.addEventListener("click",click,true);
  svg.addEventListener("wheel",wheel,{passive:false});
  svg.addEventListener("keydown",key);
  return ()=>{
    clear();
    svg.removeEventListener?.("pointerdown",down);
    svg.removeEventListener?.("pointermove",move);
    svg.removeEventListener?.("pointerup",up);
    svg.removeEventListener?.("pointercancel",up);
    svg.removeEventListener?.("click",click,true);
    svg.removeEventListener?.("wheel",wheel);
    svg.removeEventListener?.("keydown",key);
  };
}
