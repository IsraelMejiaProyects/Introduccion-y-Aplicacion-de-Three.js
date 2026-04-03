// IMPORTS (CDN)
import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.160.0/examples/jsm/controls/OrbitControls.js';


// =========================
// VARIABLES GLOBALES
// =========================

let scene, camera, renderer, controls;
let geometry, material, currentMesh;
let light;

let animationStarted = false;


// =========================
// CONTENEDOR
// =========================

const container = document.getElementById('scene-container');


// =========================
// SISTEMA DE PASOS
// =========================

let step = 0;

const steps = [
  {
    question: "const scene = new THREE.____();",
    answer: "scene",
    action: () => {
      scene = new THREE.Scene();
    }
  },
  {
    question: "const camera = new THREE.____(75, width/height, 0.1, 1000);",
    answer: "perspectivecamera",
    action: () => {
      const width = container.clientWidth;
      const height = container.clientHeight;

      camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
      camera.position.set(0, 0, 5);
    }
  },
  {
    question: "const renderer = new THREE.____({ antialias: true });",
    answer: "webglrenderer",
    action: () => {
      renderer = new THREE.WebGLRenderer({ antialias: true });

      const width = container.clientWidth;
      const height = container.clientHeight;

      renderer.setSize(width, height);
      container.appendChild(renderer.domElement);
    }
  },
  {
    question: "geometry = new THREE.____();",
    answer: "boxgeometry",
    action: () => {
      geometry = new THREE.BoxGeometry();
    }
  },
  {
    question: "material = new THREE.MeshStandardMaterial({ color: ____ });",
    answer: "0x00ffcc",
    action: () => {
      material = new THREE.MeshStandardMaterial({
        color: 0x00ffcc,
        metalness: 0.5,
        roughness: 0.2
      });
    }
  },
  {
    question: "currentMesh = new THREE.____(geometry, material);",
    answer: "mesh",
    action: () => {
      currentMesh = new THREE.Mesh(geometry, material);
      scene.add(currentMesh);
    }
  },
  {
    question: "light = new THREE.PointLight(0xffffff, ____);",
    answer: "1",
    action: () => {
      light = new THREE.PointLight(0xffffff, 1);
      light.position.set(5, 5, 5);
      scene.add(light);
    }
  },
  {
    question: "const controls = new ____ (camera, renderer.domElement);",
    answer: "orbitcontrols",
    action: () => {
      controls = new OrbitControls(camera, renderer.domElement);
    }
  },
  {
    question: "function animate() { requestAnimationFrame(____); }",
    answer: "animate",
    action: () => {
      startAnimation();
    }
  }
];


// =========================
// UI ELEMENTOS
// =========================

const input = document.getElementById("userInput");
const btn = document.getElementById("checkBtn");
const feedback = document.getElementById("feedback");
const codeBlock = document.getElementById("exerciseCode");


// =========================
// FUNCIONES
// =========================

function loadStep() {
  codeBlock.textContent = steps[step].question;
}

loadStep();


// VALIDACIÓN

btn.addEventListener("click", () => {

  const userValue = input.value.trim().toLowerCase();

  if (userValue === steps[step].answer) {

    feedback.textContent = "✅ Correcto";

    // Ejecutar acción real
    steps[step].action();

    step++;
    input.value = "";

    if (step < steps.length) {
      loadStep();
    } else {
      feedback.textContent = "🎉 Laboratorio completado";
    }

  } else {
    feedback.textContent = "❌ Intenta de nuevo";
  }

});


// =========================
// ANIMACIÓN
// =========================

function startAnimation() {

  if (animationStarted) return;
  animationStarted = true;

  function animate() {
    requestAnimationFrame(animate);

    if (currentMesh) {
      currentMesh.rotation.y += 0.01;
    }

    if (controls) controls.update();

    if (renderer && scene && camera) {
      renderer.render(scene, camera);
    }
  }

  animate();
}


// =========================
// RESPONSIVE
// =========================

window.addEventListener('resize', () => {

  if (!renderer || !camera) return;

  const width = container.clientWidth;
  const height = container.clientHeight;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  renderer.setSize(width, height);

});