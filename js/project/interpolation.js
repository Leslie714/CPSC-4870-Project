import { se3_exp, se3_log } from "./lie.js";

function vec_sub(a, b) {
  return a.map((v, i) => v - b[i]);
}
function vec_add(a, b) {
  return a.map((v, i) => v + b[i]);
}
function vec_scale(a, s) {
  return a.map((v) => v * s);
}
function vec_lerp(a, b, t) {
  return a.map((v, i) => v + (b[i] - v) * t);
}

// map u to the segment index
function locate(u, n) {
  const last = n - 1;
  if (u <= 0) return { i: 0, u: 0 };
  if (u >= last) return { i: last - 1, u: 1 };
  const i = Math.floor(u);
  return { i, u: u - i };
}

// precompute the log of each knots to not log every frame
export function buildLieAlgebraSamples(knots) {
  return knots.map((T) => se3_log(T));
}

// use bezier cubric
export function interpolateBezierLie(knotsXi, u) {
  const n = knotsXi.length;
  const { i, u: t } = locate(u, n);

  const Km1 = knotsXi[Math.max(i - 1, 0)];
  const K0 = knotsXi[i];
  const K1 = knotsXi[i + 1];
  const K2 = knotsXi[Math.min(i + 2, n - 1)];

  const B0 = K0;
  const B1 = vec_add(K0, vec_scale(vec_sub(K1, Km1), 1 / 6));
  const B2 = vec_sub(K1, vec_scale(vec_sub(K2, K0), 1 / 6));
  const B3 = K1;

  // evaluate the cubic Bezier at t
  const a = vec_lerp(B0, B1, t);
  const b = vec_lerp(B1, B2, t);
  const c = vec_lerp(B2, B3, t);
  const d = vec_lerp(a, b, t);
  const e = vec_lerp(b, c, t);
  const xi = vec_lerp(d, e, t);

  return se3_exp(xi);
}
