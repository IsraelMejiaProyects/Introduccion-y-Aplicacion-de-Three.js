import * as THREE from 'https://esm.sh/three@0.160.0';
import { OrbitControls } from 'https://esm.sh/three@0.160.0/examples/jsm/controls/OrbitControls.js';

let scene, camera, renderer, controls;
let geometry, material, currentMesh;
let ambientLight, light;
let rotationSpeed = 0.01;

let animationStarted = false;
let editorLocked = true;

const container = document.getElementById('scene-container');
const codeEditor = document.getElementById('codeEditor');
const applyBtn = document.getElementById('applyBtn');
const resetBtn = document.getElementById('resetBtn');
const input = document.getElementById('userInput');
const btn = document.getElementById('checkBtn');
const feedback = document.getElementById('feedback');

const progressText = document.getElementById('progress');
const progressBar = document.getElementById('progressBar');

const instruction = document.getElementById('instruction');
const explanation = document.getElementById('explanation');
const hint = document.getElementById('hint');
const example = document.getElementById('example');
const codeBlock = document.getElementById('exerciseCode');

let step = 0;
let codeLines = [];

function debounce(fn, delay) {
  let t;
  return () => {
    clearTimeout(t);
    t = setTimeout(fn, delay);
  };
}

/* 🔥 PARSER MEJORADO */
function parseCode(code) {
  const result = {};

  const color = code.match(/color:\s*(0x[a-fA-F0-9]+)/);
  if (color) result.color = color[1];

  const bg = code.match(/background\s*=\s*new THREE\.Color\((0x[a-fA-F0-9]+)\)/);
  if (bg) result.bg = bg[1];

  const speed = code.match(/rotationSpeed\s*=\s*([0-9.]+)/);
  if (speed) result.speed = parseFloat(speed[1]);

  return result;
}

/* 🔥 LIVE UPDATE */
function liveUpdate() {
  if (editorLocked) return;

  const updates = parseCode(codeEditor.value);

  if (updates.color && material) {
    material.color.set(updates.color);
  }

  if (updates.bg && scene) {
    scene.background = new THREE.Color(updates.bg);
  }

  if (updates.speed !== undefined) {
    rotationSpeed = updates.speed;
  }
}

/* 🔥 AUTOGUARDADO */
function save() {
  localStorage.setItem("labCode", codeEditor.value);
}

function load() {
  const saved = localStorage.getItem("labCode");
  if (saved) {
    codeEditor.value = saved;
  }
}

/* 🔥 PROGRESO */
function updateProgress() {
  progressText.textContent = `Paso ${Math.min(step + 1, steps.length)} de ${steps.length}`;
  progressBar.style.width = ((step / steps.length) * 100) + "%";
}

/* 🔥 SCENE */
function startAnimation() {
  if (animationStarted) return;
  animationStarted = true;

  function animate() {
    requestAnimationFrame(animate);

    if (currentMesh) currentMesh.rotation.y += rotationSpeed;
    if (controls) controls.update();
    if (renderer && scene && camera) renderer.render(scene, camera);
  }

  animate();
}

/* 🔥 FINAL */
function finalizeLaboratory() {
  editorLocked = false;
  codeEditor.removeAttribute("readonly");
  applyBtn.disabled = false;

  load();

  feedback.textContent = "🎉 Modo libre activado (Live edit)";
}

/* 🔥 EDITOR EVENTS */
codeEditor.addEventListener("input", debounce(() => {
  liveUpdate();
  save();
}, 300));

applyBtn.addEventListener("click", () => {
  liveUpdate();
  feedback.textContent = "✅ Cambios aplicados";
});

resetBtn.addEventListener("click", () => {
  codeEditor.value = codeLines.join("\n");
});

/* 🔥 STEPS (igual pero más estable) */
const steps = [
  {
    question: "const scene = new THREE.____();",
    answer: "scene",
    explanation: "Contenedor 3D",
    hint: "Base del entorno",
    example: "const scene = new THREE.Scene();",
    action: () => {
      scene = new THREE.Scene();
      scene.background = new THREE.Color(0x0d1117);
      return "const scene = new THREE.Scene();";
    }
  },
  {
    question: "const camera = new THREE.____(...);",
    answer: "perspectivecamera",
    explanation: "Cámara",
    hint: "Simula visión humana",
    example: "",
    action: () => {
      camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
      camera.position.z = 5;
      return "const camera = new THREE.PerspectiveCamera();";
    }
  },
  {
    question: "const renderer = new THREE.____();",
    answer: "webglrenderer",
    explanation: "Render",
    hint: "Dibuja",
    example: "",
    action: () => {
      renderer = new THREE.WebGLRenderer();
      renderer.setSize(container.clientWidth, 500);
      container.appendChild(renderer.domElement);
      startAnimation();
      return "const renderer = new THREE.WebGLRenderer();";
    }
  },
  {
    question: "geometry = new THREE.____();",
    answer: "boxgeometry",
    action: () => {
      geometry = new THREE.BoxGeometry();
      return "geometry = new THREE.BoxGeometry();";
    }
  },
  {
    question: "material color (ej: 0xff0000)",
    validator: v => /^0x[0-9a-f]{6}$/i.test(v),
    action: (v) => {
      material = new THREE.MeshStandardMaterial({ color: Number(v) });
      return `material = new THREE.MeshStandardMaterial({ color: ${v} });`;
    }
  },
  {
    question: "mesh",
    answer: "mesh",
    action: () => {
      currentMesh = new THREE.Mesh(geometry, material);
      scene.add(currentMesh);
      return "mesh creado";
    }
  }
];

function updateHelp() {
  const s = steps[step];
  instruction.textContent = s.question;
  explanation.textContent = s.explanation || "";
  hint.textContent = s.hint || "";
  example.textContent = s.example || "";
  codeBlock.textContent = s.question;
  updateProgress();
}

btn.addEventListener("click", () => {
  const val = input.value.trim().toLowerCase();
  const s = steps[step];

  let ok = s.validator ? s.validator(input.value) : val === s.answer;

  if (ok) {
    const code = s.action(input.value);
    codeLines.push(code);
    codeEditor.value = codeLines.join("\n");

    step++;
    input.value = "";

    if (step < steps.length) updateHelp();
    else finalizeLaboratory();
  } else {
    feedback.textContent = "❌ Incorrecto";
  }
});

updateHelp();