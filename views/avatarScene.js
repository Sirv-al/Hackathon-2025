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

    const loader = new GLTFLoader();
    const orbit = new OrbitControls(camera, renderer.domElement);
    orbit.enableZoom = false; // Disable zooming for the small container

    const labelRenderer = new CSS2DRenderer();
    labelRenderer.setSize(container.clientWidth, container.clientHeight);
    labelRenderer.domElement.style.position = 'absolute';
    labelRenderer.domElement.style.top = '0';
    labelRenderer.domElement.style.left = '0';
    labelRenderer.domElement.style.pointerEvents = 'none';
    container.appendChild(labelRenderer.domElement);

    // Set up camera for a closer, front-facing view
    camera.position.z = 2;
    camera.position.y = 0.5;
    
    // Limit orbit controls to prevent disorienting views
    orbit.minPolarAngle = Math.PI/2 - 0.2; // Limit vertical rotation
    orbit.maxPolarAngle = Math.PI/2 + 0.2;
    orbit.minAzimuthAngle = -0.5; // Limit horizontal rotation
    orbit.maxAzimuthAngle = 0.5;
    orbit.update();

    // Animation mixer
    let mixer;
    let animations = [];
    let currentAnimationAction = null;

    // Load the avatar model
    loader.load(
        "/models/GreenWizardAvatar.glb",
        function (gltf) {
            console.log('Avatar loaded successfully');
            gltf.scene.position.set(0, -0.3, 0); // Centered, slightly lower
            gltf.scene.scale.set(1.5, 1.5, 1.5); // Slightly bigger
            gltf.scene.rotation.y = 0; // Face forward
            scene.add(gltf.scene);

            // Setup animation mixer
            mixer = new THREE.AnimationMixer(gltf.scene);
            animations = gltf.animations;
            
            // Create compact animation controls
            const controlsDiv = document.createElement('div');
            controlsDiv.style.position = 'absolute';
            controlsDiv.style.top = '5px';
            controlsDiv.style.right = '5px';
            controlsDiv.style.zIndex = '100';
            controlsDiv.style.display = 'flex';
            controlsDiv.style.flexDirection = 'column';
            controlsDiv.style.gap = '1px';
            controlsDiv.style.background = 'rgba(0, 0, 0, 0.2)';
            controlsDiv.style.padding = '2px';
            controlsDiv.style.borderRadius = '3px';
            controlsDiv.style.maxWidth = '60px';
            container.appendChild(controlsDiv);

            gltf.animations.forEach((clip, index) => {
                const button = document.createElement('button');
                button.textContent = clip.name || `Animation ${index + 1}`;
                button.style.padding = '1px 3px';
                button.style.fontSize = '0.6em';
                button.style.backgroundColor = 'rgba(255, 255, 255, 0.6)';
                button.style.color = '#000';
                button.style.border = '1px solid rgba(255, 255, 255, 0.2)';
                button.style.borderRadius = '2px';
                button.style.cursor = 'pointer';
                button.style.margin = '0';
                button.style.width = '100%';
                button.style.textAlign = 'left';
                button.style.transition = 'all 0.2s ease';
                // Shorten animation names if they're too long
                if (clip.name.length > 8) {
                    button.textContent = clip.name.substring(0, 8) + '...';
                    button.title = clip.name; // Show full name on hover
                }

                // Add hover effects
                button.addEventListener('mouseover', () => {
                    button.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
                    button.style.transform = 'translateX(-2px)';
                });
                
                button.addEventListener('mouseout', () => {
                    button.style.backgroundColor = 'rgba(255, 255, 255, 0.6)';
                    button.style.transform = 'translateX(0)';
                });
                
                button.addEventListener('click', () => {
                    mixer.stopAllAction();
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
            console.error('Error loading avatar:', error);
        }
    );

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const directLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
    directLight.position.set(1, 1, 1);
    scene.add(directLight);

    renderer.setClearColor(0x000000, 0);

    // Handle container resize
    function onResize() {
        const newAspect = container.clientWidth / container.clientHeight;
        camera.aspect = newAspect;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
        labelRenderer.setSize(container.clientWidth, container.clientHeight);
    }

    // Add resize listener
    const resizeObserver = new ResizeObserver(onResize);
    resizeObserver.observe(container);

    // Animation loop
    function animate() {
        requestAnimationFrame(animate);
        
        if (mixer) {
            const delta = clock.getDelta();
            mixer.update(delta);
        }

        orbit.update();
        labelRenderer.render(scene, camera);
        renderer.render(scene, camera);
    }

    animate();

    function playRandomAnimation() {
        if (!mixer || animations.length === 0) return;

        // Stop current animation
        if (currentAnimationAction) {
            currentAnimationAction.stop();
        }
        
        // Select random animation
        const randomIndex = Math.floor(Math.random() * animations.length);
        const randomClip = animations[randomIndex];
        
        // Play the animation
        currentAnimationAction = mixer.clipAction(randomClip);
        currentAnimationAction.reset();
        currentAnimationAction.play();
        
        return randomClip.name;
    }

    // Function to play a specific animation by name
    function playAnimationByName(animationName) {
        if (!mixer || animations.length === 0) return;
        
        // Stop current animation
        if (currentAnimationAction) {
            currentAnimationAction.stop();
        }
        
        // Find the animation by name
        const clip = animations.find(anim => anim.name === animationName);
        if (clip) {
            currentAnimationAction = mixer.clipAction(clip);
            currentAnimationAction.reset();
            currentAnimationAction.play();
            return true;
        }
        return false;
    }

    // Return public methods
    return {
        playRandomAnimation,
        playAnimationByName,
        cleanup: () => {
            resizeObserver.disconnect();
            container.innerHTML = '';
        }
    };
}