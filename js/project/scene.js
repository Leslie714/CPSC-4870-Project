import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

// import parrot from three js assets
const PARROT_URL = "https://threejs.org/examples/models/gltf/Parrot.glb";

// reduce the size of the parrot
const PARROT_SCALE = 0.0035;

// load and build the parrot
export async function buildParrot() {
  const loader = new GLTFLoader();
  const gltf = await loader.loadAsync(PARROT_URL);

  // group is object to apply transofmrations too
  const group = new THREE.Group();
  const inner = gltf.scene;
  inner.scale.setScalar(PARROT_SCALE);

  // rotate 180 so parrot flies towards
  inner.rotation.y = Math.PI;
  group.add(inner);

  // mix updates frame to flap wings
  const mixer = new THREE.AnimationMixer(inner);
  if (gltf.animations && gltf.animations.length > 0) {
    mixer.clipAction(gltf.animations[0]).play();
  }

  return { group, mixer };
}
