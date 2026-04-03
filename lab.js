import * as THREE from 'https://esm.sh/three@0.160.0';
import { OrbitControls } from 'https://esm.sh/three@0.160.0/examples/jsm/controls/OrbitControls.js';

// VARIABLES GLOBALES
let scene, camera, renderer, controls;
let geometry, material, currentMesh;
let light;

let animationStarted = false;

const container = document.getElementById('scene-container');

// CONTROL
let step = 0;
let codeLines = [];

// PASOS
const steps = [

  {
    question: "const scene = new THREE.____();",
    answer: "scene",
    code: "const scene = new THREE.Scene();",
    explanation: "Contenedor principal de la escena.",
    hint: "Clase base del entorno.",
    example: "new THREE.Scene()",
    action: () => {
      scene = new THREE.Scene();

      // 🔥 LUZ BASE (evita pantalla negra)
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
      scene.add(ambientLight);
    }
  },

  {
    question: "const camera = new THREE.____(75, width/height, 0.1, 1000);",
    answer: "perspectivecamera",
    code: "const camera = new THREE.PerspectiveCamera(75, width/height, 0.1, 1000);",
    explanation: "Define la vista.",
    hint: "Simula visión humana.",
    example: "PerspectiveCamera",
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
    explanation: "Renderiza la escena.",
    hint: "Usa WebGL.",
    example: "WebGLRenderer",
    action: () => {
      renderer = new THREE.WebGLRenderer({ antialias: true });

      const width = container.clientWidth;
      const height = container.clientHeight;

      renderer.setSize(width, height);
      container.appendChild(renderer.domElement);

      // 🔥 iniciar render aquí
      startAnimation();
    }
  },

  {
    question: "geometry = new THREE.____();",
    answer: "boxgeometry",
    code: "geometry = new THREE.BoxGeometry();",
    explanation: "Forma del objeto.",
    hint: "Cubo.",
    example: "BoxGeometry",
    action: () => {
      geometry = new THREE.BoxGeometry();
    }
  },

  {
    question: "material = new THREE.MeshStandardMaterial({ color: ____ });",

    validator: (input) => /^0x[0-9a-f]{6}$/i.test(input),

    explanation: "Define la apariencia.",
    hint: "Color hexadecimal.",
    example: "0xff0000",

    action: (input) => {

      const colorValue = parseInt(input);

      material = new THREE.MeshStandardMaterial({
        color: colorValue,
        metalness: 0.5,
        roughness: 0.2
      });

      if (currentMesh) {
        currentMesh.material = material;
      }

      return `material = new THREE.MeshStandardMaterial({ color: ${input} });`;
    }
  },

  {
    question: "currentMesh = new THREE.____(geometry, material);",
    answer: "mesh",
    code: "currentMesh = new THREE.Mesh(geometry, material);",
    explanation: "Objeto visible.",
    hint: "Combina geometría + material.",
    example: "Mesh",
    action: () => {
      currentMesh = new THREE.Mesh(geometry, material);
      scene.add(currentMesh);
    }
  },

  {
    question: "light = new THREE.PointLight(0xffffff, ____);",

    validator: (input) => !isNaN(input) && Number(input) > 0,

    explanation: "Intensidad de luz.",
    hint: "Número mayor a 0.",
    example: "1.5",

    action: (input) => {

      const intensity = Number(input);

      light = new THREE.PointLight(0xffffff, intensity);
      light.position.set(5, 5, 5);

      scene.add(light);

      return `light = new THREE.PointLight(0xffffff, ${intensity});`;
    }
  },

  {
    question: "const controls = new ____ (camera, renderer.domElement);",
    answer: "orbitcontrols",
    code: "const controls = new OrbitControls(camera, renderer.domElement);",
    explanation: "Control de cámara.",
    hint: "OrbitControls.",
    example: "OrbitControls",
    action: () => {
      controls = new OrbitControls(camera, renderer.domElement);
    }
  },

  {
    question: "function animate() { requestAnimationFrame(____); }",
    answer: "animate",
    code: "function animate() { requestAnimationFrame(animate); }",
    explanation: "Loop de render.",
    hint: "Se llama a sí misma.",
    example: "animate",
    action: () => {
      startAnimation();
    }
  }

];

// UI
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

// BOTÓN

btn.addEventListener("click", () => {

  const userValue = input.value.trim().toLowerCase();

  let isCorrect = false;

  if (steps[step].validator) {
    isCorrect = steps[step].validator(userValue);
  } else {
    isCorrect = userValue === steps[step].answer;
  }

  if (isCorrect) {

    feedback.textContent = "✅ Correcto";

    const result = steps[step].action(userValue);

    if (result) {
      codeLines.push(result);
    } else {
      codeLines.push(steps[step].code);
    }

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