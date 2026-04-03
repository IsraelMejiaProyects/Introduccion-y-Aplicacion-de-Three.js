import * as THREE from 'https://esm.sh/three@0.160.0';
import { OrbitControls } from 'https://esm.sh/three@0.160.0/examples/jsm/controls/OrbitControls.js';

// VARIABLES GLOBALES
let scene, camera, renderer, controls;
let geometry, material, currentMesh;
let light;

let animationStarted = false;

const container = document.getElementById('scene-container');

// CONTROL DE PASOS
let step = 0;
let codeLines = [];

// PASOS COMPLETOS
const steps = [

  {
    question: "const scene = new THREE.____();",
    answer: "scene",
    code: "const scene = new THREE.Scene();",
    explanation: "La escena es el contenedor principal donde se agregan todos los objetos 3D.",
    hint: "Empieza con 'Scene'.",
    example: "const scene = new THREE.Scene();",
    action: () => {
      scene = new THREE.Scene();
    }
  },

  {
    question: "const camera = new THREE.____(75, width/height, 0.1, 1000);",
    answer: "perspectivecamera",
    code: "const camera = new THREE.PerspectiveCamera(75, width/height, 0.1, 1000);",
    explanation: "La cámara define desde dónde se observa la escena.",
    hint: "Simula la visión humana.",
    example: "new THREE.PerspectiveCamera(...)",
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
    code: "const renderer = new THREE.WebGLRenderer({ antialias: true });",
    explanation: "El renderer dibuja la escena en pantalla.",
    hint: "Utiliza WebGL.",
    example: "new THREE.WebGLRenderer()",
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
    code: "geometry = new THREE.BoxGeometry();",
    explanation: "Define la forma del objeto.",
    hint: "Es un cubo.",
    example: "new THREE.BoxGeometry()",
    action: () => {
      geometry = new THREE.BoxGeometry();
    }
  },

  {
    question: "material = new THREE.MeshStandardMaterial({ color: ____ });",
    answer: "0x00ffcc",
    code: "material = new THREE.MeshStandardMaterial({ color: 0x00ffcc });",
    explanation: "Define la apariencia del objeto.",
    hint: "Formato hexadecimal (0x...).",
    example: "color: 0xff0000",
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
    code: "currentMesh = new THREE.Mesh(geometry, material);",
    explanation: "Combina geometría y material.",
    hint: "Objeto visible final.",
    example: "new THREE.Mesh(...)",
    action: () => {
      currentMesh = new THREE.Mesh(geometry, material);
      scene.add(currentMesh);
    }
  },

  {
    question: "light = new THREE.PointLight(0xffffff, ____);",
    answer: "1",
    code: "light = new THREE.PointLight(0xffffff, 1);",
    explanation: "La luz permite ver el objeto.",
    hint: "Número de intensidad.",
    example: "new THREE.PointLight(...)",
    action: () => {
      light = new THREE.PointLight(0xffffff, 1);
      light.position.set(5, 5, 5);
      scene.add(light);
    }
  },

  {
    question: "const controls = new ____ (camera, renderer.domElement);",
    answer: "orbitcontrols",
    code: "const controls = new OrbitControls(camera, renderer.domElement);",
    explanation: "Permite mover la cámara con el mouse.",
    hint: "Control orbital.",
    example: "new OrbitControls(...)",
    action: () => {
      controls = new OrbitControls(camera, renderer.domElement);
    }
  },

  {
    question: "function animate() { requestAnimationFrame(____); }",
    answer: "animate",
    code: "function animate() { requestAnimationFrame(animate); }",
    explanation: "Permite actualizar la escena continuamente.",
    hint: "Se llama a sí misma.",
    example: "requestAnimationFrame(animate)",
    action: () => {
      startAnimation();
    }
  }

];

// ELEMENTOS UI
const input = document.getElementById("userInput");
const btn = document.getElementById("checkBtn");
const feedback = document.getElementById("feedback");
const codeBlock = document.getElementById("exerciseCode");

// FUNCIONES

function loadStep() {
  codeBlock.textContent = steps[step].question;
  updateHelp();
}

function updateHelp() {
  document.getElementById("explanation").textContent = steps[step].explanation;
  document.getElementById("hint").textContent = "💡 " + steps[step].hint;
  document.getElementById("example").textContent = steps[step].example;
}

function updateCodeDisplay() {
  const codeDisplay = document.getElementById("codeDisplay");

  codeDisplay.textContent = codeLines.join("\n");

  codeDisplay.removeAttribute("data-highlighted");

  hljs.highlightElement(codeDisplay);
}

// EVENTO BOTÓN

btn.addEventListener("click", () => {

  const userValue = input.value.trim().toLowerCase();

  if (userValue === steps[step].answer) {

    feedback.textContent = "✅ Correcto";

    steps[step].action();

    codeLines.push(steps[step].code);
    updateCodeDisplay();

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

// ANIMACIÓN

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

// RESPONSIVE

window.addEventListener('resize', () => {

  if (!renderer || !camera) return;

  const width = container.clientWidth;
  const height = container.clientHeight;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  renderer.setSize(width, height);

});

// INICIO
loadStep();