/**
 * 2D affine transform  x' = a*x + b*y + c,  y' = d*x + e*y + f.
 * Fitted by least squares from 3+ point pairs, so a few sloppy clicks average out.
 */
export type Affine = readonly [a: number, b: number, c: number, d: number, e: number, f: number];
export type Pt = readonly [number, number];

export const IDENTITY: Affine = [1, 0, 0, 0, 1, 0];

export function applyAffine(m: Affine, p: Pt): [number, number] {
  return [m[0] * p[0] + m[1] * p[1] + m[2], m[3] * p[0] + m[4] * p[1] + m[5]];
}

export function invertAffine(m: Affine): Affine {
  const [a, b, c, d, e, f] = m;
  const det = a * e - b * d;
  if (Math.abs(det) < 1e-12) throw new Error("Affine transform is not invertible (control points are collinear?)");
  const ia = e / det;
  const ib = -b / det;
  const id = -d / det;
  const ie = a / det;
  return [ia, ib, -(ia * c + ib * f), id, ie, -(id * c + ie * f)];
}

/** Solve the 3x3 system M v = r with Cramer's rule. */
function solve3(M: number[][], r: number[]): [number, number, number] {
  const det = (m: number[][]) =>
    m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) -
    m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) +
    m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]);
  const D = det(M);
  if (Math.abs(D) < 1e-12) throw new Error("Control points are collinear or duplicated: pick landmarks spread across the map.");
  const col = (i: number) => M.map((row, k) => row.map((v, j) => (j === i ? r[k] : v)));
  return [det(col(0)) / D, det(col(1)) / D, det(col(2)) / D];
}

/** Least-squares fit of `from` -> `to`. Needs 3+ non-collinear pairs. */
export function fitAffine(pairs: readonly { from: Pt; to: Pt }[]): Affine {
  if (pairs.length < 3) throw new Error("Need at least 3 control points.");
  // Normal equations: (A^T A) v = A^T t, with rows [x, y, 1].
  const ata = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
  ];
  const atx = [0, 0, 0];
  const aty = [0, 0, 0];
  for (const { from, to } of pairs) {
    const row = [from[0], from[1], 1];
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) ata[i][j] += row[i] * row[j];
      atx[i] += row[i] * to[0];
      aty[i] += row[i] * to[1];
    }
  }
  const [a, b, c] = solve3(ata, atx);
  const [d, e, f] = solve3(ata, aty);
  return [a, b, c, d, e, f];
}

/** Largest distance (in normalized units) between a fitted point and where it was clicked. */
export function maxResidual(m: Affine, pairs: readonly { from: Pt; to: Pt }[]): number {
  return pairs.reduce((worst, { from, to }) => {
    const [x, y] = applyAffine(m, from);
    return Math.max(worst, Math.hypot(x - to[0], y - to[1]));
  }, 0);
}
