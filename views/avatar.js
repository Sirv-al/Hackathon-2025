import * as THREE from 'three'
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Create clock for animations
const clock = new THREE.Clock();

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
const renderer = new THREE.WebGLRenderer({ 
    antialias: true,
    alpha: true 
});

// Animation mixer
let mixer;
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.domElement.style.position = 'fixed';
renderer.domElement.style.top = '0';
renderer.domElement.style.left = '0';
renderer.domElement.style.zIndex = '-1';
document.body.appendChild(renderer.domElement);

const loader = new GLTFLoader();
const orbit = new OrbitControls(camera, renderer.domElement);

const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(window.innerWidth, window.innerHeight);
labelRenderer.domElement.style.position = 'fixed';
labelRenderer.domElement.style.top = '0';
labelRenderer.domElement.style.left = '0';
labelRenderer.domElement.style.zIndex = '-1';
labelRenderer.domElement.style.pointerEvents = 'none';
document.body.appendChild(labelRenderer.domElement);

camera.position.z = 3; // Moved camera closer
camera.position.y = 1; // Moved camera up a bit
orbit.update();

console.log('Loading model from:', '/models/GreenWizardAvatar.glb');
loader.load(
  "/models/GreenWizardAvatar.glb",
  function (gltf) {
    console.log('Model loaded successfully');
    gltf.scene.position.set(0.5, 0, 0);
    gltf.scene.scale.set(1.2, 1.2, 1.2);
    gltf.scene.rotation.y = -1.5;
    scene.add(gltf.scene);

    // Setup animation mixer
    mixer = new THREE.AnimationMixer(gltf.scene);
    
    // Log available animations
    console.log('Available animations:', gltf.animations.map(a => a.name));

    // Create buttons for each animation
    const controlsDiv = document.createElement('div');
    controlsDiv.style.position = 'absolute';
    controlsDiv.style.top = '20px';
    controlsDiv.style.left = '20px';
    controlsDiv.style.zIndex = '100';
    document.body.appendChild(controlsDiv);

    gltf.animations.forEach((clip, index) => {
      const button = document.createElement('button');
      button.textContent = clip.name || `Animation ${index + 1}`;
      button.style.margin = '5px';
      button.addEventListener('click', () => {
        // Stop any current animation
        mixer.stopAllAction();
        // Play the selected animation
        const action = mixer.clipAction(clip);
        action.reset();
        action.play();
      });
      controlsDiv.appendChild(button);
    });
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

function animate() {
  requestAnimationFrame(animate);
  
  // Update animations
  if (mixer) {
    const delta = clock.getDelta();
    mixer.update(delta);
  }

  orbit.update();
  labelRenderer.render(scene, camera);
  renderer.render(scene, camera);
}

animate();