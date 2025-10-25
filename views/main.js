import * as THREE from 'three'
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Create a container div for the scene
const container = document.createElement('div');
container.style.width = '400px';
container.style.height = '400px';
container.style.position = 'absolute';
container.style.left = '50px';
container.style.top = '100px';
document.body.appendChild(container);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, 1, 1, 1000); // aspect ratio of 1 for square container
const renderer = new THREE.WebGLRenderer({ 
    antialias: true,
    alpha: true 
});
renderer.setSize(400, 400);
container.appendChild(renderer.domElement);

const loader = new GLTFLoader();
const orbit = new OrbitControls(camera, renderer.domElement);

const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(400, 400);
labelRenderer.domElement.style.position = 'absolute';
labelRenderer.domElement.style.top = '0';
labelRenderer.domElement.style.left = '0';
labelRenderer.domElement.style.pointerEvents = 'none';
container.appendChild(labelRenderer.domElement);

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
// titleElement.textContent = "Hello World";

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

renderer.setClearColor(0x000000, 0); // Set alpha to 0 for full transparency

// Handle window resize
window.addEventListener('resize', function() {
    // No need to update sizes since we're using fixed dimensions
    camera.aspect = 1; // Keep aspect ratio square
    camera.updateProjectionMatrix();
});

function animate() {
    requestAnimationFrame(animate);
    orbit.update();
    labelRenderer.render(scene, camera);
    renderer.render(scene, camera);
}

animate();