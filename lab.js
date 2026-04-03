import * as THREE from 'https://esm.sh/three@0.160.0';
import { OrbitControls } from 'https://esm.sh/three@0.160.0/examples/jsm/controls/OrbitControls.js';

let scene, camera, renderer, controls;
let geometry, material, mesh;
let ambientLight, pointLight;
let rotationSpeed = 0.01;

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

/* ---------------- SCENE BASE ---------------- */
function initBase() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0d1117);

  const w = container.clientWidth;
  const h = container.clientHeight;

  camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 1000);
  camera.position.set(0, 0, 5);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(w, h);

  container.innerHTML = "";
  container.appendChild(renderer.domElement);

  animate();
}

function animate() {
  requestAnimationFrame(animate);

  if (mesh) mesh.rotation.y += rotationSpeed;
  if (controls) controls.update();

  renderer.render(scene, camera);
}

/* ---------------- REBUILD ---------------- */
function rebuildSceneFromCode(code) {
  initBase();

  const lines = code.split("\n");

  lines.forEach(line => {

    if (line.includes("BoxGeometry")) {
      geometry = new THREE.BoxGeometry();
    }

    const colorMatch = line.match(/color:\s*(0x[a-fA-F0-9]+)/);
    if (colorMatch) {
      material = new THREE.MeshStandardMaterial({
        color: Number(colorMatch[1])
      });
    }

    if (line.includes("Mesh(")) {
      mesh = new THREE.Mesh(geometry, material);
      scene.add(mesh);
    }

    const ambientMatch = line.match(/AmbientLight\(0xffffff,\s*([0-9.]+)\)/);
    if (ambientMatch) {
      ambientLight = new THREE.AmbientLight(0xffffff, Number(ambientMatch[1]));
      scene.add(ambientLight);
    }

    const pointMatch = line.match(/PointLight\(0xffffff,\s*([0-9.]+)\)/);
    if (pointMatch) {
      pointLight = new THREE.PointLight(0xffffff, Number(pointMatch[1]));
      pointLight.position.set(5,5,5);
      scene.add(pointLight);
    }

    if (line.includes("OrbitControls")) {
      controls = new OrbitControls(camera, renderer.domElement);
    }

    const speedMatch = line.match(/rotationSpeed\s*=\s*([0-9.]+)/);
    if (speedMatch) {
      rotationSpeed = Number(speedMatch[1]);
    }

    const bgMatch = line.match(/Color\((0x[a-fA-F0-9]+)\)/);
    if (bgMatch) {
      scene.background = new THREE.Color(bgMatch[1]);
    }

  });
}

/* ---------------- STEPS ---------------- */
const steps = [
  {
    question: "Scene",
    answer: "scene",
    explanation: "Contenedor 3D",
    hint: "Base",
    action: () => "const scene = new THREE.Scene();"
  },
  {
    question: "Camera",
    answer: "perspectivecamera",
    explanation: "Vista",
    hint: "",
    action: () => "const camera = new THREE.PerspectiveCamera(75,1,0.1,1000);"
  },
  {
    question: "Renderer",
    answer: "webglrenderer",
    explanation: "",
    hint: "",
    action: () => "const renderer = new THREE.WebGLRenderer();"
  },
  {
    question: "Geometry",
    answer: "boxgeometry",
    explanation: "",
    hint: "",
    action: () => "const geometry = new THREE.BoxGeometry();"
  },
  {
    question: "Color",
    validator: v => /^0x[0-9a-f]{6}$/i.test(v),
    explanation: "",
    hint: "",
    action: v => `const material = new THREE.MeshStandardMaterial({ color: ${v} });`
  },
  {
    question: "Mesh",
    answer: "mesh",
    explanation: "",
    hint: "",
    action: () => "const mesh = new THREE.Mesh(geometry, material);\nscene.add(mesh);"
  },
  {
    question: "Ambient",
    validator: v => !isNaN(v),
    explanation: "",
    hint: "",
    action: v => `const ambientLight = new THREE.AmbientLight(0xffffff, ${v});\nscene.add(ambientLight);`
  },
  {
    question: "Point",
    validator: v => !isNaN(v),
    explanation: "",
    hint: "",
    action: v => `const pointLight = new THREE.PointLight(0xffffff, ${v});\nscene.add(pointLight);`
  },
  {
    question: "Controls",
    answer: "orbitcontrols",
    explanation: "",
    hint: "",
    action: () => "const controls = new OrbitControls(camera, renderer.domElement);"
  },
  {
    question: "Speed",
    validator: v => !isNaN(v),
    explanation: "",
    hint: "",
    action: v => `rotationSpeed = ${v};`
  },
  {
    question: "Loop",
    answer: "animate",
    explanation: "",
    hint: "",
    action: () => "function animate(){requestAnimationFrame(animate);}"
  }
];

/* ---------------- UI ---------------- */
function updateHelp() {
  const s = steps[step];

  instruction.textContent = s.question;
  explanation.textContent = s.explanation;
  hint.textContent = s.hint;
  example.textContent = "";
  codeBlock.textContent = s.question;

  progressText.textContent = `Paso ${step+1} de ${steps.length}`;
  progressBar.style.width = ((step / steps.length) * 100) + "%";
}

btn.addEventListener("click", () => {
  const val = input.value.toLowerCase();
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
      finalize();
    }

  } else {
    feedback.textContent = "❌";
  }
});

/* ---------------- FINAL ---------------- */
function finalize() {
  editorLocked = false;
  codeEditor.removeAttribute("readonly");
  applyBtn.disabled = false;
  feedback.textContent = "Modo libre";
}

/* ---------------- BUTTONS ---------------- */
applyBtn.addEventListener("click", () => {
  rebuildSceneFromCode(codeEditor.value);
  feedback.textContent = "Aplicado";
});

resetBtn.addEventListener("click", () => {
  codeEditor.value = codeLines.join("\n");
});

/* ---------------- INIT ---------------- */
initBase();
updateHelp();