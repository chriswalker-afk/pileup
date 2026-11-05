import { buildSides, sideKey, exactLength, parseAnswer, correctAnswer, sidesOfTriangle, readySteps, solutionSteps } from "./puzzle-engine.js";

const root=document.getElementById('app');
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const p=(x,y)=>({x,y}),d=(a,b)=>Math.hypot(b.x-a.x,b.y-a.y),mid=(a,b)=>p((a.x+b.x)/2,(a.y+b.y)/2);
const v=(a,b)=>p(b.x-a.x,b.y-a.y),cross=(a,b)=>a.x*b.y-a.y*b.x,dot=(a,b)=>a.x*b.x+a.y*b.y;
function makePuzzle(id,title,epithet,difficulty,description,base,legs,colors){
 let a=p(0,0),b=p(base[0],0),c=p(base[0],base[1]);
 const first={id:'I',pts:[a,b,c],right:1,color:colors[0],givens:[{a,b,value:base[0]},{a:b,b:c,value:base[1]}]};
 const triangles=[first];let previous=first,edge={a,b:c};
 for(let i=0;i<legs.length;i++){
  const P=edge.a,Q=edge.b,vec=v(P,Q),len=d(P,Q);
  const other=previous.pts.find(z=>z!==P&&z!==Q);
  const sign=cross(vec,v(mid(P,Q),other))>=0?-1:1;
  const R=p(P.x-sign*vec.y/len*legs[i],P.y+sign*vec.x/len*legs[i]);
  const t={id:['II','III','IV','V','VI'][i],pts:[P,Q,R],right:0,color:colors[i+1],givens:[{a:P,b:R,value:legs[i]}]};
  triangles.push(t);previous=t;edge={a:Q,b:R};
 }
 const result={id,title,epithet,difficulty,description,triangles,target:edge,solution:d(edge.a,edge.b)};
 for(const t of triangles){
  const O=t.pts[t.right],two=t.pts.filter((_,i)=>i!==t.right);
  if(Math.abs(dot(v(O,two[0]),v(O,two[1])))>1e-8)throw Error('Invalid right angle');
  for(const g of t.givens)if(Math.abs(d(g.a,g.b)-g.value)>1e-8)throw Error('Invalid labelled length');
 }
 return result;
}
const puzzles=[
 makePuzzle('first-fall','The First Fall','THE APPRENTICE','INTRODUCTORY','Three right triangles. One final length. Discover how each measurement becomes the key to another.',[3,4],[12,6],['#d7ae69','#88abb2','#b47763']),
 makePuzzle('labyrinth','The Geometer’s Labyrinth','THE ARCHITECT','CHALLENGE','Five connected triangles. More turns, more hidden lengths, one final side to uncover.',[6,8],[5,7,9,4],['#d7ae69','#7fa7a1','#b77f70','#909db6','#baa475'])
];

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
  try{localStorage.setItem("pileup-pass-b-v1-"+current.id,JSON.stringify({
    solved:[...solved],notes,hintLevels,hintsUsed
  }));}catch(_){}
}
function loadProgress(){
  solved=new Set();notes={};hintLevels={};hintsUsed=0;
  try{
    const saved=JSON.parse(localStorage.getItem("pileup-pass-b-v1-"+current.id)||"null");
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
function renderDiagram(animate=false){
  const points=current.triangles.flatMap(t=>t.pts);
  const xs=points.map(z=>z.x),ys=points.map(z=>z.y);
  const minX=Math.min(...xs),minY=Math.min(...ys),maxX=Math.max(...xs),maxY=Math.max(...ys);
  const padding=Math.max(maxX-minX,maxY-minY)*.28+3;
  const bounds={x:minX-padding,y:minY-padding,w:maxX-minX+2*padding,h:maxY-minY+2*padding};
  const center=p(bounds.x+bounds.w/2,bounds.y+bounds.h/2);
  const svg=el("svg",{viewBox:[bounds.x,bounds.y,bounds.w,bounds.h].join(" "),role:"img",
    "aria-label":"A pile of "+current.triangles.length+" right-angled triangles. Select marked unknown sides to solve them."});
  const grid=el("g",{"aria-hidden":"true"});
  for(let x=Math.floor(bounds.x/5)*5;x<bounds.x+bounds.w;x+=5)grid.append(el("line",{x1:x,y1:bounds.y,x2:x,y2:bounds.y+bounds.h,class:"grid-line"}));
  for(let y=Math.floor(bounds.y/5)*5;y<bounds.y+bounds.h;y+=5)grid.append(el("line",{x1:bounds.x,y1:y,x2:bounds.x+bounds.w,y2:y,class:"grid-line"}));
  svg.append(grid);
  current.triangles.forEach((triangle,i)=>{
    const group=el("g",{class:"piece","data-id":triangle.id,tabindex:0,role:"button",
      "aria-label":"Select a side of triangle "+triangle.id,
      style:"--delay:"+(i*340)+"ms;--angle:"+(i%2?-11:9)+"deg"});
    if(selectedSide && !sideMap.get(selectedSide).triangleIds.includes(triangle.id))group.classList.add("dimmed");
    if(selectedSide && sideMap.get(selectedSide).triangleIds.includes(triangle.id))group.classList.add("selected");
    group.append(el("polygon",{points:triangle.pts.map(z=>z.x+","+z.y).join(" "),fill:triangle.color}));
    const corner=triangle.pts[triangle.right],ends=triangle.pts.filter((_,index)=>index!==triangle.right);
    const step=Math.min(d(corner,ends[0]),d(corner,ends[1]))*.11;
    const u=v(corner,ends[0]),w=v(corner,ends[1]);
    const ux=u.x/d(corner,ends[0])*step,uy=u.y/d(corner,ends[0])*step;
    const wx=w.x/d(corner,ends[1])*step,wy=w.y/d(corner,ends[1])*step;
    group.append(el("path",{d:"M"+(corner.x+ux)+" "+(corner.y+uy)+"L"+(corner.x+ux+wx)+" "+(corner.y+uy+wy)+"L"+(corner.x+wx)+" "+(corner.y+wy)}));
    const mx=triangle.pts.reduce((sum,z)=>sum+z.x,0)/3;
    const my=triangle.pts.reduce((sum,z)=>sum+z.y,0)/3;
    group.append(el("text",{x:mx,y:my,class:"triangle-number"},triangle.id));
    group.append(el("title",{},"Triangle "+triangle.id));
    group.addEventListener("click",()=>chooseTriangle(triangle.id));
    group.addEventListener("keydown",event=>{
      if(event.key==="Enter"||event.key===" "){event.preventDefault();chooseTriangle(triangle.id);}
    });
    svg.append(group);
  });
  if(selectedSide){
    const side=sideMap.get(selectedSide);
    svg.append(el("line",{x1:side.a.x,y1:side.a.y,x2:side.b.x,y2:side.b.y,class:"active-side"}));
  }
  for(const side of sideMap.values()){
    const hit=el("line",{x1:side.a.x,y1:side.a.y,x2:side.b.x,y2:side.b.y,
      class:"side-hit",tabindex:0,role:"button",
      "aria-label":(side.given?"Given "+exactLength(side.length)+" centimetres":side.isTarget?"Select target x":"Select an unknown side")+" of triangle "+side.triangleIds.join(" and ")});
    hit.addEventListener("click",()=>chooseSide(side.key));
    hit.addEventListener("keydown",event=>{
      if(event.key==="Enter"||event.key===" "){event.preventDefault();chooseSide(side.key);}
    });
    svg.append(hit);
  }
  const labels=el("g",{class:"side-labels"+(animate&&!reduced.matches?" waiting":"")});
  const occupied=[];
  for(const side of sideMap.values()){
    const base=labelPoint(side.a,side.b,center,side.given?1.65:2.1);
    const unit=v(side.a,side.b),length=d(side.a,side.b);
    let nx=-unit.y/length,ny=unit.x/length;
    if((base.x-center.x)*nx+(base.y-center.y)*ny<0){nx=-nx;ny=-ny;}
    const label=side.given?exactLength(side.length)+" cm":solved.has(side.key)?exactLength(side.length)+" cm":side.isTarget?"x":"?";
    const width=side.given?Math.max(3.4,label.length*1.2):solved.has(side.key)?Math.max(4.7,label.length*1.16):4;
    let pos={...base};
    for(let trial=0;trial<12;trial++){
      if(!occupied.some(prev=>Math.abs(prev.x-pos.x)<(prev.w+width)/2+.5&&Math.abs(prev.y-pos.y)<3.5))break;
      const shift=1.55*(Math.floor(trial/2)+1);
      pos={x:base.x+nx*shift+unit.x/length*(trial%2?1.4:-1.4),
        y:base.y+ny*shift+unit.y/length*(trial%2?1.4:-1.4)};
    }
    occupied.push({x:pos.x,y:pos.y,w:width});
    if(side.given){
      labels.append(el("text",{x:pos.x,y:pos.y,class:"label-given"},label));
      continue;
    }
    const group=el("g",{class:"side-chip "+(solved.has(side.key)?"solved":side.isTarget?"target":"unknown")+(selectedSide===side.key?" selected":""),
      role:"button",tabindex:0,"aria-label":(side.isTarget?"Target x":"Unknown side")+"; choose to enter answer"});
    if(!solved.has(side.key)){
      group.append(el("circle",{cx:pos.x,cy:pos.y,r:2.05}));
      group.append(el("text",{x:pos.x,y:pos.y},label));
    }else{
      group.append(el("rect",{x:pos.x-width/2-.4,y:pos.y-1.95,width:width+.8,height:3.9,rx:1.25}));
      group.append(el("text",{x:pos.x,y:pos.y},label));
    }
    group.addEventListener("click",event=>{event.stopPropagation();chooseSide(side.key);});
    group.addEventListener("keydown",event=>{
      if(event.key==="Enter"||event.key===" "){event.preventDefault();chooseSide(side.key);}
    });
    labels.append(group);
  }
  if(!visible)labels.classList.add("hidden-labels");
  svg.append(labels);
  document.getElementById("diagram").replaceChildren(svg);
  if(animate&&!reduced.matches){
    animating=true;svg.classList.add("animating");
    document.getElementById("skip").hidden=false;
    document.getElementById("replay").disabled=true;
    clearTimeout(finishTimer);
    finishTimer=setTimeout(stopAnimation,current.triangles.length*340+1150);
  }else{
    animating=false;
    document.getElementById("skip").hidden=true;
    document.getElementById("replay").disabled=false;
  }
  renderInspector();
}
function stopAnimation(){
  clearTimeout(finishTimer);
  animating=false;
  const svg=document.querySelector("#diagram svg");
  svg?.classList.remove("animating");
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
  if(!isSelected){
    if(level===1)return "Begin with triangle "+step.triangleId+". It currently has two known side lengths.";
    if(level===2)return "In triangle "+step.triangleId+", the available sides are "+known.join(" and ")+". Find its missing side first.";
    if(level===3)return "For triangle "+step.triangleId+": "+step.equation+".";
    return "For triangle "+step.triangleId+", that intermediate side is "+step.answer+" cm. Use it to continue the chain.";
  }
  if(level===1)return "Triangle "+step.triangleId+" has enough information to solve this side. Identify its hypotenuse first.";
  if(level===2)return "The two known lengths are "+known.join(" and ")+". The missing side is "+(step.isHypotenuse?"the hypotenuse.":"a shorter side.") ;
  if(level===3)return step.equation+". Use Pythagoras’ theorem and take the positive square root.";
  return "This side measures "+step.answer+" cm. Enter the value above to record your step.";
}
function incorrectFeedback(side,value){
  const step=readySteps(current,sideMap,solved).find(st=>st.sideKey===side.key);
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
  return "Not quite. Check the right angle, decide whether to add or subtract the squares, and check your arithmetic.";
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
          <p class="step-narrative">Find the ${step.isHypotenuse?"hypotenuse":"missing shorter side"}.</p>
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
        <span class="tablet-controls"><button id="replay" class="small-btn" title="Replay animation" aria-label="Replay animation">↻</button>
        <button id="labels-toggle" class="small-btn" title="Show or hide measurements" aria-label="Show or hide measurements" aria-pressed="false">◉</button></span></div>
      <div class="tablet-inside"><div id="diagram"></div><button id="skip" class="skip" hidden>SKIP ANIMATION →</button>
        <div class="diagram-caption"><span>✦ ALL TRIANGLES ARE RIGHT-ANGLED</span><span>ALL LENGTHS IN CM · DRAWN TO SCALE</span></div>
      </div></div>
      <aside class="side"><div class="kicker">${puzzle.epithet} · ${puzzle.difficulty}</div><div class="rule"></div>
        <h2>Find the final <em>length.</em></h2>
        <p class="description">Trace the shared lengths, or work directly towards <strong>x</strong>. Click a triangle or a marked side to investigate it.</p>
        <div class="facts"><div><span>TRIANGLES</span><strong>${puzzle.triangles.length}</strong></div>
          <div><span>GIVEN LENGTHS</span><strong>${puzzle.triangles.reduce((n,t)=>n+t.givens.length,0)}</strong></div></div>
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
