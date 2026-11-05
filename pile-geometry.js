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
      id:["III","IV","V","VI","VII"][i],
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
    description:"Three stacked triangles, a labelled overhang and a hidden final length. Find the starting point and follow the chain.",
    base:[16,12],overhang:5,upperHypotenuse:17,legs:[6],
    colors:["#d6b06c","#7da7a9","#c48670"]
  }),
  makeOverhangPile({
    id:"labyrinth",title:"The Geometer’s Labyrinth",epithet:"THE ARCHITECT",
    difficulty:"CHALLENGE",
    description:"Five stacked triangles, including a projecting overhang. Combine straight-line lengths and linked Pythagoras calculations.",
    base:[16,12],overhang:4,overhangMode:"extension",upperHypotenuse:26,legs:[8,6,9],
    colors:["#d6b06c","#7aa9a2","#bb8373","#979fc1","#aa9983"]
  })
];