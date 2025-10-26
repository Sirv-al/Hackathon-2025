import * as THREE from 'three';
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const loader = new GLTFLoader();
let burstaMixer = null;
let burstaClips = [];

export function setMixer(mixer, clips) {
    burstaMixer = mixer;
    burstaClips = clips;
}

export function playRandomBurtsaAnimation() {
    if (!burstaMixer || burstaClips.length === 0) return;
    const randomClip = burstaClips[Math.floor(Math.random() * burstaClips.length)];
    burstaMixer.stopAllAction();
    burstaMixer.clipAction(randomClip).reset().play();
}

export function initBurtsaScene(containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error('Container not found:', containerId);
        return;
    }

    container.innerHTML = '';

    const clock = new THREE.Clock();
    const scene = new THREE.Scene();

    // Camera
    const aspect = container.clientWidth / container.clientHeight;
    const camera = new THREE.PerspectiveCamera(50, aspect, 0.1, 1000);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // Orbit Controls
    const orbit = new OrbitControls(camera, renderer.domElement);
    orbit.enableDamping = true;
    orbit.dampingFactor = 0.05;

    // CSS2D Renderer
    const labelRenderer = new CSS2DRenderer();
    labelRenderer.setSize(container.clientWidth, container.clientHeight);
    labelRenderer.domElement.style.position = 'absolute';
    labelRenderer.domElement.style.top = '0';
    labelRenderer.domElement.style.left = '0';
    labelRenderer.domElement.style.pointerEvents = 'none';
    container.appendChild(labelRenderer.domElement);

    let mixer = null;

    // Controls container for animation buttons
    const controlsDiv = document.createElement('div');
    controlsDiv.style.position = 'absolute';
    controlsDiv.style.top = '5px';
    controlsDiv.style.right = '5px';
    controlsDiv.style.zIndex = '100';
    controlsDiv.style.display = 'flex';
    controlsDiv.style.flexDirection = 'column';
    controlsDiv.style.gap = '2px';
    controlsDiv.style.background = 'rgba(0,0,0,0.3)';
    controlsDiv.style.padding = '5px';
    controlsDiv.style.borderRadius = '3px';
    container.appendChild(controlsDiv);

    // Load burtsa model
    loader.load(
        "/models/burtsa.glb",
        (gltf) => {
            const burtsa = gltf.scene;
            scene.add(burtsa);

            // Compute bounding box
            const box = new THREE.Box3().setFromObject(burtsa);
            const center = new THREE.Vector3();
            const size = new THREE.Vector3();
            box.getCenter(center);
            box.getSize(size);

            // Re-center the burtsa
            burtsa.position.sub(center);

            // Determine camera distance based on bounding box diagonal
            const maxDim = Math.max(size.x, size.y, size.z);
            const fov = camera.fov * (Math.PI / 180);
            let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
            cameraZ *= 1.5; // extra space
            camera.position.set(0, size.y * 0.5, cameraZ);
            camera.lookAt(0, size.y * 0.5, 0);

            orbit.target.set(0, size.y * 0.5, 0);
            orbit.update();

            // Lighting
            const ambient = new THREE.AmbientLight(0xffffff, 0.8);
            scene.add(ambient);

            const directional = new THREE.DirectionalLight(0xffffff, 1);
            directional.position.set(5, 10, 5);
            directional.castShadow = true;
            scene.add(directional);

            // Mixer & animations
            mixer = new THREE.AnimationMixer(burtsa);
            setMixer(mixer, gltf.animations);

            // gltf.animations.forEach((clip, i) => {
            //     const button = document.createElement('button');
            //     button.textContent = clip.name || `Anim ${i + 1}`;
            //     button.style.fontSize = '0.7em';
            //     button.style.backgroundColor = 'rgba(255,255,255,0.7)';
            //     button.style.border = '1px solid rgba(0,0,0,0.2)';
            //     button.style.cursor = 'pointer';
            //     button.style.width = '100%';
            //     button.addEventListener('click', () => {
            //         mixer.stopAllAction();
            //         mixer.clipAction(clip).reset().play();
            //     });
            //     controlsDiv.appendChild(button);
            // });

            console.log("burtsa bounding box:", box.min, box.max);
        },
        (progress) => console.log(`burtsa loading: ${(progress.loaded / progress.total * 100).toFixed(2)}%`),
        (error) => console.error("Error loading burtsa:", error)
    );

    // Resize handling
    const resizeObserver = new ResizeObserver(() => {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
        labelRenderer.setSize(container.clientWidth, container.clientHeight);
    });
    resizeObserver.observe(container);

    // Animate loop
    function animate() {
        requestAnimationFrame(animate);
        const delta = clock.getDelta();
        if (mixer) mixer.update(delta);
        orbit.update();
        renderer.render(scene, camera);
        labelRenderer.render(scene, camera);
    }
    animate();

    return () => {
        resizeObserver.disconnect();
        container.innerHTML = '';
        renderer.dispose();
    };
}
