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
    
    // Setup camera with optimized parameters
    const camera = new THREE.PerspectiveCamera(45, aspect, 1, 1000); // Reduced far plane
    
    // Optimized renderer settings
    const renderer = new THREE.WebGLRenderer({ 
        antialias: false,
        alpha: true,
        powerPreference: "high-performance",
        precision: 'mediump',
        depth: true,
        stencil: false
    });

    // Set renderer size and style
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.NoToneMapping;
    renderer.shadowMap.enabled = false; // Disable shadows for performance
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

    // Material optimization function
    function optimizeMaterial(material) {
        material.precision = 'mediump';
        material.roughness = 0.8; // Higher roughness = better performance
        material.metalness = 0.1;
        material.envMapIntensity = 1.0;
        
        // Disable expensive features
        material.aoMapIntensity = 0;
        if (material.normalScale) {
            material.normalScale.set(0, 0);
        }
        
        material.needsUpdate = true;
        return material;
    }

    // Load the map model with optimizations
    loader.load(
        "/models/medievaltownmap.glb",
        function (gltf) {
            console.log('Map model loaded successfully');
            
            // Optimize and enhance the model
            gltf.scene.traverse(function(node) {
                if (node.isMesh) {
                    // Geometry optimizations
                    if (node.geometry) {
                        node.geometry.computeBoundingSphere();
                        node.geometry.computeBoundingBox();
                        
                        // Remove unnecessary attributes
                        if (node.geometry.hasAttribute('color')) {
                            node.geometry.deleteAttribute('color');
                        }
                    }
                    
                    // Material optimizations
                    if (node.material) {
                        // Use simpler materials for better performance
                        if (Array.isArray(node.material)) {
                            node.material.forEach(mat => optimizeMaterial(mat));
                        } else {
                            optimizeMaterial(node.material);
                        }
                    }
                    
                    // Optimize shadows and rendering
                    node.castShadow = false; // Disable casting shadows
                    node.receiveShadow = false; // Disable receiving shadows
                    
                    // Enable frustum culling
                    node.frustumCulled = true;
                    
                    // Freeze matrix for static objects
                    node.matrixAutoUpdate = false;
                    node.updateMatrix();
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

    // Optimized lighting setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const directLight = new THREE.DirectionalLight(0xFFFFFF, 1);
    directLight.position.set(1, 1, 1);
    directLight.castShadow = false; // Disable shadows for performance
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
        frameCount++;
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