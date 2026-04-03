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

/* ------------------ UTILS ------------------ */
function debounce(fn, delay) {
  let t;
  return () => {
    clearTimeout(t);
    t = setTimeout(fn, delay);
  };
}

/* ------------------ PARSER ------------------ */
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

/* ------------------ LIVE UPDATE ------------------ */
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

/* ------------------ STORAGE ------------------ */
function save() {
  localStorage.setItem("labCode", codeEditor.value);
}

function load() {
  const saved = localStorage.getItem("labCode");
  if (saved) codeEditor.value = saved;
}

/* ------------------ PROGRESS ------------------ */
function updateProgress() {
  progressText.textContent = `Paso ${Math.min(step + 1, steps.length)} de ${steps.length}`;
  if (progressBar) {
    progressBar.style.width = ((step / steps.length) * 100) + "%";
  }
}

/* ------------------ SCENE ------------------ */
function startAnimation() {
  if (animationStarted) return;
  animationStarted = true;

  function animate() {
    requestAnimationFrame(animate);

    if (currentMesh) {
      currentMesh.rotation.y += rotationSpeed;
    }

    if (controls) controls.update();

    if (renderer && scene && camera) {
      renderer.render(scene, camera);
    }
  }

  animate();
}

/* ------------------ STEPS COMPLETOS ------------------ */
const steps = [
  {
    question: "const scene = new THREE.____();",
    answer: "scene",
    explanation: "La escena es el contenedor principal del entorno 3D.",
    hint: "Es la base de todo.",
    example: `const scene = new THREE.Scene();`,
    action: () => {
      scene = new THREE.Scene();
      scene.background = new THREE.Color(0x0d1117);
      return "const scene = new THREE.Scene();";
    }
  },
  {
    question: "const camera = new THREE.____(...);",
    answer: "perspectivecamera",
    explanation: "Define desde dónde se ve la escena.",
    hint: "Simula la vista humana.",
    example: "",
    action: () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 1000);
      camera.position.set(0, 0, 5);
      return "const camera = new THREE.PerspectiveCamera();";
    }
  },
  {
    question: "const renderer = new THREE.____();",
    answer: "webglrenderer",
    explanation: "Renderiza la escena.",
    hint: "Muestra el 3D.",
    example: "",
    action: () => {
      renderer = new THREE.WebGLRenderer({ antialias: true });

      const w = container.clientWidth;
      const h = container.clientHeight;

      renderer.setSize(w, h);
      container.appendChild(renderer.domElement);

      startAnimation();
      return "const renderer = new THREE.WebGLRenderer();";
    }
  },
  {
    question: "geometry = new THREE.____();",
    answer: "boxgeometry",
    explanation: "Forma del objeto.",
    hint: "Un cubo.",
    example: "",
    action: () => {
      geometry = new THREE.BoxGeometry();
      return "geometry = new THREE.BoxGeometry();";
    }
  },
  {
    question: "material color (ej: 0xff0000)",
    validator: v => /^0x[0-9a-f]{6}$/i.test(v),
    explanation: "Color del objeto.",
    hint: "Hexadecimal.",
    example: "",
    action: (v) => {
      material = new THREE.MeshStandardMaterial({ color: Number(v) });
      return `material = new THREE.MeshStandardMaterial({ color: ${v} });`;
    }
  },
  {
    question: "mesh",
    answer: "mesh",
    explanation: "Objeto visible.",
    hint: "Une geometría + material.",
    example: "",
    action: () => {
      currentMesh = new THREE.Mesh(geometry, material);
      scene.add(currentMesh);
      return "mesh creado";
    }
  },
  {
    question: "ambientLight intensidad",
    validator: v => !isNaN(v),
    explanation: "Luz base.",
    hint: "Ej: 0.5",
    example: "",
    action: (v) => {
      ambientLight = new THREE.AmbientLight(0xffffff, Number(v));
      scene.add(ambientLight);
      return `ambientLight = ${v}`;
    }
  },
  {
    question: "pointLight intensidad",
    validator: v => !isNaN(v),
    explanation: "Luz puntual.",
    hint: "Ej: 1",
    example: "",
    action: (v) => {
      light = new THREE.PointLight(0xffffff, Number(v));
      light.position.set(5, 5, 5);
      scene.add(light);
      return `light = ${v}`;
    }
  },
  {
    question: "OrbitControls",
    answer: "orbitcontrols",
    explanation: "Control de cámara.",
    hint: "Mouse",
    example: "",
    action: () => {
      controls = new OrbitControls(camera, renderer.domElement);
      return "controls activados";
    }
  },
  {
    question: "rotationSpeed",
    validator: v => !isNaN(v),
    explanation: "Velocidad de rotación.",
    hint: "0.01",
    example: "",
    action: (v) => {
      rotationSpeed = Number(v);
      return `rotationSpeed = ${v}`;
    }
  },
  {
    question: "requestAnimationFrame(____)",
    answer: "animate",
    explanation: "Loop de animación.",
    hint: "Se llama a sí misma.",
    example: "",
    action: () => "animate loop"
  }
];

/* ------------------ UI ------------------ */
function updateHelp() {
  const s = steps[step];

  instruction.textContent = s.question;
  explanation.textContent = s.explanation;
  hint.textContent = "💡 " + s.hint;
  example.textContent = s.example || "";
  codeBlock.textContent = s.question;

  updateProgress();
}

/* ------------------ EVENTOS ------------------ */
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

    if (step < steps.length) {
      updateHelp();
    } else {
      finalizeLaboratory();
    }

  } else {
    feedback.textContent = "❌ Incorrecto";
  }
});

/* ------------------ FINAL ------------------ */
function finalizeLaboratory() {
  editorLocked = false;
  codeEditor.removeAttribute("readonly");
  applyBtn.disabled = false;

  load();

  feedback.textContent = "🎉 Modo libre activado";
}

/* ------------------ EDITOR ------------------ */
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

/* ------------------ INIT ------------------ */
updateHelp();