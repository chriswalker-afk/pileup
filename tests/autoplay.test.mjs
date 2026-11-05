import test from "node:test";
import assert from "node:assert/strict";

/**
 * Reproduces the reported defect: when the device requests reduced
 * motion, first opening a puzzle was static but Replay Fall animated.
 * Students may now explicitly enable site autoplay and keep that
 * choice across challenges and reloads.
 */
function harness(reduce, saved={}) {
  const keys=["document","window","location","history","localStorage",
    "matchMedia","requestAnimationFrame","cancelAnimationFrame",
    "setTimeout","clearTimeout"];
  const previous=Object.fromEntries(keys.map(key=>[key,globalThis[key]]));
  const elements=new Map(),routes=new Map(),frames=new Map(),timers=new Map();
  const storage=new Map(Object.entries(saved));
  let id=0;
  class FakeNode {
    constructor(tag){
      this.tag=tag;this.attrs={};this.children=[];this.handlers={};
      this._classes=new Set();this.dataset={};this.style={};
      this.firstChild=null;this.hidden=false;this.disabled=false;this.open=false;
      this.innerHTML="";this.textContent="";this.value="";this.className="";
      this.classList={
        add:(...names)=>names.forEach(name=>this._classes.add(name)),
        remove:(...names)=>names.forEach(name=>this._classes.delete(name)),
        contains:name=>this._classes.has(name),
        toggle:(name,enabled)=>enabled?this._classes.add(name):this._classes.delete(name)
      };
    }
    setAttribute(key,value){
      this.attrs[key]=value;
      if(key==="class")this._classes=new Set(String(value).split(" "));
      if(key==="data-id")this.dataset.id=value;
    }
    removeAttribute(key){delete this.attrs[key];}
    append(...children){this.children.push(...children);this.firstChild=this.children[0]??null;}
    insertBefore(child,before){
      const i=this.children.indexOf(before);
      this.children.splice(i<0?this.children.length:i,0,child);
      this.firstChild=this.children[0]??null;
    }
    replaceChildren(...children){this.children=[...children];this.firstChild=this.children[0]??null;}
    addEventListener(type,handler){this.handlers[type]=handler;}
    querySelectorAll(selector){
      const found=[];
      const visit=node=>{
        for(const child of node.children){
          if(selector.startsWith(".")&&child._classes.has(selector.slice(1)))found.push(child);
          else if(selector==="[data-line-id]"&&child.dataset.lineId)found.push(child);
          visit(child);
        }
      };
      visit(this);return found;
    }
    querySelector(selector){return this.querySelectorAll(selector)[0]??new FakeNode(selector);}
    getBoundingClientRect(){return {width:780,height:490,left:0,top:0};}
    focus(){}
    animate(frames,options){
      const animation={frames,options,cancel(){this.cancelled=true;}};
      this.lastAnimation=animation;return animation;
    }
    getContext(){return {setTransform(){},clearRect(){},beginPath(){},
      moveTo(){},lineTo(){},stroke(){},arc(){},fill(){}};}
    showModal(){this.open=true;}
    close(){this.open=false;}
  }
  const document={
    body:{dataset:{}},
    getElementById(key){
      if(!elements.has(key))elements.set(key,new FakeNode(key));
      return elements.get(key);
    },
    createElementNS(_ns,tag){return new FakeNode(tag);},
    createElement(tag){return new FakeNode(tag);},
    querySelector(selector){
      if(selector==="#diagram svg")return elements.get("diagram")?.firstChild??null;
      if(selector===".side-labels")return elements.get("diagram")?.firstChild?.querySelector(".side-labels")??null;
      return new FakeNode(selector);
    },
    querySelectorAll(){return [];}
  };
  const location={hash:"#first-fall"};
  const window={
    addEventListener:(name,handler)=>routes.set(name,handler),
    scrollTo(){},confirm:()=>true,
    matchMedia:()=>({matches:reduce})
  };
  Object.assign(globalThis,{
    document,window,location,
    history:{pushState(_state,_title,hash){location.hash=hash;}},
    localStorage:{
      getItem:key=>storage.get(key)??null,
      setItem:(key,value)=>storage.set(key,String(value))
    },
    matchMedia:()=>({matches:reduce}),
    requestAnimationFrame:handler=>{const key=++id;frames.set(key,handler);return key;},
    cancelAnimationFrame:key=>frames.delete(key),
    setTimeout:handler=>{const key=++id;timers.set(key,handler);return key;},
    clearTimeout:key=>timers.delete(key)
  });
  const svg=()=>elements.get("diagram")?.firstChild;
  const go=id=>{location.hash="#"+id;routes.get("hashchange")();};
  const flushFrames=()=>{
    // Paint-frame callbacks may enqueue another frame for the working
    // editor; execute each callback at most once per scheduled frame.
    let count=0;
    while(frames.size){
      const scheduled=[...frames.entries()];
      frames.clear();
      scheduled.forEach(([,fn])=>fn());
      if(++count>10)throw Error("requestAnimationFrame loop did not settle");
    }
  };
  const restore=()=>{
    for(const [key,value] of Object.entries(previous)){
      if(value===undefined)delete globalThis[key];
      else globalThis[key]=value;
    }
  };
  return {elements,storage,frames,timers,routes,document,location,svg,go,flushFrames,restore};
}

test("Reduced-motion browser explains why the first fall was static, and gives a persistent fix",async()=>{
  const app=harness(true);
  try{
    await import("../app.js?autoplay-reduced-regression");
    const auto=app.document.getElementById("autoplay-toggle");
    const replay=app.document.getElementById("replay");
    const skip=app.document.getElementById("skip");
    assert.equal(auto.attrs["aria-pressed"],"false");
    assert.match(auto.attrs["aria-label"],/device requests reduced motion/);
    assert.equal(replay.disabled,false);
    assert.equal(skip.hidden,true);
    assert.equal(app.frames.size,0);
    assert.ok(!app.svg().classList.contains("ready-to-fall"));

    // Explicit ON enables the animation immediately, not just on the
    // *next* puzzle, and saves the decision for subsequent openings.
    auto.handlers.click();
    assert.equal(app.storage.get("pileup-auto-fall"),"on");
    assert.equal(auto.attrs["aria-pressed"],"true");
    assert.equal(app.svg().classList.contains("ready-to-fall"),true);
    assert.equal(app.svg().classList.contains("manual-motion"),true);
    assert.equal(app.document.getElementById("skip").hidden,false);
    assert.equal(app.timers.size,0,
      "The completion timer must not start until the first animation frame");
    app.flushFrames();
    assert.equal(app.timers.size,1);
    const pieces=app.svg().querySelectorAll(".piece");
    assert.ok(pieces.length>=3);
    assert.ok(pieces.every(piece=>piece.lastAnimation),"Every piece must fall");
    skip.handlers.click();
    assert.equal(app.svg().querySelector(".side-labels").classList.contains("waiting"),false);

    app.go("twin-paths");
    assert.equal(app.svg().classList.contains("ready-to-fall"),true,
      "Auto ON should animate the next puzzle despite device reduced-motion");
    assert.equal(app.svg().classList.contains("manual-motion"),true);
    app.flushFrames();
    assert.ok(app.svg().querySelectorAll(".piece").every(piece=>piece.lastAnimation));
    app.document.getElementById("skip").handlers.click();

    // Turning auto OFF disables future automatic falls without
    // disabling the student's explicit Replay Fall control.
    app.document.getElementById("autoplay-toggle").handlers.click();
    assert.equal(app.storage.get("pileup-auto-fall"),"off");
    app.go("marble-terrace");
    assert.equal(app.svg().classList.contains("ready-to-fall"),false);
    assert.equal(app.document.getElementById("skip").hidden,true);
    app.document.getElementById("replay").handlers.click();
    assert.equal(app.svg().classList.contains("ready-to-fall"),true);
    assert.equal(app.svg().classList.contains("manual-motion"),true);
    app.flushFrames();
    assert.ok(app.svg().querySelectorAll(".piece").every(piece=>piece.lastAnimation));
  }finally{app.restore();}
});

test("Autoplay starts on the first opening with ordinary motion settings",async()=>{
  const app=harness(false);
  try{
    await import("../app.js?autoplay-normal-regression");
    assert.equal(app.document.getElementById("autoplay-toggle").attrs["aria-pressed"],"true");
    assert.equal(app.svg().classList.contains("ready-to-fall"),true,
      "A brand-new puzzle should begin in its falling state");
    assert.equal(app.document.getElementById("skip").hidden,false);
    assert.equal(app.timers.size,0,
      "Hidden/background tab must not silently complete before the first frame");
    app.flushFrames();
    assert.equal(app.timers.size,1);
    assert.ok(app.svg().querySelectorAll(".piece").every(piece=>piece.lastAnimation));
    app.document.getElementById("skip").handlers.click();
    assert.equal(app.svg().querySelector(".side-labels").classList.contains("waiting"),false);
    app.go("acropolis");
    assert.equal(app.svg().classList.contains("ready-to-fall"),true);
    app.flushFrames();
    assert.equal(app.svg().querySelectorAll(".piece").length,12);
    assert.ok(app.svg().querySelectorAll(".piece").every(piece=>piece.lastAnimation));
  }finally{app.restore();}
});

test("Autoplay ON persists across a fresh page load, including with reduced-motion devices",async()=>{
  const app=harness(true,{"pileup-auto-fall":"on"});
  try{
    await import("../app.js?autoplay-persisted-regression");
    assert.equal(app.document.getElementById("autoplay-toggle").attrs["aria-pressed"],"true");
    assert.equal(app.svg().classList.contains("ready-to-fall"),true);
    assert.equal(app.svg().classList.contains("manual-motion"),true);
    app.flushFrames();
    assert.ok(app.svg().querySelectorAll(".piece").every(piece=>piece.lastAnimation));
  }finally{app.restore();}
});
