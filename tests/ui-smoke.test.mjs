import test from "node:test";
import assert from "node:assert/strict";
import { puzzles } from "../pile-geometry.js";

/**
 * Dependency-free DOM harness for the static SVG application.
 * It does not claim pixel-perfect browser rendering; it verifies
 * that every authored pile mounts, receives a falling animation and
 * lays out its labels without collisions at common viewport widths.
 */
class FakeNode {
  constructor(tag, width) {
    this.tag = tag; this.width = width;
    this.children = []; this.attrs = {}; this.style = {};
    this.dataset = {}; this.handlers = {};
    this._classes = new Set();
    this.innerHTML = ""; this.textContent = ""; this.hidden = false;
    this.disabled = false; this.open = false; this.firstChild = null;
    this.className="";this.value="";
    this.classList = {
      add: (...classes) => classes.forEach(x=>this._classes.add(x)),
      remove: (...classes) => classes.forEach(x=>this._classes.delete(x)),
      contains: name=>this._classes.has(name),
      toggle: (name,enabled)=>enabled?this._classes.add(name):this._classes.delete(name)
    };
  }
  setAttribute(key,value){
    this.attrs[key] = value;
    if(key==="class")this._classes = new Set(String(value).split(" "));
    if(key==="data-id")this.dataset.id=value;
  }
  removeAttribute(key){delete this.attrs[key];}
  append(...children){
    this.children.push(...children);
    this.firstChild = this.children[0] ?? null;
  }
  insertBefore(child,before){
    const index=this.children.indexOf(before);
    this.children.splice(index<0?this.children.length:index,0,child);
    this.firstChild=this.children[0]??null;
  }
  replaceChildren(...children){
    this.children = [...children];
    this.firstChild = this.children[0] ?? null;
  }
  addEventListener(type,callback){this.handlers[type]=callback;}
  querySelectorAll(selector){
    const output=[];
    const scan=node=>{
      for(const child of node.children){
        if(selector.startsWith(".") && child._classes.has(selector.slice(1)))output.push(child);
        scan(child);
      }
    };
    scan(this);return output;
  }
  querySelector(selector){return this.querySelectorAll(selector)[0] ?? new FakeNode(selector,this.width);}
  getBoundingClientRect(){return {width:this.width,height:490};}
  focus(){}
  getContext(){return {setTransform(){},clearRect(){},beginPath(){},
    moveTo(){},lineTo(){},stroke(){},arc(){},fill(){}};}
  focus(){}
  animate(frames,options){
    const animation={frames,options,cancel(){}};
    this.lastAnimation=animation;
    return animation;
  }
  showModal(){this.open=true;}
  close(){this.open=false;}
}

test("all nine puzzles mount with bounded labels and falling animations",async()=>{
  const oldGlobals={};
  const names=["document","window","location","history","localStorage","matchMedia","requestAnimationFrame","cancelAnimationFrame","setTimeout","clearTimeout"];
  for(const name of names)oldGlobals[name]=globalThis[name];
  let width=780;
  const nodes=new Map(),frames=[],routes=new Map(),storage=new Map();
  const document={
    getElementById(id){
      if(!nodes.has(id))nodes.set(id,new FakeNode(id,width));
      const node=nodes.get(id);
      node.width=width;
      return node;
    },
    createElementNS(_ns,tag){return new FakeNode(tag,width);},
    createElement(tag){return new FakeNode(tag,width);},
    querySelector(selector){
      if(selector==="#diagram svg")return nodes.get("diagram")?.firstChild ?? null;
      if(selector===".side-labels")return nodes.get("diagram")?.firstChild?.querySelector(".side-labels") ?? null;
      return new FakeNode(selector,width);
    },
    querySelectorAll(){return [];}
  };
  const location={hash:"#first-fall"};
  const window={
    addEventListener:(event,fn)=>routes.set(event,fn),
    scrollTo(){},confirm:()=>true
  };
  const history={pushState:(_state,_title,hash)=>{location.hash=hash;}};
  const localStorage={
    getItem:key=>storage.get(key)??null,
    setItem:(key,value)=>storage.set(key,value)
  };
  Object.assign(globalThis,{
    document,window,location,history,localStorage,
    matchMedia:()=>({matches:false}),
    requestAnimationFrame:fn=>{frames.push(fn);return frames.length;},
    cancelAnimationFrame:()=>{},
    setTimeout:()=>1,clearTimeout:()=>{}
  });
  try{
    // The imported app registers its route handlers and opens #first-fall.
    await import("../app.js");
    const show=routes.get("hashchange");
    assert.equal(typeof show,"function");
    let cases=0;
    for(const puzzle of puzzles){
      for(const measuredWidth of [780,440,340,300]){
        width=measuredWidth;
        location.hash="#"+puzzle.id;
        show();
        const svg=nodes.get("diagram")?.firstChild;
        assert.ok(svg,"No SVG mounted for "+puzzle.id);
        const pieces=svg.querySelectorAll(".piece");
        assert.equal(pieces.length,puzzle.triangles.length+(puzzle.rectangles?.length||0));
        assert.equal(svg.querySelectorAll(".rectangle-piece").length,puzzle.rectangles?.length||0);
        assert.equal(svg.querySelectorAll(".rectangle-diagonal").length,(puzzle.rectangles||[]).reduce((n,r)=>n+(r.diagonals?.length||0),0));
        const measurements=svg.querySelector(".side-labels");
        assert.ok(measurements,"Every puzzle needs a measurements layer");
        assert.ok(measurements.classList.contains("waiting"),
          "Measurements must be hidden while pieces are still falling");
        const ticks=svg.querySelectorAll(".equal-side-tick");
        const ticksInMeasurementLayer=measurements.querySelectorAll(".equal-side-tick");
        assert.equal(ticksInMeasurementLayer.length,ticks.length,
          "Equal-length marks must be in the delayed measurements layer");
        if(puzzle.equalSideGroups?.length){
          assert.ok(ticks.length>0,"Marked-equal sides must have tick marks");
        }
        const chips=svg.querySelectorAll(".side-chip");
        const rects=chips.map(group=>group.children.find(child=>child.tag==="rect")).filter(Boolean)
          .map(rect=>({
            x:Number(rect.attrs.x), y:Number(rect.attrs.y),
            w:Number(rect.attrs.width), h:Number(rect.attrs.height)
          }));
        for(const r of rects){
          assert.ok(r.x>=0 && r.y>=0 && r.x+r.w<=960 && r.y+r.h<=590,
            "Dimension outside the SVG on "+puzzle.id+" at "+width+" px");
        }
        for(let i=0;i<rects.length;i++)for(let j=i+1;j<rects.length;j++){
          const a=rects[i],b=rects[j];
          const overlaps=Math.max(a.x,b.x)<Math.min(a.x+a.w,b.x+b.w)
            && Math.max(a.y,b.y)<Math.min(a.y+a.h,b.y+b.h);
          assert.equal(overlaps,false,"Clashing labels on "+puzzle.id+" at "+width+" px");
        }
        // Execute queued animation frames. Old callbacks are safely
        // ignored by the application's own stale-render guard.
        while(frames.length)frames.shift()();
        for(const piece of pieces){
          assert.ok(piece.lastAnimation,"Missing falling animation for "+puzzle.id);
          assert.equal(piece.lastAnimation.options.fill,"both");
        }
        assert.ok(measurements.classList.contains("waiting"),
          "Equal-length marks must remain hidden while pieces are animating");
        if(puzzle.id==="twin-paths"){
          assert.equal(ticks.length,4,
            "Two matching edges should have two tick marks each.");
          // Replay must hide marks again until the second fall ends.
          document.getElementById("skip").handlers.click();
          assert.equal(measurements.classList.contains("waiting"),false,
            "Tick marks should reveal when the animation ends");
          document.getElementById("replay").handlers.click();
          const replaySvg=nodes.get("diagram").firstChild;
          const replayMeasurements=replaySvg.querySelector(".side-labels");
          assert.ok(replayMeasurements.classList.contains("waiting"),
            "Replay Fall should hide the matching marks until landing");
          assert.equal(replayMeasurements.querySelectorAll(".equal-side-tick").length,4);
          assert.equal(replaySvg.querySelectorAll(".equal-side-tick").length,4,
            "Replay must not duplicate the marks");
          document.getElementById("skip").handlers.click();
          assert.equal(replayMeasurements.classList.contains("waiting"),false,
            "Skip should reveal the marks immediately");
          document.getElementById("labels-toggle").handlers.click({currentTarget:{
            setAttribute(){}}});
          assert.ok(replayMeasurements.classList.contains("hidden-labels"),
            "Hiding measurements must also hide equality marks");
          document.getElementById("labels-toggle").handlers.click({currentTarget:{
            setAttribute(){}}});
          assert.equal(replayMeasurements.classList.contains("hidden-labels"),false,
            "Showing measurements must restore equality marks");
        }else{
          document.getElementById("skip").handlers.click();
          assert.equal(measurements.classList.contains("waiting"),false,
            "Measurements reveal once the animation is skipped");
        }
        const inspector=nodes.get("inspector")?.innerHTML||"";
        assert.match(inspector,/id="working-pad-mount"/,
          "Students should have a scratchpad immediately, before selecting a side");
        const page=nodes.get("app")?.innerHTML||"";
        assert.ok(!page.includes("Study which sides line up."),
          "Remove unneeded explanatory flavour copy from the workspace");
        assert.ok(!page.includes('Find the final <em>length.</em>'),
          "Remove the repeated final-length headline");
        assert.ok(!page.includes('class="facts"'),
          "Triangle and given counts should not crowd the working panel");
        cases++;
      }
    }
    assert.equal(cases,36);
    // The desktop home screen should put all nine challenges beside
    // the introduction rather than below a full-page hero.
    location.hash="#home";show();
    const home=nodes.get("app")?.innerHTML||"";
    assert.match(home,/class="home-compact"/);
    assert.match(home,/class="home-puzzle-grid"/);
    assert.equal((home.match(/class="challenge-card home-challenge-card"/g)||[]).length,9);
    assert.ok(!home.includes("Three steps to discovery"));
    // Navigation must be meaningful and non-duplicative now that
    // introduction and challenge catalogue share one dashboard.
    const assertSingleNavigation=html=>{
      const nav=html.match(/<nav[^>]*>([\s\S]*?)<\/nav>/);
      assert.ok(nav,"Page must have a labelled navigation region");
      assert.match(nav[0],/aria-label="Main navigation"/);
      assert.equal((nav[1].match(/<a /g)||[]).length,1,
        "Only one main navigation link should be present");
      assert.match(nav[1],/href="#puzzles">THE CHALLENGES<\/a>/);
      assert.ok(!html.includes("THE AGORA"),
        "The old Agora link duplicated the challenges destination");
      assert.match(html,/class="brand" href="#home"/,
        "The site brand remains the way back to the introduction");
    };
    assertSingleNavigation(home);
    assert.match(home,/id="home" class="home-compact"/);
    assert.match(home,/9 CHALLENGES/);
    assert.ok(!home.includes("The six trials"));
    // Visuals use genuine authored puzzle geometry, not one repeated
    // ornamental icon or placeholder reused on every challenge card.
    assert.equal((home.match(/<svg class="mini-pile"/g)||[]).length,puzzles.length);
    assert.equal((home.match(/class="mini-shape"/g)||[]).length,
      puzzles.reduce((total,p)=>total+p.triangles.length+(p.rectangles?.length||0),0));
    assert.equal((home.match(/class="mini-rectangle-diagonal"/g)||[]).length,
      puzzles.reduce((total,p)=>total+(p.rectangles||[]).reduce((s,r)=>s+(r.diagonals?.length||0),0),0));
    assert.match(home,/<svg class="hero-fall-svg"[^>]*aria-hidden="true"/);
    assert.equal((home.match(/class="hero-falling-piece"/g)||[]).length,3,
      "Hero artwork should be assembled from the three real First Fall triangles");
    assert.equal((home.match(/class="hero-right-angle"/g)||[]).length,3);
    assert.match(home,/class="hero-goal"/);
    assert.ok(!home.includes("home-art-symbol"),
      "Replace the old placeholder triangle with the geometric tableau");
    assert.equal((home.match(/class="difficulty-emblem difficulty-/g)||[]).length,9,
      "Every challenge should carry a small engraved difficulty seal");
    assert.match(home,/difficulty-triangle/);
    assert.match(home,/difficulty-double/);
    assert.match(home,/difficulty-column/);
    assert.match(home,/difficulty-laurel/);
    assert.match(home,/difficulty-temple/);

    location.hash="#puzzles";show();
    const catalogue=nodes.get("app")?.innerHTML||"";
    assertSingleNavigation(catalogue);
    assert.equal((catalogue.match(/class="challenge-card home-challenge-card"/g)||[]).length,9,
      "Challenges link should expose every puzzle");

    location.hash="#first-fall";show();
    const puzzlePage=nodes.get("app")?.innerHTML||"";
    assertSingleNavigation(puzzlePage);
    assert.match(puzzlePage,/← ALL CHALLENGES/,
      "Individual puzzles retain their dedicated back-to-catalogue link");
    assert.match(puzzlePage,/class="tablet-seal" aria-hidden="true"/);
    assert.match(puzzlePage,/class="tablet-engraving" aria-hidden="true"/);
    assert.equal((puzzlePage.match(/class="tablet-engraving-corner /g)||[]).length,4);
    assert.match(puzzlePage,/class="chapter"><svg class="difficulty-emblem/);
    assert.match(puzzlePage,/id="diagram"/);
    assert.match(puzzlePage,/id="workspace-size-toggle"/,
      "The wider working panel button must remain available");
    // A completed length is announced by a dedicated, stable live
    // region; avoid making the whole mathematical editor announce again.
    assert.match(puzzlePage,/id="progress-announcement" class="screenreader-only" role="status" aria-live="polite" aria-atomic="true"/);
    assert.doesNotMatch(puzzlePage,/id="inspector" aria-live=/);
    // Completion artwork is decorative; the actual mathematical answer,
    // review, extensions and next challenge actions remain operable.
    assert.match(puzzlePage,/class="completion-crest"/);
    assert.match(puzzlePage,/class="completion-laurel"/);
    assert.match(puzzlePage,/class="completion-laurel-leaves"/);
    assert.match(puzzlePage,/class="completion-laurel-seal"/);
    assert.match(puzzlePage,/aria-hidden="true"/);
    assert.match(puzzlePage,/aria-describedby="completion-subtitle"/);
    for(const id of ["final-answer","completion-hints","completion-review",
      "completion-extra","completion-other","completion-close"]){
      assert.ok(puzzlePage.includes('id="'+id+'"'),"Missing completion action "+id);
    }
  }finally{
    for(const name of names){
      if(oldGlobals[name]===undefined)delete globalThis[name];
      else globalThis[name]=oldGlobals[name];
    }
  }
});
