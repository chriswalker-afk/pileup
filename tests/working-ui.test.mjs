import test from "node:test";
import assert from "node:assert/strict";
import { mountWorkingSpace } from "../working-space.js";

test("student switches between editable mathematical lines and a persistent ink drawing",()=>{
  const previous={document:globalThis.document,window:globalThis.window,
    requestAnimationFrame:globalThis.requestAnimationFrame};
  class Element {
    constructor(tag){
      this.tag=tag;this.children=[];this.dataset={};this.handlers={};
      this.attrs={};this.textContent="";this.value="";this.className="";
      this.style={};this.disabled=false;this.width=0;this.height=0;
      this.classList={
        contains:name=>this.className.split(/\s+/).includes(name),
        toggle:(name,enabled)=>{
          const values=new Set(this.className.split(/\s+/).filter(Boolean));
          const next=enabled??!values.has(name);
          if(next)values.add(name);else values.delete(name);
          this.className=[...values].join(" ");
          return next;
        }
      };
    }
    append(...elements){this.children.push(...elements);}
    replaceChildren(...elements){this.children=[...elements];}
    insertBefore(child,before){
      const index=this.children.indexOf(before);
      if(index>=0)this.children.splice(index,0,child);
      else this.children.push(child);
    }
    setAttribute(key,value){this.attrs[key]=value;}
    addEventListener(type,handler){this.handlers[type]=handler;}
    getBoundingClientRect(){return {x:0,y:0,left:0,top:0,width:300,height:200};}
    setPointerCapture(){}
    getContext(){return {setTransform(){},clearRect(){},beginPath(){},
      moveTo(){},lineTo(){},stroke(){},arc(){},fill(){}};}
    querySelectorAll(selector){
      const output=[],target=selector.replace(/^[.#]/,"");
      const walk=element=>{
        for(const child of element.children){
          if(selector==="[data-line-id]" && child.dataset.lineId)output.push(child);
          else if(selector.startsWith(".")&&String(child.className).split(" ").includes(target))output.push(child);
          walk(child);
        }
      };
      walk(this);return output;
    }
    focus(){}
  }
  const find=(root,klass)=>root.querySelectorAll("."+klass)[0];
  const host=new Element("div"),updates=[];
  globalThis.document={createElement:tag=>new Element(tag)};
  globalThis.window={devicePixelRatio:2,confirm:()=>true};
  globalThis.requestAnimationFrame=fn=>{fn();return 1;};
  try{
    const stop=mountWorkingSpace(host,null,value=>updates.push(structuredClone(value)));
    assert.equal(updates.at(-1).tab,"math");
    assert.equal(find(host,"ws-math-fallback").tag,"input");
    const first=find(host,"ws-math-fallback");
    first.value="c^2=5^2+12^2";
    first.handlers.input({target:first});
    assert.equal(updates.at(-1).lines[0].latex,"c^2=5^2+12^2");
    find(host,"ws-add-line").handlers.click();
    assert.equal(updates.at(-1).lines.length,2);
    const parchment=find(host,"ws-root");
    const draw=[...host.querySelectorAll(".ws-tab")][1];
    draw.handlers.click();
    assert.equal(updates.at(-1).tab,"ink");
    assert.equal(host.classList.contains("ws-drawing-host"),true,
      "Drawing mode must allow the outer mount to grow with the pad");
    assert.equal(parchment.classList.contains("ws-drawing"),true,
      "Drawing mode must let the yellow parchment contain the canvas");
    const paper=find(host,"ws-ink-frame");
    assert.equal(paper.classList.contains("ws-ink-empty"),true,
      "Empty drawing paper has a faint engraved construction");
    const canvas=find(host,"ws-ink-canvas");
    canvas.handlers.pointerdown({button:0,pointerType:"pen",pointerId:1,
      clientX:45,clientY:45,preventDefault(){}});
    assert.equal(paper.classList.contains("ws-ink-empty"),false,
      "Decorative geometry disappears as soon as writing starts");
    canvas.handlers.pointermove({pointerId:1,clientX:120,clientY:120,preventDefault(){}});
    canvas.handlers.pointerup({pointerId:1});
    assert.equal(updates.at(-1).strokes.length,1);
    assert.equal(paper.classList.contains("ws-ink-empty"),false,
      "Watermark must not obstruct saved handwriting");
    const points=updates.at(-1).strokes[0].points;
    assert.ok(points.length>=2);
    // Enlarge the drawing pad without altering the stroke coordinates.
    const resize=find(host,"ws-resize-pad");
    resize.handlers.click();
    assert.equal(updates.at(-1).padHeight,"large");
    assert.deepEqual(updates.at(-1).strokes[0].points,points);
    const math=[...host.querySelectorAll(".ws-tab")][0];
    math.handlers.click();
    assert.equal(host.classList.contains("ws-drawing-host"),false,
      "Switching to maths restores the flexible line editor");
    assert.equal(parchment.classList.contains("ws-drawing"),false);
    assert.equal(updates.at(-1).lines.length,2);
    assert.equal(updates.at(-1).lines[0].latex,"c^2=5^2+12^2");
    draw.handlers.click();
    assert.equal(parchment.classList.contains("ws-drawing"),true,
      "Returning to drawing must restore content-sized parchment");
    assert.equal(updates.at(-1).padHeight,"large");
    assert.equal(updates.at(-1).strokes.length,1);
    // Undo must survive switching between drawing and maths tabs.
    find(host,"ws-ink-tools").querySelectorAll(".ws-action")[2].handlers.click();
    assert.equal(updates.at(-1).strokes.length,0);
    assert.equal(find(host,"ws-ink-frame").classList.contains("ws-ink-empty"),true,
      "Undoing the last stroke restores the gentle watermark");
    const canvasAgain=find(host,"ws-ink-canvas");
    canvasAgain.handlers.pointerdown({button:0,pointerType:"pen",pointerId:2,
      clientX:60,clientY:60,preventDefault(){}});
    canvasAgain.handlers.pointermove({pointerId:2,clientX:110,clientY:130,
      preventDefault(){},getCoalescedEvents:()=>[]});
    canvasAgain.handlers.pointercancel({pointerId:2,type:"pointercancel"});
    // Cancelled pen gestures leave no accidental strokes.
    assert.equal(updates.at(-1).strokes.length,0);
    stop();
  }finally{
    for(const [name,value] of Object.entries(previous)){
      if(value===undefined)delete globalThis[name];
      else globalThis[name]=value;
    }
  }
});
