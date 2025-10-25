import * as THREE from 'three'
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const loader = new GLTFLoader();
const orbit = new OrbitControls(camera, renderer.domElement);

const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(window.innerWidth, window.innerHeight);
labelRenderer.domElement.style.position = 'absolute';
labelRenderer.domElement.style.top = '0px';
labelRenderer.domElement.style.pointerEvents = 'none';
document.body.appendChild(labelRenderer.domElement);

camera.position.z = 4.5;
orbit.update();

console.log('Loading model from:', '/models/brainModel.glb');
loader.load(
  "/models/brainModel.glb",
  function (gltf) {
    console.log('Model loaded successfully');
    gltf.scene.position.set(0.5, -2, 0);
    gltf.scene.scale.set(1, 1, 1);
    gltf.scene.rotation.y = -1.5;
    scene.add(gltf.scene);
  },
  function (progress) {
    console.log('Loading progress:', (progress.loaded / progress.total * 100) + '%');
  },
  function (error) {
    console.error('Error loading model:', error);
  }
);

const titleElement = document.createElement('titleElement');
titleElement.textContent = "Hello World";

const titleDiv = document.createElement('titleDiv');
titleDiv.appendChild(titleElement);
const titleDivContainer = new CSS2DObject(titleDiv);
scene.add(titleDivContainer);

const ambientLight = new THREE.AmbientLight(0xffffff);
scene.add(ambientLight);

const directLight = new THREE.DirectionalLight(0xFFFFFF, 1)
scene.add(directLight);

const dLightHelper = new THREE.DirectionalLight(directLight);
scene.add(dLightHelper);

renderer.setClearColor(0x172d40);

function animate() {
  requestAnimationFrame(animate);
  orbit.update();
  labelRenderer.render(scene, camera);
  renderer.render(scene, camera);
}

animate();