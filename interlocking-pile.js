/**
 * The Great Interlock — an original thirteen-triangle grand challenge.
 *
 * Inspired by the visual density of a classic Pythagorean stack: a broad
 * top canopy, angled interlocking wedges, two narrow straight-line
 * offsets and two genuinely grounded supports.
 *
 * All contacts use actual triangle edges or vertices. The two base
 * calculations independently unlock the 10 cm and 15 cm sections of
 * a 25 cm diagonal. The final horizontal roof is then 24 cm (7–24–25).
 * No floating art, obscured shapes, or approximate givens.
 */
const p=(x,y)=>({x,y});
const len=(a,b)=>Math.hypot(b.x-a.x,b.y-a.y);
const vec=(a,b)=>p(b.x-a.x,b.y-a.y);
const cross=(a,b)=>a.x*b.y-a.y*b.x;
const mid=(a,b)=>p((a.x+b.x)/2,(a.y+b.y)/2);
const centre=shape=>p(
  shape.pts.reduce((sum,q)=>sum+q.x,0)/shape.pts.length,
  shape.pts.reduce((sum,q)=>sum+q.y,0)/shape.pts.length);
const at=(a,b,f)=>p(a.x+(b.x-a.x)*f,a.y+(b.y-a.y)*f);
const measure=(a,b)=>({a,b,value:len(a,b)});
const palette=[
  "#8eaeb6","#edc16e","#9e9cc9","#cc8e7c","#84b8cb",
  "#edb783","#91ae84","#bd91ae","#b1a9aa","#b2a3c2",
  "#99bfab","#d8a880","#a9c2bd"
];
const tri=(id,pts,right,givens=[],colour=0)=>({
  id,pts,right,color:palette[colour],givens
});
function outside(owner,a,b){
  const u=vec(a,b),c=len(a,b),m=mid(a,b);
  const sign=cross(u,vec(m,centre(owner)))>=0?-1:1;
  return p(-sign*u.y/c,sign*u.x/c);
}
// A new right triangle uses an entire existing edge as a leg.
function attach(owner,a,b,atEnd,perp,id,colour){
  const origin=atEnd==="a"?a:b;
  const n=outside(owner,a,b);
  const third=p(origin.x+n.x*perp,origin.y+n.y*perp);
  return tri(id,[a,b,third],atEnd==="a"?0:1,[],colour);
}
// A distinct right triangle uses an existing edge as its hypotenuse.
function onHyp(owner,a,b,firstLeg,secondLeg,id,colour){
  const c=len(a,b);
  if(Math.abs(c*c-firstLeg*firstLeg-secondLeg*secondLeg)>1e-6)
    throw Error("The interlock hypotenuse must fit both legs.");
  const u=vec(a,b),n=outside(owner,a,b);
  const corner=p(
    a.x+u.x*firstLeg*firstLeg/(c*c)+n.x*firstLeg*secondLeg/c,
    a.y+u.y*firstLeg*firstLeg/(c*c)+n.y*firstLeg*secondLeg/c
  );
  return tri(id,[a,b,corner],2,[],colour);
}
const hyp=t=>t.pts.filter((_,i)=>i!==t.right);
const relation=(whole,first,second,label)=>({
  whole:{a:whole[0],b:whole[1]},
  parts:[{a:first[0],b:first[1]},{a:second[0],b:second[1]}],
  label
});

export function makeGreatInterlock(info){
  // The upper canopy is a 7–24–25 triangle. Its 25 cm diagonal
  // is split into two genuinely adjacent 10 cm and 15 cm sections.
  const L=p(0,45),R=p(24,45),K=p(24,38),M=at(L,K,10/25);
  const roof=tri("XIII",[L,R,K],1,[measure(R,K)],12);

  // Both lower triangles use 6–8–10 and 9–12–15. Neither complete
  // hypotenuse is known until its own descending calculation route.
  function cornerBelow(a,b,legA,legB){
    const c=len(a,b),u=vec(a,b),n=p(u.y/c,-u.x/c);
    return p(
      a.x+u.x*legA*legA/(c*c)+n.x*legA*legB/c,
      a.y+u.y*legA*legA/(c*c)+n.y*legA*legB/c);
  }
  const C1=cornerBelow(L,M,6,8),C2=cornerBelow(M,K,9,12);
  const upperLeft=tri("I",[L,M,C1],2,[measure(L,C1)],0);
  const upperRight=tri("II",[M,K,C2],2,[measure(M,C2)],1);

  const branchLeft=attach(upperLeft,C1,M,"b",15,"III",2);
  branchLeft.givens=[measure(M,branchLeft.pts[2])];
  const branchRight=attach(upperRight,C2,K,"a",5,"IV",3);
  branchRight.givens=[measure(C2,branchRight.pts[2])];

  // Two inset/overhanging supports: 12+5=17 and 8+5=13.
  const lc=hyp(branchLeft),rc=hyp(branchRight);
  const lcPart=at(lc[0],lc[1],12/17);
  const rcPart=at(rc[0],rc[1],8/13);
  const insetLeft=attach(branchLeft,lc[0],lcPart,"b",5,"V",4);
  insetLeft.givens=[measure(lcPart,insetLeft.pts[2])];
  const insetRight=attach(branchRight,rc[0],rcPart,"a",6,"VI",5);
  insetRight.givens=[measure(rc[0],insetRight.pts[2])];

  const el=hyp(insetLeft),er=hyp(insetRight);
  const keyLeft=onHyp(insetLeft,el[0],el[1],5,12,"VII",6);
  keyLeft.givens=[measure(keyLeft.pts[0],keyLeft.pts[2])];
  const keyRight=onHyp(insetRight,er[0],er[1],6,8,"VIII",7);
  keyRight.givens=[measure(keyRight.pts[0],keyRight.pts[2])];

  // These long downward wedges make the diagram an interlocking pile,
  // rather than a row of triangles balanced on a single diagonal.
  const wedgeLeft=attach(keyLeft,keyLeft.pts[1],keyLeft.pts[2],"a",16,"IX",8);
  wedgeLeft.givens=[measure(wedgeLeft.pts[0],wedgeLeft.pts[2])];
  const wedgeRight=attach(keyRight,keyRight.pts[1],keyRight.pts[2],"b",15,"X",9);
  wedgeRight.givens=[measure(wedgeRight.pts[0],wedgeRight.pts[2])];

  // Two 8–15–17 and 15–20–25 grounded foundations.
  // Right foundation touches the long purple descending wedge at its tip.
  const tip=wedgeRight.pts[2],floorY=tip.y-15;
  const footR=p(tip.x,floorY),footRL=p(tip.x-8,floorY);
  const baseRight=tri("XI",[footR,footRL,tip],0,
    [measure(footR,footRL),measure(footRL,tip)],10);

  // The left foundation touches the ACTUAL edge of wedge IX, at
  // height 20, instead of simply sitting nearby as decorative scenery.
  const edgeBottom=wedgeLeft.pts[2],edgeTop=wedgeLeft.pts[0];
  const f=(floorY+20-edgeBottom.y)/(edgeTop.y-edgeBottom.y);
  if(!(f>0&&f<1))throw Error("The left footing missed its bearing edge.");
  const bearing=at(edgeBottom,edgeTop,f);
  const footL=p(bearing.x,floorY),footLR=p(bearing.x+15,floorY);
  const baseLeft=tri("XII",[footL,footLR,bearing],0,
    [measure(footL,footLR),measure(footLR,bearing)],11);

  // Match the 20 cm calculated foundation upright with wedge IX's
  // long hypotenuse, and the 15 cm upright with wedge X's outer leg.
  // These are two separate indispensable mathematical entry routes.
  const equalSideGroups=[
    [{a:footL,b:bearing},{a:wedgeLeft.pts[1],b:wedgeLeft.pts[2]}],
    [{a:footR,b:tip},{a:wedgeRight.pts[1],b:wedgeRight.pts[2]}]
  ];
  const lengthRelations=[
    relation(lc,[lc[0],lcPart],[lcPart,lc[1]],"LEFT OFFSET"),
    relation(rc,[rc[0],rcPart],[rcPart,rc[1]],"RIGHT OFFSET"),
    relation([L,K],[L,M],[M,K],"TWO SHARED SECTIONS")
  ];
  const extraSegments=[
    {...measure(lcPart,lc[1]),label:"LEFT OVERHANG"},
    {...measure(rcPart,rc[1]),label:"RIGHT OVERHANG"}
  ];

  // Bottom-up fall order and stable unique identities for label/side
  // selection, hints and browser-local progress.
  const triangles=[
    baseLeft,baseRight,wedgeLeft,wedgeRight,keyLeft,keyRight,
    insetLeft,insetRight,branchLeft,branchRight,upperLeft,upperRight,roof
  ];
  // Translate every SHARED coordinate object once so the bearing
  // edges, dimension brackets, and right angles remain exactly aligned.
  const points=new Set(triangles.flatMap(t=>t.pts));
  for(const pt of points)pt.y-=floorY;

  return {
    ...info,triangles,rectangles:[],
    fallOrder:triangles.map(t=>t.id),
    floor:{a:footL,b:footR},
    target:{a:L,b:R},solution:len(L,R),
    extraSegments,lengthRelations,equalSideGroups,
    spanHighlight:{whole:{a:L,b:K},parts:[{a:L,b:M},{a:M,b:K}]},
    tags:["13 interlocking triangles","Two foundation routes","Twin offsets","24 cm canopy"],
    topology:"dense-interlocking-two-foundations",
    architecture:{
      family:"interlocking masterpiece",
      summary:"A broad upper canopy crowns thirteen varied interlocking wedges on two true foundations",
      features:["two ground supports","partial shared diagonals","two inset offsets",
        "alternating sloping wings","two deep dependency paths","long horizontal target"]
    }
  };
}
