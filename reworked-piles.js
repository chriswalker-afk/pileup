/**
 * Four reference-informed, bottom-up Pythagorean constructions.
 *
 * The earlier bridges balanced pieces between two peaks, and their
 * equal-length dependencies were difficult to infer. These replacements
 * use directly shared segments, marked subtractions and adjacent
 * rectangular steps instead: each deduction physically unlocks the
 * segment needed by the next triangle. All geometry is authored, and
 * there are no coincident-looking but unmarked equal lengths.
 */
const p=(x,y)=>({x,y});
const length=(a,b)=>Math.hypot(b.x-a.x,b.y-a.y);
const vector=(a,b)=>p(b.x-a.x,b.y-a.y);
const cross=(a,b)=>a.x*b.y-a.y*b.x;
const mid=(a,b)=>p((a.x+b.x)/2,(a.y+b.y)/2);
const centre=t=>p(
  t.pts.reduce((sum,q)=>sum+q.x,0)/t.pts.length,
  t.pts.reduce((sum,q)=>sum+q.y,0)/t.pts.length);
const between=(a,b,f)=>p(a.x+(b.x-a.x)*f,a.y+(b.y-a.y)*f);
const given=(a,b)=>({a,b,value:length(a,b)});
const roman=["I","II","III","IV","V","VI","VII","VIII","IX","X"];
const palette=[
  "#80b2ae","#d6b06c","#bd91a6","#8faba8","#b1a4c5",
  "#e3bb8f","#91a9c5","#b5ae77","#bd9b94","#c2b2cb"
];
const tri=(id,pts,right,givens=[],color=palette[roman.indexOf(id)%palette.length])=>
  ({id,pts,right,givens,color});
const rect=(id,pts,diagonal,suppressLabels=[])=>({
  id,pts,color:id==="R1"?"#dbc6a1":"#adc2bb",rightAngles:true,
  diagonals:[{a:diagonal[0],b:diagonal[1]}],
  givens:[given(...diagonal)],suppressLabels
});
const hyp=t=>t.pts.filter((_,i)=>i!==t.right);
const otherSide=(owner,a,b)=>{
  const v=vector(a,b),m=mid(a,b),side=cross(v,vector(m,centre(owner)));
  const sign=side>=0?-1:1;
  const d=length(a,b);
  return p(-sign*v.y/d,sign*v.x/d);
};
/** A new triangle has a true leg along all or part of the host edge. */
function attach(owner,a,b,end,leg,id){
  const start=end==="a"?a:b,n=otherSide(owner,a,b);
  const tip=p(start.x+leg*n.x,start.y+leg*n.y);
  return tri(id,[a,b,tip],end==="a"?0:1);
}
/** An outside cap has its hypotenuse along the host edge, not across
 * two disconnected peaks. The shared edge is exact in both pieces. */
function onHyp(owner,a,b,legA,legB,id){
  const c=length(a,b);
  if(Math.abs(c*c-legA*legA-legB*legB)>1e-6)
    throw Error("Inconsistent right-triangle cap in "+id);
  const v=vector(a,b),n=otherSide(owner,a,b);
  const corner=p(
    a.x+v.x*legA*legA/(c*c)+n.x*legA*legB/c,
    a.y+v.y*legA*legA/(c*c)+n.y*legA*legB/c
  );
  return tri(id,[a,b,corner],2);
}
const relation=(whole,partA,partB,label)=>({
  whole:{a:whole[0],b:whole[1]},
  parts:[{a:partA[0],b:partA[1]},{a:partB[0],b:partB[1]}],label
});
function finish(info,triangles,rectangles,target,floor,extras={}){
  return {...info,...extras,triangles,rectangles,
    target:{a:target[0],b:target[1]},
    floor:{a:floor[0],b:floor[1]},solution:length(...target),
    fallOrder:extras.fallOrder||
      [...triangles.map(t=>t.id),...rectangles.map(r=>r.id)]};
}

/** 04 — SPLIT & PROJECT: a compact upward fold, not a bridge.
 * 3,4 -> 5; 13 and 5 -> 12; 12 and 5 -> 13;
 * subtract the clearly marked 2 cm inset -> 11;
 * final roof x = sqrt(11^2 + 6^2) = sqrt(157).
 */
export function makeFoldedStaircase(info){
  const P=p(0,0),Q=p(3,0),R=p(0,4);
  const I=tri("I",[P,Q,R],0,[given(P,Q),given(P,R)]);
  const II=attach(I,Q,R,"b",12,"II"),U=II.pts[2];
  II.givens=[given(Q,U)];
  const III=attach(II,R,U,"b",5,"III"),V=III.pts[2];
  III.givens=[given(U,V)];
  const W=between(R,V,11/13),IV=attach(III,R,W,"b",6,"IV");
  IV.givens=[given(W,IV.pts[2])];
  return finish(info,[I,II,III,IV],[],hyp(IV),[P,Q],{
    lengthRelations:[relation([R,V],[R,W],[W,V],"PROJECTING OVERHANG")],
    extraSegments:[{...given(W,V),label:"2 CM OVERHANG"}],
    overhang:{a:W,b:V,value:2},
    tags:["Continuous upward fold","13 − 2 inset","Four-step deduction"],
    topology:"four-triangle-inset-fold",
    architecture:{family:"inset staircase",
      summary:"An offset roof folds back over its supporting side; no upper piece balances between peaks",
      features:["one stable ground triangle","four dependent shapes","shared partial roof","visible 2 cm subtraction"]}
  });
}

/** 06 — THE GREAT PILE UP: asymmetrical zigzag (6 pieces).
 * 6,8 -> 10; 10 and 6 -> 8; 8,15 -> 17;
 * 17 and 8 -> 15; 15,20 -> 25; 25 and 7 -> 24.
 * The 8 cm side on II is also given, creating a strategically shorter
 * starting point at III. Earlier faces remain valid optional practice.
 * The intermediate 8 cm length is now also labelled as given. Students
 * can choose the short four-check path III → IV → V → VI, rather than
 * mechanically completing the two lower practice faces.
 */
export function makeRisingZigzag(info){
  const P=p(0,0),Q=p(8,0),R=p(8,6);
  const I=tri("I",[P,Q,R],1,[given(P,Q),given(Q,R)]);
  const II=onHyp(I,P,R,6,8,"II");
  II.givens=[given(P,II.pts[2])];
  const S=II.pts[2];
   // A deliberately independent starting length: route planning matters.
   II.givens.push(given(S,R));
   const III=attach(II,S,R,"a",15,"III");
  III.givens=[given(S,III.pts[2])];
  const T=III.pts[2],IV=onHyp(III,R,T,8,15,"IV");
  IV.givens=[given(R,IV.pts[2])];
  const U=IV.pts[2],V=attach(IV,U,T,"a",20,"V");
  V.givens=[given(U,V.pts[2])];
  const [a,b]=hyp(V),VI=onHyp(V,a,b,7,24,"VI");
  VI.givens=[given(a,VI.pts[2])];
  return finish(info,[I,II,III,IV,V,VI],[],[VI.pts[2],b],[P,Q],{
    tags:["Choice of route","Six connected faces","Four-check shortcut"],
    topology:"six-face-alternating-zigzag",
     routeChallenge:{par:4,startTriangle:"III"},
    architecture:{family:"alternating zigzag",
      summary:"Six connected faces offer a short middle-entry route and a longer full-chain route",
      features:["ground foundation","four-check shortcut","optional lower calculations","alternate starting points","distinct winding skyline"]}
  });
}

/** 07 — NINE MUSES: a leftward climbing staircase, not three piers.
 * One deliberate 2 cm whole/part offset breaks the repeated side
 * matches. The late calculation uses 16 and 15 to produce √481,
 * then subtracts 9² to recover 20, and finally finds √521.
 * This avoids the old reversible 16–30–34, 30–16 pattern.
 */
export function makeNineStepCascade(info){
  const P=p(0,0),Q=p(12,0),R=p(12,5);
  const I=tri("I",[P,Q,R],1,[given(P,Q),given(Q,R)]);
  const II=onHyp(I,R,P,5,12,"II");
  II.givens=[given(R,II.pts[2])];
  const A=II.pts[2],III=attach(II,A,P,"b",9,"III");
  III.givens=[given(P,III.pts[2])];
  const [C,D]=hyp(III),E=between(C,D,13/15);
  const IV=onHyp(III,C,E,5,12,"IV");
  IV.givens=[given(C,IV.pts[2])];
  const F=IV.pts[2],V=attach(IV,F,E,"b",16,"V");
  V.givens=[given(E,V.pts[2])];
  const [G,H]=hyp(V),VI=onHyp(V,G,H,12,16,"VI");
  VI.givens=[given(G,VI.pts[2])];
  const J=VI.pts[2],VII=attach(VI,J,H,"b",15,"VII");
  VII.givens=[given(H,VII.pts[2])];
  const [K,L]=hyp(VII),VIII=onHyp(VII,K,L,9,20,"VIII");
  VIII.givens=[given(K,VIII.pts[2])];
  const M=VIII.pts[2],IX=attach(VIII,M,L,"b",11,"IX");
  IX.givens=[given(L,IX.pts[2])];
  return finish(info,[I,II,III,IV,V,VI,VII,VIII,IX],[],
    hyp(IX),[P,Q],{
    lengthRelations:[relation([C,D],[C,E],[E,D],"PROJECTING OVERHANG")],
    extraSegments:[{...given(E,D),label:"2 CM OVERHANG"}],
    overhang:{a:E,b:D,value:2},
    tags:["Nine linked faces","Climbing offset","New surd reasoning","Full dependency staircase"],
    topology:"nine-face-leaning-offset-cascade",
    architecture:{family:"leaning nine-step cascade",
      summary:"A dense zigzag climbs leftwards from one real foundation; every face unlocks the next",
      features:["one grounded foundation","alternating pitches","one measured overhang","less familiar Pythagorean combinations","single traceable route"]}
  });
}

/** 09 — THE ACROPOLIS: two rectangles placed consecutively, like
 * steps on a staircase, rather than horizontally balancing a bridge.
 * I -> R1 diagonal -> II -> R2 diagonal -> III, then an alternating
 * fan of six further triangles with one explicit 2 cm inset.
 * Both rectangle diagonals are indispensable to the final x = 15.
 */
export function makeSteppedAcropolis(info){
  const P=p(0,0),Q=p(12,0),R=p(12,5);
  const S=p(24,0),T=p(24,5),U=p(24,21),A=p(36,5),B=p(36,21),C=p(36,26);
  const I=tri("I",[P,Q,R],1,[given(P,Q),given(P,R)]);
  const R1=rect("R1",[Q,S,T,R],[Q,T],
    [{a:Q,b:S},{a:S,b:T}]);
  const II=tri("II",[R,T,U],1,[given(R,U)]);
  const R2=rect("R2",[T,A,B,U],[T,B],
    [{a:T,b:A},{a:A,b:B}]);
  const III=tri("III",[U,B,C],1,[given(B,C)]);
  // First roof cap follows the R2 diagonal deduction.
  const IV=onHyp(III,C,U,5,12,"IV");
  IV.givens=[given(C,IV.pts[2])];
  const D=IV.pts[2],E=between(D,U,10/12);
  const V=attach(IV,D,E,"b",6,"V");
  V.givens=[given(E,V.pts[2])];
  const [H,G]=hyp(V),VI=onHyp(V,G,H,10,6,"VI");
  VI.givens=[given(G,VI.pts[2])];
  const J=VI.pts[2],VII=attach(VI,J,H,"b",8,"VII");
  VII.givens=[given(H,VII.pts[2])];
  const [K,L]=hyp(VII),VIII=onHyp(VII,K,L,6,8,"VIII");
  VIII.givens=[given(K,VIII.pts[2])];
  const M=VIII.pts[2],IX=attach(VIII,M,L,"b",15,"IX");
  IX.givens=[given(L,IX.pts[2])];
  const [N,O]=hyp(IX),X=onHyp(IX,N,O,8,15,"X");
  X.givens=[given(N,X.pts[2])];
  return finish(info,[I,II,III,IV,V,VI,VII,VIII,IX,X],
    [R1,R2],[X.pts[2],O],[P,S],{
    fallOrder:["I","R1","II","R2","III","IV","V","VI","VII","VIII","IX","X"],
    extraSegments:[{...given(E,U),label:"2 CM OVERHANG"}],
    lengthRelations:[relation([D,U],[D,E],[E,U],"PROJECTING OVERHANG")],
    // Opposite horizontal rectangle sides really are the same length.
    // Show separate matching tick groups rather than relying on
    // a visually implied (or entirely unmarked) equality.
    equalSideGroups:[
      [{a:R,b:T},{a:Q,b:S}],
      [{a:U,b:B},{a:T,b:A}]
    ],
    overhang:{a:E,b:U,value:2},
    rectangleReasoning:true,
    tags:["Stepped rectangle platforms","Two indispensable diagonals","10 cm sub-side","12 mathematical dependencies"],
    topology:"two-rectangle-dependent-staircase",
    architecture:{family:"double-rectangle staircase",
      summary:"Two linked rectangular steps successively unlock an ascending triangle canopy",
      features:["two physically adjacent stepped rectangles","no bridge between peaks",
        "both rectangle diagonals required","real 2 cm inset","ten linked triangular faces"]}
  });
}
