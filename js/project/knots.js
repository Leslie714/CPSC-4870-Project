import * as THREE from "three";
import { TransformControls } from "three/examples/jsm/controls/TransformControls.js";

const MARKER_SIZE = 0.045;
const MARKER_COLORS = [
  0xff5555, 0xffaa00, 0x44dd44, 0x00bbff, 0x9966ff, 0xff66cc,
];

// default position of the knots
export const DEFAULT_KNOTS = [
  { p: [-1.2, 0.3, 0.3], tilt: 20 }, // entering the scene, climbing
  { p: [-0.6, 0.85, 0.1], tilt: 0 }, // levelling off, mid-climb
  { p: [0.0, 1.1, -0.2], tilt: 0 }, // apex of the arc
  { p: [0.6, 0.85, -0.1], tilt: 0 }, // levelling on the descent
  { p: [1.2, 0.3, 0.3], tilt: -20 }, // exiting, gliding down
];

// create marker and transform controls for each knots
export function createKnots(scene, camera, rendererDom, orbitControls) {
  // visualize the knot
  const markers = [];

  // drive the mark
  const transforms = [];

  for (let i = 0; i < DEFAULT_KNOTS.length; i++) {
    const cfg = DEFAULT_KNOTS[i];
    const color = MARKER_COLORS[i % MARKER_COLORS.length];

    const marker = new THREE.Mesh(
      new THREE.BoxGeometry(MARKER_SIZE, MARKER_SIZE, MARKER_SIZE),
      new THREE.MeshBasicMaterial({ color }),
    );

    marker.position.set(cfg.p[0], cfg.p[1], cfg.p[2]);
    marker.quaternion.setFromAxisAngle(
      new THREE.Vector3(0, 0, 1),
      (cfg.tilt * Math.PI) / 180,
    );

    scene.add(marker);
    markers.push(marker);

    const ctl = new TransformControls(camera, rendererDom);
    ctl.size = 0.5;
    ctl.attach(marker);

    // pause controls when dragging a gizmo
    ctl.addEventListener("dragging-changed", (e) => {
      orbitControls.enabled = !e.value;
    });
    scene.add(ctl);
    transforms.push(ctl);
  }

  // get pose of knots and turn into 4x4 SE(3) matrix
  function getPoses() {
    return markers.map((m) => {
      const e = m.matrixWorld.elements;
      return [
        [e[0], e[4], e[8], e[12]],
        [e[1], e[5], e[9], e[13]],
        [e[2], e[6], e[10], e[14]],
        [e[3], e[7], e[11], e[15]],
      ];
    });
  }

  function setMode(mode) {
    transforms.forEach((t) => t.setMode(mode));
  }

  // helpful functiom to make knots visible
  function setVisible(visible) {
    markers.forEach((m) => (m.visible = visible));
    transforms.forEach((t) => (t.visible = visible));
  }

  // helpful function to reset knots
  function reset() {
    for (let i = 0; i < markers.length; i++) {
      const cfg = DEFAULT_KNOTS[i];
      markers[i].position.set(cfg.p[0], cfg.p[1], cfg.p[2]);
      markers[i].quaternion.setFromAxisAngle(
        new THREE.Vector3(0, 0, 1),
        (cfg.tilt * Math.PI) / 180,
      );
    }
  }

  // return the markers, transformations, and helpful functions
  return {
    count: markers.length,
    markers,
    transforms,
    getPoses,
    setMode,
    setVisible,
    reset,
  };
}
