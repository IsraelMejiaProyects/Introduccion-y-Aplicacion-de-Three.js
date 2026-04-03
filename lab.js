import * as THREE from 'https://esm.sh/three@0.160.0';
import { OrbitControls } from 'https://esm.sh/three@0.160.0/examples/jsm/controls/OrbitControls.js';

let geometry, material, currentMesh;
let light;

let animationStarted = false;   

const container = document.getElementById('scene-container');

let step = 0;
let codeLines = [];

const steps = [

  {
    question: "const scene = new THREE.____();",
    answer: "scene",
    code: "const scene = new THREE.Scene();",
    explanation: "La escena es el contenedor principal donde se agregan todos los objetos 3D.",
    hint: "Es una clase base que representa el entorno. Empieza con 'Scene'.",
    example: "const scene = new THREE.Scene();",
    action: () => {
      scene = new THREE.Scene();
    }
  },

  {
    question: "const camera = new THREE.____(75, width/height, 0.1, 1000);",
    answer: "perspectivecamera",
    code: "const camera = new THREE.PerspectiveCamera(75, width/height, 0.1, 1000);",
    explanation: "La cámara define desde qué punto se observa la escena.",
    hint: "Es una cámara en perspectiva (simula la visión humana).",
    example: "new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);",
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
    explanation: "El renderer se encarga de dibujar la escena en el navegador.",
    hint: "Utiliza WebGL para renderizar gráficos.",
    example: "const renderer = new THREE.WebGLRenderer();",
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
    explanation: "La geometría define la forma del objeto 3D.",
    hint: "Es una figura cúbica.",
    example: "new THREE.BoxGeometry();",
    action: () => {
      geometry = new THREE.BoxGeometry();
    }
  },

  {
    question: "material = new THREE.MeshStandardMaterial({ color: ____ });",
    answer: "0x00ffcc",
    code: "material = new THREE.MeshStandardMaterial({ color: 0x00ffcc });",
    explanation: "El material define cómo se ve la superficie del objeto.",
    hint: "Es un color en formato hexadecimal (empieza con 0x).",
    example: "color: 0xff0000 // rojo",
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
    explanation: "El mesh combina la geometría y el material en un objeto visible.",
    hint: "Es el objeto final que se agrega a la escena.",
    example: "new THREE.Mesh(geometry, material);",
    action: () => {
      currentMesh = new THREE.Mesh(geometry, material);
      scene.add(currentMesh);
    }
  },

  {
    question: "light = new THREE.PointLight(0xffffff, ____);",
    answer: "1",
    code: "light = new THREE.PointLight(0xffffff, 1);",
    explanation: "La luz permite que los objetos sean visibles.",
    hint: "Es la intensidad de la luz (número).",
    example: "new THREE.PointLight(0xffffff, 1);",
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
    hint: "Controla la órbita alrededor del objeto.",
    example: "new OrbitControls(camera, renderer.domElement);",
    action: () => {
      controls = new OrbitControls(camera, renderer.domElement);
    }
  },

  {
    question: "function animate() { requestAnimationFrame(____); }",
    answer: "animate",
    code: "function animate() { requestAnimationFrame(animate); }",
    explanation: "La animación actualiza la escena continuamente.",
    hint: "Se llama a sí misma para crear un bucle.",
    example: "requestAnimationFrame(animate);",
    action: () => {
      startAnimation();
    }
  }

];

const input = document.getElementById("userInput");
const btn = document.getElementById("checkBtn");
const feedback = document.getElementById("feedback");
const codeBlock = document.getElementById("exerciseCode");

function loadStep() {
  codeBlock.textContent = steps[step].question;
  updateHelp();
}

function updateCodeDisplay() {
  const codeDisplay = document.getElementById("codeDisplay");
  codeDisplay.textContent = codeLines.join("\n");

  hljs.highlightElement(codeDisplay);
}

loadStep();

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

window.addEventListener('resize', () => {

  if (!renderer || !camera) return;

  const width = container.clientWidth;
  const height = container.clientHeight;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  renderer.setSize(width, height);

});


function updateHelp() {
  document.getElementById("explanation").textContent = steps[step].explanation;
  document.getElementById("hint").textContent = "💡 " + steps[step].hint;
  document.getElementById("example").textContent = steps[step].example;
}