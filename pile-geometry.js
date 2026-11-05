import { makeSplitPile, makeCrownPile } from "./pile-variants.js";
import { makeRectangleChallenge } from "./advanced-piles.js";
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

export const puzzles=[
  makeOverhangPile({
    id:"first-fall",title:"The First Fall",epithet:"THE APPRENTICE",
    difficulty:"INTRODUCTORY",
    description:"Three stacked triangles. Find the hypotenuse, subtract an inset overhang and discover the final length.",
    base:[16,12],overhang:5,upperHypotenuse:17,legs:[6],
    colors:["#d6b06c","#7da7a9","#c48670"],
  }),
  makeOverhangPile({
    id:"projecting-edge",title:"The Projecting Edge",epithet:"THE MASON",
    difficulty:"DEVELOPING",
    description:"Four triangles. An upper side projects beyond its support, and the final answer is an exact surd.",
    base:[16,12],overhang:4,overhangMode:"extension",upperHypotenuse:26,legs:[24,7],
    colors:["#d6b06c","#79a9a0","#b77d6b","#9e9ab9"],
  }),
  makeSplitPile({
    id:"twin-paths",title:"Twin Paths",epithet:"THE SURVEYORS",
    difficulty:"INTERMEDIATE",
    description:"One long side is shared by two shorter sides. Follow two independent calculations, then combine their results.",
    base:[15,8],sectionLengths:[12,5],legLengths:[5,12],
    hypotenuseGivens:[13,13],equalHypotenuses:true,
    colors:["#d6b06c","#89a8ad","#b78a70"],
    extensions:true,
    tags:["Two starting points","Matching side marks","Perimeter & area"]
  }),
  makeSplitPile({
    id:"split-project",title:"Split & Project",epithet:"THE BUILDERS",
    difficulty:"ADVANCED",
    description:"Two smaller sides cover one long diagonal—but one projects beyond the end. Can you reconstruct the hidden length?",
    base:[20,15],sectionLengths:[12,15],legLengths:[5,8],
    hypotenuseGivens:[13,17],finalExtension:2,
    colors:["#d6b06c","#8caeaa","#bb8573"],
    extensions:true,
    tags:["Two-side overlap","Projecting overhang","Perimeter & area"]
  }),
  makeOverhangPile({
    id:"labyrinth",title:"The Geometer’s Labyrinth",epithet:"THE ARCHITECT",
    difficulty:"EXPERT",
    description:"Five stacked triangles. Trace a projecting overhang through several linked applications of Pythagoras.",
    base:[16,12],overhang:4,overhangMode:"extension",upperHypotenuse:26,legs:[8,6,9],
    colors:["#d6b06c","#7aa9a2","#bb8373","#979fc1","#aa9983"]
  }),
  makeCrownPile({
    id:"great-pile",title:"The Great Pile Up",epithet:"THE MASTER GEOMETER",
    difficulty:"MASTER CHALLENGE",
    description:"A long side bridges two smaller triangle sides, before an upper chain leads to one final surd.",
    colors:["#d6b06c","#7aa9a2","#c18a78","#979fc1","#b1a07c"],
    tags:["Two-side bridge","Branches converge","Exact surds"]
  }),
  makeOverhangPile({
    id:"nine-muses",title:"The Nine Muses",epithet:"THE ACADEMY",
    difficulty:"MASTER CHALLENGE",
    description:"Nine right triangles weave around a projecting edge. Follow the long chain through increasingly complex exact lengths.",
    base:[16,12],overhang:4,overhangMode:"extension",upperHypotenuse:26,
    legs:[8,6,9,5,4,7,3],
    colors:["#d6b06c","#7aa9a2","#bb8373","#979fc1","#aa9983","#8bac91","#c5a5a0","#a29bba","#bcac7c"],
    tags:["9 right triangles","Long chain","Overhang","Exact surds"]
  }),
  makeRectangleChallenge({
    id:"marble-terrace",title:"The Marble Terrace",epithet:"THE MASTER BUILDER",
    difficulty:"MASTER CHALLENGE",
    description:"Eight right triangles climb from a rectangle. First use its diagonal to unlock the missing roof length.",
    firstSteps:[{at:"b",leg:5},{at:"a",leg:5},{at:"a",leg:5},
      {at:"b",leg:6},{at:"b",leg:6},{at:"a",leg:6}],
    tags:["8 right triangles","1 rectangle","Diagonal reasoning"]
  }),
  makeRectangleChallenge({
    id:"acropolis",title:"The Acropolis",epithet:"THE GRAND ARCHITECT",
    difficulty:"GRAND CHALLENGE",
    description:"Ten right triangles and two rectangles. Each diagonal unlocks a new section of the structure.",
    firstSteps:[{at:"b",leg:5},{at:"a",leg:5},{at:"a",leg:5}],
    second:{depth:4,edge:"left",at:"b",leg:5,
      steps:[{at:"a",leg:4},{at:"a",leg:4},{at:"b",leg:4},{at:"b",leg:4}]},
    tags:["10 right triangles","2 rectangles","Two diagonals","Extended chain"]
  })
];

// Lightweight metadata shared by the home page and individual challenges.
for(const puzzle of puzzles){
  assertFullyVisiblePuzzle(puzzle);
  if(!puzzle.tags){
    puzzle.tags=puzzle.id==="first-fall"?["Overhang","Missing shorter side"] :
      puzzle.id==="projecting-edge"?["Projecting overhang","Exact value"] :
      ["Long chain","Exact surds"];
  }
  puzzle.topology=puzzle.topology||(puzzle.lengthRelations?.length>1?"split-and-overhang":
    puzzle.equalSideGroups?.length?"equal-sides":
    puzzle.spanHighlight?"shared-split-side":"overhang-chain");
}
