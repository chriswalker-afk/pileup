/**
 * Advanced, carefully authored multi-step constructions.
 *
 * Rectangles are *genuine* mathematical shapes, not colours behind the
 * triangles. Their diagonals create right triangles in the dependency
 * engine, while their opposite edges carry equal-length information.
 * None of those invisible mathematical helper triangles is painted.
 */
const p=(x,y)=>({x,y});
const len=(a,b)=>Math.hypot(b.x-a.x,b.y-a.y);
const center=pts=>p(pts.reduce((x,q)=>x+q.x,0)/pts.length,
                     pts.reduce((y,q)=>y+q.y,0)/pts.length);
const cross=(a,b)=>a.x*b.y-a.y*b.x;
const diff=(a,b)=>p(b.x-a.x,b.y-a.y);
const roman=["I","II","III","IV","V","VI","VII","VIII","IX","X","XI","XII"];
const palette=["#d2a96c","#8fafae","#c28b76","#aca2c5","#b0a084",
  "#9aaf89","#ba949b","#8dabb0","#c1a47c","#9e9ab7","#a6b59a","#c39c89"];

function outsideNormal(owner,a,b,amount){
 const u=diff(a,b),L=len(a,b),m=p((a.x+b.x)/2,(a.y+b.y)/2);
 const s=cross(u,diff(m,center(owner.pts)))>=0?-1:1;
 return p(-s*u.y/L*amount,s*u.x/L*amount);
}
function attach(owner, edge, at, leg, id, color) {
 const [a,b]=edge;
 const origin=at==="a"?a:b;
 const normal=outsideNormal(owner,a,b,leg);
 const c=p(origin.x+normal.x,origin.y+normal.y);
 return {
   id, pts:[a,b,c],right:at==="a"?0:1,
   color,
   givens:[{a:origin,b:c,value:leg}]
 };
}
function hypotenuse(t) {
 return t.pts.filter((_,i)=>i!==t.right);
}
function attachRectangle(owner,edge,depth,id,color){
 const [a,b]=edge;
 const offset=outsideNormal(owner,a,b,depth);
 const c=p(b.x+offset.x,b.y+offset.y);
 const d=p(a.x+offset.x,a.y+offset.y);
 const diagonal={a,b:c};
 return {
   id,pts:[a,b,c,d],color,
   diagonals:[diagonal],
   givens:[{a,b:c,value:len(a,c)}],
   rightAngles:true
 };
}
export function makeRectangleChallenge({
 id,title,epithet,difficulty,description,tags=[],
 firstSteps, second=null
}){
 // Start with a 5–12–13 triangle on the floor. The rectangle shares
 // its initially unknown 12 cm vertical leg. Knowing the rectangle
 // diagonal (15 cm), students must find its 9 cm roof before using
 // that roof as the next triangle's support.
 const P=p(0,0),Q=p(5,0),R=p(5,12),U=p(14,0),V=p(14,12);
 const base={id:"I",pts:[P,Q,R],right:1,color:palette[0],
   givens:[{a:P,b:Q,value:5},{a:P,b:R,value:13}]};
 const rect1={id:"R1",pts:[Q,U,V,R],color:"#d7cfb7",
   diagonals:[{a:Q,b:V}],givens:[{a:Q,b:V,value:15}],
   // Bottom and far-right are duplicate opposite sides, so avoid
   // cluttering the pile with redundant question marks.
   suppressLabels:[{a:Q,b:U},{a:U,b:V}],
   rightAngles:true};
 const roof=attach(rect1,[R,V],"b",12,"II",palette[1]);
 const triangles=[base,roof],rectangles=[rect1],fallOrder=["I","R1","II"];
 let last=roof;
 for(const step of firstSteps){
   const t=attach(last,hypotenuse(last),step.at,step.leg,
     roman[triangles.length],palette[triangles.length%palette.length]);
   triangles.push(t);fallOrder.push(t.id);last=t;
 }
 if(second){
   // A second 90° frame sits outside the previous hypotenuse.
   // The diagonal is given, but its short side is NOT. The next
   // triangle attaches to this missing side and cannot be solved
   // until Pythagoras is applied within the rectangle.
   const frame=attachRectangle(last,hypotenuse(last),second.depth,
     "R2","#c1c6b7");
   rectangles.push(frame);fallOrder.push(frame.id);
   frame.suppressLabels=[
     {a:frame.pts[2],b:frame.pts[3]},
     second.edge==="left"?
       {a:frame.pts[1],b:frame.pts[2]}:
       {a:frame.pts[0],b:frame.pts[3]}
   ];
   const edge=second.edge==="left"?
     [frame.pts[0],frame.pts[3]]:[frame.pts[1],frame.pts[2]];
   const next=attach(frame,edge,second.at,second.leg,
     roman[triangles.length],palette[triangles.length%palette.length]);
   triangles.push(next);fallOrder.push(next.id);last=next;
   for(const step of second.steps){
     const t=attach(last,hypotenuse(last),step.at,step.leg,
       roman[triangles.length],palette[triangles.length%palette.length]);
     triangles.push(t);fallOrder.push(t.id);last=t;
   }
 }
 const [a,b]=hypotenuse(last);
 const all=[...triangles,...rectangles];
 if(all.some(shape=>shape.pts.some(vertex=>vertex.y< -1e-8)))
   throw Error("The authored rectangle pile falls below the floor.");
 return {
   id,title,epithet,difficulty,description,tags,
   triangles,rectangles,fallOrder,
   target:{a,b},floor:{a:P,b:Q},
   solution:len(a,b),
   topology:second?"double-rectangle-chain":"rectangle-diagonal-chain",
   rectangleReasoning:true
 };
}

/**
 * Extend a previously verified overhang pile with extra exact
 * right-angled triangles. Each new triangle rests on the preceding
 * unknown hypotenuse, giving a genuine chain rather than decoration.
 */
export function extendOverhangPile(pile,extraLegs){
 const paletteOffset=pile.triangles.length;
 let last=pile.triangles.at(-1);
 for(let i=0;i<extraLegs.length;i++){
   const pair=hypotenuse(last);
   const t=attach(last,pair,extraLegs[i].at,extraLegs[i].leg,
     roman[pile.triangles.length],palette[(paletteOffset+i)%palette.length]);
   pile.triangles.push(t);last=t;
 }
 const [a,b]=hypotenuse(last);
 pile.target={a,b};
 pile.solution=len(a,b);
 return pile;
}
