import { makeSplitPile } from "./pile-variants.js";
import {
  makeCantileverChallenge,makeSuspendedProjectChallenge,
  makeForkAndRejoinChallenge,makeBridgeChallenge,
  makeTerracedMusesChallenge,makePlatformTerraceChallenge,
  makeTwinPlinthAcropolis
} from "./distinct-piles.js";
import { makeGreatInterlock } from "./interlocking-pile.js";
import {
  makeFoldedStaircase,makeRisingZigzag,
  makeNineStepCascade,makeSteppedAcropolis
} from "./reworked-piles.js";
import { assertFullyVisiblePuzzle } from "./pile-visibility.js";

/**
 * Mathematically exact, deliberately stacked triangle piles.
 *
 * The base triangle rests on y=0. Triangle II uses only part of its
 * hypotenuse (so the exposed part is a labelled overhang). Triangle III
 * rests on triangle II's unknown leg; later triangles rest on the
 * previous triangle's hypotenuse. This forms a real pile, not a fan
 * of triangles sharing one ground-level vertex.
 */
export const point = (x,y) => ({x,y});
const vector=(a,b)=>point(b.x-a.x,b.y-a.y);
const length=(a,b)=>Math.hypot(b.x-a.x,b.y-a.y);
const cross=(a,b)=>a.x*b.y-a.y*b.x;
const midpoint=(a,b)=>point((a.x+b.x)/2,(a.y+b.y)/2);

function attachOutside(a,b,other,origin,perpendicularLength){
  const edge=vector(a,b),size=length(a,b);
  const sign=cross(edge,vector(midpoint(a,b),other))>=0?-1:1;
  return point(
    origin.x-sign*edge.y/size*perpendicularLength,
    origin.y+sign*edge.x/size*perpendicularLength
  );
}

export function makeOverhangPile({
  id,title,epithet,difficulty,description,
  base,overhang,upperHypotenuse,legs,colors,overhangMode="inset"
}){
  if(legs.length<1 || legs.length!==colors.length-2){
    throw Error("Each upper triangle requires one perpendicular leg and colour.");
  }
  const P=point(0,0),Q=point(base[0],0),R=point(base[0],base[1]);
  const bottomHypotenuse=length(P,R);
  if(!(overhang>0 && overhang<bottomHypotenuse))throw Error("Invalid overhang.");
  const partial=bottomHypotenuse+(overhangMode==="extension"?overhang:-overhang);
  if(upperHypotenuse<=partial)throw Error("The upper hypotenuse must be longer than the shared part.");
  const T=point(P.x+(R.x-P.x)*partial/bottomHypotenuse,
                P.y+(R.y-P.y)*partial/bottomHypotenuse);
  const missingLeg=Math.sqrt(upperHypotenuse**2-partial**2);
  const U=attachOutside(P,R,Q,T,missingLeg);
  const triangles=[
    {id:"I",pts:[P,Q,R],right:1,color:colors[0],
      givens:[{a:P,b:Q,value:base[0]},{a:Q,b:R,value:base[1]}]},
    {id:"II",pts:[P,T,U],right:1,color:colors[1],
      givens:[{a:P,b:U,value:upperHypotenuse}]}
  ];
  let lower=T,upper=U,last=triangles[1];
  for(let i=0;i<legs.length;i++){
    const previousVertex=last.pts.find(pt=>pt!==lower&&pt!==upper);
    const V=attachOutside(lower,upper,previousVertex,upper,legs[i]);
    const triangle={
      id:["III","IV","V","VI","VII","VIII","IX","X","XI","XII"][i],
      pts:[lower,upper,V],right:1,color:colors[i+2],
      givens:[{a:upper,b:V,value:legs[i]}]
    };
    triangles.push(triangle);
    last=triangle;upper=V;
  }
  const puzzle={
    id,title,epithet,difficulty,description,triangles,
    target:{a:lower,b:upper},floor:{a:P,b:Q},
    overhang:{a:T,b:R,value:overhang},
    extraSegments:[{a:T,b:R,value:overhang,label:"OVERHANG"}],
    lengthRelations:[overhangMode==="extension" ? {
      whole:{a:P,b:T},
      parts:[{a:P,b:R},{a:R,b:T}],
      label:"STRAIGHT-LINE LENGTH"
    } : {
      whole:{a:P,b:R},
      parts:[{a:P,b:T},{a:T,b:R}],
      label:"STRAIGHT-LINE LENGTH"
    }],
    solution:length(lower,upper)
  };
  if(triangles.some(t=>t.pts.some(vertex=>vertex.y< -1e-8))){
    throw Error("A triangle has fallen below the floor.");
  }
  return puzzle;
}

/**
 * Ten structurally distinct puzzle families. Only the gentle single
 * rise and the shared-side Twin Paths retain their original geometry.
 * The remaining eight have independent, authored support architectures.
 */
export const puzzles=[
  Object.assign(makeOverhangPile({
    id:"first-fall",title:"The First Fall",epithet:"THE APPRENTICE",
    difficulty:"INTRODUCTORY",
    description:"Start with one stable foundation. Discover the hypotenuse, remove the inset overhang and climb to a final roof.",
    base:[16,12],overhang:5,upperHypotenuse:17,legs:[6],
    colors:["#d6b06c","#7da7a9","#c48670"]
  }),{
    topology:"single-rise-inset",
    architecture:{family:"single rising spine",summary:"One introductory stack with an inset",
      features:["one grounded base","inset subtraction","rising roof"]}
  }),
  makeCantileverChallenge({
    id:"projecting-edge",title:"The Projecting Edge",epithet:"THE MASON",
    difficulty:"DEVELOPING",
    description:"A cantilever reaches beyond its support. Two different upper arms grow from its edges: which length unlocks the final tip?"
  }),
  Object.assign(makeSplitPile({
    id:"twin-paths",title:"Twin Paths",epithet:"THE SURVEYORS",
    difficulty:"INTERMEDIATE",
    description:"Two smaller roofs share one long sloping side. Follow independent routes and matching marks to reconstruct its length.",
    base:[15,8],sectionLengths:[12,5],legLengths:[5,12],
    hypotenuseGivens:[13,13],equalHypotenuses:true,
    colors:["#d6b06c","#89a8ad","#b78a70"],
    extensions:true,
    tags:["Shared full side","Two upper pieces","Matching side marks"]
  }),{
    topology:"single-base-two-part-cover",
    architecture:{family:"split full side",summary:"Two upper sections exactly cover one diagonal",
      features:["one ground base","two upper roofs","matching ticks"]}
  }),
  makeFoldedStaircase({
    id:"split-project",title:"Split & Project",epithet:"THE BUILDERS",
    difficulty:"ADVANCED",
    description:"Follow a compact uphill fold: use 3–4–5, subtract from 13, find the 2 cm inset and climb to the final roof."
  }),
  makeForkAndRejoinChallenge({
    id:"labyrinth",title:"The Geometer’s Labyrinth",epithet:"THE ARCHITECT",
    difficulty:"EXPERT",
    description:"Two different calculation paths rise around a triangular opening. Their results rejoin to support one final roof."
  }),
  makeRisingZigzag({
    id:"great-pile",title:"The Great Pile Up",epithet:"THE MASTER GEOMETER",
    difficulty:"MASTER CHALLENGE",
    description:"Six right triangles climb in an alternating zigzag. Each newly discovered side unlocks the next face."
  }),
  makeNineStepCascade({
    id:"nine-muses",title:"The Nine Muses",epithet:"THE ACADEMY",
    difficulty:"MASTER CHALLENGE",
    description:"Nine linked triangles lean upwards like a stepped sculpture. The single marked 2 cm offset opens the middle tier."
  }),
  makePlatformTerraceChallenge({
    id:"marble-terrace",title:"The Marble Terrace",epithet:"THE MASTER BUILDER",
    difficulty:"MASTER CHALLENGE",
    description:"A broad rectangle is the foundation. Its diagonal reveals a split rooftop carrying two staggered towers."
  }),
  makeSteppedAcropolis({
    id:"acropolis",title:"The Acropolis",epithet:"THE GRAND ARCHITECT",
    difficulty:"GRAND CHALLENGE",
    description:"Two rectangular platforms rise one after the other. Each diagonal is essential before the zigzag canopy can be solved."
  }),
  makeGreatInterlock({
    id:"great-interlock",title:"The Great Interlock",epithet:"THE MASTERPIECE",
    difficulty:"GRAND CHALLENGE",
    description:"Thirteen triangles meet at unusual angles. Start from two distant foundations, follow the short offsets and reunited diagonals, then discover the long horizontal roof."
  })
];

// Lightweight metadata shared by the home page and individual challenges.
for(const puzzle of puzzles){
  assertFullyVisiblePuzzle(puzzle);
  if(!puzzle.tags){
    puzzle.tags=puzzle.id==="first-fall"?["Inset overhang","First calculation"]:
      ["Independent supports","Exact lengths"];
  }
  puzzle.topology=puzzle.topology||(puzzle.lengthRelations?.length>1?"split-and-overhang":
    puzzle.equalSideGroups?.length?"equal-sides":
    puzzle.spanHighlight?"shared-split-side":"overhang-chain");
}
