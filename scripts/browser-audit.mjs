import { chromium } from "playwright-core";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";

const base=process.env.AUDIT_URL||"http://127.0.0.1:4173";
const directory="audit-artifacts";
mkdirSync(directory,{recursive:true});
const puzzles=["first-fall","projecting-edge","twin-paths","split-project",
  "labyrinth","great-pile","nine-muses","marble-terrace","acropolis"];
const screens=[["desktop",1366,768],["short-laptop",1024,640],
  ["tablet",768,1024],["phone",390,844],["small-phone",320,568]];
const reports=[],errors=[];
const chrome=[process.env.CHROME_PATH,"/usr/bin/google-chrome",
  "/usr/bin/google-chrome-stable","/usr/bin/chromium"].find(x=>x&&existsSync(x));
if(!chrome)throw new Error("Chromium or Google Chrome is unavailable");
const browser=await chromium.launch({
  executablePath:chrome,headless:true,args:["--no-sandbox","--disable-dev-shm-usage"]
});
function insist(ok,message,data){
  if(!ok)throw Error(message+(data?" "+JSON.stringify(data):""));
}
async function run(name,fn){
  const t=Date.now();
  try{
    const data=await fn();
    reports.push({name,status:"PASS",ms:Date.now()-t,data});
    console.log("PASS "+name);
  }catch(error){
    const issue={name,status:"FAIL",message:String(error?.message||error)};
    reports.push(issue);errors.push(issue);
    console.error("FAIL "+name+": "+issue.message);
  }
}
async function newPage(width,height,reduce=true){
  const context=await browser.newContext({
    viewport:{width,height},deviceScaleFactor:1,
    isMobile:width<600,hasTouch:width<600,
    reducedMotion:reduce?"reduce":"no-preference"
  });
  const page=await context.newPage();
  page.setDefaultTimeout(8500);
  // Exercise the offline / slow CDN fallback deterministically.
  await page.route(url=>url.toString().startsWith("https://"),r=>r.abort());
  page.on("pageerror",error=>{
    const item={name:"Uncaught browser error",status:"FAIL",
      message:String(error.message),width,height};
    reports.push(item);errors.push(item);
    console.error("FAIL browser error: "+item.message);
  });
  return {context,page};
}
async function open(page,id){
  await page.goto(base+"/#"+id,{waitUntil:"domcontentloaded",timeout:20000});
  await page.waitForSelector("#diagram svg .piece",{timeout:9000});
}
async function snap(page,name){
  await page.screenshot({path:directory+"/"+name+".png",fullPage:true,
    animations:"disabled",timeout:12000});
}
async function sizeAudit(page){
  return page.evaluate(()=>{
    const b=e=>{
      const r=e.getBoundingClientRect();
      return {left:r.left,top:r.top,right:r.right,bottom:r.bottom,
        width:r.width,height:r.height};
    };
    const svg=document.querySelector("#diagram svg");
    const box=b(svg);
    const label=[...svg.querySelectorAll(".side-chip rect")].map(b);
    const shape=[...svg.querySelectorAll(".piece polygon")].map(b);
    const outside=arr=>arr.reduce((out,r,i)=>{
      if(r.left<box.left-1.5||r.right>box.right+1.5||
        r.top<box.top-1.5||r.bottom>box.bottom+1.5)out.push(i);
      return out;
    },[]);
    const toolbar=document.querySelector(".diagram-zoom-controls");
    const zoomRect=toolbar?b(toolbar):null;
    const zoomOverlaps=zoomRect?label.reduce((out,r,i)=>{
      const dx=Math.min(r.right,zoomRect.right)-Math.max(r.left,zoomRect.left);
      const dy=Math.min(r.bottom,zoomRect.bottom)-Math.max(r.top,zoomRect.top);
      if(dx>3&&dy>3)out.push(i);
      return out;
    },[]):[];
    const overlaps=[];
    for(let i=0;i<label.length;i++)for(let j=i+1;j<label.length;j++){
      const dx=Math.min(label[i].right,label[j].right)-
        Math.max(label[i].left,label[j].left);
      const dy=Math.min(label[i].bottom,label[j].bottom)-
        Math.max(label[i].top,label[j].top);
      if(dx>1.5&&dy>1.5)overlaps.push([i,j,Math.round(dx),Math.round(dy)]);
    }
    const measured=[...svg.querySelectorAll(".side-chip")].map(chip=>{
      const key=chip.getAttribute("data-side-key");
      const label=chip.querySelector("rect");
      const line=[...svg.querySelectorAll(".side-trace")].find(el=>
        el.getAttribute("data-side-key")===key)?.querySelector("line");
      if(!line||!label)return null;
      const cx=Number(label.getAttribute("x"))+Number(label.getAttribute("width"))/2;
      const cy=Number(label.getAttribute("y"))+Number(label.getAttribute("height"))/2;
      const mx=(Number(line.getAttribute("x1"))+Number(line.getAttribute("x2")))/2;
      const my=(Number(line.getAttribute("y1"))+Number(line.getAttribute("y2")))/2;
      return Math.hypot(cx-mx,cy-my);
    }).filter(Number.isFinite);
    const bracketErrors=[];
    const brackets=[...svg.querySelectorAll(".dimension-bracket")];
    for(const bracket of brackets){
      const key=bracket.getAttribute("data-side-key");
      const trace=[...svg.querySelectorAll(".side-trace")].find(el=>
        el.getAttribute("data-side-key")===key)?.querySelector("line");
      const spine=bracket.querySelector(".dimension-bracket-spine");
      const caps=bracket.querySelectorAll(".dimension-bracket-cap");
      const len=line=>Math.hypot(
        Number(line.getAttribute("x2"))-Number(line.getAttribute("x1")),
        Number(line.getAttribute("y2"))-Number(line.getAttribute("y1")));
      if(!trace||!spine||caps.length!==2||
        Math.abs(len(spine)-len(trace))>.001)bracketErrors.push(key);
    }
    return {pieces:shape.length,labels:label.length,overlaps,
      clippedLabels:outside(label),clippedPieces:outside(shape),
      widthOverflow:document.documentElement.scrollWidth-innerWidth,
      rectangles:svg.querySelectorAll(".rectangle-piece").length,
      equalTicks:svg.querySelectorAll(".equal-side-tick").length,
      zoomOverlaps,
      bracketCount:brackets.length,bracketErrors,
      longLeaders:svg.querySelectorAll(".dimension-leader").length,
      meanLabelDistance:measured.length?
        Math.round(measured.reduce((n,x)=>n+x,0)/measured.length*10)/10:0};
  });
}
function padRect(page){
  return page.evaluate(()=>{
    const a=selector=>{
      const e=document.querySelector(selector);
      if(!e)return null;
      const r=e.getBoundingClientRect();
      return {top:r.top,bottom:r.bottom,height:r.height};
    };
    const el=document.querySelector("#inspector");
    return {parchment:a(".ws-root"),canvas:a(".ws-ink-frame"),
      actions:a(".panel-actions"),mount:a(".working-pad-mount"),
      body:a(".ws-body"),inspector:a("#inspector"),
      scrollTop:el.scrollTop,scrollHeight:el.scrollHeight,
      clientHeight:el.clientHeight,overflow:getComputedStyle(el).overflowY};
  });
}
try{
  for(const [name,width,height] of screens){
    const {context,page}=await newPage(width,height);
    await run(name+" / homepage visual integrity",async()=>{
      await page.goto(base+"/#home",{waitUntil:"domcontentloaded"});
      await page.waitForSelector(".home-challenge-card");
      if(["desktop","phone","small-phone"].includes(name))await snap(page,"homepage-"+name);
      const data=await page.evaluate(()=>{
        const cards=[...document.querySelectorAll(".home-challenge-card")];
        const flawed=[];
        for(let i=0;i<cards.length;i++){
          const card=cards[i],r=card.getBoundingClientRect();
          const a=card.querySelector(".home-card-title").getBoundingClientRect();
          const p=card.querySelector(".mini-pile").getBoundingClientRect();
          const b=card.querySelector(".home-card-bottom").getBoundingClientRect();
          const hit=a.right>p.left+2 &&
            Math.min(a.bottom,p.bottom)-Math.max(a.top,p.top)>2;
          if(a.left<r.left-2||a.right>r.right+2||p.right>r.right+2||
            b.bottom>r.bottom+2||hit)flawed.push(i+1);
        }
        const first=cards[0];
        const boxes={};
        for(const [k,e] of Object.entries({
          card:first,title:first.querySelector(".home-card-title"),
          preview:first.querySelector(".mini-pile"),bottom:first.querySelector(".home-card-bottom")
        })){
          const r=e.getBoundingClientRect();
          boxes[k]={left:Math.round(r.left),top:Math.round(r.top),
            right:Math.round(r.right),bottom:Math.round(r.bottom)};
        }
        return {cards:cards.length,preview:document.querySelectorAll(".mini-pile").length,
          hero:!!document.querySelector(".hero-fall-svg"),
          sideways:document.documentElement.scrollWidth-innerWidth,flawed,firstBoxes:boxes};
      });
      insist(data.cards===9&&data.preview===9&&data.hero,"Missing home artwork",data);
      insist(data.sideways<=1,"Homepage horizontal overflow",data);
      insist(!data.flawed.length,"Homepage clipped card content",data);
      return data;
    });
    await page.goto(base+"/",{waitUntil:"domcontentloaded"});
    await page.evaluate(()=>localStorage.setItem("pileup-auto-fall","off"));
    for(const id of puzzles){
      await run(name+" / "+id+" geometry and labels",async()=>{
        await open(page,id);
        const d=await sizeAudit(page);
        insist(d.pieces>=3,"Missing visible pieces",d);
        insist(d.labels>=d.pieces,"Missing side labels",d);
        insist(d.widthOverflow<=1,"Horizontal page overflow",d);
        insist(!d.clippedLabels.length,"Clipped measurements",d);
        insist(!d.clippedPieces.length,"Clipped geometry",d);
        insist(!d.overlaps.length,"Overlapping measurement labels",d);
        insist(!d.bracketErrors.length,
          "Whole/part dimension bracket does not span its actual length",d);
        insist(Number.isFinite(d.meanLabelDistance),
          "Computed label distances must be finite",d);
        if(["twin-paths","split-project","first-fall","projecting-edge"].includes(id)){
          insist(d.bracketCount>0,
            "Whole/partial straight-line lengths are missing their brackets",d);
        }
        insist(!d.zoomOverlaps.length,"Zoom controls cover a label at 100%",d);
        if(id==="twin-paths")insist(d.equalTicks===4,"Equal-length marks missing",d);
        if(id==="acropolis")insist(d.rectangles===2,"Two rectangles missing",d);
        if(id==="marble-terrace")insist(d.rectangles===1,"Rectangle missing",d);
        // Each rewritten silhouette is visually audited at both
        // desktop and phone size; do not rely only on overlap counts.
        if(["desktop","phone"].includes(name))
          await snap(page,"architecture-"+id+"-"+name);
        return d;
      });
    }
    await run(name+" / zoom, pan, side selection and Fit",async()=>{
      await open(page,"acropolis");
      const controls=page.locator(".diagram-zoom-controls");
      insist(await controls.count()===1,"Zoom toolbar missing");
      const data=await page.evaluate(()=>{
        const svg=document.querySelector("#diagram svg");
        const view=svg.viewBox.baseVal;
        const r=e=>{const b=e.getBoundingClientRect();
          return {left:b.left,right:b.right,top:b.top,bottom:b.bottom}};
        const control=document.querySelector(".diagram-zoom-controls");
        const parent=document.querySelector(".tablet-inside");
        return {original:{x:view.x,y:view.y,width:view.width,height:view.height},
          controls:r(control),tablet:r(parent),readout:document.querySelector("#diagram-zoom-level").textContent,
          hiddenOverlap:[...svg.querySelectorAll(".side-chip rect")].filter(label=>{
            const a=r(label),b=r(control);
            return Math.min(a.right,b.right)-Math.max(a.left,b.left)>3&&
              Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>3;
          }).length};
      });
      insist(data.readout==="100%","Initial zoom is not Fit",data);
      insist(data.controls.left>=data.tablet.left &&
        data.controls.right<=data.tablet.right+1 &&
        data.controls.top>=data.tablet.top &&
        data.controls.bottom<=data.tablet.bottom+1,
        "Zoom controls extend outside the tablet",data);
      insist(data.hiddenOverlap===0,
        "Zoom toolbar covers a length label at default magnification",data);
      await controls.locator("#diagram-zoom-in").click();
      const first=await page.evaluate(()=>({
        scale:document.querySelector("#diagram-zoom-level").textContent,
        width:document.querySelector("#diagram svg").viewBox.baseVal.width
      }));
      insist(first.scale==="125%"&&first.width<data.original.width,
        "Zoom + did not magnify SVG",first);
      const clickable=await page.locator("#diagram svg").evaluate(svg=>{
        const bounds=svg.getBoundingClientRect();
        const safe=[...svg.querySelectorAll(".side-chip.unknown:not(.overhang)")];
        const one=safe.find(e=>{
          const b=e.getBoundingClientRect();
          return b.left>bounds.left+1&&b.right<bounds.right-1&&
            b.top>bounds.top+1&&b.bottom<bounds.bottom-1;
        });
        return one?.getAttribute("data-side-key")||"";
      });
      insist(clickable,"No reachable mathematical length at 125%",{name});
      await page.locator('#diagram svg .side-chip[data-side-key="'+clickable+'"]').click();
      const clicked=await page.locator("#side-select").inputValue();
      insist(clicked===clickable,"Clicking a magnified label did not select its side",
        {clicked,clickable});
      insist(await page.locator("#diagram-zoom-level").innerText()==="125%",
        "Clicking a length reset diagram zoom");
      await controls.locator("#diagram-zoom-in").click();
      await controls.locator("#diagram-zoom-in").click();
      const before=await page.evaluate(()=>{
        const v=document.querySelector("#diagram svg").viewBox.baseVal;
        return {x:v.x,y:v.y,width:v.width,height:v.height};
      });
      const bounds=await page.locator("#diagram svg").boundingBox();
      insist(bounds?.width>0,"Diagram bounding box missing");
      await page.mouse.move(bounds.x+bounds.width*.5,bounds.y+bounds.height*.5);
      await page.mouse.down();
      await page.mouse.move(bounds.x+bounds.width*.68,bounds.y+bounds.height*.67,{steps:6});
      await page.mouse.up();
      const after=await page.evaluate(()=>{
        const v=document.querySelector("#diagram svg").viewBox.baseVal;
        return {x:v.x,y:v.y,width:v.width,height:v.height};
      });
      insist(Math.abs(after.x-before.x)>1||Math.abs(after.y-before.y)>1,
        "Drag did not pan the magnified image",{before,after});
      // Selecting another mathematical side re-renders the SVG; its zoom
      // must not reset and all diagram hit targets should remain usable.
      await page.locator("#side-select").selectOption({index:1});
      const retained=await page.evaluate(()=>{
        const v=document.querySelector("#diagram svg").viewBox.baseVal;
        return {width:v.width,readout:document.querySelector("#diagram-zoom-level").textContent};
      });
      insist(retained.width<960 && retained.readout!=="100%",
        "Side selection reset the student's zoom",retained);
      if(name==="desktop"||name==="phone")
        await snap(page,"zoomed-acropolis-"+name);
      // When the diagram itself is focused, arrow keys pan it without
      // hijacking regular keyboard use in the answer fields.
      await page.locator("#diagram svg").focus();
      const keyBefore=await page.locator("#diagram svg").evaluate(e=>e.viewBox.baseVal.x);
      await page.keyboard.press("ArrowRight");
      const keyAfter=await page.locator("#diagram svg").evaluate(e=>e.viewBox.baseVal.x);
      insist(keyAfter>keyBefore+1,"Keyboard arrow did not pan the enlarged view",
        {keyBefore,keyAfter});
      // Ctrl-wheel / trackpad gestures zoom at the pointer rather than
      // zooming the whole webpage.
      const keyLevel=await page.locator("#diagram-zoom-level").innerText();
      const b=await page.locator("#diagram svg").boundingBox();
      await page.mouse.move(b.x+b.width*.48,b.y+b.height*.46);
      await page.keyboard.down("Control");
      await page.mouse.wheel(0,-180);
      await page.keyboard.up("Control");
      const wheelLevel=await page.locator("#diagram-zoom-level").innerText();
      insist(wheelLevel!==keyLevel,"Control-wheel did not magnify the SVG",
        {keyLevel,wheelLevel});
      await page.locator("#replay").click();
      insist((await page.locator("#diagram-zoom-level").innerText())!=="100%",
        "Replay changed zoom unexpectedly");
      if(await page.locator("#skip").isVisible())await page.locator("#skip").click();
      insist(await page.locator(".side-labels.waiting").count()===0,
        "Replay/Skip did not restore labels after zoom");
      await controls.locator("#diagram-zoom-out").click();
      await controls.locator("#diagram-zoom-fit").click();
      const reset=await page.evaluate(()=>{
        const v=document.querySelector("#diagram svg").viewBox.baseVal;
        return {x:v.x,y:v.y,width:v.width,height:v.height,
          label:document.querySelector("#diagram-zoom-level").textContent,
          fitDisabled:document.querySelector("#diagram-zoom-fit").disabled};
      });
      insist(Math.abs(reset.x)<.001&&Math.abs(reset.y)<.001&&
        Math.abs(reset.width-960)<.001&&Math.abs(reset.height-590)<.001,
        "Fit failed to restore the complete original diagram",reset);
      insist(reset.label==="100%"&&reset.fitDisabled,"Zoom reset UI is incorrect",reset);
      if(name==="desktop"||name==="phone")await snap(page,"zoom-acropolis-"+name);
      return {afterZoom:first,panBefore:before,panAfter:after,reset};
    });
    await run(name+" / label Focus, exact trace and Locate at zoom",async()=>{
      await open(page,"acropolis");
      const svg=page.locator("#diagram svg");
      const labels=svg.locator(".side-chip");
      const all=await labels.count();
      insist(all>=12,"Complex pile has too few marked sides",{all});
      const correspondence=await svg.evaluate(root=>{
        const data=[...root.querySelectorAll(".side-chip")].map(chip=>{
          const key=chip.getAttribute("data-side-key");
          const trace=[...root.querySelectorAll(".side-trace")].find(e=>e.getAttribute("data-side-key")===key);
          const association=[...root.querySelectorAll(".side-association")].find(e=>e.getAttribute("data-side-key")===key);
          const hit=[...root.querySelectorAll(".side-hit")].find(e=>e.getAttribute("data-side-key")===key);
          const line=trace?.querySelector("line");
          const same=hit&&line&&["x1","y1","x2","y2"].every(attr=>
            Math.abs(Number(hit.getAttribute(attr))-Number(line.getAttribute(attr)))<.001);
          return {key,trace:!!trace,connector:!!association,hit:!!hit,same};
        });
        return {total:data.length,missing:data.filter(x=>!x.trace||!x.connector||x.hit&&!x.same)};
      });
      insist(correspondence.missing.length===0,
        "Labels lack a connector or exact segment geometry",correspondence);
      const label=svg.locator(".side-chip.given:not(.overhang)").first();
      const key=await label.getAttribute("data-side-key");
      await label.hover();
      const preview=await svg.evaluate((root,k)=>{
        const trace=[...root.querySelectorAll(".side-trace")].find(x=>x.getAttribute("data-side-key")===k);
        const chip=[...root.querySelectorAll(".side-chip")].find(x=>x.getAttribute("data-side-key")===k);
        return {on:trace?.classList.contains("is-emphasized")||false,
          chip:chip?.classList.contains("is-emphasized")||false,
          number:root.querySelectorAll(".side-trace.is-emphasized").length};
      },key);
      insist(preview.on&&preview.chip&&preview.number===1,
        "Hover fails to connect a length chip to its exact side",preview);
      await page.mouse.move(4,4);
      insist(await svg.locator(".side-trace.is-emphasized").count()===0,
        "Side preview persists after pointer leaves the label");
      const focus=page.locator("#label-focus-toggle");
      insist(await focus.getAttribute("aria-pressed")==="false",
        "All labels must be shown by default");
      await focus.click();
      insist(await focus.getAttribute("aria-pressed")==="true",
        "Focus view button failed to switch on");
      await page.locator("#side-select").selectOption({index:1});
      const highlighted=await svg.evaluate(root=>({
        focused:root.classList.contains("label-focus-active"),
        muted:root.querySelectorAll(".side-chip.focus-muted").length,
        strong:root.querySelectorAll(".side-chip:not(.focus-muted)").length,
        traces:root.querySelectorAll(".side-trace.is-emphasized").length
      }));
      insist(highlighted.focused&&highlighted.muted>0&&highlighted.strong>=3&&
        highlighted.traces===1,"Focus view does not isolate the active shape",highlighted);
      // Acropolis has rectangles but no authored straight-line
      // whole/part relation. Bracket-focus behaviour is checked
      // separately on a split-side challenge below.
      await page.locator("#diagram-zoom-in").click();
      await page.locator("#diagram-zoom-in").click();
      await page.locator("#diagram-zoom-in").click();
      const before=await svg.evaluate(e=>({
        width:e.viewBox.baseVal.width,height:e.viewBox.baseVal.height
      }));
      await page.locator("#locate-side").click();
      const located=await svg.evaluate(e=>{
        const box=e.viewBox.baseVal,selected=document.querySelector(".side-chip.selected");
        const key=selected?.getAttribute("data-side-key");
        const line=[...e.querySelectorAll(".side-trace")].find(n=>n.getAttribute("data-side-key")===key)?.querySelector("line");
        const mx=(Number(line.getAttribute("x1"))+Number(line.getAttribute("x2")))/2;
        const my=(Number(line.getAttribute("y1"))+Number(line.getAttribute("y2")))/2;
        return {box:{x:box.x,y:box.y,w:box.width,h:box.height},mx,my,
          label:document.querySelector("#diagram-zoom-level").textContent};
      });
      insist(Math.abs(located.box.w-before.width)<.001 &&
        Math.abs(located.box.h-before.height)<.001,
        "Locate unexpectedly reset the zoom",located);
      insist(located.mx>=located.box.x-1&&
        located.mx<=located.box.x+located.box.w+1&&
        located.my>=located.box.y-1&&
        located.my<=located.box.y+located.box.h+1,
        "Locate did not bring selected side into the visible SVG",located);
      await page.locator("#label-focus-toggle").click();
      insist(await svg.locator(".side-chip.focus-muted").count()===0,
        "All Labels does not restore every measurement");
      await page.locator("#replay").click();
      if(await page.locator("#skip").isVisible())await page.locator("#skip").click();
      insist(await svg.locator(".side-chip").count()===all,
        "Replay/Skip changed the measurement count after Focus view");
      await open(page,"twin-paths");
      await page.locator("#side-select").selectOption({index:1});
      await page.locator("#label-focus-toggle").click();
      const brackets=await page.locator("#diagram svg").evaluate(root=>{
        const list=[...root.querySelectorAll(".dimension-bracket")];
        const mismatch=list.flatMap(el=>{
          const key=el.getAttribute("data-side-key");
          const chip=[...root.querySelectorAll(".side-chip")].find(x=>x.getAttribute("data-side-key")===key);
          return chip&&(
            chip.classList.contains("focus-muted")!==el.classList.contains("focus-muted") ||
            chip.classList.contains("is-emphasized")!==el.classList.contains("is-emphasized")
          )?[key]:[];
        });
        return {total:list.length,mismatch};
      });
      insist(brackets.total>0&&!brackets.mismatch.length,
        "Split-side dimension brackets do not follow their label Focus state",brackets);
      if(name==="desktop"||name==="phone")await snap(page,"twin-paths-focused-"+name);
      return {all,preview,highlighted,located,brackets};
    });
    await run(name+" / drawing containment and working controls",async()=>{
      await open(page,"first-fall");
      await page.locator(".ws-tab").nth(1).click();
      const dims=[];
      for(const large of [false,true]){
        if(large)await page.locator(".ws-resize-pad").click();
        const d=await padRect(page);
        if(name==="short-laptop")await snap(page,"short-laptop-pad-"+(large?"large":"regular"));
        insist(d.canvas&&d.parchment&&d.actions,"Missing drawing controls",d);
        insist(d.parchment.bottom>=d.canvas.bottom-1,
          "Canvas extends outside parchment",d);
        insist(d.actions.top>=d.parchment.bottom-1,
          "Solution buttons overlap drawing",d);
        if(width>=900&&d.scrollHeight>d.clientHeight){
          await page.locator("#inspector").evaluate(e=>e.scrollTop=e.scrollHeight);
          const visible=await page.locator(".panel-actions").evaluate(e=>{
            const a=e.getBoundingClientRect(),p=e.parentElement.getBoundingClientRect();
            return a.bottom<=p.bottom+3;
          });
          insist(visible,"Cannot scroll to solution buttons",d);
        }
        dims.push({large,height:Math.round(d.canvas.height)});
      }
      if(name==="desktop"||name==="phone")await snap(page,"large-pad-"+name);
      await page.locator(".ws-tab").first().click();
      insist(await page.locator(".ws-root.ws-drawing").count()===0,
        "Maths tab did not restore normal layout");
      return dims;
    });
    await context.close();
  }
  const primary=await newPage(1366,768,false);
  await run("first opening automatically animates; skip and replay restore labels",async()=>{
    await open(primary.page,"twin-paths");
    insist(await primary.page.locator("#autoplay-toggle").getAttribute("aria-pressed")==="true",
      "Autoplay not enabled on ordinary device");
    insist(await primary.page.locator("#skip").isVisible(),"First fall failed to start");
    insist(await primary.page.locator(".side-labels.waiting").count()===1,
      "Labels shown during initial fall");
    await primary.page.locator("#skip").click();
    insist(await primary.page.locator(".equal-side-tick").count()===4,"Tick marks missing");
    await primary.page.locator("#replay").click();
    insist(await primary.page.locator(".side-labels.waiting").count()===1,
      "Replay failed to delay measurements");
    await primary.page.locator("#skip").click();
    await primary.page.locator("#labels-toggle").click();
    insist(await primary.page.locator(".side-labels.hidden-labels").count()===1,
      "Hide measurements failed");
    await primary.page.locator("#labels-toggle").click();
    insist(await primary.page.locator(".side-labels.hidden-labels").count()===0,
      "Show measurements failed");
  });
  await run("correct final answer opens accessible completion with solution review",async()=>{
    await open(primary.page,"first-fall");
    if(await primary.page.locator("#skip").isVisible())
      await primary.page.locator("#skip").click();
    const result=await primary.page.evaluate(async()=>{
      const {puzzles}=await import("./pile-geometry.js");
      const {exactLength}=await import("./puzzle-engine.js");
      const p=puzzles.find(p=>p.id==="first-fall");
      const item=[...document.querySelector("#side-select").options]
        .find(x=>x.textContent.includes("Target x"));
      return {length:exactLength(p.solution),side:item?.value};
    });
    insist(result.side,"Target side missing",result);
    await primary.page.selectOption("#side-select",result.side);
    await primary.page.locator("#answer-input").fill(result.length);
    await primary.page.locator("#answer-form button[type=submit]").click();
    const modal=primary.page.locator("#completion-modal");
    insist(await modal.evaluate(el=>el.open),"Correct target did not complete puzzle");
    insist(await modal.locator(".completion-laurel").count()===1,"Laurel missing");
    const spacing=await modal.evaluate(el=>{
      const b=selector=>el.querySelector(selector).getBoundingClientRect();
      const crest=b(".completion-crest"),laurel=b(".completion-laurel"),title=b("h2");
      return {crestBottom:crest.bottom,laurelBottom:laurel.bottom,titleTop:title.top};
    });
    insist(spacing.crestBottom<=spacing.titleTop-1,
      "Completion crest overlaps the solved heading",spacing);
    insist(spacing.laurelBottom<=spacing.crestBottom+1,
      "Laurel SVG spills beyond the reserved crest region",spacing);
    for(const id of ["completion-review","completion-other","completion-close"])
      insist(await modal.locator("#"+id).isVisible(),"Completion action missing: "+id);
    await snap(primary.page,"solved-modal-desktop");
    await modal.locator("#completion-review").click();
    insist(await primary.page.locator("#worked-solution-heading").isVisible(),
      "Full solution button failed");
    return result;
  });
  await run("intermediate solution: hint preserves working and confirms only the new length",async()=>{
    await open(primary.page,"first-fall");
    if(await primary.page.locator("#skip").isVisible())
      await primary.page.locator("#skip").click();
    const step=await primary.page.evaluate(async()=>{
      const {puzzles}=await import("./pile-geometry.js");
      const {solutionSteps}=await import("./puzzle-engine.js");
      return solutionSteps(puzzles.find(p=>p.id==="first-fall"))[0];
    });
    insist(step?.sideKey && step.answer,"Missing first solvable length",step);
    await primary.page.selectOption("#side-select",step.sideKey);
    const math=primary.page.locator(".ws-math-fallback, math-field.ws-math-field").first();
    await math.fill("a^2+b^2=c^2");
    await primary.page.locator("#hint-next").click();
    insist((await primary.page.locator(".ws-math-fallback, math-field.ws-math-field")
      .first().inputValue()).includes("c^2"),"Hint destroyed mathematical working");
    await primary.page.locator("#answer-input").fill(step.answer);
    await primary.page.locator("#answer-form button[type=submit]").click();
    insist(await primary.page.locator(".side-chip.just-discovered").count()===1,
      "Newly discovered side not highlighted exactly once");
    const announcement=await primary.page.locator("#progress-announcement").innerText();
    insist(announcement.includes("Length discovered"),
      "Accessible progress announcement missing",announcement);
    return {answer:step.answer,announcement};
  });
  await run("scratchpad saves handwriting and maths across refresh",async()=>{
    await open(primary.page,"first-fall");
    if(await primary.page.locator("#skip").isVisible())
      await primary.page.locator("#skip").click();
    await primary.page.locator("#side-select").selectOption("");
    const field=primary.page.locator(".ws-math-fallback, math-field.ws-math-field").first();
    await field.fill("c^2 = 3^2 + 4^2");
    await primary.page.locator(".ws-tab").nth(1).click();
    const frame=primary.page.locator(".ws-ink-canvas");
    const r=await frame.boundingBox();
    insist(r&&r.height>120,"Ink canvas unusably small",r);
    await primary.page.mouse.move(r.x+r.width*.2,r.y+r.height*.25);
    await primary.page.mouse.down();
    await primary.page.mouse.move(r.x+r.width*.6,r.y+r.height*.65,{steps:6});
    await primary.page.mouse.up();
    insist(await primary.page.locator(".ws-ink-frame.ws-ink-empty").count()===0,
      "Watermark covered a saved stroke");
    await primary.page.reload({waitUntil:"domcontentloaded"});
    if(await primary.page.locator("#skip").isVisible())
      await primary.page.locator("#skip").click();
    await primary.page.locator(".ws-tab").first().click();
    insist((await primary.page.locator(".ws-math-fallback, math-field.ws-math-field")
      .first().inputValue()).includes("c^2"),"Maths notes lost after reload");
    await primary.page.locator(".ws-tab").nth(1).click();
    insist(await primary.page.locator(".ws-ink-frame.ws-ink-empty").count()===0,
      "Drawing not retained after reload");
  });
  await primary.context.close();
  const reduce=await newPage(1366,768,true);
  await run("reduced motion: Auto ON explicitly starts and persists falling",async()=>{
    await open(reduce.page,"first-fall");
    insist(await reduce.page.locator("#autoplay-toggle").getAttribute("aria-pressed")==="false",
      "Reduced-motion was not respected");
    await reduce.page.locator("#autoplay-toggle").click();
    insist(await reduce.page.locator("#skip").isVisible(),
      "Opting in failed to start fall");
    await reduce.page.locator("#skip").click();
    await open(reduce.page,"projecting-edge");
    insist(await reduce.page.locator("#skip").isVisible(),
      "Autoplay preference not saved to the next puzzle");
    await reduce.page.locator("#skip").click();
  });
  await reduce.context.close();
  for(const [name,width,height] of [["phone",390,844],["small-phone",320,568]]){
    const target=await newPage(width,height,true);
    await run(name+" / responsive completion dialog and reachable bottom actions",async()=>{
      await open(target.page,"first-fall");
      const result=await target.page.evaluate(async()=>{
        const {puzzles}=await import("./pile-geometry.js");
        const {exactLength}=await import("./puzzle-engine.js");
        return {length:exactLength(puzzles.find(p=>p.id==="first-fall").solution),
          key:[...document.querySelector("#side-select").options]
            .find(x=>x.textContent.includes("Target x"))?.value};
      });
      insist(result.key,"Missing target side",result);
      await target.page.selectOption("#side-select",result.key);
      await target.page.locator("#answer-input").fill(result.length);
      await target.page.locator("#answer-form button[type=submit]").click();
      const modal=target.page.locator("#completion-modal");
      insist(await modal.evaluate(el=>el.open),"Phone completion dialog did not open");
      const geometry=await modal.evaluate(el=>{
        const crest=el.querySelector(".completion-crest").getBoundingClientRect();
        const laurel=el.querySelector(".completion-laurel").getBoundingClientRect();
        const title=el.querySelector("h2").getBoundingClientRect();
        return {crestBottom:crest.bottom,laurelBottom:laurel.bottom,titleTop:title.top};
      });
      insist(geometry.crestBottom<=geometry.titleTop-1,
        "Laurel container overlaps completion title on phone",geometry);
      insist(geometry.laurelBottom<=geometry.crestBottom+1,
        "Laurel spills out of container on phone",geometry);
      await modal.evaluate(el=>el.scrollTop=el.scrollHeight);
      const reach=await modal.evaluate(el=>{
        const dialog=el.getBoundingClientRect();
        const button=el.querySelector("#completion-close").getBoundingClientRect();
        return {bottom:button.bottom,visibleBottom:Math.min(dialog.bottom,innerHeight),
          top:button.top,dialogTop:dialog.top};
      });
      insist(reach.bottom<=reach.visibleBottom+2&&reach.top>=reach.dialogTop-2,
        "Completion close button cannot be reached by scrolling",reach);
      await snap(target.page,"completion-"+name);
      return {result,geometry,reach};
    });
    await target.context.close();
  }
}finally{
  await browser.close();
}
const report={generated:new Date().toISOString(),chrome,
  summary:{passed:reports.filter(x=>x.status==="PASS").length,
    failed:errors.length,viewports:screens.length,puzzles:puzzles.length},
  reports};
writeFileSync(directory+"/report.json",JSON.stringify(report,null,2));
console.log("\nBROWSER AUDIT: "+report.summary.passed+" passed; "+report.summary.failed+" failed");
if(errors.length)process.exitCode=1;
