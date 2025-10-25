import * as THREE from 'three'
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const MAP_SETTINGS = {
    knight: {
        cameraPos: { x: -5.16 , y: 1.14, z: 9.6 },
        ambient: { color: 0xffd4a3, intensity: 0.4 },
        sun: { color: 0xff7e47, intensity: 1.2, pos: [-1, 0.5, -1] },
        sky: { color: 0x5b8dff, intensity: 0.4, pos: [1, 1, 1] },
        ground: { color: 0xff9666, intensity: 0.3, pos: [0, -1, 0] },
        toneMappingExposure: 0.8,
        bgGradient: ['#ff7e47', '#2c1810'] // sunset
    },
    cave: {
        cameraPos: { x: 0, y: 10, z: 20 },
        ambient: { color: 0x222244, intensity: 0.3 },
        sun: { color: 0x8888ff, intensity: 0.4, pos: [0, 1, 0] },
        sky: { color: 0x223366, intensity: 0.2, pos: [1, 1, 1] },
        ground: { color: 0x110000, intensity: 0.2, pos: [0, -1, 0] },
        toneMappingExposure: 0.4,
        bgGradient: ['#1a1a2e', '#000000'] // dark blue to black
    },
    castle: {
        cameraPos: { x: -0.96, y: 10, z: 21.37 },
        ambient: { color: 0xffffff, intensity: 0.5 },
        sun: { color: 0xfff4c2, intensity: 1.0, pos: [1, 1, 0.5] },
        sky: { color: 0x99ccff, intensity: 0.5, pos: [0, 1, 1] },
        ground: { color: 0xffe0b2, intensity: 0.4, pos: [0, -1, 0] },
        toneMappingExposure: 1.0,
        bgGradient: ['#e0c97f', '#b0975a'] // golden
    },
    medieval_town_two: {
        cameraPos: { x: -1.23, y: 12.83, z: 21.41 },
        ambient: { color: 0xf8dcb8, intensity: 0.45 },
        sun: { color: 0xffd08a, intensity: 1.1, pos: [-1, 0.6, -0.3] },
        sky: { color: 0x87ceeb, intensity: 0.5, pos: [0.5, 1, 0.8] },
        ground: { color: 0xffbb88, intensity: 0.3, pos: [0, -1, 0] },
        toneMappingExposure: 0.9,
        bgGradient: ['#ffe5b4', '#c98c56'] // warm daylight
    }
};


const loader = new GLTFLoader();

export function initMapScene(containerId, mapType = 'knight') {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error('Container not found:', containerId);
        return;
    }

    // Clear the container
    container.innerHTML = '';
    
    const scene = new THREE.Scene();

    const settings = MAP_SETTINGS[mapType] || MAP_SETTINGS['knight'];
    
    // Get container dimensions
    const width = container.clientWidth;
    const height = container.clientHeight;
    const aspect = width / height;
    
    // Setup camera with optimized parameters
    const camera = new THREE.PerspectiveCamera(45, aspect, 1, 1000); // Reduced far plane
    
    // Optimized renderer settings
    const renderer = new THREE.WebGLRenderer({ 
        antialias: true,
        alpha: true,
        powerPreference: "high-performance"
    });
    
    // Enable physically correct lighting
    renderer.physicallyCorrectLights = true;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = settings.toneMappingExposure;; // Adjust for sunset exposure

    // Set renderer size and style
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.top = '0';
    renderer.domElement.style.left = '0';
    container.appendChild(renderer.domElement);

    // Setup controls
    const orbit = new OrbitControls(camera, renderer.domElement);
    if (mapType === 'cave') {
    orbit.maxDistance = 40;
    orbit.minDistance = 5;
    } else if (mapType === 'castle') {
        orbit.maxDistance = 120;
        orbit.minDistance = 20;
    } else {
        orbit.maxDistance = 80;
        orbit.minDistance = 10;
    }

    
    orbit.maxPolarAngle = Math.PI / 2;
    orbit.enableDamping = true;
    orbit.dampingFactor = 0.05;

    // Setup CSS2D renderer for labels
    const labelRenderer = new CSS2DRenderer();
    labelRenderer.setSize(width, height);
    labelRenderer.domElement.style.position = 'absolute';
    labelRenderer.domElement.style.top = '0';
    labelRenderer.domElement.style.pointerEvents = 'none';
    container.appendChild(labelRenderer.domElement);

    // Initial camera position
    camera.position.set(
    settings.cameraPos.x,
    settings.cameraPos.y,
    settings.cameraPos.z
);
    camera.lookAt(0, 0, 0);
    orbit.update();

    // Choose model path based on map type
let modelPath;
switch (mapType) {
    case 'knight':
        modelPath = '/models/knightbattle.glb';
        break;
    case 'cave':
        modelPath = '/models/cave.glb';
        break;
    case 'castle':
        modelPath = '/models/medieval_door.glb';
        break;
    default:
        modelPath = '/models/medieval_town_two.glb';
}

// Load the selected model
loader.load(
    modelPath,
    function (gltf) {
        console.log(`Map model (${mapType}) loaded successfully`);

        // --- same optimization code you already have ---
        gltf.scene.traverse(function(node) {
            if (node.isMesh) {
                if (node.material) {
                    node.material.roughness = 0.5;
                    node.material.metalness = 0.2;
                    node.material.envMapIntensity = 1.5;
                    node.material.needsUpdate = true;
                }
                node.castShadow = true;
                node.receiveShadow = true;
                if (node.geometry) {
                    node.geometry.computeBoundingSphere();
                    node.geometry.computeBoundingBox();
                }
            }
        });

        gltf.scene.position.set(0, 0, 0);
        scene.add(gltf.scene);

        // Center the camera on the model
        const box = new THREE.Box3().setFromObject(gltf.scene);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        // camera.position.set(
        //     center.x + maxDim * 0.5,
        //     center.y + maxDim * 0.3,
        //     center.z + maxDim * 0.5
        // );
        // orbit.target.copy(center);
        orbit.target.set(0, 0, 0); // Or some map-specific target if needed
        orbit.update();
    },
    function (progress) {
        console.log('Loading progress:', (progress.loaded / progress.total * 100) + '%');
    },
    function (error) {
        console.error('Error loading map:', error);
    }
);


    // Setup sunset lighting
    
        // --- Dynamic Lighting Setup based on Map ---
    const ambientLight = new THREE.AmbientLight(settings.ambient.color, settings.ambient.intensity);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(settings.sun.color, settings.sun.intensity);
    sunLight.position.set(...settings.sun.pos);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.set(2048, 2048);
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 500;
    sunLight.shadow.bias = -0.0001;
    scene.add(sunLight);

    const skyLight = new THREE.DirectionalLight(settings.sky.color, settings.sky.intensity);
    skyLight.position.set(...settings.sky.pos);
    scene.add(skyLight);

    const groundLight = new THREE.DirectionalLight(settings.ground.color, settings.ground.intensity);
    groundLight.position.set(...settings.ground.pos);
    scene.add(groundLight);

    // Enable shadow rendering
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Set background with subtle sunset gradient
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();
    
    // Create subtle gradient background
    const canvas = document.createElement('canvas');
    canvas.width = 2;
    canvas.height = 2;
    
    const context = canvas.getContext('2d');
    const gradient = context.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, settings.bgGradient[0]);
    gradient.addColorStop(1, settings.bgGradient[1]);
    
    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    const texture = new THREE.CanvasTexture(canvas);
    scene.background = texture;

    // Handle container resize
    function onResize() {
        const newWidth = container.clientWidth;
        const newHeight = container.clientHeight;
        const newAspect = newWidth / newHeight;
        
        camera.aspect = newAspect;
        camera.updateProjectionMatrix();
        
        renderer.setSize(newWidth, newHeight);
        labelRenderer.setSize(newWidth, newHeight);
    }

    // Add resize observer
    const resizeObserver = new ResizeObserver(() => {
        onResize();
    });
    resizeObserver.observe(container);


    // Optimized animation loop with frame rate control
    let frameCount = 0;
    const targetFPS = 60;
    let then = performance.now();
    const interval = 1000 / targetFPS;

    function animate(now) {
        requestAnimationFrame(animate);
        
        // Frame rate control
        const delta = now - then;
        if (delta < interval) return;
        
        then = now - (delta % interval);
        
        // Only update if controls have changed or needed
        orbit.update();
        renderer.render(scene, camera);
        labelRenderer.render(scene, camera);
         // Update debug overlay
    if (cameraDebugEl) {
        const { x, y, z } = camera.position;
        cameraDebugEl.textContent = `Camera: X:${x.toFixed(2)} Y:${y.toFixed(2)} Z:${z.toFixed(2)}`;
    }
    }

    animate();

    // Return optimized cleanup function
    return () => {
        resizeObserver.disconnect();
        
        // Properly dispose of geometries and materials
        scene.traverse(object => {
            if (object.isMesh) {
                if (object.geometry) {
                    object.geometry.dispose();
                }
                if (object.material) {
                    if (Array.isArray(object.material)) {
                        object.material.forEach(material => material.dispose());
                    } else {
                        object.material.dispose();
                    }
                }
            }
        });
        
        renderer.dispose();
        orbit.dispose();
        labelRenderer.domElement.remove();
        container.innerHTML = '';
    };
}