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
    const overlaps=[];
    for(let i=0;i<label.length;i++)for(let j=i+1;j<label.length;j++){
      const dx=Math.min(label[i].right,label[j].right)-
        Math.max(label[i].left,label[j].left);
      const dy=Math.min(label[i].bottom,label[j].bottom)-
        Math.max(label[i].top,label[j].top);
      if(dx>1.5&&dy>1.5)overlaps.push([i,j,Math.round(dx),Math.round(dy)]);
    }
    return {pieces:shape.length,labels:label.length,overlaps,
      clippedLabels:outside(label),clippedPieces:outside(shape),
      widthOverflow:document.documentElement.scrollWidth-innerWidth,
      rectangles:svg.querySelectorAll(".rectangle-piece").length,
      equalTicks:svg.querySelectorAll(".equal-side-tick").length};
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
        if(id==="twin-paths")insist(d.equalTicks===4,"Equal-length marks missing",d);
        if(id==="acropolis")insist(d.rectangles===2,"Two rectangles missing",d);
        if(id==="marble-terrace")insist(d.rectangles===1,"Rectangle missing",d);
        if(["first-fall","acropolis"].includes(id)&&
          ["desktop","phone"].includes(name))await snap(page,id+"-"+name);
        return d;
      });
    }
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
    for(const id of ["completion-review","completion-other","completion-close"])
      insist(await modal.locator("#"+id).isVisible(),"Completion action missing: "+id);
    await snap(primary.page,"solved-modal-desktop");
    await modal.locator("#completion-review").click();
    insist(await primary.page.locator("#worked-solution-heading").isVisible(),
      "Full solution button failed");
    return result;
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
