/** Invisible right-triangle decompositions of real rectangle pieces.
 * They power the mathematics and dashed diagonal without obscuring a
 * rectangle's interior with a coloured triangular overlay.
 */
export function rectangleVirtualTriangles(puzzle){
  return (puzzle.rectangles||[]).flatMap(rect=>{
    const [a,b,c,d]=rect.pts;
    return (rect.diagonals||[]).flatMap((diagonal,i)=>{
      if(diagonal.a!==a||diagonal.b!==c)
        throw Error("Rectangle diagonals must connect the first and third corners.");
      return [
        {id:rect.id+"-DIAG-"+i+"A",pts:[a,b,c],right:1,givens:[]},
        {id:rect.id+"-DIAG-"+i+"B",pts:[a,d,c],right:1,givens:[]}
      ];
    });
  });
}
export function rectangleOppositePairs(rect){
  const [a,b,c,d]=rect.pts;
  return [
    [{a,b},{a:c,b:d}],
    [{a:b,b:c},{a:d,b:a}]
  ];
}
export function rectangleIsValid(rect,epsilon=1e-7){
  if(!rect || !Array.isArray(rect.pts)||rect.pts.length!==4)return false;
  const q=rect.pts;
  if(q.some(p=>!Number.isFinite(p.x)||!Number.isFinite(p.y)))return false;
  const edges=q.map((p,i)=>({x:q[(i+1)%4].x-p.x,y:q[(i+1)%4].y-p.y}));
  const l=edges.map(z=>Math.hypot(z.x,z.y));
  if(l.some(x=>x<epsilon))return false;
  for(let i=0;i<4;i++){
    const a=edges[i],b=edges[(i+1)%4];
    if(Math.abs(a.x*b.x+a.y*b.y)>epsilon*Math.max(1,l[i]*l[(i+1)%4]))return false;
  }
  return Math.abs(l[0]-l[2])<epsilon && Math.abs(l[1]-l[3])<epsilon;
}
