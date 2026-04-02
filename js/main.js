import * as THREE from 'three';

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';


// ESCENA
const scene = new THREE.Scene();
const loader = new THREE.TextureLoader();

loader.load(
    'https://threejs.org/examples/textures/gradientMaps/threeTone.jpg',
    function(texture){

        texture.mapping = THREE.EquirectangularReflectionMapping;

        scene.background = texture;

        scene.environment = texture;

    }
);



// CÁMARA
const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);

camera.position.set(0, 0, 5);


// RENDERIZADOR
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.shadowMap.enabled = true;

renderer.setSize(window.innerWidth, window.innerHeight);

const container = document.getElementById('scene-container');
container.appendChild(renderer.domElement);


// CONTROLES
const controls = new OrbitControls(camera, renderer.domElement);

controls.enableDamping = true;

controls.dampingFactor = 0.05;


// GEOMETRÍA INICIAL
let geometry = new THREE.BoxGeometry();


// MATERIAL INICIAL
let material = new THREE.MeshStandardMaterial({

    color: 0x00ffcc,

    metalness: 0.5,

    roughness: 0.2

});


// OBJETO ACTUAL
let currentMesh = new THREE.Mesh(geometry, material);
currentMesh.castShadow = true;


scene.add(currentMesh);


// LUZ PRINCIPAL
const light = new THREE.PointLight(0xffffff, 100);
light.castShadow = true;


light.position.set(5, 5, 5);

scene.add(light);



const fillLight = new THREE.DirectionalLight(0xffffff, 0.5);

fillLight.position.set(-5, 5, -5);

scene.add(fillLight);



// LUZ AMBIENTE
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);

scene.add(ambientLight);

let rotationEnabled = true;


// PANEL — CONTROL DE COLOR

const colorPicker = document.getElementById('colorPicker');

colorPicker.addEventListener('input', (event) => {

    currentMesh.material.color.set(event.target.value);

});


// PANEL — CONTROL DE FORMA

const shapeSelector = document.getElementById('shapeSelector');

shapeSelector.addEventListener('change', (event) => {

    scene.remove(currentMesh);

    if (event.target.value === 'cube') {

        geometry = new THREE.BoxGeometry();

    }

    if (event.target.value === 'sphere') {

        geometry = new THREE.SphereGeometry(1, 32, 32);

    }

    if (event.target.value === 'torus') {

        geometry = new THREE.TorusGeometry(0.7, 0.3, 16, 100);

    }

    material = new THREE.MeshStandardMaterial({

        color: colorPicker.value,

        metalness: 0.7,

        roughness: 0.1

    });

    currentMesh = new THREE.Mesh(geometry, material);
    currentMesh.castShadow = true;

    scene.add(currentMesh);

});

// PISO

const floorGeometry = new THREE.PlaneGeometry(20, 20);

const floorMaterial = new THREE.MeshStandardMaterial({

    color: 0x222222,

    metalness: 0.2,

    roughness: 0.8

});

const floor = new THREE.Mesh(floorGeometry, floorMaterial);

floor.rotation.x = -Math.PI / 2;

floor.position.y = -1.5;

floor.receiveShadow = true;

scene.add(floor);




// ANIMACIÓN

function animate() {

    requestAnimationFrame(animate);

    if(rotationEnabled)
        {
            currentMesh.position.y = 0;
            currentMesh.rotation.y += 0.01;
        }


    controls.update();

    renderer.render(scene, camera);

}

animate();


// RESPONSIVE

window.addEventListener('resize', () => {

    const width = container.clientWidth;
    const height = container.clientHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    renderer.setSize(width, height);

});

const lightIntensityControl = document.getElementById('lightIntensity');

lightIntensityControl.addEventListener('input', (event) => {

    light.intensity = event.target.value;

});

const rotationToggle = document.getElementById('rotationToggle');

rotationToggle.addEventListener('change', (event) => {

    rotationEnabled = event.target.value === 'on';

});

const infoBox = document.getElementById('infoBox');

shapeSelector.addEventListener('change', (event) => {

    let nombre = "";

    if(event.target.value === "cube") nombre = "Cubo";
    if(event.target.value === "sphere") nombre = "Esfera";
    if(event.target.value === "torus") nombre = "Toro";

    infoBox.innerHTML = `
        Objeto actual: ${nombre}<br>
        Geometría: ${event.target.value}<br>
        Material: MeshStandardMaterial<br>
        Render: WebGLRenderer
    `;

});



