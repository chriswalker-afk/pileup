/**
 * Student working space: typeset line-by-line mathematics and ink drawing.
 * State is plain JSON, keyed by puzzle side in app.js.
 * The input widget uses MathLive (loaded by index.html) when available.
 * A keyboard-editable LaTeX input remains functional if its CDN is blocked.
 */
export const MAX_MATH_LINES = 16;
export const MAX_STROKES = 120;
const MAX_LATEX = 260;
const MAX_POINTS = 420;
let nextLineId = 1;

function freshLine(latex = "") {
  return { id: "step-" + nextLineId++, latex: String(latex).slice(0,MAX_LATEX) };
}
export function emptyWorking() {
  return { tab: "math", lines: [freshLine()], strokes: [] };
}
export function sanitizeWorking(input) {
  const initial=emptyWorking();
  if (!input || typeof input !== "object") return initial;
  const tab=input.tab==="ink"?"ink":"math";
  const lines=Array.isArray(input.lines)?input.lines.slice(0,MAX_MATH_LINES)
    .filter(v=>v && typeof v.latex==="string")
    .map(line=>({id:String(line.id||"step-"+nextLineId++).slice(0,40),latex:line.latex.slice(0,MAX_LATEX)})) : [];
  const strokes=Array.isArray(input.strokes)?input.strokes.slice(-MAX_STROKES)
    .filter(s=>s && Array.isArray(s.points))
    .map(s=>({
      width:Math.max(1,Math.min(8,Number(s.width)||2.4)),
      points:s.points.slice(0,MAX_POINTS)
        .filter(p=>Array.isArray(p)&&p.length===2&&Number.isFinite(+p[0])&&Number.isFinite(+p[1]))
        .map(p=>[Number(Math.max(0,Math.min(1,+p[0])).toFixed(4)),Number(Math.max(0,Math.min(1,+p[1])).toFixed(4))])
    })).filter(s=>s.points.length) : [];
  return {tab,lines:lines.length?lines:[freshLine()],strokes,padHeight:input.padHeight==="large"?"large":"regular"};
}
export function appendLine(work, afterId = null) {
  if(work.lines.length>=MAX_MATH_LINES)return false;
  const line=freshLine();
  const index=afterId?work.lines.findIndex(l=>l.id===afterId):-1;
  work.lines.splice(index>=0?index+1:work.lines.length,0,line);
  return line.id;
}
export function removeLine(work, id) {
  const index=work.lines.findIndex(line=>line.id===id);
  if(index<0)return false;
  if(work.lines.length===1){work.lines[0].latex="";return true;}
  work.lines.splice(index,1);
  return true;
}
export function setLine(work,id,latex) {
  const line=work.lines.find(item=>item.id===id);
  if(!line)return false;
  line.latex=String(latex||"").slice(0,MAX_LATEX);
  return true;
}
export function addStroke(work, stroke) {
  if(!stroke || !Array.isArray(stroke.points) || !stroke.points.length)return false;
  const copy=sanitizeWorking({lines:work.lines,strokes:[stroke]}).strokes[0];
  if(!copy)return false;
  work.strokes.push(copy);
  if(work.strokes.length>MAX_STROKES)work.strokes.shift();
  return true;
}
export function distanceToSegment(point,a,b) {
  const dx=b[0]-a[0],dy=b[1]-a[1];
  if(dx*dx+dy*dy<1e-12)return Math.hypot(point[0]-a[0],point[1]-a[1]);
  const t=Math.min(1,Math.max(0,((point[0]-a[0])*dx+(point[1]-a[1])*dy)/(dx*dx+dy*dy)));
  return Math.hypot(point[0]-(a[0]+t*dx),point[1]-(a[1]+t*dy));
}
export function eraseAt(work,point,radius=0.03) {
  const before=work.strokes.length;
  work.strokes=work.strokes.filter(stroke=>{
    if(stroke.points.some(p=>Math.hypot(p[0]-point[0],p[1]-point[1])<=radius))return false;
    for(let i=1;i<stroke.points.length;i++){
      if(distanceToSegment(point,stroke.points[i-1],stroke.points[i])<=radius)return false;
    }
    return true;
  });
  return before-work.strokes.length;
}
function node(tag,className,text) {
  const e=document.createElement(tag);
  if(className)e.className=className;
  if(text!==undefined)e.textContent=text;
  return e;
}
function actionButton(text,title,onClick,className="") {
  const e=node("button","ws-action "+className,text);
  e.type="button"; e.title=title||text;
  e.addEventListener("click",onClick);
  return e;
}
function isMathLiveReady() {
  return typeof customElements!=="undefined" && Boolean(customElements.get("math-field"));
}
function drawInk(canvas,work,preview=null) {
  const ctx=canvas.getContext("2d");
  if(!ctx)return;
  const bounds=canvas.getBoundingClientRect();
  const W=Math.max(1,bounds.width),H=Math.max(1,bounds.height);
  const ratio=Math.min(3,Math.max(1,window.devicePixelRatio||1));
  const width=Math.round(W*ratio),height=Math.round(H*ratio);
  if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;}
  ctx.setTransform(ratio,0,0,ratio,0,0);
  ctx.clearRect(0,0,W,H);
  const render=stroke=>{
    const pts=stroke.points;if(!pts.length)return;
    ctx.beginPath();ctx.lineJoin="round";ctx.lineCap="round";
    ctx.lineWidth=stroke.width;ctx.strokeStyle="#38372f";ctx.fillStyle="#38372f";
    ctx.moveTo(pts[0][0]*W,pts[0][1]*H);
    for(let i=1;i<pts.length;i++)ctx.lineTo(pts[i][0]*W,pts[i][1]*H);
    if(pts.length===1){
      ctx.beginPath();ctx.arc(pts[0][0]*W,pts[0][1]*H,stroke.width/2,0,Math.PI*2);
      ctx.fill();
    }else ctx.stroke();
  };
  work.strokes.forEach(render);
  if(preview)render(preview);
}
function buildInk(container,work,commit,undo) {
  let tool="pen",activePointer=null,activeStroke=null,observer=null;
  let eraserChanged=false;
  const toolbar=node("div","ws-ink-tools");
  const pen=actionButton("✎ Pen","Draw using pen",()=>setTool("pen"));
  const eraser=actionButton("⌫ Eraser","Erase a touched ink stroke",()=>setTool("eraser"));
  const undoButton=actionButton("↶ Undo","Undo the most recent drawing or erasure",()=>{
    if(!undo.length)return;
    work.strokes=undo.pop();commit();redraw();updateUndo();
  });
  const clearButton=actionButton("Clear","Clear the drawing, not the mathematical lines",()=>{
    if(!work.strokes.length)return;
    if(!window.confirm("Clear this drawing? Your maths lines will be kept."))return;
    snapshot();work.strokes=[];commit();redraw();updateUndo();
  });
  const sizeButton=actionButton("⤢ Larger pad","Increase drawing space",()=>{
    work.padHeight=work.padHeight==="large"?"regular":"large";
    refreshSize();commit();
  },"ws-resize-pad");
  const setTool=value=>{
    tool=value;pen.setAttribute("aria-pressed",String(value==="pen"));
    eraser.setAttribute("aria-pressed",String(value==="eraser"));
    canvas.style.cursor=value==="pen"?"crosshair":"cell";
  };
  toolbar.append(pen,eraser,undoButton,clearButton,sizeButton);
  const frame=node("div","ws-ink-frame");
  const canvas=node("canvas","ws-ink-canvas");
  canvas.setAttribute("role","img");
  canvas.setAttribute("aria-label","Drawing pad. Use a mouse, finger or stylus to draw; the eraser removes whole strokes.");
  frame.append(canvas);
  const caption=node("p","ws-help","Draw with mouse, pen or touch. Undo and pad size remain available when you switch tabs.");
  container.append(toolbar,frame,caption);
  const refreshSize=()=>{
    frame.className="ws-ink-frame"+(work.padHeight==="large"?" is-large":"")+
      (work.strokes.length===0?" ws-ink-empty":"");
    sizeButton.setAttribute("aria-pressed",String(work.padHeight==="large"));
    sizeButton.textContent=work.padHeight==="large"?"⤡ Smaller pad":"⤢ Larger pad";
    sizeButton.title=work.padHeight==="large"?"Return to normal drawing height":"Increase drawing height";
    requestAnimationFrame(redraw);
  };
  const updateUndo=()=>{undoButton.disabled=undo.length===0;};
  const snapshot=()=>{
    undo.push(work.strokes.map(s=>({width:s.width,points:s.points.map(p=>[...p])})));
    if(undo.length>20)undo.shift();
  };
  const redraw=()=>{
    // Decorative construction lines only belong on completely blank
    // paper. Hide the watermark as soon as ink begins, and restore it
    // after Undo, Eraser or Clear removes the final stroke.
    frame.classList.toggle("ws-ink-empty",work.strokes.length===0&&!activeStroke);
    drawInk(canvas,work,activeStroke);
  };
  const pointerPoint=event=>{
    const bounds=canvas.getBoundingClientRect();
    return [
      Math.max(0,Math.min(1,(event.clientX-bounds.left)/Math.max(1,bounds.width))),
      Math.max(0,Math.min(1,(event.clientY-bounds.top)/Math.max(1,bounds.height)))
    ];
  };
  const pushPoint=event=>{
    if(!activeStroke || activeStroke.points.length>=MAX_POINTS)return;
    const point=pointerPoint(event),last=activeStroke.points.at(-1);
    if(Math.hypot(point[0]-last[0],point[1]-last[1])>0.0012)activeStroke.points.push(point);
  };
  canvas.addEventListener("pointerdown",event=>{
    if(activePointer!==null || (event.button!==undefined && event.button!==0) ||
      (event.pointerType==="touch" && event.isPrimary===false))return;
    event.preventDefault();
    activePointer=event.pointerId;eraserChanged=false;
    canvas.setPointerCapture?.(event.pointerId);
    const point=pointerPoint(event);
    snapshot();
    if(tool==="pen"){
      activeStroke={width:event.pointerType==="pen"?2.2:2.7,points:[point]};
      redraw();
    }else if(eraseAt(work,point,0.033)){
      eraserChanged=true;redraw();updateUndo();
    }
  });
  canvas.addEventListener("pointermove",event=>{
    if(activePointer!==event.pointerId)return;
    event.preventDefault();
    if(tool==="pen" && activeStroke){
      const events=typeof event.getCoalescedEvents==="function" ?
        event.getCoalescedEvents():[];
      for(const sample of events.length?events:[event])pushPoint(sample);
      // Some browsers omit the latest sample from coalesced events.
      pushPoint(event);
      redraw();
    }else if(tool==="eraser" && eraseAt(work,pointerPoint(event),0.033)){
      eraserChanged=true;redraw();updateUndo();
    }
  });
  const finish=event=>{
    if(activePointer!==event.pointerId)return;
    if(event.type==="pointercancel"){
      // Palm rejection/browser gesture should not leave a partial line.
      const previous=undo.pop();
      if(previous && (activeStroke||eraserChanged)){
        work.strokes=previous;
        if(eraserChanged)commit();
      }
    }else if(activeStroke){
      pushPoint(event);
      addStroke(work,activeStroke);
      commit();
    }else if(tool==="eraser" && eraserChanged){
      // Erase is committed once per drag rather than per pointermove.
      commit();
    }else if(undo.length){
      undo.pop(); // no drawing was changed
    }
    activeStroke=null;activePointer=null;eraserChanged=false;
    canvas.releasePointerCapture?.(event.pointerId);
    redraw();updateUndo();
  };
  canvas.addEventListener("pointerup",finish);
  canvas.addEventListener("pointercancel",finish);
  if(typeof ResizeObserver!=="undefined"){
    observer=new ResizeObserver(redraw);
    observer.observe(frame);
  }
  setTool("pen");updateUndo();refreshSize();
  return ()=>{
    observer?.disconnect();
    if(activeStroke)activeStroke=null;
    // The host element is removed when the selected side changes.
  };
}

function buildMath(container,work,commit) {
  const list=node("div","ws-line-list");
  const toolbar=node("div","ws-maths-toolbar");
  const add=actionButton("+ Add line","Add the next mathematical line",()=>{
    const id=appendLine(work);if(!id)return;
    commit();renderMath(id);
  },"ws-add-line");
  toolbar.append(add);
  const explain=node("span","ws-line-caption","One mathematical step per line · Enter adds a line");
  toolbar.append(explain);
  container.append(list,toolbar);
  let focusedId=null;
  function renderMath(focusId=null){
    list.replaceChildren();
    work.lines.forEach((line,index)=>{
      const row=node("div","ws-math-row");
      const number=node("span","ws-line-no",String(index+1).padStart(2,"0"));
      let field;
      if(isMathLiveReady()){
        field=node("math-field","ws-math-field");
        field.setAttribute("virtual-keyboard-mode","auto");
        field.setAttribute("smart-fence","");
        field.setAttribute("aria-label","Mathematical working line "+(index+1));
        field.value=line.latex;
      }else{
        field=node("input","ws-math-fallback");
        field.type="text";
        field.setAttribute("aria-label","LaTeX working line "+(index+1));
        field.placeholder="e.g. c^2 = 3^2 + 4^2";
        field.value=line.latex;
      }
      field.dataset.lineId=line.id;
      field.addEventListener("input",event=>{
        setLine(work,line.id,event.target.value);
        commit();
      });
      field.addEventListener("focus",()=>{focusedId=line.id;});
      field.addEventListener("keydown",event=>{
        if(event.key==="Enter"&&!event.shiftKey&&!event.isComposing){
          event.preventDefault();event.stopPropagation();
          const id=appendLine(work,line.id);
          if(id){commit();renderMath(id);}
        }
      });
      const insert=actionButton("+","Insert a mathematical line after this step",()=>{
        const id=appendLine(work,line.id);if(id){commit();renderMath(id);}
      },"ws-line-icon");
      const remove=actionButton("×","Remove working line "+(index+1),()=>{
        removeLine(work,line.id);commit();renderMath();
      },"ws-line-icon ws-remove");
      row.append(number,field,insert,remove);list.append(row);
    });
    add.disabled=work.lines.length>=MAX_MATH_LINES;
    if(focusId){
      const target=[...list.querySelectorAll("[data-line-id]")].find(el=>el.dataset.lineId===focusId);
      target?.focus?.();
    }
  }
  const keys=node("div","ws-math-keys");
  [
    ["a²","^{2}"],["√","\\sqrt{#0}"],["a/b","\\frac{#0}{#?}"],["=","="],["×","\\times"],["( )","\\left(#0\\right)"]
  ].forEach(([label,value])=>{
    const key=actionButton(label,"Insert "+label,()=>{
      const line=work.lines.find(l=>l.id===focusedId)||work.lines.at(-1);
      const field=[...list.querySelectorAll("[data-line-id]")].find(el=>el.dataset.lineId===line.id);
      if(field?.insert){
        field.insert(value);
        setLine(work,line.id,field.value);commit();field.focus();
      }else if(field){
        const start=Number.isFinite(field.selectionStart)?field.selectionStart:field.value.length;
        const end=Number.isFinite(field.selectionEnd)?field.selectionEnd:start;
        field.value=field.value.slice(0,start)+value.replaceAll("#0","").replaceAll("#?","")+
          field.value.slice(end);
        setLine(work,line.id,field.value);commit();field.focus();
      }
    },"ws-key");
    keys.append(key);
  });
  container.insertBefore(keys,list);
  const tip=node("p","ws-help",isMathLiveReady()?
    "Use the maths keyboard or the quick symbols above. Your steps are saved automatically.":
    "Maths typesetting is unavailable right now; enter LaTeX here. Saved work will typeset when MathLive loads.");
  container.append(tip);
  renderMath();
  return ()=>{};
}
export function mountWorkingSpace(container, initial, onChange) {
  const work=sanitizeWorking(initial);
  const inkUndo=[]; // persists when switching between Maths and Draw tabs
  let cleanup=()=>{},destroyed=false;
  const root=node("section","ws-root");
  root.setAttribute("aria-label","Your mathematical working");
  const head=node("div","ws-header");
  const titleGroup=node("div","ws-title-group");
  const title=node("strong","ws-title","YOUR WORKING");
  const status=node("span","ws-save-status","Saved on this device");
  titleGroup.append(title,status);
  const tabs=node("div","ws-tabs");
  const math=actionButton("∑ Maths","Type mathematics line by line",()=>switchTab("math"),"ws-tab");
  const ink=actionButton("✎ Draw","Draw freehand with a pen or finger",()=>switchTab("ink"),"ws-tab");
  tabs.append(math,ink);head.append(titleGroup,tabs);
  const body=node("div","ws-body");
  root.append(head,body);container.append(root);
  const commit=()=>{
    const result=onChange(sanitizeWorking(work));
    status.textContent=result===false?"Not saved — browser storage full":"Saved on this device";
    status.dataset.state=result===false?"error":"saved";
    return result;
  };
  function switchTab(tab) {
    cleanup();
    work.tab=tab;commit();
    // The ink pad has a fixed usable canvas height, so its parchment
    // container must grow with that canvas rather than being stretched
    // into the editor's remaining flex space. The inspector itself
    // scrolls if there is not enough vertical room.
    container.classList.toggle("ws-drawing-host",tab==="ink");
    root.classList.toggle("ws-drawing",tab==="ink");
    math.classList.toggle("active",tab==="math");
    ink.classList.toggle("active",tab==="ink");
    math.setAttribute("aria-pressed",String(tab==="math"));
    ink.setAttribute("aria-pressed",String(tab==="ink"));
    body.replaceChildren();
    cleanup=tab==="math"?buildMath(body,work,commit):buildInk(body,work,commit,inkUndo);
  }
  switchTab(work.tab);
  // If a slow CDN loads MathLive after a fallback field was created,
  // upgrade the maths view without throwing away any typed lines.
  if(typeof customElements!=="undefined" && !isMathLiveReady() &&
     typeof customElements.whenDefined==="function"){
    customElements.whenDefined("math-field").then(()=>{
      if(!destroyed && work.tab==="math" && isMathLiveReady()){
        cleanup();
        body.replaceChildren();
        cleanup=buildMath(body,work,commit);
      }
    }).catch(()=>{});
  }
  return ()=>{destroyed=true;cleanup();};
}
