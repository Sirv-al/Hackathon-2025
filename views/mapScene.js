import * as THREE from 'three'
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const loader = new GLTFLoader();

export function initMapScene(containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error('Container not found:', containerId);
        return;
    }

    // Clear the container
    container.innerHTML = '';
    
    const scene = new THREE.Scene();
    
    // Get container dimensions
    const width = container.clientWidth;
    const height = container.clientHeight;
    const aspect = width / height;
    
    // Setup camera with better parameters for map viewing
    const camera = new THREE.PerspectiveCamera(45, aspect, 1, 5000);
    
    const renderer = new THREE.WebGLRenderer({ 
        antialias: false,
        alpha: true,
        powerPreference: "high-performance"
    });

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
    orbit.maxDistance = 100;
    orbit.minDistance = 5;
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
    camera.position.set(0, 20, 40);
    camera.lookAt(0, 0, 0);
    orbit.update();

    // Load the map model
    loader.load(
        "/models/medieval_town_two.glb",
        function (gltf) {
            console.log('Map model loaded successfully');
            
            // Optimize and enhance the model
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
            
            // Center camera on model
            const box = new THREE.Box3().setFromObject(gltf.scene);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());
            
            const maxDim = Math.max(size.x, size.y, size.z);
            camera.position.set(
                center.x + maxDim * 0.5,
                center.y + maxDim * 0.3,
                center.z + maxDim * 0.5
            );
            
            orbit.target.copy(center);
            orbit.update();
        },
        function (progress) {
            console.log('Loading progress:', (progress.loaded / progress.total * 100) + '%');
        },
        function (error) {
            console.error('Error loading map:', error);
        }
    );

    // Setup lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const directLight = new THREE.DirectionalLight(0xFFFFFF, 1);
    directLight.position.set(1, 1, 1);
    directLight.castShadow = true;
    scene.add(directLight);

    // Set background transparency
    renderer.setClearColor(0x000000, 0);

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

    // Animation loop
    function animate() {
        requestAnimationFrame(animate);
        orbit.update();
        renderer.render(scene, camera);
        labelRenderer.render(scene, camera);
    }

    animate();

    // Return cleanup function
    return () => {
        resizeObserver.disconnect();
        renderer.dispose();
        orbit.dispose();
        container.innerHTML = '';
    };
}