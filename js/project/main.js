import * as THREE from "three";
import { ThreeEngine, get_default_lil_gui } from "../utils/utils_three.js";

import {
  interpolateBezierLie,
  buildLieAlgebraSamples,
} from "./interpolation.js";
import { buildParrot } from "./scene.js";
import { createKnots } from "./knots.js";

// set up the engine
const engine = ThreeEngine.new_default_3d();

// initialize the parrot
const { group: parrot, mixer } = await buildParrot();
engine.scene.add(parrot);

engine.controls.target.set(0, 0.7, 0);
engine.controls.update();

// create the knots
const knots = createKnots(
  engine.scene,
  engine.camera,
  engine.renderer.domElement,
  engine.controls,
);
const N = knots.count;
const U_MAX = N - 1;

// visualize the spline path
const PATH_SAMPLES = 200;
const pathGeometry = new THREE.BufferGeometry();
const pathPositions = new Float32Array(PATH_SAMPLES * 3);
pathGeometry.setAttribute(
  "position",
  new THREE.BufferAttribute(pathPositions, 3).setUsage(THREE.DynamicDrawUsage),
);
const pathMaterial = new THREE.LineBasicMaterial({ color: 0x222222 });
const pathLine = new THREE.Line(pathGeometry, pathMaterial);
engine.scene.add(pathLine);

// runtime parameters and refreshing path
const params = {
  u: 0.0,
  speed: 0.6,
  play: true,
  showKnots: true,
  showPath: true,
  reset_knots: () => {
    knots.reset();
    params.u = 0;
  },
};

function refreshPathLine(knotXis) {
  for (let i = 0; i < PATH_SAMPLES; i++) {
    const u = (i / (PATH_SAMPLES - 1)) * U_MAX;
    const T = interpolateBezierLie(knotXis, u);
    pathPositions[i * 3] = T[0][3];
    pathPositions[i * 3 + 1] = T[1][3];
    pathPositions[i * 3 + 2] = T[2][3];
  }
  pathGeometry.attributes.position.needsUpdate = true;
}

// set up the gui
const gui = get_default_lil_gui("260px");
gui.title("Flight path");

gui.add(params, "u", 0, U_MAX, 0.001).name("t  (segment + frac)").listen();
gui.add(params, "speed", 0, 2.0, 0.01).name("playback speed");

params.playAction = () => {
  params.play = true;
};
params.pauseAction = () => {
  params.play = false;
};

gui.add(params, "playAction").name("Play");
gui.add(params, "pauseAction").name("Pause");

gui.add(params, "reset_knots").name("Reset knots");

gui
  .add(params, "showKnots")
  .name("show knots")
  .onChange((v) => knots.setVisible(v));
gui
  .add(params, "showPath")
  .name("show flight path")
  .onChange((v) => (pathLine.visible = v));

// ==================== amination loop ===================

// reuse objects to not reallocate every time
const _eye = new THREE.Vector3();
const _target = new THREE.Vector3();
const _m4 = new THREE.Matrix4();
const _UP = new THREE.Vector3(0, 1, 0);
const TANGENT_EPS = 0.01;

let lastTime = performance.now() / 1000;

engine.animation_loop(() => {
  const now = performance.now() / 1000;
  const dt = Math.min(now - lastTime, 1 / 30);
  lastTime = now;

  // keep parrot moving
  mixer.update(dt);

  if (params.play) {
    params.u += params.speed * dt;
    if (params.u > U_MAX) params.u = 0;
  }

  const knotPoses = knots.getPoses();
  const knotXis = buildLieAlgebraSamples(knotPoses);
  refreshPathLine(knotXis);

  // keep parrot moving toward in the direction of travel
  let uNow = params.u,
    uAhead = uNow + TANGENT_EPS;
  if (uAhead > U_MAX) {
    uNow = U_MAX - TANGENT_EPS;
    uAhead = U_MAX;
  }

  const TNow = interpolateBezierLie(knotXis, uNow);
  const TAhead = interpolateBezierLie(knotXis, uAhead);

  _eye.set(TNow[0][3], TNow[1][3], TNow[2][3]);
  _target.set(TAhead[0][3], TAhead[1][3], TAhead[2][3]);

  // local -Z points from eye to the target, the forward direction
  _m4.lookAt(_eye, _target, _UP);
  _m4.setPosition(_eye);
  parrot.matrixAutoUpdate = false;
  parrot.matrix.copy(_m4);
});
