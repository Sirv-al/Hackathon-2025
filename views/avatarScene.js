import * as THREE from 'three';
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Top-level loader and mixer for external access
const loader = new GLTFLoader();
let avatarMixer = null;
let avatarClips = [];

// Register mixer and clips when avatar loads
export function setMixer(mixer, clips) {
    avatarMixer = mixer;
    avatarClips = clips;
}

// Play a random animation
export function playRandomAnimation() {
    if (!avatarMixer || avatarClips.length === 0) return;

    const randomClip = avatarClips[Math.floor(Math.random() * avatarClips.length)];

    avatarMixer.stopAllAction();
    avatarMixer.clipAction(randomClip).reset().play();
}

export function idle() {
    if (!avatarMixer || avatarClips.length === 0) return;

    const randomClip = avatarClips[3];

    avatarMixer.stopAllAction();
    avatarMixer.clipAction(randomClip).reset().play();
}

export function initAvatarScene(containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error('Container not found:', containerId);
        return;
    }

    const clock = new THREE.Clock();
    const scene = new THREE.Scene();
    const aspect = container.clientWidth / container.clientHeight;
    const camera = new THREE.PerspectiveCamera(75, aspect, 1, 1000);
    camera.position.z = 2;
    camera.position.y = 0.5;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    container.appendChild(renderer.domElement);

    const orbit = new OrbitControls(camera, renderer.domElement);
    orbit.enableZoom = false;
    orbit.minPolarAngle = Math.PI / 2 - 0.2;
    orbit.maxPolarAngle = Math.PI / 2 + 0.2;
    orbit.minAzimuthAngle = -0.5;
    orbit.maxAzimuthAngle = 0.5;
    orbit.update();

    const labelRenderer = new CSS2DRenderer();
    labelRenderer.setSize(container.clientWidth, container.clientHeight);
    labelRenderer.domElement.style.position = 'absolute';
    labelRenderer.domElement.style.top = '0';
    labelRenderer.domElement.style.left = '0';
    labelRenderer.domElement.style.pointerEvents = 'none';
    container.appendChild(labelRenderer.domElement);

    let mixer = null; // single mixer used in loop and buttons

    // Create animation controls container
    const controlsDiv = document.createElement('div');
    controlsDiv.style.position = 'absolute';
    controlsDiv.style.top = '5px';
    controlsDiv.style.right = '5px';
    controlsDiv.style.zIndex = '100';
    controlsDiv.style.display = 'flex';
    controlsDiv.style.flexDirection = 'column';
    controlsDiv.style.gap = '2px';
    controlsDiv.style.background = 'rgba(0,0,0,0.2)';
    controlsDiv.style.padding = '2px';
    controlsDiv.style.borderRadius = '3px';
    controlsDiv.style.maxWidth = '80px';
    container.appendChild(controlsDiv);

    // Load the avatar model
    loader.load(
        "/models/GreenWizardAvatar.glb",
        (gltf) => {
            console.log('Avatar loaded successfully');
            const avatar = gltf.scene;
            avatar.position.set(0, -0.3, 0);
            avatar.scale.set(1.5, 1.5, 1.5);
            avatar.rotation.y = 0;
            scene.add(avatar);

            // Initialize mixer and register externally
            mixer = new THREE.AnimationMixer(avatar);
            setMixer(mixer, gltf.animations);

            // Create buttons for each animation
            // gltf.animations.forEach((clip, index) => {
            //     const button = document.createElement('button');
            //     button.textContent = clip.name || `Anim ${index + 1}`;
            //     button.style.fontSize = '0.6em';
            //     button.style.backgroundColor = 'rgba(255,255,255,0.6)';
            //     button.style.border = '1px solid rgba(255,255,255,0.2)';
            //     button.style.cursor = 'pointer';
            //     button.style.width = '100%';
            //     button.style.textAlign = 'left';

            //     button.addEventListener('click', () => {
            //         mixer.stopAllAction();
            //         mixer.clipAction(clip).reset().play();
            //     });

            //     controlsDiv.appendChild(button);
            // });
        },
        (progress) => console.log(`Loading progress: ${(progress.loaded / progress.total * 100).toFixed(2)}%`),
        (error) => console.error('Error loading avatar:', error)
    );

    // Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const directLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directLight.position.set(1, 1, 1);
    scene.add(directLight);

    renderer.setClearColor(0x000000, 0);

    // Resize handling
    const resizeObserver = new ResizeObserver(() => {
        const newAspect = container.clientWidth / container.clientHeight;
        camera.aspect = newAspect;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
        labelRenderer.setSize(container.clientWidth, container.clientHeight);
    });
    resizeObserver.observe(container);

    // Animation loop
    function animate() {
        requestAnimationFrame(animate);
        if (mixer) mixer.update(clock.getDelta());
        orbit.update();
        renderer.render(scene, camera);
        labelRenderer.render(scene, camera);
    }

    animate();

    return () => {
        resizeObserver.disconnect();
        container.innerHTML = '';
    };
}
