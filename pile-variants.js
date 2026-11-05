/**
 * Authored alternative pile geometries for Pass C.
 *
 * Not every triangle joins along a complete side. In a split pile one
 * long diagonal is covered by TWO shorter sides belonging to two
 * other right triangles. The second support may overhang its end.
 * All coordinates are defined mathematically, not by pixels.
 */
const pt = (x,y) => ({x,y});
const distance = (a,b) => Math.hypot(a.x-b.x,a.y-b.y);
const diff = (a,b) => pt(b.x-a.x,b.y-a.y);
const prod = (a,b) => a.x*b.y-a.y*b.x;

function thirdVertex(a,b,other,start,leg,opposite=true) {
  const u=diff(a,b),L=distance(a,b),mid=pt((a.x+b.x)/2,(a.y+b.y)/2);
  const originalSign=prod(u,diff(mid,other))>=0?1:-1;
  const sideSign=opposite?-originalSign:originalSign;
  return pt(start.x-sideSign*u.y/L*leg,start.y+sideSign*u.x/L*leg);
}

/**
 * The lower triangle sits on the floor. Two upper triangles share
 * consecutive sections of the lower hypotenuse. A split side can
 * be precisely equal, or the second section can project past the end
 * of the lower hypotenuse by the labelled amount.
 */
export function makeSplitPile({
  id,title,epithet,difficulty,description,
  base,sectionLengths,legLengths,hypotenuseGivens,
  finalExtension=0,equalHypotenuses=false,
  colors, extensions=false, tags=[]
}) {
  if(sectionLengths.length!==2||legLengths.length!==2||
    hypotenuseGivens.length!==2||colors.length!==3) {
    throw Error("A split pile needs two upper triangles and three colours.");
  }
  const P=pt(0,0),Q=pt(base[0],0),R=pt(base[0],base[1]);
  const whole=distance(P,R);
  const sum=sectionLengths[0]+sectionLengths[1];
  if(Math.abs(sum-(whole+finalExtension))>1e-8) {
    throw Error("Sections must span the bottom hypotenuse plus any extension.");
  }
  const direction=pt((R.x-P.x)/whole,(R.y-P.y)/whole);
  const M=pt(P.x+direction.x*sectionLengths[0],
             P.y+direction.y*sectionLengths[0]);
  const N=pt(M.x+direction.x*sectionLengths[1],
             M.y+direction.y*sectionLengths[1]);
  const U=thirdVertex(P,M,Q,M,legLengths[0]);
  const V=thirdVertex(M,N,Q,N,legLengths[1]);
  const h1=distance(P,U),h2=distance(M,V);
  if(Math.abs(h1-hypotenuseGivens[0])>1e-8||
     Math.abs(h2-hypotenuseGivens[1])>1e-8){
    throw Error("Given hypotenuse must match exact leg geometry.");
  }
  if(equalHypotenuses && Math.abs(h1-h2)>1e-8) {
    throw Error("Equal ticks require equal actual lengths.");
  }
  const A={id:"I",pts:[P,Q,R],right:1,color:colors[0],
    givens:[{a:Q,b:R,value:base[1]}]};
  const B={id:"II",pts:[P,M,U],right:1,color:colors[1],
    givens:[{a:M,b:U,value:legLengths[0]},{a:P,b:U,value:h1}]};
  const C={id:"III",pts:[M,N,V],right:1,color:colors[2],
    givens:[{a:N,b:V,value:legLengths[1]}]};
  if(!equalHypotenuses)C.givens.push({a:M,b:V,value:h2});
  const extraSegments=[];
  const lengthRelations=[];
  const equalSideGroups=equalHypotenuses ? [
    [{a:P,b:U},{a:M,b:V}]
  ] : [];
  if(finalExtension>0){
    // M---R---N : support C extends beyond the lower base diagonal.
    extraSegments.push({a:R,b:N,value:finalExtension,label:"PROJECTING OVERHANG"});
    lengthRelations.push({whole:{a:M,b:N},
      parts:[{a:M,b:R},{a:R,b:N}],label:"PROJECTING OVERHANG"});
    lengthRelations.push({whole:{a:P,b:R},
      parts:[{a:P,b:M},{a:M,b:R}],label:"TWO SHARED SECTIONS"});
  }else{
    // P---M---R : the long diagonal is exactly two shorter edges.
    lengthRelations.push({whole:{a:P,b:R},
      parts:[{a:P,b:M},{a:M,b:R}],label:"TWO SHARED SECTIONS"});
  }
  const puzzle={
    id,title,epithet,difficulty,description,
    triangles:[A,B,C],target:{a:P,b:Q},floor:{a:P,b:Q},
    extraSegments,lengthRelations,equalSideGroups,
    solution:base[0],
    tags,
    spanHighlight:{whole:{a:P,b:R},
      parts:[{a:P,b:M},{a:M,b:N}]}
  };
  if(finalExtension>0)puzzle.overhang={a:R,b:N,value:finalExtension};
  // This is a union of non-overlapping right triangles, with shared
  // borders only. Its perimeter is exterior edges plus the overhang.
  if(extensions){
    const clean=n=>Math.abs(n-Math.round(n))<1e-7?Math.round(n):Number(n.toFixed(4));
    const perimeter=base[0]+base[1]+finalExtension+
      h1+h2+legLengths[0]+legLengths[1];
    const area=.5*(base[0]*base[1]+
      sectionLengths[0]*legLengths[0]+
      sectionLengths[1]*legLengths[1]);
    puzzle.extensions=[
      {id:"perimeter",title:"Perimeter of the complete pile",
       prompt:"Find the exterior perimeter. Do not count the internal shared edges.",
       unit:"cm",value:perimeter,
       working:base[0]+" + "+base[1]+
          (finalExtension>0?" + "+finalExtension:"")+
          " + "+clean(h1)+" + "+legLengths[0]+" + "+clean(h2)+" + "+legLengths[1]+
          " = "+perimeter+" cm"},
      {id:"area",title:"Area of the complete pile",
       prompt:"Find the total area enclosed by the non-overlapping triangles.",
       unit:"cm²",value:area,
       working:"½("+base[0]+" × "+base[1]+") + ½("+
         sectionLengths[0]+" × "+legLengths[0]+") + ½("+
         sectionLengths[1]+" × "+legLengths[1]+") = "+area+" cm²"}
    ];
  }
  if(puzzle.triangles.some(t=>t.pts.some(p=>p.y< -1e-8))) {
    throw Error("All triangles must sit above the stone floor.");
  }
  return puzzle;
}

/**
 * Bridge a split pile with an additional triangle whose full side
 * spans both adjacent support sections, then add another upper piece.
 * These intentional polygon overlaps are part of the puzzle's
 * construction; no simple sum-of-areas extension is offered.
 */
export function makeCrownPile({id,title,epithet,difficulty,description,colors,tags=[]}) {
  const base=makeSplitPile({
    id,title,epithet,difficulty,description,
    base:[15,8],sectionLengths:[12,5],legLengths:[5,12],
    hypotenuseGivens:[13,13],equalHypotenuses:false,
    colors:colors.slice(0,3)
  });
  const [A,B]=base.triangles;
  const P=A.pts[0],R=A.pts[2],U=B.pts[2];
  // Fourth triangle spans the two collinear supports on the opposite
  // side of the diagonal from B and C.
  const W=thirdVertex(P,R,U,R,6);
  const bridge={id:"IV",pts:[P,R,W],right:1,color:colors[3],
    givens:[{a:R,b:W,value:6}]};
  const E=thirdVertex(P,W,R,W,5,false);
  const crown={id:"V",pts:[P,W,E],right:1,color:colors[4],
    givens:[{a:W,b:E,value:5}]};
  base.triangles.push(bridge,crown);
  base.target={a:P,b:E};
  base.solution=distance(P,E);
  base.tags=tags;
  base.spanHighlight={whole:{a:P,b:R},
    parts:base.spanHighlight.parts};
  if(base.triangles.some(t=>t.pts.some(q=>q.y< -1e-8))) {
    throw Error("A crown vertex falls below the stone floor.");
  }
  return base;
}
