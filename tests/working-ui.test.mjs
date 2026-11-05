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
      this.classList={toggle:()=>{}};
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
    const draw=[...host.querySelectorAll(".ws-tab")][1];
    draw.handlers.click();
    assert.equal(updates.at(-1).tab,"ink");
    const canvas=find(host,"ws-ink-canvas");
    canvas.handlers.pointerdown({button:0,pointerType:"pen",pointerId:1,
      clientX:45,clientY:45,preventDefault(){}});
    canvas.handlers.pointermove({pointerId:1,clientX:120,clientY:120,preventDefault(){}});
    canvas.handlers.pointerup({pointerId:1});
    assert.equal(updates.at(-1).strokes.length,1);
    const points=updates.at(-1).strokes[0].points;
    assert.ok(points.length>=2);
    const math=[...host.querySelectorAll(".ws-tab")][0];
    math.handlers.click();
    assert.equal(updates.at(-1).lines.length,2);
    assert.equal(updates.at(-1).lines[0].latex,"c^2=5^2+12^2");
    stop();
  }finally{
    for(const [name,value] of Object.entries(previous)){
      if(value===undefined)delete globalThis[name];
      else globalThis[name]=value;
    }
  }
});
