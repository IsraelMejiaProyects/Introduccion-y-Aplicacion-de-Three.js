
import * as THREE from 'https://esm.sh/three@0.160.0';
import { OrbitControls } from 'https://esm.sh/three@0.160.0/examples/jsm/controls/OrbitControls.js';

let scene, camera, renderer, controls;
let ambientLight, keyLight;
let geometry, material, currentMesh;
let rotationSpeed = 0.01;

let animationStarted = false;
let editorLocked = true;
let previewTimer = null;

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
const stepCount = document.getElementById('stepCount');
const modeBadge = document.getElementById('modeBadge');

const STORAGE_KEY = 'threejs_lab_state_v1';

let step = 0;
let codeLines = [];
let generatedCode = '';

const steps = [
  {
    question: 'const scene = new THREE.____();',
    answer: 'scene',
    explanation: 'La escena es el contenedor principal donde se colocan objetos, luces y fondos.',
    hint: 'Es el punto de inicio de todo entorno 3D.',
    example: 'const scene = new THREE.Scene();',
    action: () => {
      ensureBaseScene();
      scene.background = new THREE.Color(0x0d1117);
      return 'const scene = new THREE.Scene();';
    }
  },
  {
    question: 'const camera = new THREE.____(...);',
    answer: 'perspectivecamera',
    explanation: 'La cámara define desde qué ángulo se observa la escena.',
    hint: 'Es la cámara más usada para escenas 3D realistas.',
    example: 'const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);',
    action: () => {
      ensureRendererReady();
      const w = Math.max(container.clientWidth, 1);
      const h = Math.max(container.clientHeight, 1);
      camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 1000);
      camera.position.set(0, 0, 5);
      return `const camera = new THREE.PerspectiveCamera(75, ${roundNumber(w / h)}, 0.1, 1000);\ncamera.position.set(0, 0, 5);`;
    }
  },
  {
    question: 'const renderer = new THREE.____();',
    answer: 'webglrenderer',
    explanation: 'El renderer convierte la escena 3D en una imagen visible en pantalla.',
    hint: 'Es el motor que dibuja todo en el canvas.',
    example: 'const renderer = new THREE.WebGLRenderer({ antialias: true });',
    action: () => {
      ensureRendererReady();
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      const w = Math.max(container.clientWidth, 1);
      const h = Math.max(container.clientHeight, 1);
      renderer.setPixelRatio(window.devicePixelRatio || 1);
      renderer.setSize(w, h);
      container.innerHTML = '';
      container.appendChild(renderer.domElement);
      startAnimation();
      return 'const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });';
    }
  },
  {
    question: 'geometry = new THREE.____();',
    answer: 'boxgeometry',
    explanation: 'La geometría define la forma del objeto 3D.',
    hint: 'Piensa en un cubo.',
    example: 'geometry = new THREE.BoxGeometry();',
    action: () => {
      geometry = new THREE.BoxGeometry(1, 1, 1);
      return 'geometry = new THREE.BoxGeometry(1, 1, 1);';
    }
  },
  {
    question: 'material color (ej: 0xff0000)',
    validator: (v) => /^0x[a-fA-F0-9]{6}$/.test(v.trim()) || /^#[a-fA-F0-9]{6}$/.test(v.trim()),
    explanation: 'El material define cómo se ve la superficie del objeto, incluyendo su color.',
    hint: 'Usa un hexadecimal como 0xff0000 o #ff0000.',
    example: 'material = new THREE.MeshStandardMaterial({ color: 0xff0000, roughness: 0.45, metalness: 0.08 });',
    action: (v) => {
      const color = normalizeHexColor(v);
      material = new THREE.MeshStandardMaterial({ color, roughness: 0.45, metalness: 0.08 });
      return `material = new THREE.MeshStandardMaterial({ color: ${formatHex(color)}, roughness: 0.45, metalness: 0.08 });`;
    }
  },
  {
    question: 'mesh',
    answer: 'mesh',
    explanation: 'El mesh une geometría y material para formar un objeto visible.',
    hint: 'Es la parte que se puede ver en pantalla.',
    example: 'currentMesh = new THREE.Mesh(geometry, material);\nscene.add(currentMesh);',
    action: () => {
      if (!geometry || !material) {
        geometry = geometry || new THREE.BoxGeometry(1, 1, 1);
        material = material || new THREE.MeshStandardMaterial({ color: 0x44aa88 });
      }
      currentMesh = new THREE.Mesh(geometry, material);
      currentMesh.name = 'mainMesh';
      scene.add(currentMesh);
      return 'currentMesh = new THREE.Mesh(geometry, material);\nscene.add(currentMesh);';
    }
  },
  {
    question: 'ambientLight intensidad',
    validator: (v) => isFiniteNumber(v),
    explanation: 'La luz ambiental ilumina toda la escena de forma uniforme.',
    hint: 'Prueba con 0.5 o 0.8.',
    example: 'ambientLight = new THREE.AmbientLight(0xffffff, 0.7);\nscene.add(ambientLight);',
    action: (v) => {
      const intensity = toNumber(v, 0.7);
      ambientLight = new THREE.AmbientLight(0xffffff, intensity);
      ambientLight.name = 'ambientLight';
      scene.add(ambientLight);
      return `ambientLight = new THREE.AmbientLight(0xffffff, ${formatNumber(intensity)});\nscene.add(ambientLight);`;
    }
  },
  {
    question: 'pointLight intensidad',
    validator: (v) => isFiniteNumber(v),
    explanation: 'La luz puntual emite luz desde un punto específico y crea reflejos y volumen.',
    hint: 'Prueba con 1 o 1.2.',
    example: 'keyLight = new THREE.PointLight(0xffffff, 1.2);\nkeyLight.position.set(5, 5, 5);\nscene.add(keyLight);',
    action: (v) => {
      const intensity = toNumber(v, 1.2);
      keyLight = new THREE.PointLight(0xffffff, intensity);
      keyLight.position.set(5, 5, 5);
      keyLight.name = 'keyLight';
      scene.add(keyLight);
      return `keyLight = new THREE.PointLight(0xffffff, ${formatNumber(intensity)});\nkeyLight.position.set(5, 5, 5);\nscene.add(keyLight);`;
    }
  },
  {
    question: 'OrbitControls',
    answer: 'orbitcontrols',
    explanation: 'OrbitControls permite mover la cámara con el mouse para explorar la escena.',
    hint: 'Es un control interactivo para navegar.',
    example: 'controls = new OrbitControls(camera, renderer.domElement);',
    action: () => {
      ensureRendererReady();
      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      return 'controls = new OrbitControls(camera, renderer.domElement);';
    }
  },
  {
    question: 'rotationSpeed',
    validator: (v) => isFiniteNumber(v),
    explanation: 'La velocidad de rotación controla qué tan rápido gira el objeto principal.',
    hint: 'Un valor pequeño como 0.01 funciona bien.',
    example: 'rotationSpeed = 0.01;',
    action: (v) => {
      rotationSpeed = toNumber(v, 0.01);
      return `rotationSpeed = ${formatNumber(rotationSpeed)};`;
    }
  },
  {
    question: 'requestAnimationFrame(____)',
    answer: 'animate',
    explanation: 'El loop de animación se ejecuta continuamente para actualizar la escena en tiempo real.',
    hint: 'Es el nombre de la función que se llama a sí misma.',
    example: `function animate() {\n  requestAnimationFrame(animate);\n  currentMesh.rotation.y += rotationSpeed;\n  renderer.render(scene, camera);\n}`,
    action: () => {
      return [
        'function animate() {',
        '  requestAnimationFrame(animate);',
        '  if (currentMesh) currentMesh.rotation.y += rotationSpeed;',
        '  if (controls) controls.update();',
        '  if (renderer && scene && camera) renderer.render(scene, camera);',
        '}',
        'requestAnimationFrame(animate);'
      ].join('\n');
    }
  }
];

function ensureBaseScene() {
  if (!scene) {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0d1117);
  }
}

function ensureRendererReady() {
  ensureBaseScene();
  if (!renderer) {
    const w = Math.max(container.clientWidth, 1);
    const h = Math.max(container.clientHeight, 1);
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio || 1);
    renderer.setSize(w, h);
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
  }
  if (!camera) {
    const w = Math.max(container.clientWidth, 1);
    const h = Math.max(container.clientHeight, 1);
    camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 1000);
    camera.position.set(0, 0, 5);
  }
}

function startAnimation() {
  if (animationStarted) return;
  animationStarted = true;

  const animate = () => {
    requestAnimationFrame(animate);
    if (currentMesh) currentMesh.rotation.y += rotationSpeed;
    if (controls) controls.update();
    if (renderer && scene && camera) renderer.render(scene, camera);
  };

  animate();
}

function updateProgress() {
  progressText.textContent = `Paso ${Math.min(step + 1, steps.length)} de ${steps.length}`;
  stepCount.textContent = step < steps.length ? `Paso ${step + 1}/${steps.length}` : 'Modo libre';
  const percent = steps.length > 0 ? Math.min((step / steps.length) * 100, 100) : 0;
  if (progressBar) progressBar.style.width = `${percent}%`;
}

function updateHelp() {
  const s = steps[step];
  instruction.textContent = s.question;
  explanation.textContent = s.explanation;
  hint.textContent = `💡 ${s.hint}`;
  example.textContent = s.example || '';
  codeBlock.textContent = s.question;
  updateProgress();
  saveState();
}

function setFeedback(message, kind = '') {
  feedback.textContent = message;
  feedback.className = `feedback ${kind}`.trim();
}

function normalizeHexColor(inputValue) {
  const raw = String(inputValue).trim();
  if (/^#[a-fA-F0-9]{6}$/.test(raw)) return Number(`0x${raw.slice(1)}`);
  if (/^0x[a-fA-F0-9]{6}$/.test(raw)) return Number(raw);
  return 0xffffff;
}

function formatHex(value) {
  return `0x${value.toString(16).padStart(6, '0')}`;
}

function isFiniteNumber(value) {
  return Number.isFinite(Number(String(value).trim()));
}

function toNumber(value, fallback = 0) {
  const n = Number(String(value).trim());
  return Number.isFinite(n) ? n : fallback;
}

function formatNumber(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '0';
  const fixed = Number(n.toFixed(6));
  return String(fixed);
}

function roundNumber(value) {
  return Number(Number(value).toFixed(4));
}

function debounce(fn, delay) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), delay);
  };
}

function saveState() {
  const state = {
    step,
    codeLines,
    editorLocked,
    code: codeEditor.value
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return false;

  try {
    const state = JSON.parse(raw);
    if (typeof state.step === 'number' && Array.isArray(state.codeLines)) {
      step = Math.max(0, Math.min(state.step, steps.length));
      codeLines = state.codeLines.slice();
      editorLocked = Boolean(state.editorLocked);

      if (typeof state.code === 'string' && state.code.trim()) {
        codeEditor.value = state.code;
      } else {
        codeEditor.value = codeLines.join('\n');
      }

      generatedCode = codeLines.join('\n');

      if (step >= steps.length) {
        finalizeLaboratory(true);
        rebuildSceneFromCode(codeEditor.value);
      } else {
        updateHelp();
      }

      return true;
    }
  } catch {
    return false;
  }

  return false;
}

function checkAnswer(stepData, value) {
  if (stepData.validator) return stepData.validator(value);
  const normalized = String(value).trim().toLowerCase();
  return normalized === stepData.answer;
}

function buildGeneratedCode() {
  return codeLines.join('\n');
}

function pushGeneratedLine(line) {
  codeLines.push(line);
  generatedCode = buildGeneratedCode();
  codeEditor.value = generatedCode;
}

function finalizeLaboratory(fromRestore = false) {
  editorLocked = false;
  codeEditor.removeAttribute('readonly');
  applyBtn.disabled = false;
  modeBadge.textContent = 'Modo libre';
  modeBadge.style.background = 'rgba(0, 255, 136, 0.1)';
  modeBadge.style.borderColor = 'rgba(0, 255, 136, 0.2)';
  codeEditor.setAttribute('aria-readonly', 'false');

  if (!fromRestore) {
    setFeedback('🎉 Modo libre activado. Ahora puedes editar el código y aplicar cambios.', 'ok');
  }
  saveState();
}

function sanitizeLine(line) {
  return String(line).replace(/\/\/.*$/g, '').trim();
}

function parseNumberList(argString) {
  if (!argString.trim()) return [];
  return argString
    .split(',')
    .map(part => Number(part.trim()))
    .filter(num => Number.isFinite(num));
}

function splitTopLevelArgs(input) {
  const parts = [];
  let current = '';
  let depthParen = 0;
  let depthBrace = 0;
  let depthBracket = 0;
  let inString = false;
  let stringChar = '';

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    const prev = input[i - 1];

    if (inString) {
      current += ch;
      if (ch === stringChar && prev !== '\\') {
        inString = false;
        stringChar = '';
      }
      continue;
    }

    if (ch === '"' || ch === "'") {
      inString = true;
      stringChar = ch;
      current += ch;
      continue;
    }

    if (ch === '(') depthParen++;
    if (ch === ')') depthParen = Math.max(0, depthParen - 1);
    if (ch === '{') depthBrace++;
    if (ch === '}') depthBrace = Math.max(0, depthBrace - 1);
    if (ch === '[') depthBracket++;
    if (ch === ']') depthBracket = Math.max(0, depthBracket - 1);

    if (ch === ',' && depthParen === 0 && depthBrace === 0 && depthBracket === 0) {
      parts.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }

  if (current.trim()) parts.push(current.trim());
  return parts;
}

function parseObjectLiteralProps(text) {
  const props = {};
  const content = text
    .trim()
    .replace(/^\{/, '')
    .replace(/\}$/, '')
    .trim();

  if (!content) return props;

  for (const part of splitTopLevelArgs(content)) {
    const [rawKey, ...rest] = part.split(':');
    if (!rawKey || rest.length === 0) continue;
    const key = rawKey.trim();
    const value = rest.join(':').trim();
    props[key] = value;
  }
  return props;
}

function resolveLiteral(expr, vars) {
  const trimmed = expr.trim();

  if (/^0x[a-fA-F0-9]{6}$/.test(trimmed)) return Number(trimmed);
  if (/^#[a-fA-F0-9]{6}$/.test(trimmed)) return Number(`0x${trimmed.slice(1)}`);
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) return Number(trimmed);
  if (/^true$/i.test(trimmed)) return true;
  if (/^false$/i.test(trimmed)) return false;
  if (/^null$/i.test(trimmed)) return null;

  if (/^[a-zA-Z_$][\w$]*$/.test(trimmed) && vars[trimmed] !== undefined) {
    return vars[trimmed];
  }

  return undefined;
}

function createGeometry(type, args) {
  const n = parseNumberList(args);
  switch (type) {
    case 'BoxGeometry':
      return new THREE.BoxGeometry(n[0] ?? 1, n[1] ?? 1, n[2] ?? 1);
    case 'SphereGeometry':
      return new THREE.SphereGeometry(n[0] ?? 1, n[1] ?? 32, n[2] ?? 16);
    case 'TorusGeometry':
      return new THREE.TorusGeometry(n[0] ?? 1, n[1] ?? 0.35, n[2] ?? 16, n[3] ?? 100);
    case 'ConeGeometry':
      return new THREE.ConeGeometry(n[0] ?? 1, n[1] ?? 2, n[2] ?? 32);
    case 'CylinderGeometry':
      return new THREE.CylinderGeometry(n[0] ?? 1, n[1] ?? 1, n[2] ?? 2, n[3] ?? 32);
    case 'PlaneGeometry':
      return new THREE.PlaneGeometry(n[0] ?? 1, n[1] ?? 1);
    case 'IcosahedronGeometry':
      return new THREE.IcosahedronGeometry(n[0] ?? 1, n[1] ?? 0);
    case 'OctahedronGeometry':
      return new THREE.OctahedronGeometry(n[0] ?? 1, n[1] ?? 0);
    case 'TetrahedronGeometry':
      return new THREE.TetrahedronGeometry(n[0] ?? 1, n[1] ?? 0);
    case 'RingGeometry':
      return new THREE.RingGeometry(n[0] ?? 0.5, n[1] ?? 1, n[2] ?? 32);
    default:
      return null;
  }
}

function createMaterial(type, propsText) {
  const props = parseObjectLiteralProps(propsText);
  const options = {};

  if (props.color) {
    const value = resolveLiteral(props.color, {});
    if (typeof value === 'number') options.color = value;
  }

  if (props.roughness !== undefined) options.roughness = Number(props.roughness);
  if (props.metalness !== undefined) options.metalness = Number(props.metalness);
  if (props.wireframe !== undefined) options.wireframe = /^true$/i.test(props.wireframe.trim());
  if (props.transparent !== undefined) options.transparent = /^true$/i.test(props.transparent.trim());
  if (props.opacity !== undefined) options.opacity = Number(props.opacity);
  if (props.side !== undefined) {
    const side = props.side.trim();
    if (side === 'THREE.DoubleSide') options.side = THREE.DoubleSide;
    if (side === 'THREE.FrontSide') options.side = THREE.FrontSide;
    if (side === 'THREE.BackSide') options.side = THREE.BackSide;
  }

  switch (type) {
    case 'MeshStandardMaterial':
      return new THREE.MeshStandardMaterial(options);
    case 'MeshBasicMaterial':
      return new THREE.MeshBasicMaterial(options);
    case 'MeshPhongMaterial':
      return new THREE.MeshPhongMaterial(options);
    default:
      return null;
  }
}

function createLight(type, args) {
  const parts = splitTopLevelArgs(args);
  const colorExpr = parts[0] ?? '0xffffff';
  const intensityExpr = parts[1] ?? '1';

  const color = resolveLiteral(colorExpr, {});
  const intensity = Number(intensityExpr);

  switch (type) {
    case 'AmbientLight':
      return new THREE.AmbientLight(color ?? 0xffffff, Number.isFinite(intensity) ? intensity : 1);
    case 'PointLight':
      return new THREE.PointLight(color ?? 0xffffff, Number.isFinite(intensity) ? intensity : 1);
    case 'DirectionalLight':
      return new THREE.DirectionalLight(color ?? 0xffffff, Number.isFinite(intensity) ? intensity : 1);
    default:
      return null;
  }
}

function createObjectFromNewExpression(expr, vars) {
  const trimmed = expr.trim();

  const geometryMatch = trimmed.match(/^new\s+THREE\.(\w+)\((.*)\)$/s);
  if (!geometryMatch) {
    return resolveLiteral(trimmed, vars);
  }

  const [, className, argText] = geometryMatch;

  if (className.endsWith('Geometry')) {
    return createGeometry(className, argText);
  }

  if (className.endsWith('Material')) {
    return createMaterial(className, argText);
  }

  if (className === 'AmbientLight' || className === 'PointLight' || className === 'DirectionalLight') {
    return createLight(className, argText);
  }

  if (className === 'Mesh') {
    const meshArgs = splitTopLevelArgs(argText);
    const geometryExpr = meshArgs[0] ?? '';
    const materialExpr = meshArgs[1] ?? '';

    const geometryValue = createObjectFromNewExpression(geometryExpr, vars);
    const materialValue = createObjectFromNewExpression(materialExpr, vars);

    if (geometryValue instanceof THREE.BufferGeometry && materialValue instanceof THREE.Material) {
      return new THREE.Mesh(geometryValue, materialValue);
    }

    const geoResolved = resolveLiteral(geometryExpr, vars);
    const matResolved = resolveLiteral(materialExpr, vars);

    if (geoResolved instanceof THREE.BufferGeometry && matResolved instanceof THREE.Material) {
      return new THREE.Mesh(geoResolved, matResolved);
    }
  }

  return undefined;
}

function applyTransformStatement(target, property, args) {
  const values = parseNumberList(args);
  if (!target || !property || values.length < 3) return;

  if (property === 'position') target.position.set(values[0], values[1], values[2]);
  if (property === 'rotation') target.rotation.set(values[0], values[1], values[2]);
  if (property === 'scale') target.scale.set(values[0], values[1], values[2]);
}

function cleanupRuntimeObjects() {
  const seen = new Set();
  const allObjects = [currentMesh, ambientLight, keyLight];

  allObjects.forEach(obj => {
    if (!obj || seen.has(obj)) return;
    seen.add(obj);

    if (obj.parent) obj.parent.remove(obj);

    if (obj.isMesh) {
      if (obj.geometry && typeof obj.geometry.dispose === 'function' && !seen.has(obj.geometry)) {
        seen.add(obj.geometry);
        obj.geometry.dispose();
      }
      if (obj.material) {
        const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
        materials.forEach(mat => {
          if (mat && typeof mat.dispose === 'function' && !seen.has(mat)) {
            seen.add(mat);
            mat.dispose();
          }
        });
      }
    } else if (obj.material && typeof obj.material.dispose === 'function' && !seen.has(obj.material)) {
      seen.add(obj.material);
      obj.material.dispose();
    }

    if (obj.geometry && typeof obj.geometry.dispose === 'function' && !seen.has(obj.geometry)) {
      seen.add(obj.geometry);
      obj.geometry.dispose();
    }
  });

  currentMesh = null;
  ambientLight = null;
  keyLight = null;
}

function clearSceneContent() {
  if (!scene) return;

  const toRemove = [];
  scene.traverse((child) => {
    if (child !== scene && child !== camera) {
      toRemove.push(child);
    }
  });

  for (const child of toRemove) {
    if (child.parent) child.parent.remove(child);
  }
}

function rebuildSceneFromCode(code) {
  ensureRendererReady();
  cleanupRuntimeObjects();
  clearSceneContent();

  if (!scene.background) {
    scene.background = new THREE.Color(0x0d1117);
  }

  const vars = {
    scene,
    camera,
    renderer,
    controls
  };

  const lines = String(code).split(/\r?\n/);

  for (const rawLine of lines) {
    const line = sanitizeLine(rawLine);
    if (!line) continue;

    if (/^function\s+animate\s*\(/.test(line)) {
      continue;
    }

    let match;

    match = line.match(/^scene\.background\s*=\s*new\s+THREE\.Color\(([^)]+)\)/);
    if (match) {
      const color = resolveLiteral(match[1].trim(), vars);
      if (typeof color === 'number') scene.background = new THREE.Color(color);
      continue;
    }

    match = line.match(/^scene\.background\s*=\s*(['"])(#[a-fA-F0-9]{6}|0x[a-fA-F0-9]{6})\1/);
    if (match) {
      scene.background = new THREE.Color(normalizeHexColor(match[2]));
      continue;
    }

    match = line.match(/^(?:const|let|var)?\s*([a-zA-Z_$][\w$]*)\s*=\s*new\s+THREE\.([A-Za-z0-9_]+)\((.*)\)$/s);
    if (match) {
      const [, name, className, argText] = match;
      let created;

      if (className.endsWith('Geometry')) created = createGeometry(className, argText);
      else if (className.endsWith('Material')) created = createMaterial(className, argText);
      else if (className === 'AmbientLight' || className === 'PointLight' || className === 'DirectionalLight') created = createLight(className, argText);
      else if (className === 'Mesh') {
        const meshArgs = splitTopLevelArgs(argText);
        const geoExpr = meshArgs[0] ?? '';
        const matExpr = meshArgs[1] ?? '';

        const geoValue = createObjectFromNewExpression(geoExpr, vars) ?? resolveLiteral(geoExpr, vars);
        const matValue = createObjectFromNewExpression(matExpr, vars) ?? resolveLiteral(matExpr, vars);

        if (geoValue instanceof THREE.BufferGeometry && matValue instanceof THREE.Material) {
          created = new THREE.Mesh(geoValue, matValue);
        }
      }

      if (created) {
        vars[name] = created;
        if (created.isLight || created.isMesh) {
          scene.add(created);
        }
        if (name === 'currentMesh') currentMesh = created.isMesh ? created : currentMesh;
        if (name === 'ambientLight') ambientLight = created.isLight ? created : ambientLight;
        if (name === 'keyLight' || name === 'light') keyLight = created.isLight ? created : keyLight;
      }
      continue;
    }

    match = line.match(/^([a-zA-Z_$][\w$]*)\.position\.set\(([^)]+)\)/);
    if (match) {
      const target = vars[match[1]];
      applyTransformStatement(target, 'position', match[2]);
      continue;
    }

    match = line.match(/^([a-zA-Z_$][\w$]*)\.rotation\.set\(([^)]+)\)/);
    if (match) {
      const target = vars[match[1]];
      applyTransformStatement(target, 'rotation', match[2]);
      continue;
    }

    match = line.match(/^([a-zA-Z_$][\w$]*)\.scale\.set\(([^)]+)\)/);
    if (match) {
      const target = vars[match[1]];
      applyTransformStatement(target, 'scale', match[2]);
      continue;
    }

    match = line.match(/^([a-zA-Z_$][\w$]*)\.lookAt\(([^)]+)\)/);
    if (match && vars[match[1]] && typeof vars[match[1]].lookAt === 'function') {
      const values = parseNumberList(match[2]);
      if (values.length >= 3) vars[match[1]].lookAt(values[0], values[1], values[2]);
      continue;
    }

    match = line.match(/^rotationSpeed\s*=\s*([\d.]+)/);
    if (match) {
      rotationSpeed = Number(match[1]);
      continue;
    }

    match = line.match(/^scene\.add\(([^)]+)\)/);
    if (match) {
      const targetName = match[1].trim();
      const target = vars[targetName];
      if (target && target !== scene && !target.parent) scene.add(target);
      continue;
    }

    match = line.match(/^([a-zA-Z_$][\w$]*)\.material\.color\.set\(([^)]+)\)/);
    if (match && vars[match[1]] && vars[match[1]].material && vars[match[1]].material.color) {
      const color = resolveLiteral(match[2].trim(), vars);
      if (typeof color === 'number') vars[match[1]].material.color.set(color);
      continue;
    }

    match = line.match(/^([a-zA-Z_$][\w$]*)\.material\.opacity\s*=\s*([\d.]+)/);
    if (match && vars[match[1]] && vars[match[1]].material) {
      vars[match[1]].material.transparent = true;
      vars[match[1]].material.opacity = Number(match[2]);
      continue;
    }

    match = line.match(/^([a-zA-Z_$][\w$]*)\.visible\s*=\s*(true|false)/i);
    if (match && vars[match[1]]) {
      vars[match[1]].visible = /^true$/i.test(match[2]);
      continue;
    }

    match = line.match(/^([a-zA-Z_$][\w$]*)\.castShadow\s*=\s*(true|false)/i);
    if (match && vars[match[1]]) {
      vars[match[1]].castShadow = /^true$/i.test(match[2]);
      continue;
    }

    match = line.match(/^([a-zA-Z_$][\w$]*)\.receiveShadow\s*=\s*(true|false)/i);
    if (match && vars[match[1]]) {
      vars[match[1]].receiveShadow = /^true$/i.test(match[2]);
      continue;
    }

    const assignMatch = line.match(/^(?:const|let|var)?\s*([a-zA-Z_$][\w$]*)\s*=\s*([^;]+)$/s);
    if (assignMatch) {
      const name = assignMatch[1];
      const expr = assignMatch[2].trim();

      if (name === 'rotationSpeed' && /^-?[\d.]+$/.test(expr)) {
        rotationSpeed = Number(expr);
        continue;
      }

      const value = createObjectFromNewExpression(expr, vars) ?? resolveLiteral(expr, vars);
      if (value !== undefined) {
        vars[name] = value;
        if (value.isLight || value.isMesh) scene.add(value);
        if (name === 'currentMesh' && value.isMesh) currentMesh = value;
        if ((name === 'ambientLight' || name === 'light' || name === 'keyLight') && value.isLight) {
          if (name === 'ambientLight') ambientLight = value;
          else keyLight = value;
        }
      }
    }
  }

  if (camera && renderer) {
    renderer.render(scene, camera);
  }
}

const livePreviewFromEditor = () => {
  if (editorLocked) return;
  if (previewTimer) clearTimeout(previewTimer);

  previewTimer = setTimeout(() => {
    try {
      rebuildSceneFromCode(codeEditor.value);
      saveState();
      setFeedback('Vista previa actualizada.', 'ok');
    } catch (error) {
      setFeedback('No se pudo aplicar la vista previa. Revisa la sintaxis del código.', 'error');
    }
  }, 250);
};

btn.addEventListener('click', () => {
  const val = input.value.trim();
  const s = steps[step];
  const ok = checkAnswer(s, val);

  if (ok) {
    const code = s.action(val);
    pushGeneratedLine(code);

    step += 1;
    input.value = '';
    setFeedback('✅ Correcto', 'ok');

    if (step < steps.length) {
      updateHelp();
    } else {
      finalizeLaboratory(false);
    }
    saveState();
  } else {
    setFeedback('❌ Incorrecto', 'error');
  }
});

applyBtn.addEventListener('click', () => {
  if (editorLocked) return;
  try {
    rebuildSceneFromCode(codeEditor.value);
    saveState();
    setFeedback('✅ Cambios aplicados', 'ok');
  } catch (error) {
    setFeedback('❌ No se pudieron aplicar los cambios', 'error');
  }
});

resetBtn.addEventListener('click', () => {
  codeEditor.value = generatedCode || buildGeneratedCode();
  if (!editorLocked) {
    try {
      rebuildSceneFromCode(codeEditor.value);
      setFeedback('Código restaurado y aplicado.', 'ok');
    } catch {
      setFeedback('Código restaurado.', 'ok');
    }
  } else {
    setFeedback('Código restaurado.', 'ok');
  }
  saveState();
});

codeEditor.addEventListener('input', () => {
  if (!editorLocked) {
    livePreviewFromEditor();
  }
});

input.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    btn.click();
  }
});

window.addEventListener('resize', () => {
  if (!renderer || !camera) return;
  const w = Math.max(container.clientWidth, 1);
  const h = Math.max(container.clientHeight, 1);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
});

function initializeLab() {
  ensureBaseScene();
  ensureRendererReady();
  startAnimation();
  updateProgress();

  const restored = loadState();
  if (!restored) {
    codeEditor.value = '';
    generatedCode = '';
    codeLines = [];
    modeBadge.textContent = 'Modo guiado';
    modeBadge.style.background = 'rgba(88, 166, 255, 0.12)';
    modeBadge.style.borderColor = 'rgba(88, 166, 255, 0.25)';
    setFeedback('Completa los pasos para desbloquear la edición libre.', '');
    updateHelp();
    saveState();
  }
}

initializeLab();