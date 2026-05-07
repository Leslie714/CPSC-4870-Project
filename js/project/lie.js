import {
  add_matrix_matrix,
  mul_matrix_matrix,
  mul_matrix_scalar,
  identity_matrix,
} from "../utils/utils_math.js";

const EPS = 1e-9;

// skew symmetric matric [w]_x
export function hat(w) {
  return [
    [0, -w[2], w[1]],
    [w[2], 0, -w[0]],
    [-w[1], w[0], 0],
  ];
}

// SO(3) exponential map
export function so3_exp(w) {
  const theta = Math.hypot(w[0], w[1], w[2]);
  const W = hat(w);

  const W2 = mul_matrix_matrix(W, W);
  const a = Math.sin(theta) / theta;
  const b = (1 - Math.cos(theta)) / (theta * theta);

  return add_matrix_matrix(
    add_matrix_matrix(identity_matrix(3), mul_matrix_scalar(W, a)),
    mul_matrix_scalar(W2, b),
  );
}

// SO(3) log and inverse of SO(3) exponential map
export function so3_log(R) {
  const tr = R[0][0] + R[1][1] + R[2][2];
  let c = (tr - 1) / 2;
  if (c > 1) c = 1;
  if (c < -1) c = -1;
  const theta = Math.acos(c);
  if (theta < EPS) {
    return [
      (R[2][1] - R[1][2]) / 2,
      (R[0][2] - R[2][0]) / 2,
      (R[1][0] - R[0][1]) / 2,
    ];
  }
  const k = theta / (2 * Math.sin(theta));
  return [
    k * (R[2][1] - R[1][2]),
    k * (R[0][2] - R[2][0]),
    k * (R[1][0] - R[0][1]),
  ];
}

// SE(3) exponential map
export function se3_exp(twist) {
  const v = [twist[0], twist[1], twist[2]];
  const w = [twist[3], twist[4], twist[5]];
  const theta = Math.hypot(w[0], w[1], w[2]);
  const R = so3_exp(w);

  let V;
  if (theta < EPS) {
    V = identity_matrix(3);
  } else {
    const W = hat(w);
    const W2 = mul_matrix_matrix(W, W);
    const a = (1 - Math.cos(theta)) / (theta * theta);
    const b = (theta - Math.sin(theta)) / (theta * theta * theta);
    V = add_matrix_matrix(
      add_matrix_matrix(identity_matrix(3), mul_matrix_scalar(W, a)),
      mul_matrix_scalar(W2, b),
    );
  }
  const t = [
    V[0][0] * v[0] + V[0][1] * v[1] + V[0][2] * v[2],
    V[1][0] * v[0] + V[1][1] * v[1] + V[1][2] * v[2],
    V[2][0] * v[0] + V[2][1] * v[1] + V[2][2] * v[2],
  ];
  return [
    [R[0][0], R[0][1], R[0][2], t[0]],
    [R[1][0], R[1][1], R[1][2], t[1]],
    [R[2][0], R[2][1], R[2][2], t[2]],
    [0, 0, 0, 1],
  ];
}

// SE(3) logarithm
export function se3_log(T) {
  const R = [
    [T[0][0], T[0][1], T[0][2]],
    [T[1][0], T[1][1], T[1][2]],
    [T[2][0], T[2][1], T[2][2]],
  ];
  const t = [T[0][3], T[1][3], T[2][3]];
  const w = so3_log(R);
  const theta = Math.hypot(w[0], w[1], w[2]);

  let Vinv;
  if (theta < EPS) {
    Vinv = identity_matrix(3);
  } else {
    const W = hat(w);
    const W2 = mul_matrix_matrix(W, W);
    // V⁻¹ = I − ½[w]_x + (1/θ² − (1+cosθ)/(2θ sinθ)) [w]_x²
    const c =
      1 / (theta * theta) -
      (1 + Math.cos(theta)) / (2 * theta * Math.sin(theta));
    Vinv = add_matrix_matrix(
      add_matrix_matrix(identity_matrix(3), mul_matrix_scalar(W, -0.5)),
      mul_matrix_scalar(W2, c),
    );
  }
  const v = [
    Vinv[0][0] * t[0] + Vinv[0][1] * t[1] + Vinv[0][2] * t[2],
    Vinv[1][0] * t[0] + Vinv[1][1] * t[1] + Vinv[1][2] * t[2],
    Vinv[2][0] * t[0] + Vinv[2][1] * t[1] + Vinv[2][2] * t[2],
  ];
  return [v[0], v[1], v[2], w[0], w[1], w[2]];
}
