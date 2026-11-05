import { buildSides, sideKey, exactLength, parseAnswer, correctAnswer, sidesOfTriangle, readySteps, solutionSteps } from "./puzzle-engine.js";
import { puzzles } from "./pile-geometry.js";

const root=document.getElementById('app');
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const p=(x,y)=>({x,y}),d=(a,b)=>Math.hypot(b.x-a.x,b.y-a.y),mid=(a,b)=>p((a.x+b.x)/2,(a.y+b.y)/2);
const v=(a,b)=>p(b.x-a.x,b.y-a.y),cross=(a,b)=>a.x*b.y-a.y*b.x,dot=(a,b)=>a.x*b.x+a.y*b.y;
let current=puzzles[0],selectedSide=null,animating=false,visible=true,finishTimer=null,screen="home";
let sideMap=buildSides(current),solved=new Set(),notes={},hintLevels={},hintsUsed=0,feedback=null,solutionOpen=false;
const header=()=>'<header><a class="brand" href="#home"><span class="seal">△</span><span>PYTHAGORAS <em>PILE UP</em></span></a><nav><a href="#home">THE AGORA</a><a href="#puzzles">THE CHALLENGES</a></nav><span class="header-note">A GEOMETER’S TRIAL</span></header>';
const footer=()=>'<footer><span>△ PYTHAGORAS PILE UP</span><span>Inspired by the original classroom activity at greatmathsteachingideas.com and a design by @mrallanmaths.</span><span>MADE FOR CURIOUS MINDS</span></footer>';
function home(gallery=false){
 screen='home';clearTimeout(finishTimer);
 root.innerHTML=header()+`<main><section class="hero"><div><div class="eyebrow">— AN ANCIENT PUZZLE · A MODERN CHALLENGE</div><h1>When triangles<br><em>fall into place.</em></h1><p class="lead">In the footsteps of Pythagoras, follow a trail of hidden lengths. Each answer unlocks the next. Can you uncover the final side?</p><div class="actions"><button class="btn primary" data-puzzle="first-fall">BEGIN THE TRIAL &nbsp; →</button><button class="btn plain" data-gallery>EXPLORE THE CHALLENGES ↗</button></div><p class="footnote">✦ &nbsp; RIGHT-ANGLED TRIANGLES. ONE HIDDEN ANSWER.</p></div><div class="illustration"><svg viewBox="0 0 470 430" role="img" aria-label="Decorative arrangement of coloured geometric triangles"><polygon points="75,260 285,260 285,116" fill="#d7ae69" stroke="#433c31" stroke-width="3"/><polygon points="285,116 285,260 402,190" fill="#7fa7a1" stroke="#433c31" stroke-width="3"/><polygon points="75,260 285,260 184,370" fill="#b77f70" stroke="#433c31" stroke-width="3"/><polygon points="134,73 285,116 75,260" fill="#a7a0bb" stroke="#433c31" stroke-width="3"/><g fill="#433c31" font-size="21" font-family="Georgia,serif"><text x="170" y="249">a</text><text x="308" y="222">b</text><text x="194" y="311">c</text><text x="194" y="102">?</text></g><path d="M47 367H425M47 375H425" stroke="#ae9e80"/></svg><span class="illustration-caption">FIG. I — THE BEAUTY OF CONNECTION</span></div></section><div class="meander"></div><section class="section"><div class="section-title"><div class="eyebrow">THE METHOD</div><h2>Three steps to discovery</h2><p>Simple in principle. Surprisingly deep in practice.</p></div><div class="steps"><article><span class="number">I.</span><h3>Watch the fall</h3><p>Right-angled triangles tumble onto a carefully constructed geometric tablet.</p></article><article><span class="number">II.</span><h3>Follow the clues</h3><p>Known lengths lead to unknown lengths. Discover where the chain begins.</p></article><article><span class="number">III.</span><h3>Find the final side</h3><p>Use Pythagoras' theorem to connect the pieces and reach the target.</p></article></div></section><section class="section" id="challenges"><div class="section-title"><div class="eyebrow">CHOOSE YOUR PATH</div><h2>The challenges</h2><p>Two mathematically exact piles. Choose your own route to the answer.</p></div><div class="cards">${puzzles.map((x,i)=>`<button class="challenge-card" data-puzzle="${x.id}"><span class="card-index">0${i+1} / ${x.epithet}</span><span class="card-mark" aria-hidden="true">${i?'⌁':'△'}</span><span class="card-title">${x.title}</span><span class="card-description">${x.description}</span><span class="card-footer"><span>${x.triangles.length} TRIANGLES</span><span>${x.difficulty} ↗</span></span></button>`).join('')}</div></section></main>`+footer();
 bind();if(gallery)requestAnimationFrame(()=>document.getElementById('challenges')?.scrollIntoView({behavior:reduced.matches?'instant':'smooth'}));
}
function el(name,attrs={},text=''){const x=document.createElementNS('http://www.w3.org/2000/svg',name);Object.entries(attrs).forEach(([k,v])=>x.setAttribute(k,String(v)));if(text)x.textContent=text;return x;}
function labelPoint(a,b,cent,offset){const M=mid(a,b),vec=v(a,b),len=d(a,b);let nx=-vec.y/len,ny=vec.x/len;if((M.x-cent.x)*nx+(M.y-cent.y)*ny<0){nx=-nx;ny=-ny;}return p(M.x+offset*nx,M.y+offset*ny);}
function escapeHtml(text){
  return String(text).replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
}
function saveProgress(){
  try{localStorage.setItem("pileup-pass-b-v2-"+current.id,JSON.stringify({
    solved:[...solved],notes,hintLevels,hintsUsed
  }));}catch(_){}
}
function loadProgress(){
  solved=new Set();notes={};hintLevels={};hintsUsed=0;
  try{
    const saved=JSON.parse(localStorage.getItem("pileup-pass-b-v2-"+current.id)||"null");
    if(!saved || typeof saved!=="object")return;
    if(Array.isArray(saved.solved))for(const key of saved.solved){
      if(sideMap.has(key) && !sideMap.get(key).given)solved.add(key);
    }
    if(saved.notes && typeof saved.notes==="object"){
      for(const [key,value] of Object.entries(saved.notes)){
        if(sideMap.has(key)&&typeof value==="string")notes[key]=value.slice(0,1000);
      }
    }
    if(saved.hintLevels && typeof saved.hintLevels==="object"){
      for(const [key,value] of Object.entries(saved.hintLevels)){
        if(sideMap.has(key))hintLevels[key]=Math.max(0,Math.min(4,Number(value)||0));
      }
    }
    hintsUsed=Math.max(0,Number(saved.hintsUsed)||0);
  }catch(_){}
}
function stepsRemaining(){
  return [...sideMap.values()].filter(s=>!s.given&&!solved.has(s.key));
}
function progress(){
  const all=[...sideMap.values()].filter(s=>!s.given);
  return {total:all.length,done:all.length-stepsRemaining().length};
}
function activeHintStep(){
  const available=readySteps(current,sideMap,solved);
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
  const triangle=current.triangles.find(t=>t.id===id);
  if(!triangle)return;
  const edges=sidesOfTriangle(triangle,sideMap);
  const options=edges.filter(s=>!s.given&&!solved.has(s.key));
  const choices=readySteps(current,sideMap,solved);
  const side=options.find(s=>choices.some(step=>step.sideKey===s.key))||options[0]||edges.find(s=>!s.given)||edges[0];
  if(side)chooseSide(side.key);
}
function chooseSide(key){
  if(animating)return;
  if(!sideMap.has(key))return;
  selectedSide=key;
  feedback=null;
  solutionOpen=false;
  renderDiagram(false);
  renderInspector();
  document.getElementById("answer-input")?.focus({preventScroll:true});
}

/** All pieces, lines and labels are positioned in screen-oriented SVG
 * coordinates. The world geometry is independent of the SVG viewBox:
 * labels and right-angle markers therefore stay small and legible. */
let pieceAnimations=[];
let fallRequest=0;
function renderDiagram(animate=false){
  clearTimeout(finishTimer);
  pieceAnimations.forEach(animation=>{try{animation.cancel()}catch(_){}});
  pieceAnimations=[];
  if(fallRequest){cancelAnimationFrame(fallRequest);fallRequest=0;}
  const W=960,H=590,floorY=518;
  const points=current.triangles.flatMap(t=>t.pts);
  const minX=Math.min(...points.map(q=>q.x));
  const maxX=Math.max(...points.map(q=>q.x));
  const maxY=Math.max(...points.map(q=>q.y));
  const scale=Math.min(790/(maxX-minX),418/maxY);
  const offsetX=(W-(maxX-minX)*scale)/2-minX*scale;
  const xy=pt=>({x:offsetX+pt.x*scale,y:floorY-pt.y*scale});
  const toSide=side=>({a:xy(side.a),b:xy(side.b)});
  const canvas=document.getElementById("diagram");
  const svg=el("svg",{viewBox:"0 0 "+W+" "+H,role:"img",
    "aria-label":"A pile of "+current.triangles.length+" right-angled triangles resting on a stone floor. Select a labelled side or triangle to investigate."});
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
  current.triangles.forEach((triangle,i)=>{
    const group=el("g",{class:"piece","data-id":triangle.id,tabindex:0,role:"button",
      style:"--delay:"+(i*850)+"ms;--twist:"+(i%2?-13:12)+"deg",
      "aria-label":"Select triangle "+triangle.id});
    const tpts=triangle.pts.map(xy);
    if(selectedSide&&!sideMap.get(selectedSide).triangleIds.includes(triangle.id))group.classList.add("dimmed");
    if(selectedSide&&sideMap.get(selectedSide).triangleIds.includes(triangle.id))group.classList.add("selected");
    group.append(el("polygon",{points:tpts.map(pt=>pt.x+","+pt.y).join(" "),fill:triangle.color}));
    const corner=tpts[triangle.right];
    const ends=tpts.filter((_,j)=>j!==triangle.right);
    const unit=ends.map(end=>{
      const v=({x:end.x-corner.x,y:end.y-corner.y});
      const len=Math.hypot(v.x,v.y);
      return {x:v.x/len,y:v.y/len};
    });
    const k=10;
    group.append(el("path",{
      d:"M"+(corner.x+unit[0].x*k)+" "+(corner.y+unit[0].y*k)
       +"L"+(corner.x+(unit[0].x+unit[1].x)*k)+" "+(corner.y+(unit[0].y+unit[1].y)*k)
       +"L"+(corner.x+unit[1].x*k)+" "+(corner.y+unit[1].y*k),
      class:"angle-square"
    }));
    const centroid={x:tpts.reduce((sum,z)=>sum+z.x,0)/3,y:tpts.reduce((sum,z)=>sum+z.y,0)/3};
    group.append(el("text",{x:centroid.x,y:centroid.y,class:"triangle-number"},triangle.id));
    group.append(el("title",{},"Triangle "+triangle.id));
    group.addEventListener("click",()=>chooseTriangle(triangle.id));
    group.addEventListener("keydown",event=>{
      if(event.key==="Enter"||event.key===" "){event.preventDefault();chooseTriangle(triangle.id);}
    });
    svg.append(group);
  });
  if(selectedSide){
    const side=sideMap.get(selectedSide),ends=toSide(side);
    svg.append(el("line",{x1:ends.a.x,y1:ends.a.y,x2:ends.b.x,y2:ends.b.y,class:"active-side"}));
  }
  // Collinear full/part edges overlap. Hit targets are ordered with short,
  // currently unknown edges above long or given edges for reliable selection.
  const orderedSides=[...sideMap.values()].sort((a,b)=>
    Number(a.given)-Number(b.given) || b.length-a.length);
  for(const side of orderedSides){
    if(side.isOverhang)continue;
    const ends=toSide(side);
    const hit=el("line",{
      x1:ends.a.x,y1:ends.a.y,x2:ends.b.x,y2:ends.b.y,
      class:"side-hit",tabindex:0,role:"button",
      "aria-label":(side.given?"Given "+exactLength(side.length)+" centimetres":side.isTarget?"Select target x":"Select an unknown side")
        +" of triangle "+side.triangleIds.join(" and ")
    });
    hit.addEventListener("click",()=>chooseSide(side.key));
    hit.addEventListener("keydown",event=>{
      if(event.key==="Enter"||event.key===" "){event.preventDefault();chooseSide(side.key);}
    });
    svg.append(hit);
  }

  const labels=el("g",{class:"side-labels"+(animate&&!reduced.matches?" waiting":"")});
  const occupied=[];
  const actualW=canvas.getBoundingClientRect().width||780;
  const actualH=Math.min(490,Math.max(340,actualW*590/960));
  const ratio=Math.max(.32,Math.min(actualW/W,actualH/H));
  const fontSize=Math.min(31,Math.max(15,12/ratio));
  const boxHeight=fontSize+11;
  const clash=(pos,width,height)=>occupied.reduce((total,box)=>{
    const dx=Math.abs(box.x-pos.x),dy=Math.abs(box.y-pos.y);
    const ox=Math.max(0,(box.w+width)/2+6-dx);
    const oy=Math.max(0,(box.h+height)/2+5-dy);
    return total+ox*oy;
  },0);
  const centroids=current.triangles.map(t=>({
    id:t.id,
    point:xy({x:t.pts.reduce((sum,z)=>sum+z.x,0)/3,y:t.pts.reduce((sum,z)=>sum+z.y,0)/3})
  }));
  const first=current.triangles[0];
  const fullLineKey=sideKey(current.lengthRelations[0].whole.a,current.lengthRelations[0].whole.b);
  const partialLineKey=sideKey(current.lengthRelations[0].parts[0].a,current.lengthRelations[0].parts[0].b);
  const overlapKeys=new Set([fullLineKey,partialLineKey]);
  function positioning(side,labelWidth){
    const ends=toSide(side),dx=ends.b.x-ends.a.x,dy=ends.b.y-ends.a.y;
    const length=Math.hypot(dx,dy),mx=(ends.a.x+ends.b.x)/2,my=(ends.a.y+ends.b.y)/2;
    let nx=-dy/length,ny=dx/length;
    const own=centroids.find(t=>side.triangleIds.includes(t.id))?.point||centroids[0].point;
    const inward=((own.x-mx)*nx+(own.y-my)*ny)>0;
    const isFloor=side.key===sideKey(current.floor.a,current.floor.b);
    if(isFloor){
      if(ny>0){nx=-nx;ny=-ny;}
    }else if(side.isOverhang){
      // Put the dimension line on the inside of the bottom triangle.
      const b=centroids[0].point;
      if(((b.x-mx)*nx+(b.y-my)*ny)<0){nx=-nx;ny=-ny;}
    }else if(overlapKeys.has(side.key)){
      if(!inward){nx=-nx;ny=-ny;}
    }else{
      if(inward){nx=-nx;ny=-ny;}
    }
    const tx=dx/length,ty=dy/length;
    let best=null;
    const normalOffsets=[side.isOverhang?30:24,39,54,68,84];
    for(const distance of normalOffsets){
      for(const tangent of [0,-19,19,-37,37,-56,56]){
        const pos={x:mx+nx*distance+tx*tangent,y:my+ny*distance+ty*tangent};
        const boundaryPenalty=(pos.x<labelWidth/2+25 || pos.x>W-labelWidth/2-25 ||
          pos.y<36 || pos.y>floorY+1)?20000:0;
        const penalty=clash(pos,labelWidth,boxHeight)+boundaryPenalty+
          (distance-normalOffsets[0])*.18+Math.abs(tangent)*.12;
        if(!best||penalty<best.penalty)best={pos,nx,ny,score:penalty,penalty};
      }
    }
    return best;
  }
  const sides=[...sideMap.values()];
  // Given lengths before unknown tags; annotate the overhang clearly.
  sides.sort((a,b)=>Number(b.given)-Number(a.given)||
    Number(b.isOverhang)-Number(a.isOverhang)||
    Number(b.isTarget)-Number(a.isTarget));
  for(const side of sides){
    const solvedSide=solved.has(side.key);
    const label=side.given||solvedSide?exactLength(side.length)+" cm":side.isTarget?"x":"?";
    const textWidth=label.length*fontSize*.56;
    const width=Math.max(fontSize+12,textWidth+15);
    const chosen=positioning(side,width);
    const pos=chosen.pos;
    occupied.push({x:pos.x,y:pos.y,w:width,h:boxHeight});
    const classes=["side-chip",side.given?"given":solvedSide?"solved":side.isTarget?"target":"unknown"];
    if(side.isOverhang)classes.push("overhang");
    if(selectedSide===side.key)classes.push("selected");
    const group=el("g",{class:classes.join(" "),role:"button",tabindex:0,
      "aria-label":(side.isOverhang?"Given overhang ":side.isTarget?"Final target ":side.given?"Given ":"Missing length ")+label});
    if(side.isOverhang){
      const ends=toSide(side);
      const nx=chosen.nx,ny=chosen.ny,dx=nx*13,dy=ny*13;
      const start={x:ends.a.x+dx,y:ends.a.y+dy},stop={x:ends.b.x+dx,y:ends.b.y+dy};
      group.append(el("line",{x1:start.x,y1:start.y,x2:stop.x,y2:stop.y,class:"overhang-bracket"}));
      const ex=(stop.x-start.x)/Math.hypot(stop.x-start.x,stop.y-start.y);
      const ey=(stop.y-start.y)/Math.hypot(stop.x-start.x,stop.y-start.y);
      for(const pt of [start,stop]){
        group.append(el("line",{x1:pt.x-nx*5,y1:pt.y-ny*5,x2:pt.x+nx*5,y2:pt.y+ny*5,class:"overhang-bracket"}));
      }
    }
    if(overlapKeys.has(side.key)){
      // Thin leader lines distinguish the whole hypotenuse from its
      // overlapping shorter section when both are still unknown.
      const ends=toSide(side);
      labels.append(el("line",{
        x1:(ends.a.x+ends.b.x)/2,y1:(ends.a.y+ends.b.y)/2,
        x2:pos.x,y2:pos.y,class:"dimension-leader"
      }));
    }
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
    labels.append(group);
  }
  if(!visible)labels.classList.add("hidden-labels");
  svg.append(labels);
  canvas.replaceChildren(svg);
  if(animate&&!reduced.matches){
    animating=true;
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
          ],{delay:i*850,duration:1340,easing:"cubic-bezier(.22,.68,.32,1)",fill:"both"}));
        });
      }else{
        svg.classList.add("falling");
      }
    });
    finishTimer=setTimeout(stopAnimation,(current.triangles.length-1)*850+1400);
  }else{
    animating=false;
    document.getElementById("skip").hidden=true;
    document.getElementById("replay").disabled=false;
  }
  renderInspector();
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
  if(step.kind==="overhang"){
    if(!isSelected){
      if(level===1)return "Find the complete straight side, then look carefully at the small labelled overhang.";
      if(level===2)return "The complete side and the extra overhang measure "+known.join(" and ")+".";
      if(level===3)return "Use lengths along a straight line: "+step.equation+".";
      return "Subtract the overhang to find the shorter shared side: "+step.answer+" cm.";
    }
    if(level===1)return "The shorter side and labelled overhang lie along one straight line.";
    if(level===2)return "The two known lengths are "+known.join(" and ")+". Think about which one is the whole.";
    if(level===3)return step.equation+". No Pythagoras is needed in this step.";
    return "The missing straight-line part is "+step.answer+" cm. Enter it to continue.";
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
  if(step?.kind==="overhang"){
    return "Check the straight line: complete length = shorter part + labelled overhang. You may need to subtract.";
  }
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
      <h3 class="inspect-title">Complete worked solution</h3>
      <p class="solution-disclaimer">One valid order is shown. You may have solved the triangles in a different order.</p>
      <ol class="review-list">
        ${all.map((step,index)=>`<li class="review-item">
          <button data-review-side="${step.sideKey}"><span>STEP ${index+1} · TRIANGLE ${step.triangleId}</span><span>LOCATE ↗</span></button>
          <p class="step-narrative">${step.kind==="overhang"?"Subtract the labelled overhang from the complete side.":"Find the "+(step.isHypotenuse?"hypotenuse":"missing shorter side")+"."}</p>
          <p class="step-equation">${step.equation}</p>
          <p class="step-result">${step.isTarget?"x":"s"} = ${step.answer} cm</p>
        </li>`).join("")}
      </ol><button class="btn-link" id="return-solving">← RETURN TO THE PILE</button>`;
    panel.querySelector("#return-solving").addEventListener("click",()=>{solutionOpen=false;renderInspector();});
    panel.querySelectorAll("[data-review-side]").forEach(button=>button.addEventListener("click",()=>{
      selectedSide=button.dataset.reviewSide;
      renderDiagram(false);
    }));
    return;
  }
  const unprovided=[...sideMap.values()].filter(s=>!s.given);
  const side=selectedSide?sideMap.get(selectedSide):null;
  const choices=`<div class="inspect-field">
    <label for="side-select">CHOOSE A SIDE TO INVESTIGATE</label>
    <select id="side-select">
      <option value="">Select a marked side…</option>
      ${unprovided.map((s,i)=>`<option value="${s.key}" ${selectedSide===s.key?"selected":""}>${s.isTarget?"Target x":"Side "+(i+1)+" · triangle "+s.triangleIds.join(" & ")}${solved.has(s.key)?" ✓":""}</option>`).join("")}
    </select></div>`;
  let body;
  if(!side){
    const available=readySteps(current,sideMap,solved);
    const message=available.length
      ?"Look for a triangle with two known lengths. Select a ? on its side, or choose one in the list."
      :"The final target is waiting for your answer.";
    body=`<h3 class="inspect-title">Where would you begin?</h3>
      <p class="inspect-intro">${message} You can solve on paper and enter the target directly.</p>`;
  }else if(side.given){
    body=`<h3 class="inspect-title">Given: ${exactLength(side.length)} cm</h3>
      <p class="inspect-intro">This length is already known. Try selecting a side marked with ? or x.</p>`;
  }else if(solved.has(side.key)){
    body=`<h3 class="inspect-title">Length discovered ✓</h3>
      <p class="solved-note">${side.isTarget?"The final length x":"This shared length"} = <strong>${exactLength(side.length)} cm</strong></p>
      <p class="inspect-intro">This measurement is now available wherever the side is shared.</p>`;
  }else{
    const level=hintLevels[side.key]||0;
    const valid=readySteps(current,sideMap,solved).some(step=>step.sideKey===side.key);
    body=`<h3 class="inspect-title">${side.isTarget?"Discover the final x":"Find this missing length"}</h3>
      <p class="inspect-intro">${valid?"This side can be found from two known lengths.":"You can enter the answer now if you have worked it out, or find an earlier length first."}</p>
      <form id="answer-form" autocomplete="off">
        <div class="inspect-field"><label for="answer-input">YOUR ANSWER (CM)</label>
          <div class="input-row"><input id="answer-input" name="answer" inputmode="decimal" maxlength="90" placeholder="e.g. √205 or 14.3" aria-describedby="answer-format" required>
          <button class="submit" type="submit">CHECK →</button></div>
          <span id="answer-format" class="solution-disclaimer">Use an exact value or a decimal to at least 3 s.f. You can type sqrt(205).</span></div>
      </form>
      <div id="answer-feedback" role="status" aria-live="polite"></div>
      <div class="hint-area"><button class="hint-button" id="hint-next" ${level>=4?"disabled":""}>${level?level>=4?"ALL CLUES SHOWN":"REVEAL NEXT CLUE ("+(level+1)+"/4)":"NEED A CLUE? (1/4)"}</button>
      ${level?`<div class="hint-content"><strong>CLUE ${level} / 4</strong><p>${escapeHtml(hintText(side,level))}</p></div>`:""}</div>
      <details class="working-details"><summary>MY WORKING (OPTIONAL)</summary><p>Keep your calculation for this side. Notes are saved in this browser.</p>
        <div class="inspect-field"><textarea id="working-notes" maxlength="1000" aria-label="Your working notes for this side" placeholder="Example: a² + b² = c²">${escapeHtml(notes[side.key]||"")}</textarea></div>
      </details>`;
  }
  panel.innerHTML=`<span class="kicker">THE GEOMETER’S NOTES</span>
    ${choices}
    ${body}
    <div class="panel-actions">
      <button class="btn-link" id="solution-toggle">REVEAL FULL SOLUTION ↗</button>
      <button class="btn-link" id="reset-progress">START AGAIN ↻</button>
    </div>`;
  panel.querySelector("#side-select").addEventListener("change",event=>{
    if(event.target.value)chooseSide(event.target.value);
    else{selectedSide=null;feedback=null;renderDiagram(false);}
  });
  panel.querySelector("#solution-toggle").addEventListener("click",()=>{solutionOpen=true;renderInspector();});
  panel.querySelector("#reset-progress").addEventListener("click",()=>{
    if(!window.confirm("Clear your discovered lengths and working notes for this challenge?"))return;
    solved=new Set();notes={};hintLevels={};hintsUsed=0;feedback=null;selectedSide=null;
    saveProgress();renderDiagram(false);
  });
  const form=panel.querySelector("#answer-form");
  if(form)form.addEventListener("submit",event=>{
    event.preventDefault();
    submitAnswer(panel.querySelector("#answer-input").value);
  });
  const hintButton=panel.querySelector("#hint-next");
  if(hintButton)hintButton.addEventListener("click",()=>{
    hintLevels[side.key]=Math.min(4,(hintLevels[side.key]||0)+1);
    hintsUsed++;saveProgress();renderInspector();
  });
  const textarea=panel.querySelector("#working-notes");
  if(textarea)textarea.addEventListener("input",event=>{
    notes[side.key]=event.target.value;saveProgress();
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
    solved.add(side.key);saveProgress();renderDiagram(false);
    if(side.isTarget)showCompletion();
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
  if(!dialog.open)dialog.showModal();
}
function openPuzzle(id){
  const puzzle=puzzles.find(x=>x.id===id);if(!puzzle)return;
  current=puzzle;sideMap=buildSides(puzzle);selectedSide=null;visible=true;solutionOpen=false;screen=id;clearTimeout(finishTimer);
  loadProgress();
  if(location.hash.slice(1)!==id)history.pushState(null,"","#"+id);
  const index=puzzles.indexOf(puzzle);
  root.innerHTML=header()+`<main class="challenge-main">
    <div class="challenge-heading"><a class="back" href="#puzzles">← ALL CHALLENGES</a>
      <span class="chapter">CHALLENGE 0${index+1} / 0${puzzles.length}</span>
      <h1>${puzzle.title}</h1><p>${puzzle.description}</p></div>
    <div class="challenge-layout"><div class="tablet">
      <div class="tablet-bar"><span><span class="symbol">✧</span> THE GEOMETER’S TABLET</span>
        <span class="tablet-controls"><button id="replay" class="small-btn replay-button" title="Replay the falling triangles" aria-label="Replay the falling triangles">↻ <span>REPLAY FALL</span></button>
        <button id="labels-toggle" class="small-btn" title="Show or hide measurements" aria-label="Show or hide measurements" aria-pressed="false">◉</button></span></div>
      <div class="tablet-inside"><div id="diagram"></div><button id="skip" class="skip" hidden>SKIP ANIMATION →</button>
        <div class="diagram-caption"><span>✦ ALL TRIANGLES ARE RIGHT-ANGLED</span><span>ALL LENGTHS IN CM · DRAWN TO SCALE</span></div>
      </div></div>
      <aside class="side"><div class="kicker">${puzzle.epithet} · ${puzzle.difficulty}</div><div class="rule"></div>
        <h2>Find the final <em>length.</em></h2>
        <p class="description">Start with the bottom triangle on the floor. Look for the labelled overhang: it is part of the chain. Click any marked side to investigate.</p>
        <div class="facts"><div><span>TRIANGLES</span><strong>${puzzle.triangles.length}</strong></div>
          <div><span>GIVEN LENGTHS</span><strong>${puzzle.triangles.reduce((n,t)=>n+t.givens.length,0)+(puzzle.extraSegments?.length||0)}</strong></div></div>
        <div class="status-strip"><span>DISCOVERED LENGTHS</span><span id="progress-count">0 of 0 lengths found</span></div>
        <div class="progress-track" aria-label="Number of missing lengths discovered"><span id="progress-fill" style="width:0"></span></div>
        <div class="inspector" id="inspector" aria-live="polite"></div>
        <div class="side-bottom"><strong>✦ THE CHAIN IS YOURS TO DISCOVER</strong>
          <p>Any mathematically correct length is accepted, even if you solve the target first. Progress and notes stay in this browser.</p></div>
      </aside>
    </div><div class="challenge-bottom"><span>ANCIENT WISDOM. FRESH PERSPECTIVES.</span>
      <button data-puzzle="${puzzles.find(x=>x.id!==id).id}">TRY THE OTHER CHALLENGE →</button></div>
    </main>
    <dialog class="completion-dialog" id="completion-modal" aria-labelledby="completion-heading">
      <div class="completion-inner"><div class="completion-icon">✧</div><h2 id="completion-heading">The pile is solved.</h2>
      <p>By the wisdom of Pythagoras, you have found the final length.</p>
      <div class="completion-answer" id="final-answer"></div>
      <p id="completion-hints"></p><div class="completion-controls">
      <button class="confirm" id="completion-review">REVIEW THE FULL SOLUTION →</button>
      <button id="completion-other">TRY ANOTHER PILE</button></div>
      <button class="completion-close" id="completion-close">RETURN TO THE PILE</button></div>
    </dialog>`+footer();
  bind();
  document.getElementById("replay").addEventListener("click",()=>renderDiagram(true));
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
  });
  document.getElementById("completion-other").addEventListener("click",()=>{
    modal.close();openPuzzle(puzzles.find(x=>x.id!==id).id);
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
