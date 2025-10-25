import * as THREE from 'three'
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const scene = new THREE.Scene();
// Increase far plane distance and reduce FOV for better distant viewing
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 5000);
const renderer = new THREE.WebGLRenderer({ 
    antialias: false, // Disable antialiasing for better performance
    alpha: true,
    powerPreference: "high-performance"
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit pixel ratio for performance
renderer.domElement.style.position = 'fixed';
renderer.domElement.style.top = '0';
renderer.domElement.style.left = '0';
renderer.domElement.style.width = '100%';
renderer.domElement.style.height = '100%';
renderer.domElement.style.zIndex = '-3'; // Set to be behind everything
document.body.appendChild(renderer.domElement);

const loader = new GLTFLoader();
const orbit = new OrbitControls(camera, renderer.domElement);

const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(window.innerWidth, window.innerHeight);
labelRenderer.domElement.style.position = 'fixed';
labelRenderer.domElement.style.top = '0';
labelRenderer.domElement.style.left = '0';
labelRenderer.domElement.style.zIndex = '-3';
labelRenderer.domElement.style.pointerEvents = 'none';
document.body.appendChild(labelRenderer.domElement);

// Set up orbit controls with more reasonable defaults
orbit.maxDistance = 100; // Reduce max zoom out distance
orbit.minDistance = 5;   // Allow closer zoom
orbit.maxPolarAngle = Math.PI / 2; // Limit rotation to prevent going under the map
orbit.enableDamping = true; // Add smooth camera movements
orbit.dampingFactor = 0.05;

// Position camera closer
camera.position.set(0, 20, 40);
camera.lookAt(0, 0, 0);
orbit.update();

console.log('Loading model from:', '/models/medievaltownmap.glb');
loader.load(
  "/models/medievaltownmap.glb",
  function (gltf) {
    console.log('Map model loaded successfully');
    
    // Optimize and enhance the model
    gltf.scene.traverse(function(node) {
      if (node.isMesh) {
        // Enhance materials for better visibility
        if (node.material) {
          node.material.roughness = 0.5;
          node.material.metalness = 0.2;
          node.material.envMapIntensity = 1.5;
          
          // Ensure materials are using physically correct lighting
          node.material.needsUpdate = true;
        }
        
        // Enable shadows
        node.castShadow = true;
        node.receiveShadow = true;
        
        // Optimize geometry
        if (node.geometry) {
          node.geometry.computeBoundingSphere();
          node.geometry.computeBoundingBox();
        }
      }
    });

    gltf.scene.position.set(0, 0, 0);
    gltf.scene.scale.set(1, 1, 1); // Reset to original scale
    
    // Center the camera on the model's bounding box
    const box = new THREE.Box3().setFromObject(gltf.scene);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    
    // Calculate appropriate camera position based on model size
    const maxDim = Math.max(size.x, size.y, size.z);
    camera.position.set(
        center.x + maxDim * 0.5,
        center.y + maxDim * 0.3,
        center.z + maxDim * 0.5
    );
    
    // Set orbit controls to look at center of model
    orbit.target.copy(center);
    
    // Log model dimensions for debugging
    console.log('Model dimensions:', {
        width: size.x,
        height: size.y,
        depth: size.z
    });
    
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

// Create a much stronger lighting setup
const ambientLight = new THREE.AmbientLight(0xffffff, 1.0); // Brighter ambient light
scene.add(ambientLight);

// Main sun-like directional light
const mainLight = new THREE.DirectionalLight(0xffffff, 2.0);
mainLight.position.set(100, 200, 100);
mainLight.castShadow = true;
scene.add(mainLight);

// Adjust shadow properties for better quality
mainLight.shadow.mapSize.width = 2048;
mainLight.shadow.mapSize.height = 2048;
mainLight.shadow.camera.near = 0.5;
mainLight.shadow.camera.far = 500;
mainLight.shadow.camera.left = -100;
mainLight.shadow.camera.right = 100;
mainLight.shadow.camera.top = 100;
mainLight.shadow.camera.bottom = -100;

// Add hemisphere light for better environmental lighting
const hemisphereLight = new THREE.HemisphereLight(0xffffbb, 0x080820, 1);
scene.add(hemisphereLight);

// Enable shadow mapping with optimized settings
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setClearColor(0x000000, 0); // Set alpha to 0 for full transparency

// Handle window resize
window.addEventListener('resize', function() {
    // No need to update sizes since we're using fixed dimensions
    camera.aspect = 1; // Keep aspect ratio square
    camera.updateProjectionMatrix();
});

// Handle window resizing
window.addEventListener('resize', function() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    labelRenderer.setSize(window.innerWidth, window.innerHeight);
});

// Track if the scene needs rendering
let needsRender = true;

// Only render when necessary
orbit.addEventListener('change', () => {
    needsRender = true;
});

function animate() {
    requestAnimationFrame(animate);
    
    if (needsRender) {
        orbit.update();
        labelRenderer.render(scene, camera);
        renderer.render(scene, camera);
        needsRender = false;
    }
}

// Force a render when window is resized
window.addEventListener('resize', () => {
    needsRender = true;
});

animate();