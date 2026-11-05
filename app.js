import { buildSides, sideKey, exactLength, parseAnswer, correctAnswer, sidesOfTriangle, readySteps, solutionSteps, propagateRectangleSides } from "./puzzle-engine.js";
import { puzzles } from "./pile-geometry.js";
import { mountWorkingSpace, sanitizeWorking } from "./working-space.js";
import { fitPileInTablet } from "./pile-visibility.js";
import { newZoom, zoomAt, zoomStep, zoomViewBox, connectZoomGestures } from "./diagram-zoom.js";
import { labelsForShape, centreSideAtZoom } from "./label-clarity.js";
import {layoutMeasurements, classifyRelationSides, dimensionBracket, labelTether} from "./label-layout.js";
import {crowdedUnknownKeys,compactFace} from "./label-density.js";

const root=document.getElementById('app');
const reduced=matchMedia('(prefers-reduced-motion: reduce)');

/** Site-specific override: respect reduced motion unless the student
 * explicitly opts into automatic falling on this website. */
let autoplayPreference="system";
try{
  const stored=localStorage.getItem("pileup-auto-fall");
  if(stored==="on"||stored==="off")autoplayPreference=stored;
}catch(_){}
function autoFallEnabled(){
  return autoplayPreference==="on"||
    (autoplayPreference==="system"&&!reduced.matches);
}
function refreshAutoFallControl(){
  const button=document.getElementById("autoplay-toggle");
  if(!button)return;
  const on=autoFallEnabled();
  const reason=!on&&autoplayPreference==="system"&&reduced.matches;
  button.textContent=on?"▶ AUTO ON":"▷ AUTO OFF";
  button.setAttribute("aria-pressed",String(on));
  const explanation=on?
    "Automatic falling animation is on. Click to turn it off.":
    reason?
      "Automatic falling is off because your device requests reduced motion. Click to enable it for this website.":
      "Automatic falling is off. Click to enable it.";
  button.setAttribute("aria-label",explanation);
  button.title=explanation;
}
function toggleAutoFall(){
  autoplayPreference=autoFallEnabled()?"off":"on";
  try{localStorage.setItem("pileup-auto-fall",autoplayPreference)}catch(_){}
  refreshAutoFallControl();
  if(autoFallEnabled()){
    // An explicit opt-in starts the current puzzle immediately, too.
    renderDiagram(true,true);
  }else if(animating){
    stopAnimation();
  }
}

const p=(x,y)=>({x,y}),d=(a,b)=>Math.hypot(b.x-a.x,b.y-a.y),mid=(a,b)=>p((a.x+b.x)/2,(a.y+b.y)/2);
const v=(a,b)=>p(b.x-a.x,b.y-a.y),cross=(a,b)=>a.x*b.y-a.y*b.x,dot=(a,b)=>a.x*b.x+a.y*b.y;
let current=puzzles[0],selectedSide=null,animating=false,visible=true,finishTimer=null,screen="home";
let sideMap=buildSides(current),solved=new Set(),workingBySide={},hintLevels={},hintsUsed=0,feedback=null,solutionOpen=false;
let pendingDiscoveredKey=null;
let focusLabels=false,focusUserChoice=false,focusedShapeId=null,previewSideKey=null;

/**
 * One visual relationship for the chip, its exact full segment, and
 * its owning shape. This changes CSS classes only: never unmount
 * the mathematical working editor in response to hover or Focus.
 */
function refreshLabelClarity(){
  const svg=document.querySelector("#diagram svg");
  if(!svg)return;
  const hasFocus=focusLabels&&Boolean(selectedSide)&&Boolean(focusedShapeId);
  const permitted=hasFocus?labelsForShape(sideMap,focusedShapeId):new Set();
  const allShapes=[...current.triangles,...(current.rectangles||[])];
  const xy=fitPileInTablet(current).xy;
  const isCompact=hasFocus&&allShapes.some(shape=>
    shape.id===focusedShapeId&&compactFace(shape,allShapes,xy));
  const emphasis=previewSideKey||selectedSide;
  svg.classList.toggle("label-focus-enabled",focusLabels);
  svg.classList.toggle("label-focus-active",hasFocus);
  svg.classList.toggle("compact-label-focus",isCompact);
  for(const selector of [".side-chip",".side-trace",".measurement-tether",".dimension-bracket"]){
    for(const element of svg.querySelectorAll(selector)){
      const key=element.getAttribute?.("data-side-key");
      if(!key)continue;
      element.classList.toggle("is-emphasized",emphasis===key);
      element.classList.toggle("focus-muted",hasFocus && !permitted.has(key) && emphasis!==key);
    }
  }
  for(const piece of svg.querySelectorAll(".piece")){
    piece.classList.toggle("focus-piece-muted",
      hasFocus&&piece.dataset?.id!==focusedShapeId&&
      !sideMap.get(emphasis)?.triangleIds.includes(piece.dataset?.id));
  }
}
function previewExactSide(key){
  if(animating)return;
  previewSideKey=key;
  refreshLabelClarity();
}
function clearSidePreview(key){
  if(previewSideKey===key){previewSideKey=null;refreshLabelClarity();}
}
function attachSidePreview(element,key){
  element.addEventListener("pointerenter",()=>previewExactSide(key));
  element.addEventListener("pointerleave",()=>clearSidePreview(key));
  element.addEventListener("focus",()=>previewExactSide(key));
  element.addEventListener("blur",()=>clearSidePreview(key));
}
function locateSelectedSide(){
  const side=sideMap.get(selectedSide);
  if(!side||animating)return;
  const {xy}=fitPileInTablet(current);
  setDiagramZoom(centreSideAtZoom(zoomState,xy(side.a),xy(side.b)));
  previewSideKey=null;
  refreshLabelClarity();
  const svg=document.querySelector("#diagram svg");
  if(window.innerWidth<=899){
    svg?.scrollIntoView?.({block:"center",behavior:"instant"});
  }
  const notice=document.getElementById("progress-announcement");
  if(notice)notice.textContent="Located selected length in the diagram.";
}

let disposeWorking=()=>{};
let extensionMode=false,extensionGrades={};
let zoomState=newZoom();
let detachDiagramZoom=()=>{};
function refreshZoomControls(){
  const scale=zoomState.scale;
  const readout=document.getElementById("diagram-zoom-level");
  if(readout)readout.textContent=Math.round(scale*100)+"%";
  const minus=document.getElementById("diagram-zoom-out");
  const plus=document.getElementById("diagram-zoom-in");
  const fit=document.getElementById("diagram-zoom-fit");
  if(minus)minus.disabled=scale<=1.001;
  if(plus)plus.disabled=scale>=3.999;
  if(fit)fit.disabled=scale<=1.001;
}
function setDiagramZoom(next){
  zoomState=next;
  const svg=document.querySelector("#diagram svg");
  if(svg){
    const box=zoomViewBox(next);
    svg.setAttribute("viewBox",[box.x,box.y,box.width,box.height].join(" "));
    svg.classList.toggle("diagram-is-zoomed",next.scale>1.001);
    const baseDescription="A pile of "+current.triangles.length+" right-angled triangles"+
      (current.rectangles?.length?" and "+current.rectangles.length+" rectangles":"")+
      " resting on a stone floor. Select a marked side or shape to investigate.";
    svg.setAttribute("aria-label",baseDescription+
      (next.scale>1.001?" Diagram magnified to "+Math.round(next.scale*100)+
        " percent. Drag to pan, or focus the diagram and use arrow keys.":""));
  }
  refreshZoomControls();
}
function mountDiagramZoom(svg){
  detachDiagramZoom();
  setDiagramZoom(zoomState);
  detachDiagramZoom=connectZoomGestures(svg,()=>zoomState,setDiagramZoom);
}
let workingFocused=false;
try{workingFocused=localStorage.getItem("pileup-working-width")==="wide";}catch(_){}
function setWorkingFocused(wide){
  workingFocused=Boolean(wide);
  try{localStorage.setItem("pileup-working-width",workingFocused?"wide":"balanced");}catch(_){}
  document.querySelector(".challenge-layout")?.classList.toggle("working-focused",workingFocused);
  const button=document.getElementById("workspace-size-toggle");
  if(button){
    button.textContent=workingFocused?"↔ Balanced view":"↔ More working room";
    button.setAttribute("aria-pressed",String(workingFocused));
    button.title=workingFocused?"Give the diagram more room":"Widen the student working panel";
  }
}

const header=()=>'<header><a class="brand" href="#home" aria-label="Pythagoras Pile Up home"><span class="seal">△</span><span>PYTHAGORAS <em>PILE UP</em></span></a><nav aria-label="Main navigation"><a href="#puzzles">THE CHALLENGES</a></nav><span class="header-note">A GEOMETER’S TRIAL</span></header>';
const footer=()=>'<footer><span>△ PYTHAGORAS PILE UP</span><span>Inspired by the original classroom activity at greatmathsteachingideas.com and a design by @mrallanmaths.</span><span>MADE FOR CURIOUS MINDS</span></footer>';
/**
 * A small graphic of the ACTUAL problem, not a generic triangular
 * icon. Colour blocks, true overhangs, and rectangle diagonals allow
 * each of the nine challenges to have its own visual identity.
 */
/**
 * Engraved difficulty seal. Uses the puzzle's actual tier rather than
 * repeating a decorative emoji. The label remains in text for clarity;
 * the SVG is silent to screen readers.
 */
/**
 * A purely decorative, scalable completion crest. The leaves are
 * original geometric SVG shapes; the meaningful achievement stays
 * in the actual dialog heading and text.
 */
function completionLaurel(){
  const leaves=[];
  const left=[
    [56,98,-54],[44,87,-53],[38,75,-40],[35,62,-28],
    [37,49,-11],[44,38,7],[53,27,24],[64,18,42]
  ];
  for(const [x,y,rotation] of left){
    leaves.push('<ellipse cx="'+x+'" cy="'+y+'" rx="4.8" ry="10" transform="rotate('+
      rotation+" "+x+" "+y+')"/>');
    const xr=180-x;
    leaves.push('<ellipse cx="'+xr+'" cy="'+y+'" rx="4.8" ry="10" transform="rotate('+
      (-rotation)+" "+xr+" "+y+')"/>');
  }
  return '<svg class="completion-laurel" viewBox="0 0 180 130" focusable="false" aria-hidden="true">'+
    '<g class="completion-laurel-stars"><path d="M90 3V13 M85 8H95 M18 33V43 M13 38H23 M162 33V43 M157 38H167"/>'+
      '<circle cx="21" cy="80" r="1.7"/><circle cx="159" cy="80" r="1.7"/></g>'+
    '<g class="completion-laurel-branches">'+
      '<path class="completion-laurel-stem" d="M89 116C35 106 19 54 64 12"/>'+
      '<path class="completion-laurel-stem" d="M91 116C145 106 161 54 116 12"/>'+
      '<g class="completion-laurel-leaves">'+leaves.join("")+'</g>'+
      '<path class="completion-laurel-ribbon" d="M73 113Q90 104 107 113 M76 118Q90 124 104 118"/>'+
    '</g>'+
    '<g class="completion-laurel-seal"><circle cx="90" cy="63" r="27"/>'+
      '<circle cx="90" cy="63" r="22"/><path d="M75 78L89 46L105 78Z"/>'+
      '<path d="M82 73H88V67"/><circle cx="90" cy="63" r="2"/></g>'+
    '</svg>';
}

function difficultyEmblem(puzzle){
  const tier=String(puzzle.difficulty||"").toUpperCase();
  const shape=tier.includes("GRAND")?"temple":
    tier.includes("MASTER")?"laurel":
    tier.includes("EXPERT")||tier.includes("ADVANCED")?"column":
    tier.includes("INTERMEDIATE")||tier.includes("DEVELOPING")?"double":"triangle";
  const drawings={
    triangle:'<path d="M18 7L29 27H7Z M12 23V27H16" />',
    double:'<path d="M6 25L15 9L24 25Z M16 27L25 11L31 27Z" />',
    column:'<path d="M5 12L18 6L31 12 M7 14H29 M10 14V26 M16 14V26 M22 14V26 M28 14V26 M6 28H30" />',
    laurel:'<path d="M18 8L27 24H9Z M9 28C3 24 4 16 8 12 M27 28C33 24 32 16 28 12 M6 17L10 18 M7 22L12 23 M30 17L26 18 M29 22L24 23" />',
    temple:'<path d="M4 14L18 6L32 14 M7 16H29 M9 16V27 M15 16V27 M21 16V27 M27 16V27 M5 29H31" />'
  };
  return '<svg class="difficulty-emblem difficulty-'+shape+
    '" aria-hidden="true" focusable="false" viewBox="0 0 36 36">'+
    '<circle class="difficulty-emblem-ring" cx="18" cy="18" r="16"/>'+
    '<g class="difficulty-emblem-drawing">'+drawings[shape]+'</g></svg>';
}

function miniPreview(puzzle){
  const shapes=[...puzzle.triangles,...(puzzle.rectangles||[])];
  const points=shapes.flatMap(t=>t.pts);
  const minX=Math.min(...points.map(p=>p.x)),maxX=Math.max(...points.map(p=>p.x));
  const minY=Math.min(...points.map(p=>p.y)),maxY=Math.max(...points.map(p=>p.y));
  const spanX=Math.max(0.01,maxX-minX),spanY=Math.max(.01,maxY-minY);
  const scale=Math.min(125/spanX,74/spanY);
  const midX=(minX+maxX)/2,baseY=88;
  const pos=p=>({
    x:80+(p.x-midX)*scale,
    y:baseY-(p.y-minY)*scale
  });
  const vertex=p=>{const v=pos(p);return v.x.toFixed(1)+","+v.y.toFixed(1);};
  const content=shapes.map(shape=>{
    const outline='<polygon class="mini-shape" fill="'+shape.color+
      '" points="'+shape.pts.map(vertex).join(" ")+'"/>';
    const diagonals=(shape.diagonals||[]).map(d=>{
      const a=pos(d.a),b=pos(d.b);
      return '<path class="mini-rectangle-diagonal" d="M'+a.x.toFixed(1)+" "+a.y.toFixed(1)+
        " L"+b.x.toFixed(1)+" "+b.y.toFixed(1)+'"/>';
    }).join("");
    return outline+diagonals;
  }).join("");
  return '<svg class="mini-pile" aria-hidden="true" focusable="false" viewBox="0 0 160 105">'+
    '<circle class="mini-geometry-ring" cx="80" cy="48" r="39"/>'+
    '<path class="mini-geometry-guide" d="M14 49H146 M80 8V96"/>'+
    '<path class="mini-floor" d="M13 89H147"/>'+
    content+
    '<path class="mini-plinth" d="M26 93H134"/>'+
    '</svg>';
}

/**
 * A hero engraving built from the opening puzzle's REAL triangles.
 * The sequence is decorative; the interactive fall continues to live
 * on the challenge page, with its own Replay and Skip controls.
 */
function homeHeroIllustration(){
  const puzzle=puzzles[0],scale=9.15,originX=117,floorY=221;
  const pos=p=>({
    x:originX+p.x*scale,
    y:floorY-p.y*scale
  });
  const vertex=p=>{const v=pos(p);return v.x.toFixed(1)+","+v.y.toFixed(1);};
  const pieces=puzzle.triangles.map((triangle,index)=>{
    const corners=triangle.pts.map(pos);
    const right=triangle.right,corner=corners[right];
    const near=corners[(right+1)%3],far=corners[(right+2)%3];
    const a={x:near.x-corner.x,y:near.y-corner.y};
    const b={x:far.x-corner.x,y:far.y-corner.y};
    const al=Math.hypot(a.x,a.y),bl=Math.hypot(b.x,b.y),k=8;
    const u={x:a.x/al*k,y:a.y/al*k},v={x:b.x/bl*k,y:b.y/bl*k};
    const d='M'+(corner.x+u.x).toFixed(1)+" "+(corner.y+u.y).toFixed(1)+
      ' L'+(corner.x+u.x+v.x).toFixed(1)+" "+(corner.y+u.y+v.y).toFixed(1)+
      ' L'+(corner.x+v.x).toFixed(1)+" "+(corner.y+v.y).toFixed(1);
    const centre={
      x:corners.reduce((s,q)=>s+q.x,0)/3,
      y:corners.reduce((s,q)=>s+q.y,0)/3
    };
    return '<g class="hero-falling-piece" style="--hero-index:'+index+'">'+
      '<polygon points="'+triangle.pts.map(vertex).join(" ")+'" fill="'+triangle.color+'"/>'+
      '<path class="hero-right-angle" d="'+d+'"/>'+
      '<text class="hero-number" x="'+centre.x.toFixed(1)+'" y="'+centre.y.toFixed(1)+'">'+
        triangle.id+'</text></g>';
  }).join("");
  const targetA=pos(puzzle.target.a),targetB=pos(puzzle.target.b);
  const x=targetA.x+19,y=(targetA.y+targetB.y)/2;
  return '<svg class="hero-fall-svg" viewBox="0 0 390 260" aria-hidden="true" focusable="false">'+
    '<g class="hero-guides">'+
      '<circle cx="191" cy="128" r="90"/><circle cx="191" cy="128" r="75"/>'+
      '<circle cx="191" cy="128" r="5"/>'+
      '<path d="M191 16V240 M53 128H329"/>'+
      '<path d="M115 42A118 118 0 0 1 290 93" stroke-dasharray="3 7"/>'+
      '<path d="M93 177A116 116 0 0 0 284 211" stroke-dasharray="3 7"/>'+
    '</g>'+
    '<path class="hero-fine-grid" d="M75 59H312 M75 94H312 M75 164H312 M75 199H312 M97 38V226 M148 38V226 M239 38V226 M289 38V226"/>'+
    '<g class="hero-stars"><path d="M70 62V75 M64 68H77"/>'+
      '<path d="M310 137V151 M303 144H317"/>'+
      '<circle cx="317" cy="53" r="2"/><circle cx="76" cy="185" r="2"/></g>'+
    '<path class="hero-plinth" d="M64 222H328 M87 228H308 M109 234H283"/>'+
    pieces+
    '<g class="hero-goal"><path d="M'+(targetA.x+6).toFixed(1)+' '+targetA.y.toFixed(1)+
      ' H'+(x+5).toFixed(1)+' V'+targetB.y.toFixed(1)+' H'+(targetB.x+6).toFixed(1)+'"/>'+
      '<circle cx="'+(x+6).toFixed(1)+'" cy="'+y.toFixed(1)+'" r="13"/>'+
      '<text x="'+(x+6).toFixed(1)+'" y="'+(y+5).toFixed(1)+'">x</text></g>'+
    '<text class="hero-engraving-caption" x="195" y="254" text-anchor="middle">'+
      'GEOMETRY  ·  REASONING  ·  DISCOVERY</text>'+
    '</svg>';
}
function home(gallery=false){
  detachDiagramZoom();detachDiagramZoom=()=>{};
  focusLabels=false;focusUserChoice=false;focusedShapeId=null;previewSideKey=null;
  disposeWorking();disposeWorking=()=>{};
  screen="home";clearTimeout(finishTimer);
  if(document.body?.dataset)document.body.dataset.view="home";
  root.innerHTML=header()+`<main id="home" class="home-compact">
    <section class="home-story" aria-labelledby="home-heading">
      <div class="home-story-top">
        <div class="eyebrow">✧ AN ANCIENT PUZZLE · A MODERN CHALLENGE</div>
        <h1 id="home-heading">When triangles <em>fall into place.</em></h1>
        <p class="home-lead">Discover hidden lengths in a pile of right-angled triangles. Each answer becomes the clue to another.</p>
        <div class="home-story-art" aria-hidden="true">
          ${homeHeroIllustration()}
        </div>
      </div>
      <div class="home-story-bottom">
        <div class="home-steps">
          <span><b>I</b> Watch them fall</span>
          <span><b>II</b> Trace the lengths</span>
          <span><b>III</b> Find the final x</span>
        </div>
        <button class="btn primary home-start" data-puzzle="first-fall">BEGIN THE FIRST TRIAL <span aria-hidden="true">→</span></button>
        <p class="footnote">${puzzles.length} CHALLENGES · FROM APPRENTICE TO MASTER</p>
      </div>
    </section>
    <section class="home-library" id="challenges" aria-labelledby="home-challenge-title">
      <div class="home-library-heading">
        <div>
          <div class="eyebrow">CHOOSE YOUR PATH</div>
          <h2 id="home-challenge-title">The challenges</h2>
        </div>
        <p>Different piles. Different connections.</p>
      </div>
      <div class="home-puzzle-grid">
      ${puzzles.map((puzzle,index)=>`<button class="challenge-card home-challenge-card" data-puzzle="${puzzle.id}" aria-label="Challenge ${index+1}: ${puzzle.title}. ${puzzle.difficulty}">
        <span class="home-card-number"><span>${String(index+1).padStart(2,"0")} / ${puzzle.difficulty}</span>${difficultyEmblem(puzzle)}</span>
        ${miniPreview(puzzle)}
        <span class="home-card-copy">
          <strong class="home-card-title">${escapeHtml(puzzle.title)}</strong>
          <span class="home-card-desc">${escapeHtml(puzzle.description)}</span>
        </span>
        <span class="home-card-bottom"><span>${puzzle.triangles.length} TRIANGLES</span><span class="home-card-go">EXPLORE →</span></span>
      </button>`).join("")}
      </div>
    </section>
  </main>`+footer();
  bind();
  if(gallery && window.matchMedia?.("(max-width: 899px)")?.matches){
    requestAnimationFrame(()=>document.getElementById("challenges")?.scrollIntoView({
      behavior:reduced.matches?"instant":"smooth"
    }));
  }
}

function el(name,attrs={},text=''){const x=document.createElementNS('http://www.w3.org/2000/svg',name);Object.entries(attrs).forEach(([k,v])=>x.setAttribute(k,String(v)));if(text)x.textContent=text;return x;}
function labelPoint(a,b,cent,offset){const M=mid(a,b),vec=v(a,b),len=d(a,b);let nx=-vec.y/len,ny=vec.x/len;if((M.x-cent.x)*nx+(M.y-cent.y)*ny<0){nx=-nx;ny=-ny;}return p(M.x+offset*nx,M.y+offset*ny);}
function escapeHtml(text){
  return String(text).replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
}
/**
 * Changing a puzzle's shape invalidates side keys and previously
 * discovered answers. Keep the legacy saved copy intact, but start
 * a separate namespace for the seven redesigned structures.
 * Unchanged First Fall and Twin Paths retain their progress.
 */
function progressKey(){
  // The four re-authored puzzles now use different side coordinates,
  // givens and answers. Never mark new lengths solved using old data.
  // Preserve the previous version in localStorage for reversibility.
  if(["split-project","great-pile","nine-muses","acropolis"].includes(current.id))
    return "pileup-architecture-v2-"+current.id;
  const unchanged=current.id==="first-fall"||current.id==="twin-paths";
  return (unchanged?"pileup-pass-b-v2-":"pileup-architecture-v1-")+current.id;
}
function saveProgress(){
  try{
    localStorage.setItem(progressKey(),JSON.stringify({
      solved:[...solved],workingBySide,hintLevels,hintsUsed,extensionGrades
    }));
    return true;
  }catch(error){
    // Storage quota or disabled storage must not prevent solving.
    console.warn("Could not save the working for this puzzle.",error);
    return false;
  }
}
function loadProgress(){
  solved=new Set();workingBySide={};hintLevels={};hintsUsed=0;extensionGrades={};
  try{
    const saved=JSON.parse(localStorage.getItem(progressKey())||"null");
    if(!saved || typeof saved!=="object")return;
    if(Array.isArray(saved.solved))for(const key of saved.solved){
      if(sideMap.has(key) && !sideMap.get(key).given)solved.add(key);
    }
    if(saved.workingBySide && typeof saved.workingBySide==="object"){
      for(const [key,value] of Object.entries(saved.workingBySide)){
        if(key==="__scratch__" || (sideMap.has(key)&&!sideMap.get(key).given))
          workingBySide[key]=sanitizeWorking(value);
      }
    }else if(saved.notes && typeof saved.notes==="object"){
      // One-time conversion from the old free-text working field.
      // Preserve its contents inside an editable maths line rather than discarding it.
      for(const [key,value] of Object.entries(saved.notes)){
        if(!sideMap.has(key)||sideMap.get(key).given||typeof value!=="string"||!value.trim())continue;
        const lines=value.split("\n").map(line=>line.trim()).filter(Boolean).slice(0,16);
        workingBySide[key]=sanitizeWorking({tab:"math",lines:lines.map((latex,i)=>({
          id:"legacy-"+i,latex:latex.replace(/²/g,"^{2}").replace(/³/g,"^{3}").slice(0,260)
        }))});
      }
    }
    if(saved.hintLevels && typeof saved.hintLevels==="object"){
      for(const [key,value] of Object.entries(saved.hintLevels)){
        if(sideMap.has(key))hintLevels[key]=Math.max(0,Math.min(4,Number(value)||0));
      }
    }
    hintsUsed=Math.max(0,Number(saved.hintsUsed)||0);
    propagateRectangleSides(current,sideMap,solved);
    if(saved.extensionGrades && typeof saved.extensionGrades==="object"){
      for(const item of current.extensions||[])if(saved.extensionGrades[item.id]===true)extensionGrades[item.id]=true;
    }
  }catch(error){
    console.warn("Could not restore the working for this puzzle.",error);
  }
}

function stepsRemaining(){
  return [...sideMap.values()].filter(s=>!s.given&&!s.suppressLabel&&!solved.has(s.key));
}
function progress(){
  const all=[...sideMap.values()].filter(s=>!s.given&&!s.suppressLabel);
  return {total:all.length,done:all.length-stepsRemaining().length};
}
function activeHintStep(){
  const available=readySteps(current,sideMap,solved).filter(s=>!sideMap.get(s.sideKey)?.suppressLabel);
  if(selectedSide){
    const forSelected=available.find(step=>step.sideKey===selectedSide);
    if(forSelected)return forSelected;
  }
  return available[0]||null;
}
function sideDescription(side){
  if(side.isTarget)return "FINAL TARGET x";
  const names=side.triangleIds.join(" & ");
  return "MISSING SIDE · TRIANGLE "+names;
}
function chooseTriangle(id){
  if(animating)return;
  const shape=[...current.triangles,...(current.rectangles||[])].find(t=>t.id===id);
  if(!shape)return;
  const edges=shape.pts.length===3?sidesOfTriangle(shape,sideMap):
    [...shape.pts.map((a,i)=>sideMap.get(sideKey(a,shape.pts[(i+1)%4]))),
     ...(shape.diagonals||[]).map(s=>sideMap.get(sideKey(s.a,s.b)))];
  const options=edges.filter(s=>s&&!s.given&&!s.suppressLabel&&!solved.has(s.key));
  const choices=readySteps(current,sideMap,solved);
  const side=options.find(s=>choices.some(step=>step.sideKey===s.key))||options[0]||edges.find(s=>s&&!s.given&&!s.suppressLabel)||edges.find(Boolean);
  if(side)chooseSide(side.key,id);
}
function chooseSide(key,shapeId=null){
  if(animating)return;
  const side=sideMap.get(key);
  if(!side)return;
  selectedSide=key;
  focusedShapeId=shapeId||side.triangleIds[0]||null;
  // In a tight cluster, automatically isolate the chosen piece's
  // measurements. An explicit All Labels choice always takes priority.
  if(!focusUserChoice){
    const shapes=[...current.triangles,...(current.rectangles||[])];
    const shape=shapes.find(t=>t.id===focusedShapeId);
    if(shape)focusLabels=compactFace(shape,shapes,fitPileInTablet(current).xy);
  }
  previewSideKey=null;
  feedback=null;
  solutionOpen=false;
  renderDiagram(false);
  document.getElementById("answer-input")?.focus({preventScroll:true});
}

/** All pieces, lines and labels are positioned in screen-oriented SVG
 * coordinates. The world geometry is independent of the SVG viewBox:
 * labels and right-angle markers therefore stay small and legible. */
let pieceAnimations=[];
let fallRequest=0;
function renderDiagram(animate=false,forceMotion=false){
  const discoveredNow=pendingDiscoveredKey;
  pendingDiscoveredKey=null;
  previewSideKey=null;
  const shouldAnimate=animate&&(forceMotion||autoFallEnabled());
  clearTimeout(finishTimer);
  pieceAnimations.forEach(animation=>{try{animation.cancel()}catch(_){}});
  pieceAnimations=[];
  if(fallRequest){cancelAnimationFrame(fallRequest);fallRequest=0;}
  const {width:W,height:H,floorY,xy}=fitPileInTablet(current);
  const toSide=side=>({a:xy(side.a),b:xy(side.b)});
  const canvas=document.getElementById("diagram");
  const diagramDescription="A pile of "+current.triangles.length+" right-angled triangles"+
    (current.rectangles?.length?" and "+current.rectangles.length+" rectangles":"")+
    " resting on a stone floor. Select a marked side or shape to investigate.";
  const svg=el("svg",{viewBox:"0 0 "+W+" "+H,role:"img",tabindex:0,
    "aria-label":diagramDescription,"data-base-label":diagramDescription});
  const defs=el("defs");
  const grad=el("linearGradient",{id:"floor-light",x1:"0",y1:"0",x2:"0",y2:"1"});
  grad.append(el("stop",{offset:"0%",'stop-color':"#d6c4a5"}),el("stop",{offset:"100%",'stop-color':"#bca987"}));
  defs.append(grad);
  svg.append(defs);
  const grid=el("g",{"aria-hidden":"true",class:"tablet-grid"});
  for(let x=62;x<W-45;x+=64)grid.append(el("line",{x1:x,y1:48,x2:x,y2:floorY+10}));
  for(let y=58;y<floorY;y+=64)grid.append(el("line",{x1:62,y1:y,x2:W-45,y2:y}));
  svg.append(grid);
  // The floor is present even while the triangles fall.
  const floor=el("g",{class:"stone-floor","aria-hidden":"true"});
  floor.append(el("rect",{x:35,y:floorY+3,width:W-70,height:26,fill:"url(#floor-light)"}));
  floor.append(el("line",{x1:35,y1:floorY,x2:W-35,y2:floorY,class:"floor-edge"}));
  for(let x=70;x<W-80;x+=123){
    floor.append(el("line",{x1:x,y1:floorY+9,x2:x+7,y2:floorY+12,class:"stone-seam"}));
  }
  svg.append(floor);
  const pieces=[...current.triangles,...(current.rectangles||[])];
  if(current.fallOrder){
    pieces.sort((a,b)=>current.fallOrder.indexOf(a.id)-current.fallOrder.indexOf(b.id));
  }
  // A 10-triangle challenge should not force students to watch 12s
  // of repetitive falling. Cap the whole construction at roughly 7s.
  const stepMs=Math.max(290,Math.min(850,5400/Math.max(1,pieces.length-1)));
  pieces.forEach((shape,i)=>{
    const rectangle=shape.pts.length===4;
    const group=el("g",{class:"piece"+(rectangle?" rectangle-piece":""),
      "data-id":shape.id,tabindex:0,role:"button",
      style:"--delay:"+(i*stepMs)+"ms;--twist:"+(i%2?-13:12)+"deg",
      "aria-label":"Select "+(rectangle?"rectangle ":"triangle ")+shape.id});
    const tpts=shape.pts.map(xy);
    if(selectedSide&&!sideMap.get(selectedSide).triangleIds.includes(shape.id))
      group.classList.add("dimmed");
    if(selectedSide&&sideMap.get(selectedSide).triangleIds.includes(shape.id))
      group.classList.add("selected");
    group.append(el("polygon",{
      points:tpts.map(pt=>pt.x+","+pt.y).join(" "),fill:shape.color
    }));
    function cornerMark(corner,first,second){
      const u={x:first.x-corner.x,y:first.y-corner.y};
      const w={x:second.x-corner.x,y:second.y-corner.y};
      const ul=Math.hypot(u.x,u.y),wl=Math.hypot(w.x,w.y),k=rectangle?9:10;
      if(ul<1e-5||wl<1e-5)return;
      const a={x:u.x/ul*k,y:u.y/ul*k},b={x:w.x/wl*k,y:w.y/wl*k};
      group.append(el("path",{
        d:"M"+(corner.x+a.x)+" "+(corner.y+a.y)+
          "L"+(corner.x+a.x+b.x)+" "+(corner.y+a.y+b.y)+
          "L"+(corner.x+b.x)+" "+(corner.y+b.y),
        class:"angle-square"
      }));
    }
    if(rectangle){
      // Two neat right-angle indicators establish the rectangle,
      // while a dotted diagonal gives a real Pythagoras clue.
      for(const j of [0,2]){
        cornerMark(tpts[j],tpts[(j+3)%4],tpts[(j+1)%4]);
      }
      for(const diagonal of shape.diagonals||[]){
        const a=xy(diagonal.a),b=xy(diagonal.b);
        group.append(el("line",{
          x1:a.x,y1:a.y,x2:b.x,y2:b.y,class:"rectangle-diagonal"
        }));
      }
    }else{
      const j=shape.right;
      cornerMark(tpts[j],tpts[(j+1)%3],tpts[(j+2)%3]);
    }
    const centroid={
      x:tpts.reduce((sum,z)=>sum+z.x,0)/tpts.length,
      y:tpts.reduce((sum,z)=>sum+z.y,0)/tpts.length
    };
    group.append(el("text",{
      x:centroid.x,y:centroid.y,
      class:"triangle-number"+(rectangle?" rectangle-number":"")
    },shape.id));
    group.append(el("title",{},(rectangle?"Rectangle ":"Triangle ")+shape.id));
    group.addEventListener("click",()=>chooseTriangle(shape.id));
    group.addEventListener("keydown",event=>{
      if(event.key==="Enter"||event.key===" "){
        event.preventDefault();chooseTriangle(shape.id);
      }
    });
    svg.append(group);
  });
  // A dedicated trace draws the exact endpoints of the selected or
  // hovered length. It is deliberately overlaid without modifying
  // triangle geometry or the label-placement algorithm.
  // Collinear full/part edges overlap. Hit targets are ordered with short,
  // currently unknown edges above long or given edges for reliable selection.
  const orderedSides=[...sideMap.values()].filter(s=>!s.suppressLabel).sort((a,b)=>
    Number(a.given)-Number(b.given) || b.length-a.length);
  for(const side of orderedSides){
    if(side.isOverhang)continue;
    const ends=toSide(side);
    const hit=el("line",{
      x1:ends.a.x,y1:ends.a.y,x2:ends.b.x,y2:ends.b.y,
      class:"side-hit","data-side-key":side.key,tabindex:0,role:"button",
      "aria-label":(side.given?"Given "+exactLength(side.length)+" centimetres":side.isTarget?"Select target x":"Select an unknown side")
        +" of triangle "+side.triangleIds.join(" and ")
    });
    attachSidePreview(hit,side.key);
    hit.addEventListener("click",()=>chooseSide(side.key));
    hit.addEventListener("keydown",event=>{
      if(event.key==="Enter"||event.key===" "){event.preventDefault();chooseSide(side.key);}
    });
    svg.append(hit);
  }

  const labels=el("g",{class:"side-labels"+(shouldAnimate?" waiting":"")});
  const compactScene=pieces.some(shape=>compactFace(shape,pieces,xy));
  svg.classList.toggle("has-compact-triangles",compactScene);
  const traces=el("g",{class:"side-traces","aria-hidden":"true"});
  for(const side of sideMap.values()){
    if(side.suppressLabel)continue;
    const ends=toSide(side);
    const trace=el("g",{class:"side-trace","data-side-key":side.key});
    trace.append(el("line",{
      x1:ends.a.x,y1:ends.a.y,x2:ends.b.x,y2:ends.b.y,class:"side-trace-line"
    }));
    for(const point of [ends.a,ends.b]){
      trace.append(el("circle",{cx:point.x,cy:point.y,r:4.1,class:"side-trace-end"}));
    }
    traces.append(trace);
  }
  labels.append(traces);
  // Matching tick marks are measurements: hide and reveal them with all
  // other measurement labels after the final piece has settled.
  // Their geometry is drawn on the actual side (above the hit targets
  // and below the labels), so students see the mathematical convention.
  for(const [groupIndex,group] of (current.equalSideGroups||[]).entries()){
    for(const descriptor of group){
      const side=sideMap.get(sideKey(descriptor.a,descriptor.b));
      if(!side)continue;
      const endpoints=toSide(side),dx=endpoints.b.x-endpoints.a.x,dy=endpoints.b.y-endpoints.a.y;
      const L=Math.hypot(dx,dy),nx=-dy/L,ny=dx/L,tx=dx/L,ty=dy/L;
      const ticks=Math.min(3,groupIndex+2);
      for(let j=0;j<ticks;j++){
        const shift=(j-(ticks-1)/2)*8;
        const cx=(endpoints.a.x+endpoints.b.x)/2+tx*shift;
        const cy=(endpoints.a.y+endpoints.b.y)/2+ty*shift;
        labels.append(el("line",{
          x1:cx-nx*8,y1:cy-ny*8,x2:cx+nx*8,y2:cy+ny*8,
          class:"equal-side-tick"
        }));
      }
    }
  }

  const dense=pieces.length>=8;
  const actualW=canvas.getBoundingClientRect().width||780;
  const actualH=Math.min(490,Math.max(340,actualW*590/960));
  const ratio=Math.max(.32,Math.min(actualW/W,actualH/H));
  const fontSize=dense?Math.min(31,Math.max(12,11/ratio)):
    Math.min(31,Math.max(15,12/ratio));
  const boxHeight=fontSize+11;
  const centroids=pieces.map(t=>({
    id:t.id,
    point:xy({x:t.pts.reduce((sum,z)=>sum+z.x,0)/t.pts.length,
      y:t.pts.reduce((sum,z)=>sum+z.y,0)/t.pts.length})
  }));
  const relations=classifyRelationSides(current.lengthRelations,sideKey);
  // In intricate reference-style piles, showing every question-mark
  // initially obscures the geometry. Show givens and x, then disclose
  // unknown labels on the selected face (or once discovered). All
  // sides remain selectable through SVG hit targets and the side list.
  const quietDense=["great-interlock","nine-muses","acropolis"].includes(current.id);
  // All Labels is an explicit opt-in to show *every* measurement,
  // including postponed question marks. Returning to Focus View
  // restores the low-clutter state without losing student work.
  const forceAllLabels=focusUserChoice&&!focusLabels;
  const compactKeys=pieces.length>=4?
    crowdedUnknownKeys(sideMap.values(),xy):new Set();
  const sides=[...sideMap.values()].filter(side=>{
    if(side.suppressLabel)return false;
    if(forceAllLabels)return true;
    // Never hide givens, discovered lengths, the target or the chosen
    // shape's measurements. Only defer nonessential '?' labels in
    // genuinely crowded regions until that triangle is investigated.
    if(side.given||side.isTarget||solved.has(side.key))return true;
    if(selectedSide&&(side.key===selectedSide||
      side.triangleIds.includes(focusedShapeId)))return true;
    return !quietDense&&!compactKeys.has(side.key);
  });
  // Reserve the least obstructed spots for givens and target x.
  sides.sort((a,b)=>Number(b.given)-Number(a.given)||
    Number(b.isOverhang)-Number(a.isOverhang)||
    Number(b.isTarget)-Number(a.isTarget)||
    b.length-a.length);
  const descriptors=sides.map(side=>{
    const solvedSide=solved.has(side.key);
    const label=side.given||solvedSide?exactLength(side.length)+" cm":side.isTarget?"x":"?";
    const textWidth=label.length*fontSize*.56;
    const width=Math.max(fontSize+12,textWidth+15);
    const owner=centroids.find(c=>side.triangleIds.includes(c.id))?.point||
      centroids[0].point;
    return {key:side.key,ends:toSide(side),width,height:boxHeight,
      owner,isFloor:side.key===sideKey(current.floor.a,current.floor.b),
      isOverhang:side.isOverhang,relationKind:relations.get(side.key)||null,
      label,solvedSide};
  });
  const placements=layoutMeasurements(descriptors,{
    width:W,floorY,minY:36,marginX:23,
    shapeEdges:[...sideMap.values()].map(side=>({...toSide(side),key:side.key}))
  });
  const byKey=new Map(descriptors.map(item=>[item.key,item]));
  // Brackets identify the physical extent of whole versus part edges.
  const brackets=el("g",{class:"measurement-brackets","aria-hidden":"true"});
  const tethers=el("g",{class:"measurement-tethers","aria-hidden":"true"});
  labels.append(brackets,tethers);
  for(const side of sides){
    const info=byKey.get(side.key);
    const {solvedSide,label,width}=info;
    const chosen=placements.get(side.key);
    const pos=chosen.pos;
    const ends=info.ends;
    const classes=["side-chip",side.given?"given":solvedSide?"solved":side.isTarget?"target":"unknown"];
    if(side.isOverhang)classes.push("overhang");
    if(selectedSide===side.key)classes.push("selected");
    if(discoveredNow===side.key)classes.push("just-discovered");
    const group=el("g",{class:classes.join(" "),"data-side-key":side.key,role:"button",tabindex:0,
      "aria-label":(side.isOverhang?"Given overhang ":side.isTarget?"Final target ":side.given?"Given ":"Missing length ")+
        label+" on "+(side.triangleIds.length>1?"shared side of ":"side of ")+
        (side.triangleIds.join(" and ")||"the straight-line segment")});
    const relationKind=relations.get(side.key)||(side.isOverhang?"overhang":null);
    const bracket=relationKind?dimensionBracket(ends.a,ends.b,chosen,relationKind):null;
    if(bracket){
      const bracketGroup=el("g",{class:"dimension-bracket dimension-bracket-"+relationKind,
        "data-side-key":side.key,"aria-hidden":"true"});
      bracketGroup.append(el("line",{
        x1:bracket.start.x,y1:bracket.start.y,x2:bracket.end.x,y2:bracket.end.y,
        class:"dimension-bracket-spine"
      }));
      for(const [a,b] of [bracket.capA,bracket.capB]){
        bracketGroup.append(el("line",{
          x1:a.x,y1:a.y,x2:b.x,y2:b.y,class:"dimension-bracket-cap"
        }));
      }
      brackets.append(bracketGroup);
    }
    // Always-visible, understated physical attachment from the exact
    // side (or the span bracket) to the nearest edge of its own chip.
    // The fine anchor dot and connection remain clear without hover,
    // while hover/focus/selection illuminate this precise relationship.
    const tether=labelTether(info,chosen,bracket?.mid||null);
    const attach=el("g",{
      class:"measurement-tether"+(side.isTarget?" tether-target":""),
      "data-side-key":side.key
    });
    attach.append(el("line",{
      x1:tether.anchor.x,y1:tether.anchor.y,
      x2:tether.end.x,y2:tether.end.y,
      class:"side-association","data-side-key":side.key
    }));
    attach.append(el("circle",{
      cx:tether.anchor.x,cy:tether.anchor.y,r:2.7,
      class:"measurement-anchor","data-side-key":side.key
    }));
    tethers.append(attach);
    group.append(el("rect",{x:pos.x-width/2,y:pos.y-boxHeight/2,width,height:boxHeight,rx:4}));
    group.append(el("text",{
      x:pos.x,y:pos.y,style:"font-size:"+fontSize+"px",class:"measure-text"
    },label));
    group.addEventListener("click",event=>{
      event.stopPropagation();
      if(!side.isOverhang)chooseSide(side.key);
    });
    group.addEventListener("keydown",event=>{
      if((event.key==="Enter"||event.key===" ")&&!side.isOverhang){
        event.preventDefault();chooseSide(side.key);
      }
    });
    if(side.isOverhang)group.removeAttribute("tabindex");
    attachSidePreview(group,side.key);
    labels.append(group);
  }
  if(!visible)labels.classList.add("hidden-labels");
  svg.append(labels);
  canvas.replaceChildren(svg);
  mountDiagramZoom(svg);
  if(shouldAnimate){
    animating=true;
    if(forceMotion||(autoplayPreference==="on"&&reduced.matches))svg.classList.add("manual-motion");
    svg.classList.add("ready-to-fall");
    document.getElementById("skip").hidden=false;
    document.getElementById("replay").disabled=true;
    // Request a separate paint before triggering the animations.
    // WAAPI handles SVG transforms consistently across Chromium and Firefox;
    // the CSS keyframe is a fallback for browsers without Element.animate.
    fallRequest=requestAnimationFrame(()=>{
      fallRequest=0;
      if(canvas.firstChild!==svg || !animating)return;
      svg.classList.remove("ready-to-fall");
      const pieces=[...svg.querySelectorAll(".piece")];
      const supportsWAAPI=pieces.every(piece=>typeof piece.animate==="function");
      if(supportsWAAPI){
        pieces.forEach((piece,i)=>{
          const twist=i%2?-13:12,sideways=i%2?95:-80;
          pieceAnimations.push(piece.animate([
            {opacity:0,transform:"translate("+sideways+"px, -600px) rotate("+twist+"deg)",offset:0},
            {opacity:1,transform:"translate(0px, 24px) rotate(-3deg)",offset:.68},
            {opacity:1,transform:"translate(0px, -12px) rotate(1.4deg)",offset:.84},
            {opacity:1,transform:"translate(0px, 0px) rotate(0deg)",offset:1}
          ],{delay:i*stepMs,duration:1340,easing:"cubic-bezier(.22,.68,.32,1)",fill:"both"}));
        });
      }else{
        svg.classList.add("falling");
      }
      // Do not count down in a hidden tab before the first animation
      // frame. requestAnimationFrame may be suspended but timers can run.
      finishTimer=setTimeout(stopAnimation,(pieces.length-1)*stepMs+1400);
    });
  }else{
    animating=false;
    document.getElementById("skip").hidden=true;
    document.getElementById("replay").disabled=false;
  }
  renderInspector();
  refreshLabelClarity();
  if(discoveredNow){
    const bar=document.getElementById("progress-fill");
    bar?.classList.add("progress-advanced");
    bar?.addEventListener("animationend",()=>bar.classList.remove("progress-advanced"),{once:true});
  }
}
function stopAnimation(){
  clearTimeout(finishTimer);
  if(fallRequest){cancelAnimationFrame(fallRequest);fallRequest=0;}
  pieceAnimations.forEach(animation=>{try{animation.cancel()}catch(_){}});
  pieceAnimations=[];
  animating=false;
  const svg=document.querySelector("#diagram svg");
  svg?.classList.remove("animating","falling","ready-to-fall");
  svg?.querySelector(".side-labels")?.classList.remove("waiting");
  document.getElementById("skip").hidden=true;
  document.getElementById("replay").disabled=false;
  renderInspector();
}

function hintText(side,level){
  const step=activeHintStep();
  if(!step)return "Every missing side has been discovered.";
  const isSelected=step.sideKey===side.key;
  const known=step.known.map(key=>exactLength(sideMap.get(key).length)+" cm");
  if(step.kind==="rectangle-opposite"){
    if(level===1)return "Opposite edges of a rectangle are equal in length.";
    if(level===2)return "Look at rectangle "+step.triangleId+
      ". A parallel side measures "+known[0]+".";
    if(level===3)return step.equation+".";
    return "The missing rectangle edge is "+step.answer+" cm.";
  }
  if(step.kind==="rectangle-diagonal"){
    if(level===1)return "A rectangle's diagonal divides it into two right-angled triangles.";
    if(level===2)return "Use the diagonal and side lengths "+known.join(" and ")+
      ". Decide whether to add or subtract squares.";
    if(level===3)return step.equation+".";
    return "This rectangle length is "+step.answer+" cm.";
  }
  if(step.kind==="equal"){
    if(!isSelected){
      if(level===1)return "Look for the identical tick marks on two different sides.";
      if(level===2)return "Both marked sides have the same length. One of them is already known.";
      if(level===3)return step.equation+".";
      return "The side with matching tick marks is "+step.answer+" cm.";
    }
    if(level===1)return "The small matching strokes on two edges tell you something about their lengths.";
    if(level===2)return "Find the other side with identical tick marks. Its value is "+known[0]+".";
    if(level===3)return step.equation+".";
    return "This side is "+step.answer+" cm. Enter it above.";
  }
  if(step.kind==="split"||step.kind==="overhang"){
    const split=step.kind==="split";
    const action=step.equation.includes("−")?"subtract":"add";
    if(!isSelected){
      if(level===1)return split ?
        "One long side lies along two smaller triangle sides. Both smaller lengths matter." :
        "Look for the short labelled overhang at the end of a straight side.";
      if(level===2)return "The available straight-line lengths are "+known.join(" and ")+".";
      if(level===3)return step.equation+".";
      return "Use the lengths on the same straight line to find "+step.answer+" cm.";
    }
    if(level===1)return split ?
      "The shared side is made from two consecutive shorter edges." :
      "The projecting or inset section and the other edge lie on one straight line.";
    if(level===2)return "The known sections measure "+known.join(" and ")+". Decide which side is the whole.";
    if(level===3)return "Use straight-line lengths: "+step.equation+". You must "+action+".";
    return "This section measures "+step.answer+" cm. Enter it to continue.";
  }
  if(!isSelected){
    if(level===1)return "Begin with triangle "+step.triangleId+". It currently has two known side lengths.";
    if(level===2)return "In triangle "+step.triangleId+", the available sides are "+known.join(" and ")+". Find its missing side first.";
    if(level===3)return "For triangle "+step.triangleId+": "+step.equation+".";
    return "For triangle "+step.triangleId+", that intermediate side is "+step.answer+" cm. Use it to continue the chain.";
  }
  if(level===1)return "Triangle "+step.triangleId+" has enough information to solve this side. Identify its hypotenuse first.";
  if(level===2)return "The two known lengths are "+known.join(" and ")+". The missing side is "+(step.isHypotenuse?"the hypotenuse.":"a shorter side.");
  if(level===3)return step.equation+". Use Pythagoras’ theorem and take the positive square root.";
  return "This side measures "+step.answer+" cm. Enter the value above to record your step.";
}

function incorrectFeedback(side,value){
  const step=readySteps(current,sideMap,solved).find(st=>st.sideKey===side.key);
  if(step?.kind==="overhang"||step?.kind==="split"){
    return "Check the straight line: decide which lengths form the complete section, and whether you need to add or subtract.";
  }
  if(step?.kind==="equal")return "Matching tick marks represent equal lengths. Look for the known matching side.";
  if(step?.kind==="rectangle-opposite")return "Opposite sides of a rectangle are equal. Check the matching length.";
  if(step?.kind==="rectangle-diagonal")return "Use the diagonal as the hypotenuse of a right triangle inside the rectangle.";
  if(step){
    const known=step.known.map(key=>sideMap.get(key).length);
    if(step.isHypotenuse){
      const minus=Math.sqrt(Math.abs(known[0]**2-known[1]**2));
      if(Math.abs(value-minus)<0.04)return "This is the hypotenuse. You need to add the squares, not subtract them.";
    }else{
      const plus=Math.sqrt(known[0]**2+known[1]**2);
      if(Math.abs(value-plus)<0.04)return "You already have the hypotenuse. Subtract the square of the known shorter side.";
    }
  }
  return "Not quite. Trace the corresponding triangle or straight line, then check your arithmetic.";
}

function renderInspector(){
  disposeWorking();disposeWorking=()=>{};
  const panel=document.getElementById("inspector");if(!panel)return;
  const meter=document.getElementById("progress-count"),bar=document.getElementById("progress-fill");
  const state=progress();
  if(meter)meter.textContent=state.done+" of "+state.total+" lengths found";
  if(bar)bar.style.width=(state.total?state.done/state.total*100:0)+"%";
  if(animating){
    panel.innerHTML='<span class="kicker">THE PILE IS FORMING</span><h3 class="inspect-title">Watch the geometry settle</h3><p class="inspect-intro">The marked sides will appear once the pieces come to rest.</p>';
    return;
  }
  if(solutionOpen){
    const all=solutionSteps(current,sideMap);
    panel.innerHTML=`<span class="kicker">THE GEOMETER’S SCROLL</span>
      <h3 class="inspect-title" id="worked-solution-heading" tabindex="-1">Complete worked solution</h3>
      <p class="solution-disclaimer">One valid order is shown. Shared edges may be solved by different routes.</p>
      <ol class="review-list">
        ${all.map((step,index)=>`<li class="review-item">
          <button data-review-side="${step.sideKey}"><span>STEP ${index+1} · ${step.kind==="pythagoras"?"TRIANGLE "+step.triangleId:
            step.kind==="rectangle-diagonal"?"RECTANGLE DIAGONAL":
            step.kind==="rectangle-opposite"?"RECTANGLE · EQUAL SIDES":
            step.kind==="equal"?"EQUAL MARKS":
            step.kind==="split"?"SHARED LONG SIDE":"OVERHANG"}</span><span>LOCATE ↗</span></button>
          <p class="step-narrative">${step.kind==="rectangle-diagonal"?"Use the right triangle inside the rectangle.":
            step.kind==="rectangle-opposite"?"Opposite sides of a rectangle are equal.":
            step.kind==="equal"?"Matching ticks mean these two lengths are equal.":
            step.kind==="split"?"Combine the two shorter edges along one long side.":
            step.kind==="overhang"?(step.equation.includes("−")?"Subtract the overhang from the longer edge.":"Add the projecting overhang to the supporting side."):
            "Find the "+(step.isHypotenuse?"hypotenuse":"missing shorter side")+"."}</p>
          <p class="step-equation">${escapeHtml(step.equation)}</p>
          <p class="step-result">${step.isTarget?"x":"s"} = ${step.answer} cm</p>
        </li>`).join("")}
      </ol>
      ${(current.extensions||[]).length?`<div class="worked-extensions"><h4>Compound-shape extensions</h4>${current.extensions.map(item=>
        `<p><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.working)}</span></p>`).join("")}</div>`:""}
      <button class="btn-link" id="return-solving">← RETURN TO THE PILE</button>`;
    panel.querySelector("#return-solving").addEventListener("click",()=>{
      solutionOpen=false;renderInspector();
      panel.querySelector("#side-select")?.focus({preventScroll:true});
    });
    panel.querySelectorAll("[data-review-side]").forEach(button=>button.addEventListener("click",()=>{
      selectedSide=button.dataset.reviewSide;
      focusedShapeId=sideMap.get(selectedSide)?.triangleIds[0]||null;
      renderDiagram(false);
      locateSelectedSide();
    }));
    return;
  }
  if(extensionMode && current.extensions?.length){
    renderExtensions(panel);
    return;
  }
  const unprovided=[...sideMap.values()].filter(s=>!s.given&&!s.suppressLabel);
  const shapes=[...current.triangles,...(current.rectangles||[])];
  const xy=fitPileInTablet(current).xy;
  const hasSmallCluster=shapes.length>=4&&
    shapes.some(shape=>compactFace(shape,shapes,xy));
  const side=selectedSide?sideMap.get(selectedSide):null;
  const choices=`<div class="inspect-field clarity-field">
    <div class="clarity-selector-heading"><label for="side-select">CHOOSE A SIDE TO INVESTIGATE</label>
      <button id="label-focus-toggle" type="button" class="clarity-focus-toggle"
        aria-pressed="${focusLabels}" title="${focusLabels?"Show every measurement":"Show only measurements belonging to the selected shape"}">
        ${focusLabels?"ALL LABELS":"FOCUS VIEW"}</button></div>
    <div class="clarity-selector-row"><select id="side-select">
      <option value="">${hasSmallCluster?"Select a side…":"Select a marked side…"}</option>
      ${unprovided.map((s,i)=>`<option value="${s.key}" ${selectedSide===s.key?"selected":""}>${s.isTarget?"Target x":"Side "+(i+1)+" · triangle "+s.triangleIds.join(" & ")}${solved.has(s.key)?" ✓":""}</option>`).join("")}
    </select>
    <button id="locate-side" type="button" class="clarity-locate"
      title="Centre the chosen length in the zoomed diagram"
      aria-label="Locate selected side in diagram" ${selectedSide?"":"disabled"}>LOCATE ↗</button></div></div>`;
  let body;
  if(!side){
    body=`<div class="workspace-brief"><strong>${hasSmallCluster?"Tap a triangle to inspect its lengths":"Select a ? on the diagram"}</strong><span>Choose a side above, or start working on your scratchpad.</span></div>
      <div id="working-pad-mount" class="working-pad-mount"></div>`;
  }else if(side.given){
    body=`<div class="workspace-brief"><strong>Given: ${exactLength(side.length)} cm</strong><span>Select a missing length to solve it.</span></div>
      <div id="working-pad-mount" class="working-pad-mount"></div>`;
  }else if(solved.has(side.key)){
    body=`<p class="solved-note solved-engraving"><span class="solved-tick" aria-hidden="true">✓</span><strong>${side.isTarget?"x":"Length"} = ${exactLength(side.length)} cm</strong></p>
      <div id="working-pad-mount" class="working-pad-mount"></div>`;
  }else{
    const level=hintLevels[side.key]||0;
    const valid=readySteps(current,sideMap,solved).some(step=>step.sideKey===side.key);
    body=`<div class="workspace-answer-head"><strong>${side.isTarget?"Solve x":"Missing length"}</strong>
        <span>${valid?"Ready to calculate":"You may need another side first"}</span></div>
      <form id="answer-form" autocomplete="off">
        <div class="inspect-field answer-field"><label for="answer-input">ANSWER (CM)</label>
          <div class="input-row"><input id="answer-input" name="answer" inputmode="decimal" maxlength="90"
            placeholder="e.g. √205 or 14.3" aria-label="Answer in centimetres" title="Exact surds and rounded decimals accepted" required>
          <button class="submit" type="submit">CHECK →</button></div></div>
      </form>
      <div id="answer-feedback" role="status" aria-live="polite"></div>
      <div id="working-pad-mount" class="working-pad-mount"></div>
      <div class="hint-area"><button class="hint-button" id="hint-next" ${level>=4?"disabled":""}>${level?level>=4?"ALL CLUES SHOWN":"REVEAL NEXT CLUE ("+(level+1)+"/4)":"NEED A CLUE? (1/4)"}</button>
      ${level?`<div class="hint-content" role="status" aria-live="polite" aria-atomic="true"><strong>CLUE ${level} / 4</strong><p>${escapeHtml(hintText(side,level))}</p></div>`:""}</div>`;
  }
  panel.innerHTML=`${choices}
    ${body}
    ${current.extensions?.length && solved.has(sideKey(current.target.a,current.target.b))?
      `<button class="extension-cta" id="open-extension-panel">✦ GEOMETER'S EXTENSIONS · PERIMETER & AREA →</button>`:""}
    <div class="panel-actions">
      <button class="btn-link" id="solution-toggle">REVEAL FULL SOLUTION ↗</button>
      <button class="btn-link" id="reset-progress">START AGAIN ↻</button>
    </div>`;
  panel.querySelector("#label-focus-toggle").addEventListener("click",()=>{
    focusLabels=!focusLabels;
    focusUserChoice=true;
    // This action also changes which unknown chips exist in crowded
    // areas, so a fresh SVG is required. Ordinary hover never does so.
    renderDiagram(false);
  });
  panel.querySelector("#locate-side").addEventListener("click",locateSelectedSide);
  panel.querySelector("#side-select").addEventListener("change",event=>{
    if(event.target.value)chooseSide(event.target.value);
    else{selectedSide=null;focusedShapeId=null;previewSideKey=null;feedback=null;renderDiagram(false);}
  });
  panel.querySelector("#solution-toggle").addEventListener("click",()=>{
    solutionOpen=true;renderInspector();
    panel.querySelector("#worked-solution-heading")?.focus({preventScroll:false});
  });
  panel.querySelector("#open-extension-panel")?.addEventListener("click",()=>{
    extensionMode=true;selectedSide=null;renderDiagram(false);
  });
  panel.querySelector("#reset-progress").addEventListener("click",()=>{
    if(!window.confirm("Clear solved lengths, maths lines, drawings and hints for this challenge?"))return;
    solved=new Set();workingBySide={};hintLevels={};hintsUsed=0;extensionGrades={};extensionMode=false;feedback=null;selectedSide=null;
    pendingDiscoveredKey=null;focusedShapeId=null;previewSideKey=null;
    saveProgress();renderDiagram(false);
  });
  const form=panel.querySelector("#answer-form");
  if(form)form.addEventListener("submit",event=>{
    event.preventDefault();
    submitAnswer(panel.querySelector("#answer-input").value);
  });
  const hintButton=panel.querySelector("#hint-next");
  if(hintButton)hintButton.addEventListener("click",()=>{
    const level=Math.min(4,(hintLevels[side.key]||0)+1);
    if(level===(hintLevels[side.key]||0))return;
    hintLevels[side.key]=level;hintsUsed++;saveProgress();
    hintButton.textContent=level>=4?"ALL CLUES SHOWN":"REVEAL NEXT CLUE ("+(level+1)+"/4)";
    hintButton.disabled=level>=4;
    const area=panel.querySelector(".hint-area");
    if(!area)return;
    let clue=area.querySelector(".hint-content");
    if(!clue){
      clue=document.createElement("div");
      clue.className="hint-content";
      clue.setAttribute("role","status");
      clue.setAttribute("aria-live","polite");
      clue.setAttribute("aria-atomic","true");
      area.append(clue);
    }
    clue.innerHTML="<strong>CLUE "+level+" / 4</strong><p>"+
      escapeHtml(hintText(side,level))+"</p>";
  });
  const space=panel.querySelector("#working-pad-mount");
  if(space){
    const id=side && !side.given?side.key:"__scratch__";
    disposeWorking=mountWorkingSpace(space,workingBySide[id],working=>{
      workingBySide[id]=working;
      return saveProgress();
    });
  }
}

function renderExtensions(panel){
  const completed=(current.extensions||[]).filter(e=>extensionGrades[e.id]===true).length;
  panel.innerHTML=
    '<span class="kicker">THE GEOMETER’S SECOND TRIAL</span>'+
    '<h3 class="inspect-title">Perimeter & area extensions</h3>'+
    '<p class="inspect-intro">The final side is found. Now consider the <strong>whole outer shape</strong>, not just the individual triangles. Internal boundaries are not part of the perimeter.</p>'+
    '<p class="extension-progress">'+completed+' / '+current.extensions.length+' extensions solved</p>'+
    current.extensions.map(item=>{
      const solvedItem=extensionGrades[item.id]===true;
      return '<section class="extension-task"><h4>'+escapeHtml(item.title)+'</h4>'+
        '<p>'+escapeHtml(item.prompt)+'</p>'+
        (solvedItem?'<div class="result-feedback good">✓ Correct: '+escapeHtml(exactLength(item.value))+' '+escapeHtml(item.unit)+'</div>':
          '<form class="extension-form" data-extension-id="'+escapeHtml(item.id)+'" autocomplete="off">'+
          '<label for="extension-'+escapeHtml(item.id)+'">YOUR ANSWER ('+escapeHtml(item.unit)+')</label>'+
          '<div class="input-row"><input id="extension-'+escapeHtml(item.id)+'" required maxlength="90" inputmode="decimal" placeholder="Your answer" aria-label="'+escapeHtml(item.title)+'"><button class="submit" type="submit">CHECK</button></div>'+
          '<div class="extension-feedback" role="status" aria-live="polite"></div>'+
          '</form>')+
        '</section>';
    }).join('')+
    (completed===current.extensions.length?'<p class="all-extensions-done">✦ You have completed the full geometer’s challenge!</p>':"")+
    '<div class="panel-actions"><button class="btn-link" id="extension-back">← RETURN TO THE PILE</button>'+
    '<button class="btn-link" id="extension-solutions">REVIEW WORKED SOLUTIONS ↗</button></div>';
  panel.querySelector("#extension-back").addEventListener("click",()=>{
    extensionMode=false;renderInspector();
  });
  panel.querySelector("#extension-solutions").addEventListener("click",()=>{
    solutionOpen=true;renderInspector();
    panel.querySelector("#worked-solution-heading")?.focus({preventScroll:false});
  });
  panel.querySelectorAll(".extension-form").forEach(form=>{
    form.addEventListener("submit",event=>{
      event.preventDefault();
      const item=current.extensions.find(ext=>ext.id===form.dataset.extensionId);
      if(!item)return;
      const value=form.querySelector("input").value;
      const status=form.querySelector(".extension-feedback");
      if(correctAnswer(value,item.value)){
        extensionGrades[item.id]=true;saveProgress();renderExtensions(panel);
      }else{
        const numeric=parseAnswer(value);
        status.className="extension-feedback result-feedback bad";
        status.textContent=numeric===null ?
          "Enter a positive number or a valid mathematical expression.":
          "Not quite. For perimeter, remove internal edges. For area, add the non-overlapping triangular regions.";
      }
    });
  });
}

function submitAnswer(raw){
  const side=sideMap.get(selectedSide);if(!side||side.given)return;
  const parsed=parseAnswer(raw);
  if(parsed===null){
    const box=document.getElementById("answer-feedback");
    box.className="result-feedback bad";
    box.textContent="Please enter a valid length such as 5, √205, sqrt(205), or 14.32.";
    return;
  }
  if(correctAnswer(raw,side.length)){
    solved.add(side.key);
    const rectangleSides=propagateRectangleSides(current,sideMap,solved);
    pendingDiscoveredKey=side.key;
    saveProgress();
    renderDiagram(false);
    // A dedicated live region announces only the meaningful new
    // result, not a complete re-render of every control and field.
    const announcement=document.getElementById("progress-announcement");
    if(announcement){
      const progressState=progress();
      announcement.textContent=(side.isTarget?"Final length solved: ":"Length discovered: ")+
        exactLength(side.length)+" centimetres. "+
        progressState.done+" of "+progressState.total+" lengths found."+
        (rectangleSides>0?" Matching rectangle lengths added automatically.":"");
    }
    if(side.isTarget)showCompletion();
    else document.getElementById("side-select")?.focus({preventScroll:true});
  }else{
    const box=document.getElementById("answer-feedback");
    box.className="result-feedback bad";
    box.textContent=incorrectFeedback(side,parsed);
  }
}
function showCompletion(){
  const dialog=document.getElementById("completion-modal");
  dialog.querySelector("#final-answer").textContent="x = "+exactLength(sideMap.get(sideKey(current.target.a,current.target.b)).length)+" cm";
  dialog.querySelector("#completion-hints").textContent=hintsUsed===0?"Without any hints":hintsUsed+" clues used";
  dialog.querySelector("#completion-extra").hidden=!current.extensions?.length;
  if(!dialog.open){
    dialog.showModal();
    dialog.querySelector("#completion-review")?.focus({preventScroll:true});
  }
}
function openPuzzle(id){
  detachDiagramZoom();detachDiagramZoom=()=>{};
  zoomState=newZoom();
  disposeWorking();disposeWorking=()=>{};
  if(document.body?.dataset)document.body.dataset.view="puzzle";
  const puzzle=puzzles.find(x=>x.id===id);if(!puzzle)return;
  current=puzzle;sideMap=buildSides(puzzle);selectedSide=null;visible=true;solutionOpen=false;extensionMode=false;screen=id;clearTimeout(finishTimer);
  focusLabels=false;focusUserChoice=false;focusedShapeId=null;previewSideKey=null;
  pendingDiscoveredKey=null;
  loadProgress();
  if(location.hash.slice(1)!==id)history.pushState(null,"","#"+id);
  const index=puzzles.indexOf(puzzle);
  const following=puzzles[(index+1)%puzzles.length];
  root.innerHTML=header()+`<main class="challenge-main">
    <div class="challenge-heading"><a class="back" href="#puzzles">← ALL CHALLENGES</a>
      <span class="chapter">${difficultyEmblem(puzzle)}<span>CHALLENGE ${String(index+1).padStart(2,"0")} / ${String(puzzles.length).padStart(2,"0")}</span></span>
      <h1>${puzzle.title}</h1><p>${puzzle.description}</p><p class="challenge-tags">${(puzzle.tags||[]).map(t=>`<span>${escapeHtml(t)}</span>`).join("")}</p></div>
    <div class="challenge-layout"><div class="tablet">
      <div class="tablet-bar"><span class="tablet-bar-brand">
        <span class="tablet-seal" aria-hidden="true"><svg viewBox="0 0 30 30" focusable="false">
          <circle cx="15" cy="15" r="12"/><path d="M15 4V26 M4 15H26 M15 8L23 22H7Z"/>
        </svg></span> THE GEOMETER’S TABLET</span>
        <span class="tablet-controls"><button id="replay" class="small-btn replay-button" title="Replay the falling triangles" aria-label="Replay the falling triangles">↻ <span>REPLAY FALL</span></button>
        <button id="autoplay-toggle" type="button" class="small-btn autoplay-button" aria-pressed="false" title="Enable or disable automatic falling animation">▷ AUTO OFF</button>
        <button id="labels-toggle" class="small-btn" title="Show or hide measurements" aria-label="Show or hide measurements" aria-pressed="false">◉</button></span></div>
      <div class="tablet-inside"><div class="tablet-engraving" aria-hidden="true">
          <span class="tablet-engraving-corner tablet-engraving-nw">⌜</span>
          <span class="tablet-engraving-corner tablet-engraving-ne">⌝</span>
          <span class="tablet-engraving-corner tablet-engraving-sw">⌞</span>
          <span class="tablet-engraving-corner tablet-engraving-se">⌟</span>
        </div><div id="diagram"></div>
        <div class="diagram-zoom-controls" role="group" aria-label="Diagram zoom" aria-describedby="diagram-zoom-hint">
          <button id="diagram-zoom-out" class="diagram-zoom-button" type="button" aria-label="Zoom out" title="Zoom out" disabled>−</button>
          <output id="diagram-zoom-level" aria-label="Diagram magnification">100%</output>
          <button id="diagram-zoom-in" class="diagram-zoom-button" type="button" aria-label="Zoom in" title="Zoom in">+</button>
          <button id="diagram-zoom-fit" class="diagram-zoom-fit" type="button" aria-label="Fit entire puzzle" title="Fit the entire diagram" disabled>FIT</button>
          <span id="diagram-zoom-hint" class="screenreader-only">Use plus and minus to zoom. At more than 100 percent, drag the picture to move around it, or focus the diagram and use arrow keys. Control plus mouse wheel also zooms.</span>
        </div>
        <button id="skip" class="skip" hidden>SKIP ANIMATION →</button>
        <div class="diagram-caption"><span>✦ ALL TRIANGLES ARE RIGHT-ANGLED · RECTANGLES HAVE 90° CORNERS</span><span>ALL LENGTHS IN CM · DRAWN TO SCALE</span></div>
      </div></div>
      <aside class="side"><div class="side-topline"><div class="kicker">${puzzle.epithet} · ${puzzle.difficulty}</div><button id="workspace-size-toggle" type="button" class="workspace-size-toggle" aria-pressed="false" title="Widen the student working panel">↔ More working room</button></div><div class="rule"></div>
        <div class="status-strip"><span>DISCOVERED LENGTHS</span><span id="progress-count">0 of 0 lengths found</span></div>
        <div class="progress-track" aria-label="Number of missing lengths discovered"><span id="progress-fill" style="width:0"></span></div>
        <div id="progress-announcement" class="screenreader-only" role="status" aria-live="polite" aria-atomic="true"></div>
        <div class="inspector" id="inspector"></div>

      </aside>
    </div><div class="challenge-bottom"><button data-puzzle="${following.id}">NEXT CHALLENGE →</button></div>
    </main>
    <dialog class="completion-dialog" id="completion-modal" aria-labelledby="completion-heading" aria-describedby="completion-subtitle">
      <div class="completion-inner">
      <div class="completion-overline">✦ A GEOMETER'S TRIAL ✦</div>
      <div class="completion-crest">${completionLaurel()}</div>
      <h2 id="completion-heading">The pile is solved.</h2>
      <p class="completion-subtitle" id="completion-subtitle">You have found the final length.</p>
      <div class="completion-answer" id="final-answer"></div>
      <p id="completion-hints"></p><div class="completion-controls">
      <button class="confirm" id="completion-review">REVIEW THE FULL SOLUTION →</button>
      <button id="completion-extra" hidden>TRY PERIMETER & AREA EXTENSIONS ↗</button>
      <button id="completion-other">TRY THE NEXT PILE</button></div>
      <button class="completion-close" id="completion-close">RETURN TO THE PILE</button></div>
    </dialog>`+footer();
  bind();
  setWorkingFocused(workingFocused);
  document.getElementById("workspace-size-toggle")?.addEventListener("click",()=>setWorkingFocused(!workingFocused));
  document.getElementById("diagram-zoom-in").addEventListener("click",()=>setDiagramZoom(zoomStep(zoomState,1)));
  document.getElementById("diagram-zoom-out").addEventListener("click",()=>setDiagramZoom(zoomStep(zoomState,-1)));
  document.getElementById("diagram-zoom-fit").addEventListener("click",()=>setDiagramZoom(zoomAt(zoomState,1)));
  document.getElementById("replay").addEventListener("click",()=>renderDiagram(true,true));
  document.getElementById("autoplay-toggle").addEventListener("click",toggleAutoFall);
  refreshAutoFallControl();
  document.getElementById("skip").addEventListener("click",stopAnimation);
  document.getElementById("labels-toggle").addEventListener("click",event=>{
    visible=!visible;
    document.querySelector(".side-labels")?.classList.toggle("hidden-labels",!visible);
    event.currentTarget.setAttribute("aria-pressed",String(!visible));
  });
  const modal=document.getElementById("completion-modal");
  document.getElementById("completion-close").addEventListener("click",()=>modal.close());
  document.getElementById("completion-review").addEventListener("click",()=>{
    modal.close();solutionOpen=true;renderInspector();
    document.getElementById("worked-solution-heading")?.focus({preventScroll:false});
  });
  document.getElementById("completion-extra").addEventListener("click",()=>{
    modal.close();extensionMode=true;solutionOpen=false;selectedSide=null;renderDiagram(false);
  });
  document.getElementById("completion-other").addEventListener("click",()=>{
    modal.close();openPuzzle(puzzles[(puzzles.findIndex(p=>p.id===id)+1)%puzzles.length].id);
  });
  renderDiagram(true);
  window.scrollTo({top:0,behavior:"instant"});
}
function bind(){
  document.querySelectorAll("[data-puzzle]").forEach(el=>el.addEventListener("click",()=>openPuzzle(el.dataset.puzzle)));
  document.querySelectorAll("[data-gallery]").forEach(el=>el.addEventListener("click",()=>{
    history.pushState(null,"","#puzzles");home(true);
  }));
}
function route(){
  const id=location.hash.slice(1);
  if(puzzles.some(x=>x.id===id))openPuzzle(id);
  else home(id==="puzzles");
}
window.addEventListener("hashchange",route);
window.addEventListener("popstate",route);
route();
