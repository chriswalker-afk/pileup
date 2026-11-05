import { rectangleVirtualTriangles,rectangleOppositePairs,rectangleIsValid } from "./rectangle-math.js";

/**
 * Pure mathematical helpers for Pythagoras Pile Up.
 * These functions do not access the DOM or browser storage.
 */
const EPSILON = 1e-7;

export function pointKey(point) {
  return Number(point.x.toFixed(8)) + "," + Number(point.y.toFixed(8));
}
export function sideKey(a, b) {
  return [pointKey(a), pointKey(b)].sort().join("|");
}
export function sideLength(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function buildSides(puzzle) {
  const sides = new Map();
  const register = (a, b) => {
    const key = sideKey(a, b);
    if (!sides.has(key)) sides.set(key, {
      key, a, b, length: sideLength(a, b), given: false,
      triangleIds: [], isTarget: false, isOverhang: false
    });
    return sides.get(key);
  };
  const markGiven = (measurement, overhang = false) => {
    const side = register(measurement.a, measurement.b);
    if (Math.abs(side.length - measurement.value) > EPSILON) {
      throw Error("An incorrect given length was provided.");
    }
    side.given = true;
    side.givenValue = measurement.value;
    if (overhang) side.isOverhang = true;
  };
  for (const triangle of [...puzzle.triangles,...rectangleVirtualTriangles(puzzle)]) {
    const pts = triangle.pts;
    for (const [i, j] of [[0, 1], [1, 2], [2, 0]]) {
      const side = register(pts[i], pts[j]);
      if (!side.triangleIds.includes(triangle.id)) side.triangleIds.push(triangle.id);
    }
    for (const measurement of triangle.givens) markGiven(measurement);
  }
  for(const rect of puzzle.rectangles||[]){
    if(!rectangleIsValid(rect))throw Error("Invalid rectangle "+rect.id);
    const pts=rect.pts;
    for(let i=0;i<4;i++){
      const s=register(pts[i],pts[(i+1)%4]);
      if(!s.triangleIds.includes(rect.id))s.triangleIds.push(rect.id);
    }
    for(const diagonal of rect.diagonals||[]){
      const s=register(diagonal.a,diagonal.b);
      if(!s.triangleIds.includes(rect.id))s.triangleIds.push(rect.id);
      s.isRectangleDiagonal=true;
    }
    for(const measurement of rect.givens||[])markGiven(measurement);
    for(const descriptor of rect.suppressLabels||[]){
      register(descriptor.a,descriptor.b).suppressLabel=true;
    }
  }
  // Extra measured segments are not necessarily overhangs. A marked
  // foundation span is a genuine given length but must not inherit the
  // overhang's visual treatment or interpretation.
  for (const extra of puzzle.extraSegments || []){
    markGiven(extra,/overhang/i.test(extra.label||""));
  }
  for (const relation of puzzle.lengthRelations || []) {
    const whole = register(relation.whole.a, relation.whole.b);
    const parts = relation.parts.map(s => register(s.a, s.b));
    const total = parts.reduce((sum, part) => sum + part.length, 0);
    if (Math.abs(total - whole.length) > EPSILON) {
      throw Error("Overhang parts must add to the complete straight side.");
    }
    const A = whole.a, B = whole.b, ABx = B.x - A.x, ABy = B.y - A.y;
    const magnitude = whole.length;
    for (const part of parts) {
      for (const point of [part.a, part.b]) {
        const APx = point.x - A.x, APy = point.y - A.y;
        const distance = Math.abs(ABx * APy - ABy * APx) / magnitude;
        const projection = (ABx * APx + ABy * APy) / magnitude;
        if (distance > EPSILON || projection < -EPSILON || projection > magnitude + EPSILON) {
          throw Error("An overhang segment must lie on the straight side.");
        }
      }
    }
  }
  for(const group of puzzle.equalSideGroups || []){
    if(group.length<2)throw Error("An equal-side group needs at least two edges.");
    const members=group.map(s=>sides.get(sideKey(s.a,s.b)));
    if(members.some(s=>!s))throw Error("An equal-side mark references an unknown edge.");
    if(members.some(s=>Math.abs(s.length-members[0].length)>EPSILON)){
      throw Error("Equal marks must identify genuinely equal lengths.");
    }
    members.forEach(s=>s.equalMark=true);
  }
  const targetKey = sideKey(puzzle.target.a, puzzle.target.b);
  if (!sides.has(targetKey)) throw Error("The target must be an edge of a triangle.");
  sides.get(targetKey).isTarget = true;
  return sides;
}

/** Automatically carry equal opposite rectangle sides into the
 * student's discovered measurements. These equalities follow from
 * the rectangle rather than requiring repetitive answer submissions.
 */
export function propagateRectangleSides(puzzle,sides,solved){
  let changed=true,count=0;
  while(changed){
    changed=false;
    for(const rect of puzzle.rectangles||[]){
      for(const pair of rectangleOppositePairs(rect)){
        const members=pair.map(s=>sides.get(sideKey(s.a,s.b)));
        for(let i=0;i<2;i++){
          const candidate=members[i],other=members[1-i];
          if(!candidate.given&&!solved.has(candidate.key) && isKnown(other,solved)){
            solved.add(candidate.key);changed=true;count++;
          }
        }
      }
    }
  }
  return count;
}

export function sidesOfTriangle(triangle, sides) {
  return [
    sides.get(sideKey(triangle.pts[0], triangle.pts[1])),
    sides.get(sideKey(triangle.pts[1], triangle.pts[2])),
    sides.get(sideKey(triangle.pts[2], triangle.pts[0]))
  ];
}
export function hypotenuseOf(triangle, sides) {
  const opposite = triangle.pts.filter((_, i) => i !== triangle.right);
  return sides.get(sideKey(opposite[0], opposite[1]));
}
export function isKnown(side, solved) {
  return side.given || solved.has(side.key);
}
export function readySteps(puzzle, sides, solved) {
  const candidates = [];
  for (const triangle of [...puzzle.triangles,...rectangleVirtualTriangles(puzzle)]) {
    const edges = sidesOfTriangle(triangle, sides);
    const missing = edges.filter(side => !isKnown(side, solved));
    if (missing.length === 1) {
      const known = edges.filter(side => isKnown(side, solved));
      if (known.length === 2) {
        candidates.push(makeStep(triangle, missing[0], known, sides));
      }
    }
  }
  // Length along a straight line: whole = first part + overhang.
  // The student may solve any of the three lengths when the other two are known.
  for (const relation of puzzle.lengthRelations || []) {
    const whole = sides.get(sideKey(relation.whole.a, relation.whole.b));
    const parts = relation.parts.map(part => sides.get(sideKey(part.a, part.b)));
    const group = [whole, ...parts];
    const missing = group.filter(side => !isKnown(side, solved));
    if (missing.length !== 1) continue;
    const answer = missing[0];
    const known = group.filter(side => isKnown(side, solved));
    const isWhole = answer.key === whole.key;
    const otherPart = parts.find(s => s.key !== answer.key);
    const equation = isWhole ?
      "s = " + parts.map(s => exactLength(s.length)).join(" + ") :
      "s = " + exactLength(whole.length) + " − " + exactLength(otherPart.length);
    candidates.push({
      kind: relation.label==="TWO SHARED SECTIONS"?"split":"overhang",
      triangleId: relation.label==="TWO SHARED SECTIONS"?"STRAIGHT EDGE":"OVERHANG",
      sideKey: answer.key,
      isTarget: answer.isTarget,
      isHypotenuse: false,
      known: known.map(s => s.key),
      equation,
      answer: exactLength(answer.length),
      length: answer.length
    });
  }
  // Opposite rectangle edges have equal lengths. This is a true
  // mathematical dependency, not an automatically supplied number.
  for(const rect of puzzle.rectangles||[]){
    for(const pair of rectangleOppositePairs(rect)){
      const edges=pair.map(d=>sides.get(sideKey(d.a,d.b)));
      for(let j=0;j<2;j++){
        const missing=edges[j],known=edges[1-j];
        if(!isKnown(missing,solved)&&isKnown(known,solved)){
          candidates.push({
            kind:"rectangle-opposite",triangleId:rect.id,sideKey:missing.key,
            isTarget:missing.isTarget,isHypotenuse:false,
            known:[known.key],answer:exactLength(missing.length),length:missing.length,
            equation:"s = "+exactLength(known.length)+" (opposite rectangle sides)"
          });
        }
      }
    }
  }
  // Equal tick marks: use one discovered side to deduce its match,
  // without requiring a new Pythagoras calculation.
  for(const group of puzzle.equalSideGroups || []){
    const members=group.map(item=>sides.get(sideKey(item.a,item.b)));
    const known=members.filter(side=>isKnown(side,solved));
    const unknown=members.filter(side=>!isKnown(side,solved));
    if(!known.length)continue;
    for(const side of unknown){
      candidates.push({
        kind:"equal",triangleId:"MATCHING MARKS",
        sideKey:side.key,isTarget:side.isTarget,isHypotenuse:false,
        known:[known[0].key],
        equation:"s = "+exactLength(known[0].length)+" (matching tick marks)",
        answer:exactLength(side.length),length:side.length
      });
    }
  }
  return candidates;
}

export function exactLength(value) {
  if (!Number.isFinite(value)) return "?";
  const squared = value * value;
  const n = Math.round(squared);
  if (n > 0 && n <= 1000000 && Math.abs(squared - n) < 1e-6) {
    const whole = Math.round(Math.sqrt(n));
    if (whole * whole === n) return String(whole);
    for (let factor = Math.floor(Math.sqrt(n)); factor >= 2; factor--) {
      const square = factor * factor;
      if (n % square === 0) {
        const remainder = n / square;
        return String(factor) + "√" + String(remainder);
      }
    }
    return "√" + String(n);
  }
  return String(Number(value.toPrecision(6)));
}
export function labelForSide(side) {
  return exactLength(side.length);
}
function makeStep(triangle, missing, known, sides) {
  const hyp = hypotenuseOf(triangle, sides);
  const isHypotenuse = missing.key === hyp.key;
  let expression;
  if (isHypotenuse) {
    expression = "(" + exactLength(known[0].length) + ")² + (" + exactLength(known[1].length) + ")²";
  } else {
    const leg = known.find(item => item.key !== hyp.key);
    if (!leg) throw Error("Expected a known leg and hypotenuse.");
    expression = "(" + exactLength(hyp.length) + ")² − (" + exactLength(leg.length) + ")²";
  }
  return {
    kind: triangle.id.includes("-DIAG-")?"rectangle-diagonal":"pythagoras",
    triangleId: triangle.id,
    sideKey: missing.key,
    isTarget: missing.isTarget,
    isHypotenuse,
    known: known.map(item => item.key),
    equation: (missing.isTarget ? "x" : "s") + "² = " + expression,
    answer: exactLength(missing.length),
    length: missing.length
  };
}
export function solutionSteps(puzzle, sides = buildSides(puzzle)) {
  const solved = new Set(), steps = [];
  const total = [...sides.values()].filter(side => !side.given).length;
  for (let i = 0; i < total; i++) {
    const ready = readySteps(puzzle, sides, solved).filter(step => !solved.has(step.sideKey));
    if (!ready.length) throw Error("This puzzle does not have a complete valid solution chain.");
    const chosen = ready[0];
    solved.add(chosen.sideKey);
    steps.push(chosen);
  }
  return steps;
}

function tokenize(raw) {
  const normalized = raw
    .toLowerCase()
    .replace(/\\sqrt\s*\{/g, "sqrt(")
    .replace(/[{}]/g, match => match === "{" ? "(" : ")")
    .replace(/√/g, "sqrt")
    .replace(/[×·]/g, "*")
    .replace(/÷/g, "/")
    .replace(/[−–]/g, "-")
    .replace(/\s*cm\s*$/i, "")
    .trim();
  if (!normalized || normalized.length > 90) return null;
  const result = [];
  const regex = /\s*(sqrt|(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?|[()+\-*/^])/iy;
  let pos = 0;
  while (pos < normalized.length) {
    regex.lastIndex = pos;
    const match = regex.exec(normalized);
    if (!match || regex.lastIndex <= pos) return null;
    result.push(match[1]);
    pos = regex.lastIndex;
    if (result.length > 70) return null;
  }
  const tokens = [];
  for (const token of result) {
    const prev = tokens[tokens.length - 1];
    const implicit = prev && (prev === ")" || /^\d|^\./.test(prev)) && (token === "sqrt" || token === "(");
    if (implicit) tokens.push("*");
    tokens.push(token);
  }
  return tokens;
}

export function parseAnswer(raw) {
  if (typeof raw !== "string") return null;
  const tokens = tokenize(raw);
  if (!tokens) return null;
  let i = 0;
  const peek = () => tokens[i];
  const take = () => tokens[i++];
  function atom() {
    const token = take();
    if (token === "+" || token === "-") {
      const next = atom();
      return token === "-" ? -next : next;
    }
    if (token === "sqrt") return Math.sqrt(atom());
    if (token === "(") {
      const result = expression();
      if (take() !== ")") throw Error("Missing closing bracket.");
      return result;
    }
    if (token === undefined || !/^(?:\d|\.)/.test(token)) throw Error("Invalid number.");
    return Number(token);
  }
  function power() {
    let value = atom();
    if (peek() === "^") {
      take();
      value = Math.pow(value, power());
    }
    return value;
  }
  function product() {
    let value = power();
    while (peek() === "*" || peek() === "/") {
      const operator = take(), right = power();
      value = operator === "*" ? value * right : value / right;
    }
    return value;
  }
  function expression() {
    let value = product();
    while (peek() === "+" || peek() === "-") {
      const operator = take(), right = product();
      value = operator === "+" ? value + right : value - right;
    }
    return value;
  }
  try {
    const answer = expression();
    if (i !== tokens.length || !Number.isFinite(answer) || answer < 0) return null;
    return answer;
  } catch (_) {
    return null;
  }
}

export function correctAnswer(raw, expected) {
  const value = parseAnswer(raw);
  if (value === null || !Number.isFinite(expected) || expected < 0) return false;
  if (Math.abs(value - expected) < 1e-8 * Math.max(1, expected)) return true;
  const cleaned = raw.trim().toLowerCase().replace(/\s*cm\s*$/i, "").replace(/\s+/g, "");
  if (/^\d+(?:\.\d+)?$/.test(cleaned)) {
    // The next three forms are accepted: 3 s.f., 2 d.p., or a more precise decimal.
    if (value === Number(expected.toPrecision(3))) return true;
    const decimals = cleaned.split(".")[1]?.length ?? 0;
    if (decimals >= 2 && decimals <= 10 && value === Number(expected.toFixed(decimals))) return true;
  }
  return false;
}

export function puzzleIsValid(puzzle) {
  const sides = buildSides(puzzle);
  for(const rect of puzzle.rectangles||[])if(!rectangleIsValid(rect))return false;
  for (const triangle of [...puzzle.triangles,...rectangleVirtualTriangles(puzzle)]) {
    const corner = triangle.pts[triangle.right];
    const ends = triangle.pts.filter((_, i) => i !== triangle.right);
    const ax = ends[0].x - corner.x, ay = ends[0].y - corner.y;
    const bx = ends[1].x - corner.x, by = ends[1].y - corner.y;
    if (Math.abs(ax * bx + ay * by) > EPSILON) return false;
  }
  if (puzzle.floor && (Math.abs(puzzle.floor.a.y - puzzle.floor.b.y) > EPSILON || puzzle.triangles.some(t => t.pts.some(v => v.y < puzzle.floor.a.y - EPSILON)))) return false;
  return solutionSteps(puzzle, sides).length === [...sides.values()].filter(side => !side.given).length;
}
