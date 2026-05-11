import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const clock = new THREE.Clock();
const scene = new THREE.Scene();
const canvas = document.getElementById("experience-canvas");
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
};
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor(0x000000, 0);
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.shadowMap.enabled = true;
renderer.toneMapping = THREE.ReinhardToneMapping;
renderer.toneMappingExposure = 4;

const fadeOverlay = document.getElementById('fade-overlay');
let isTransitioning = false;
const zoomPoint = new THREE.Vector3(0, 2, 0);

let intersectObject;
const intersectObjects = [];
const intersectObjectsNames = [
    "scene", "01_Frame", "02_Monitor", "03_Controller", "bike", "bird", "level"
];

const categoryLabelEl = document.getElementById('category-label');
const categoryMap = { '01_Frame': 'Design', '02_Monitor': 'Motion', '03_Controller': '3D' };

let bikeAngle = Math.PI * 0.4;
let birdAngle = Math.PI * -0.6;
let bikeMesh = null;
let birdMesh = null;
let mixer = null;

let swingGroup = null;
let monitorGroup = null;
let controllerGroup = null;
let monitorScreenMesh = null;
let controllerOriginalY = 0;
let controllerOriginalRotZ = 0;
let previousHoverObject = '';

let labelDelayTimer = null;

const COOLDOWN = 5;

const hoverAnim = {
    swing: { active: false, time: 0, lastPlayed: -10 },
    monitor: { active: false, time: 0, lastPlayed: -10 },
    controller: { active: false, time: 0, lastPlayed: -10 }
};

// mp4
const video = document.getElementById('monitor-video');
video.play().catch(e => console.warn('Autoplay blocked:', e));
const videoTexture = new THREE.VideoTexture(video);
videoTexture.colorSpace = THREE.SRGBColorSpace;
videoTexture.repeat.set(-3, 2.15);
videoTexture.offset.set(0.935, -1.155);

const loader = new GLTFLoader();
loader.load("./Portfolio_3DLevel_1.5.glb", function (glb) {
    glb.scene.traverse((child) => {
        if (intersectObjectsNames.includes(child.name)) {
            intersectObjects.push(child);
        }
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            child.material.roughness = 1;
        }

        if (child.name === 'Bike') bikeMesh = child;
        if (child.name === 'Bird') birdMesh = child;

        if (child.name === 'Cube013_1') {
            monitorScreenMesh = child;
            child.material.color.set(0x000000);
            child.material.map = null;
            child.material.emissiveMap = videoTexture;
            child.material.emissive.set(0xffffff);
            child.material.emissiveIntensity = 1.5;
            child.material.needsUpdate = true;
        }

        if (child.name === '01_Frame' && !child.isMesh) swingGroup = child;
        if (child.name === '02_Monitor' && !child.isMesh) monitorGroup = child;
        if (child.name === '03_Controller' && !child.isMesh) controllerGroup = child;
    });

    scene.add(glb.scene);

    if (controllerGroup) {
        controllerOriginalY = controllerGroup.position.y;
        controllerOriginalRotZ = controllerGroup.rotation.z;
    }

    if (glb.animations && glb.animations.length > 0) {
        mixer = new THREE.AnimationMixer(glb.scene);
        glb.animations.forEach((clip) => mixer.clipAction(clip).play());
    }

}, undefined, function (error) {
    console.error(error);
});

const sun = new THREE.DirectionalLight(0xFFFFFF);
sun.castShadow = true;
sun.position.set(-20, 35, 25);
sun.target.position.set(0, 0, 0);
sun.shadow.mapSize.width = 4096;
sun.shadow.mapSize.height = 4096;
sun.shadow.camera.left = -50;
sun.shadow.camera.right = 50;
sun.shadow.camera.top = 50;
sun.shadow.camera.bottom = -50;
sun.shadow.normalBias = 0.5;
scene.add(sun);

const light = new THREE.AmbientLight(0xffffff, 1);
scene.add(light);
const Hemispherelight = new THREE.HemisphereLight(0xffffbb, 0x080820, 1);
scene.add(Hemispherelight);

const horizonGeo = new THREE.PlaneGeometry(2000, 2000);
const horizonMat = new THREE.MeshLambertMaterial({ color: 0x1B3870 });
const horizonPlane = new THREE.Mesh(horizonGeo, horizonMat);
horizonPlane.rotation.x = -Math.PI / 2;
horizonPlane.position.y = -3.2;
horizonPlane.renderOrder = -1;
horizonPlane.receiveShadow = true;
scene.add(horizonPlane);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(-12, 0.2, 18.5);

const controls = new OrbitControls(camera, canvas);
controls.target.set(0, 3, 0);
controls.maxPolarAngle = Math.PI / 2 + 0.15;
controls.minPolarAngle = Math.PI / 3;
controls.minDistance = 15;
controls.maxDistance = 23.5;
controls.enablePan = false;
controls.update();

function onResize() {
    sizes.width = window.innerWidth;
    sizes.height = window.innerHeight;
    camera.aspect = sizes.width / sizes.height;
    camera.updateProjectionMatrix();
    renderer.setSize(sizes.width, sizes.height);
}

// Page transition
function startTransition(url) {
    if (isTransitioning) return;
    isTransitioning = true;
    controls.enabled = false;

    setTimeout(() => {
        fadeOverlay.style.transition = 'opacity 0.7s ease';  // fade duration
        fadeOverlay.style.opacity = '1';
    }, 500);   // delay before fade starts (camera zooms during this window)

    setTimeout(() => {
        window.location.href = url;
    }, 1300);  // total time before page navigates
}

function onClick() {
    if (intersectObject === '01_Frame')      startTransition('design-works.html');
    if (intersectObject === '02_Monitor')    startTransition('motion-works.html');
    if (intersectObject === '03_Controller') startTransition('3d-works.html');
}

function onPointerMove(event) {
    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

window.addEventListener("resize", onResize);
window.addEventListener("click", onClick);
window.addEventListener("pointermove", onPointerMove);

function animate() {
    const delta = clock.getDelta();

    raycaster.setFromCamera(pointer, camera);
    const intersects = raycaster.intersectObjects(intersectObjects);

    if (intersects.length > 0) {
        document.body.style.cursor = "pointer";
    } else {
        document.body.style.cursor = "default";
        intersectObject = "";
    }

    if (intersects.length > 0) {
        const hit = intersects[0].object;
        if (intersectObjectsNames.includes(hit.name)) {
            intersectObject = hit.name;
        } else if (intersectObjectsNames.includes(hit.parent?.name)) {
            intersectObject = hit.parent.name;
        } else {
            intersectObject = '';
        }
    }

    if (intersectObject !== previousHoverObject) {
        const now = clock.getElapsedTime();

        // Category label — show after 3s, hide immediately on hover exit
        clearTimeout(labelDelayTimer);
        const label = categoryMap[intersectObject] || '';
        if (label && categoryLabelEl) {
            labelDelayTimer = setTimeout(() => {
                categoryLabelEl.textContent = label;
                categoryLabelEl.classList.add('visible');
            }, 3000);
        } else if (categoryLabelEl) {
            categoryLabelEl.classList.remove('visible');
        }

        if (intersectObject === '01_Frame'
            && !hoverAnim.swing.active
            && (now - hoverAnim.swing.lastPlayed) >= COOLDOWN) {
            hoverAnim.swing.active = true;
            hoverAnim.swing.time = 0;
            hoverAnim.swing.lastPlayed = now;
        }

        if (intersectObject === '02_Monitor'
            && !hoverAnim.monitor.active
            && (now - hoverAnim.monitor.lastPlayed) >= COOLDOWN) {
            hoverAnim.monitor.active = true;
            hoverAnim.monitor.time = 0;
            hoverAnim.monitor.lastPlayed = now;
        }

        if (intersectObject === '03_Controller'
            && !hoverAnim.controller.active
            && (now - hoverAnim.controller.lastPlayed) >= COOLDOWN) {
            hoverAnim.controller.active = true;
            hoverAnim.controller.time = 0;
            hoverAnim.controller.lastPlayed = now;
        }

        previousHoverObject = intersectObject;
    }

    // Swing
    if (hoverAnim.swing.active && swingGroup) {
        hoverAnim.swing.time += delta;
        const t = hoverAnim.swing.time;
        if (t < 2.0) {
            swingGroup.rotation.z = Math.sin(t * Math.PI * 2) * 0.35 * (1 - t / 2.0);
        } else {
            swingGroup.rotation.z = 0;
            hoverAnim.swing.active = false;
        }
    }

    // Monitor flicker
    if (hoverAnim.monitor.active && monitorScreenMesh) {
        hoverAnim.monitor.time += delta;
        const t = hoverAnim.monitor.time;
        if (t < 0.5) {
            const phase = Math.floor(t / 0.1) % 2;
            monitorScreenMesh.material.emissiveIntensity = phase === 0 ? 10 : 1.5;
        } else {
            monitorScreenMesh.material.emissiveIntensity = 1.5;
            hoverAnim.monitor.active = false;
        }
    }

    // Controller jump
    if (hoverAnim.controller.active && controllerGroup) {
        hoverAnim.controller.time += delta;
        const t = hoverAnim.controller.time / 0.8;
        if (t < 1) {
            const arc = Math.sin(t * Math.PI);
            controllerGroup.position.y = controllerOriginalY + arc * 1.2;
            controllerGroup.rotation.z -= 0.001;
            controllerGroup.scale.setScalar(1 + arc * 0.65);
        } else {
            controllerGroup.position.y = controllerOriginalY;
            controllerGroup.rotation.z = controllerOriginalRotZ;
            controllerGroup.scale.setScalar(1);
            hoverAnim.controller.active = false;
        }
    }

    // Bike orbit
    bikeAngle += 0.004;
    if (bikeMesh) {
        bikeMesh.position.x = Math.cos(bikeAngle) * 12;
        bikeMesh.position.z = Math.sin(bikeAngle) * 12;
        bikeMesh.rotation.y = -bikeAngle + Math.PI;
    }

    // Bird orbit
    birdAngle -= 0.005;
    if (birdMesh) {
        birdMesh.position.x = Math.cos(birdAngle) * 14;
        birdMesh.position.z = Math.sin(birdAngle) * 14;
        birdMesh.rotation.y = -birdAngle;
    }

    if (mixer) mixer.update(delta);

    // Camera zoom on transition — adjust 0.03 to change speed
    if (isTransitioning) {
        camera.position.lerp(zoomPoint, 0.03);
        camera.lookAt(0, 2.5, 0);
    }

    renderer.render(scene, camera);
}

renderer.setAnimationLoop(animate);

// Burger menu
const navPanel = document.getElementById('nav-panel');
const burgerBtn = document.getElementById('burger-btn');
const closeBtn = document.getElementById('close-btn');

burgerBtn.addEventListener('click', () => {
    navPanel.classList.add('open');
    burgerBtn.style.opacity = '0';
    burgerBtn.style.pointerEvents = 'none';
    closeBtn.classList.add('visible');
});

closeBtn.addEventListener('click', () => {
    navPanel.classList.remove('open');
    burgerBtn.style.opacity = '1';
    burgerBtn.style.pointerEvents = 'auto';
    closeBtn.classList.remove('visible');
});

document.addEventListener('click', (e) => {
    if (
        navPanel.classList.contains('open') &&
        !navPanel.contains(e.target) &&
        e.target !== burgerBtn &&
        !burgerBtn.contains(e.target)
    ) {
        navPanel.classList.remove('open');
        burgerBtn.style.opacity = '1';
        burgerBtn.style.pointerEvents = 'auto';
        closeBtn.classList.remove('visible');
    }
});
