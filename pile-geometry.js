/**
 * Authored, exactly right-angled piles.
 *
 * The base triangle rests on the floor (y=0). The next triangle uses
 * only part of the base triangle's hypotenuse. Its uncovered section
 * is a labelled overhang, and the full/part/overhang relationship is
 * necessary to reach the final target.
 */
export const point = (x, y) => ({ x, y });
const vector = (a, b) => point(b.x - a.x, b.y - a.y);
const length = (a, b) => Math.hypot(b.x - a.x, b.y - a.y);
const cross = (a, b) => a.x * b.y - a.y * b.x;
const midpoint = (a, b) => point((a.x + b.x) / 2, (a.y + b.y) / 2);

function attachOutside(a, b, other, origin, perpendicularLength) {
  const edge = vector(a, b);
  const edgeLength = length(a, b);
  // Put the new third vertex on the other side of the shared edge.
  const sign = cross(edge, vector(midpoint(a, b), other)) >= 0 ? -1 : 1;
  return point(
    origin.x - sign * edge.y / edgeLength * perpendicularLength,
    origin.y + sign * edge.x / edgeLength * perpendicularLength
  );
}

export function makeOverhangPile({
  id, title, epithet, difficulty, description,
  base, overhang, legs, colors
}) {
  if (legs.length < 2 || legs.length !== colors.length - 1) {
    throw Error("Each upper triangle requires one leg length and one colour.");
  }
  const P = point(0, 0), Q = point(base[0], 0), R = point(base[0], base[1]);
  const baseHypotenuse = length(P, R);
  if (!(overhang > 0 && overhang < baseHypotenuse)) throw Error("Invalid overhang.");
  const partial = baseHypotenuse - overhang;
  const T = point(P.x + (R.x - P.x) * partial / baseHypotenuse,
                  P.y + (R.y - P.y) * partial / baseHypotenuse);
  const U = attachOutside(P, R, Q, T, legs[0]);

  const triangles = [
    { id: "I", pts: [P, Q, R], right: 1, color: colors[0],
      givens: [{ a: P, b: Q, value: base[0] },
               { a: Q, b: R, value: base[1] }] },
    { id: "II", pts: [P, T, U], right: 1, color: colors[1],
      givens: [{ a: T, b: U, value: legs[0] }] }
  ];
  let last = triangles[1];
  let top = U;

  for (let i = 1; i < legs.length; i++) {
    const other = last.pts[1];
    const next = attachOutside(P, top, other, top, legs[i]);
    const triangle = {
      id: ["III", "IV", "V", "VI", "VII"][i - 1],
      pts: [P, top, next], right: 1, color: colors[i + 1],
      givens: [{ a: top, b: next, value: legs[i] }]
    };
    triangles.push(triangle);
    last = triangle;
    top = next;
  }

  const puzzle = {
    id, title, epithet, difficulty, description, triangles,
    target: { a: P, b: top }, floor: { a: P, b: Q },
    overhang: { a: T, b: R, value: overhang },
    extraSegments: [{ a: T, b: R, value: overhang, label: "OVERHANG" }],
    lengthRelations: [{
      whole: { a: P, b: R },
      parts: [{ a: P, b: T }, { a: T, b: R }],
      label: "STRAIGHT-LINE LENGTH"
    }],
    solution: length(P, top)
  };
  if (triangles.some(triangle =>
    triangle.pts.some(vertex => vertex.y < -1e-8))) {
    throw Error("A triangle has fallen below the floor.");
  }
  return puzzle;
}

export const puzzles = [
  makeOverhangPile({
    id: "first-fall",
    title: "The First Fall",
    epithet: "THE APPRENTICE",
    difficulty: "INTRODUCTORY",
    description: "Three right triangles, a small overhang and one final length. Discover which measurement unlocks the next.",
    base: [12, 9], overhang: 3,
    legs: [5, 7],
    colors: ["#d6b06c", "#7da7a9", "#c48670"]
  }),
  makeOverhangPile({
    id: "labyrinth",
    title: "The Geometer’s Labyrinth",
    epithet: "THE ARCHITECT",
    difficulty: "CHALLENGE",
    description: "Five interconnected triangles. The labelled overhang is the key to an increasingly demanding chain.",
    base: [16, 12], overhang: 4,
    legs: [8, 7, 6, 8],
    colors: ["#d6b06c", "#7aa9a2", "#bb8373", "#979fc1", "#aa9983"]
  })
];