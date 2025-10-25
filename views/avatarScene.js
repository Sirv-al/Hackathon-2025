import * as THREE from 'three'
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const loader = new GLTFLoader();

export function initAvatarScene(containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error('Container not found:', containerId);
        return;
    }

    // Create clock for animations
    const clock = new THREE.Clock();

    const scene = new THREE.Scene();
    
    // Calculate aspect ratio based on container size
    const aspect = container.clientWidth / container.clientHeight;
    const camera = new THREE.PerspectiveCamera(75, aspect, 1, 1000);

    const renderer = new THREE.WebGLRenderer({ 
        antialias: true,
        alpha: true 
    });

    // Set renderer size to container size
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    container.appendChild(renderer.domElement);

    // Animation mixer and available animations
    let mixer;
    let availableAnimations = [];
    let animationActions = {};

    const loader = new GLTFLoader();
    const orbit = new OrbitControls(camera, renderer.domElement);
    orbit.enableZoom = false;

    // ... rest of your existing setup code ...

    // Load the avatar model
    loader.load(
        "/models/GreenWizardAvatar.glb",
        function (gltf) {
            console.log('Avatar loaded successfully');
            gltf.scene.position.set(0, -0.3, 0);
            gltf.scene.scale.set(1.5, 1.5, 1.5);
            gltf.scene.rotation.y = 0;
            scene.add(gltf.scene);

            // Setup animation mixer
            mixer = new THREE.AnimationMixer(gltf.scene);
            
            // Store available animations
            availableAnimations = gltf.animations.map(clip => clip.name);
            
            // Create animation actions for quick access
            gltf.animations.forEach((clip) => {
                animationActions[clip.name] = mixer.clipAction(clip);
            });

            // ... rest of your button creation code ...
        },
        // ... rest of your load callbacks ...
    );

    // ... rest of your existing code (lighting, resize, animate) ...

    // Function to play random animation
    const playRandomAnimation = () => {
        if (availableAnimations.length > 0 && mixer) {
            const randomIndex = Math.floor(Math.random() * availableAnimations.length);
            const randomAnimationName = availableAnimations[randomIndex];
            
            mixer.stopAllAction();
            const action = animationActions[randomAnimationName];
            if (action) {
                action.reset();
                action.play();
                console.log(`Playing random animation: ${randomAnimationName}`);
            }
        }
    };

    // Return cleanup function and public methods
    return {
        cleanup: () => {
            resizeObserver.disconnect();
            container.innerHTML = '';
        },
        playRandomAnimation,
        getAvailableAnimations: () => [...availableAnimations]
    };
}