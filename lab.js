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

/* ------------------ STEPS ------------------ */
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
      return "const camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 1000);";
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
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      container.appendChild(renderer.domElement);
      startAnimation();
      return "const renderer = new THREE.WebGLRenderer({ antialias: true });";
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
      controls.enableDamping = true;
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

/* ------------------ UTILITIES ------------------ */
function debounce(fn, delay) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), delay);
  };
}

function getRendererSize() {
  return {
    width: Math.max(1, container.clientWidth),
    height: Math.max(1, container.clientHeight)
  };
}

function refreshEditorState() {
  codeEditor.readOnly = editorLocked;
  applyBtn.disabled = editorLocked;
}

function clearScene() {
  if (!scene) return;

  for (let i = scene.children.length - 1; i >= 0; i--) {
    const child = scene.children[i];
    scene.remove(child);

    if (child.geometry) child.geometry.dispose?.();
    if (child.material) {
      if (Array.isArray(child.material)) {
        child.material.forEach(mat => mat.dispose?.());
      } else {
        child.material.dispose?.();
      }
    }
  }

  currentMesh = null;
  ambientLight = null;
  light = null;
}

/* ------------------ PARSER ------------------ */
function parseCode(code) {
  const result = {};

  const color = code.match(/color:\s*(0x[a-fA-F0-9]+)/);
  if (color) result.color = color[1];

  const bg = code.match(/scene\.background\s*=\s*new THREE\.Color\((0x[a-fA-F0-9]+)\)/);
  if (bg) result.bg = bg[1];

  const speed = code.match(/rotationSpeed\s*=\s*([0-9.]+)/);
  if (speed) result.speed = parseFloat(speed[1]);

  const ambient = code.match(/ambientLight\s*=\s*new THREE\.AmbientLight\(0xffffff,\s*([0-9.]+)\)/);
  if (ambient) result.ambient = parseFloat(ambient[1]);

  const point = code.match(/light\s*=\s*new THREE\.PointLight\(0xffffff,\s*([0-9.]+)\)/);
  if (point) result.point = parseFloat(point[1]);

  const camZ = code.match(/camera\.position\.set\(\s*[^,]+,\s*[^,]+,\s*([0-9.-]+)\s*\)/);
  if (camZ) result.cameraZ = parseFloat(camZ[1]);

  return result;
}

/* ------------------ LIVE UPDATE ------------------ */
function liveUpdate() {
  if (editorLocked || !scene) return;

  const updates = parseCode(codeEditor.value);

  if (updates.color && material) {
    material.color.set(updates.color);
  }

  if (updates.bg) {
    scene.background = new THREE.Color(updates.bg);
  }

  if (updates.speed !== undefined && !Number.isNaN(updates.speed)) {
    rotationSpeed = updates.speed;
  }

  if (updates.ambient !== undefined && ambientLight) {
    ambientLight.intensity = updates.ambient;
  }

  if (updates.point !== undefined && light) {
    light.intensity = updates.point;
  }

  if (updates.cameraZ !== undefined && camera) {
    camera.position.z = updates.cameraZ;
  }
}

/* ------------------ SCENE REBUILD ------------------ */
function rebuildSceneFromCode(code) {
  if (!scene) return;

  clearScene();

  const lines = code.split('\n');

  for (const line of lines) {
    const bgMatch = line.match(/scene\.background\s*=\s*new THREE\.Color\((0x[a-fA-F0-9]+)\)/);
    if (bgMatch) {
      scene.background = new THREE.Color(bgMatch[1]);
    }

    const colorMatch = line.match(/color:\s*(0x[a-fA-F0-9]+)/);
    if (colorMatch) {
      material = new THREE.MeshStandardMaterial({ color: Number(colorMatch[1]) });
    }

    const geoMatch = line.match(/new THREE\.(BoxGeometry|SphereGeometry|TorusGeometry|ConeGeometry|CylinderGeometry|PlaneGeometry)\s*\(/);
    if (geoMatch) {
      switch (geoMatch[1]) {
        case 'BoxGeometry':
          geometry = new THREE.BoxGeometry();
          break;
        case 'SphereGeometry':
          geometry = new THREE.SphereGeometry();
          break;
        case 'TorusGeometry':
          geometry = new THREE.TorusGeometry();
          break;
        case 'ConeGeometry':
          geometry = new THREE.ConeGeometry();
          break;
        case 'CylinderGeometry':
          geometry = new THREE.CylinderGeometry();
          break;
        case 'PlaneGeometry':
          geometry = new THREE.PlaneGeometry();
          break;
      }
    }

    if (/new THREE\.Mesh\s*\(/.test(line)) {
      if (geometry && material) {
        currentMesh = new THREE.Mesh(geometry, material);
        scene.add(currentMesh);
      }
    }

    const ambientMatch = line.match(/new THREE\.AmbientLight\(0xffffff,\s*([0-9.]+)\)/);
    if (ambientMatch) {
      ambientLight = new THREE.AmbientLight(0xffffff, Number(ambientMatch[1]));
      scene.add(ambientLight);
    }

    const pointMatch = line.match(/new THREE\.PointLight\(0xffffff,\s*([0-9.]+)\)/);
    if (pointMatch) {
      light = new THREE.PointLight(0xffffff, Number(pointMatch[1]));
      light.position.set(5, 5, 5);
      scene.add(light);
    }

    const directionalMatch = line.match(/new THREE\.DirectionalLight\(0xffffff,\s*([0-9.]+)\)/);
    if (directionalMatch) {
      const directionalLight = new THREE.DirectionalLight(0xffffff, Number(directionalMatch[1]));
      directionalLight.position.set(5, 5, 5);
      scene.add(directionalLight);
    }

    if (/new OrbitControls\(/.test(line) || /new THREE\.OrbitControls\(/.test(line) || /controls/.test(line)) {
      if (camera && renderer) {
        controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
      }
    }

    const speedMatch = line.match(/rotationSpeed\s*=\s*([0-9.]+)/);
    if (speedMatch) {
      rotationSpeed = Number(speedMatch[1]);
    }

    const camMatch = line.match(/camera\.position\.set\(\s*([-0-9.]+)\s*,\s*([-0-9.]+)\s*,\s*([-0-9.]+)\s*\)/);
    if (camMatch && camera) {
      camera.position.set(Number(camMatch[1]), Number(camMatch[2]), Number(camMatch[3]));
    }
  }
}

/* ------------------ RENDER LOOP ------------------ */
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

/* ------------------ UI ------------------ */
function updateProgress() {
  progressText.textContent = `Paso ${Math.min(step + 1, steps.length)} de ${steps.length}`;
  if (progressBar) {
    progressBar.style.width = `${(step / steps.length) * 100}%`;
  }
}

function updateHelp() {
  const s = steps[step];
  instruction.textContent = s.question;
  explanation.textContent = s.explanation;
  hint.textContent = `💡 ${s.hint}`;
  example.textContent = s.example || '';
  codeBlock.textContent = s.question;
  updateProgress();
}

function initializeBaseScene() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0d1117);

  const { width, height } = getRendererSize();
  camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
  camera.position.set(0, 0, 5);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
  scene.add(ambientLight);

  light = new THREE.PointLight(0xffffff, 1);
  light.position.set(5, 5, 5);
  scene.add(light);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;

  startAnimation();
}

function startNewSession() {
  if (renderer && renderer.domElement && renderer.domElement.parentNode === container) {
    container.removeChild(renderer.domElement);
  }

  if (controls) controls.dispose?.();

  scene = null;
  camera = null;
  renderer = null;
  controls = null;
  geometry = null;
  material = null;
  currentMesh = null;
  ambientLight = null;
  light = null;
  rotationSpeed = 0.01;
  animationStarted = false;
  editorLocked = true;
  step = 0;
  codeLines = [];

  codeEditor.value = '';
  input.value = '';
  feedback.textContent = '';
  refreshEditorState();
  updateHelp();
  initializeBaseScene();
}

function finalizeLaboratory() {
  editorLocked = false;
  refreshEditorState();
  feedback.textContent = '🎉 Modo libre activado';
  updateProgress();
}

/* ------------------ EVENTS ------------------ */
btn.addEventListener('click', () => {
  const val = input.value.trim().toLowerCase();
  const s = steps[step];

  const ok = s.validator ? s.validator(input.value.trim()) : val === s.answer;

  if (ok) {
    const code = s.action(input.value.trim());
    codeLines.push(code);
    codeEditor.value = codeLines.join('\n');

    step++;
    input.value = '';

    if (step < steps.length) {
      updateHelp();
    } else {
      finalizeLaboratory();
    }
  } else {
    feedback.textContent = '❌ Incorrecto';
  }
});

codeEditor.addEventListener('input', debounce(() => {
  liveUpdate();
}, 200));

applyBtn.addEventListener('click', () => {
  rebuildSceneFromCode(codeEditor.value);
  feedback.textContent = '✅ Cambios aplicados';
});

resetBtn.addEventListener('click', () => {
  if (editorLocked) {
    startNewSession();
    feedback.textContent = '↩️ Laboratorio reiniciado';
    return;
  }

  codeEditor.value = codeLines.join('\n');
  rebuildSceneFromCode(codeEditor.value);
  feedback.textContent = '↩️ Código restaurado';
});

window.addEventListener('resize', () => {
  if (!camera || !renderer) return;
  const { width, height } = getRendererSize();
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
});

/* ------------------ START ------------------ */
startNewSession();