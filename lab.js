import * as THREE from 'https://esm.sh/three@0.160.0';
import { OrbitControls } from 'https://esm.sh/three@0.160.0/examples/jsm/controls/OrbitControls.js';

let scene, camera, renderer, controls;
let geometry, material, currentMesh;
let ambientLight, light, floor;
let rotationSpeed = 0.01;

let animationStarted = false;
let editorLocked = true;

const DEFAULT_STATE = {
  background: 0x0d1117,
  camera: { x: 0, y: 0, z: 5 },
  materialColor: 0xff0000,
  ambientIntensity: 0.4,
  lightIntensity: 1,
  rotationSpeed: 0.01
};

let sceneState = createDefaultSceneState();

const container = document.getElementById('scene-container');
const codeEditor = document.getElementById('codeEditor');
const applyBtn = document.getElementById('applyBtn');
const resetBtn = document.getElementById('resetBtn');
const input = document.getElementById('userInput');
const btn = document.getElementById('checkBtn');
const feedback = document.getElementById('feedback');
const codeBlock = document.getElementById('exerciseCode');
const progress = document.getElementById('progress');
const instruction = document.getElementById('instruction');
const explanation = document.getElementById('explanation');
const hint = document.getElementById('hint');
const example = document.getElementById('example');
const ambientSlider = document.getElementById("ambientSlider");
const lightSlider = document.getElementById("lightSlider");
const rotationSlider = document.getElementById("rotationSlider");

let step = 0;
let codeLines = [];

const steps = [
  {
    question: "const scene = new THREE.____();",
    answer: "scene",
    explanation: "La escena es el contenedor principal donde se agregan todos los objetos 3D.",
    hint: "Es la base del entorno 3D.",
    example:
`const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0d1117);`,
    action: () => {
      scene = new THREE.Scene();
      scene.background = new THREE.Color(0x0d1117);

      return [
        "const scene = new THREE.Scene();",
        "scene.background = new THREE.Color(0x0d1117);"
      ].join("\n");
    }
  },
  {
    question: "const camera = new THREE.____(75, width / height, 0.1, 1000);",
    answer: "perspectivecamera",
    explanation: "La cámara define desde qué punto se observa la escena.",
    hint: "Simula la visión humana.",
    example:
`const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
camera.position.set(0, 0, 5);`,
    action: () => {
      const width = container.clientWidth;
      const height = container.clientHeight;

      camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
      camera.position.set(0, 0, 5);

      return [
        "const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);",
        "camera.position.set(0, 0, 5);"
      ].join("\n");
    }
  },
  {
    question: "const renderer = new THREE.____({ antialias: true });",
    answer: "webglrenderer",
    explanation: "El renderer dibuja la escena en el navegador.",
    hint: "Es el motor que convierte la escena 3D en imagen visible.",
    example:
`const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(width, height);
renderer.setPixelRatio(window.devicePixelRatio);`,
    action: () => {
      renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.shadowMap.enabled = true;

      const width = container.clientWidth;
      const height = container.clientHeight;

      renderer.setSize(width, height);
      renderer.setPixelRatio(window.devicePixelRatio);
      container.appendChild(renderer.domElement);

      startAnimation();

      return [
        "const renderer = new THREE.WebGLRenderer({ antialias: true });",
        "renderer.setSize(width, height);",
        "renderer.setPixelRatio(window.devicePixelRatio);"
      ].join("\n");
    }
  },
  {
    question: "geometry = new THREE.____();",
    answer: "boxgeometry",
    explanation: "La geometría define la forma del objeto.",
    hint: "Aquí se usa un cubo.",
    example:
`geometry = new THREE.BoxGeometry();`,
    action: () => {
      geometry = new THREE.BoxGeometry();

      return "geometry = new THREE.BoxGeometry();";
    }
  },
  {
    question: "material = new THREE.MeshStandardMaterial({ color: ____ });",
    validator: (inputValue) => /^0x[0-9a-f]{6}$/i.test(inputValue),
    explanation: "El material define el color y la apariencia del objeto.",
    hint: "Debe ser un color hexadecimal válido. Ejemplo: 0xff0000.",
    example:
`material = new THREE.MeshStandardMaterial({
  color: 0xff0000,
  metalness: 0.5,
  roughness: 0.2
});`,
    action: (inputValue) => {
      const colorValue = Number(inputValue);

      material = new THREE.MeshStandardMaterial({
        color: colorValue,
        metalness: 0.5,
        roughness: 0.2
      });

      if (currentMesh) {
        currentMesh.material = material;
      }

      return [
        `material = new THREE.MeshStandardMaterial({ color: ${inputValue}, metalness: 0.5, roughness: 0.2 });`
      ].join("\n");
    }
  },
  {
    question: "currentMesh = new THREE.____(geometry, material);",
    answer: "mesh",
    explanation: "El mesh combina geometría y material para crear el objeto visible.",
    hint: "Es la unión de forma + color.",
    example:
`currentMesh = new THREE.Mesh(geometry, material);
scene.add(currentMesh);`,
    action: () => {
      currentMesh = new THREE.Mesh(geometry, material);
      scene.add(currentMesh);
      currentMesh.castShadow = true;

      return [
        "currentMesh = new THREE.Mesh(geometry, material);",
        "scene.add(currentMesh);"
      ].join("\n");
    }
  },
  {
    question: "ambientLight = new THREE.____(0xffffff, ____);",
    validator: (inputValue) => {
      const value = Number(inputValue);
      return !Number.isNaN(value) && value >= 0;
    },
    explanation: "La luz ambiental ilumina toda la escena de forma suave.",
    hint: "Sirve para evitar que la escena quede negra.",
    example:
`ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambientLight);`,
    action: (inputValue) => {
      const intensity = Number(inputValue);

      ambientLight = new THREE.AmbientLight(0xffffff, intensity);
      scene.add(ambientLight);

      return [
        `ambientLight = new THREE.AmbientLight(0xffffff, ${intensity});`,
        "scene.add(ambientLight);"
      ].join("\n");
    }
  },
  {
    question: "light = new THREE.PointLight(0xffffff, ____);",
    validator: (inputValue) => {
      const value = Number(inputValue);
      return !Number.isNaN(value) && value > 0;
    },
    explanation: "La luz puntual ilumina una zona específica y da profundidad al objeto.",
    hint: "Puedes usar un número mayor que 0, como 0.8, 1 o 2.",
    example:
`light = new THREE.PointLight(0xffffff, 1);
light.position.set(5, 5, 5);
scene.add(light);`,
    action: (inputValue) => {
      const intensity = Number(inputValue);

      light = new THREE.PointLight(0xffffff, intensity);
      light.castShadow = true;
      light.position.set(5, 5, 5);
      scene.add(light);
      const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(20, 20),
        new THREE.MeshStandardMaterial({
          color: 0xfefffe,
          metalness: 0.2,
          roughness: 0.8
        })
      );

      floor.rotation.x = -Math.PI / 2;
      floor.position.y = -1.5;
      floor.receiveShadow = true;

      scene.add(floor);

      return [
        `light = new THREE.PointLight(0xffffff, ${intensity});`,
        "light.position.set(5, 5, 5);",
        "scene.add(light);"
      ].join("\n");
    }
  },
  {
    question: "controls = new ____ (camera, renderer.domElement);",
    answer: "orbitcontrols",
    explanation: "Los controles permiten mover la cámara con el mouse.",
    hint: "Son los controles orbitables de Three.js.",
    example:
`controls = new OrbitControls(camera, renderer.domElement);`,
    action: () => {
      controls = new OrbitControls(camera, renderer.domElement);

      return "controls = new OrbitControls(camera, renderer.domElement);";
    }
  },
  {
    question: "rotationSpeed = ____;",
    validator: (inputValue) => {
      const value = Number(inputValue);
      return !Number.isNaN(value) && value > 0;
    },
    explanation: "La velocidad de rotación permite ajustar qué tan rápido gira el objeto.",
    hint: "Usa un número pequeño, por ejemplo 0.01 o 0.03.",
    example:
`rotationSpeed = 0.01;`,
    action: (inputValue) => {
      rotationSpeed = Number(inputValue);
      return `rotationSpeed = ${rotationSpeed};`;
    }
  },
  {
    question: "function animate() { requestAnimationFrame(____); }",
    answer: "animate",
    explanation: "La animación actualiza la escena constantemente.",
    hint: "La función se llama a sí misma.",
    example:
`function animate() {
  requestAnimationFrame(animate);

  if (currentMesh) {
    currentMesh.rotation.y += rotationSpeed;
  }

  if (controls) controls.update();

  renderer.render(scene, camera);
}`,
    action: () => {
      return [
        "function animate() {",
        "  requestAnimationFrame(animate);",
        "",
        "  if (currentMesh) {",
        "    currentMesh.rotation.y += rotationSpeed;",
        "  }",
        "",
        "  if (controls) controls.update();",
        "",
        "  renderer.render(scene, camera);",
        "}"
      ].join("\n");
    }
  }
];

function createDefaultSceneState() {
  return {
    background: DEFAULT_STATE.background,
    camera: { ...DEFAULT_STATE.camera },
    materialColor: DEFAULT_STATE.materialColor,
    ambientIntensity: DEFAULT_STATE.ambientIntensity,
    lightIntensity: DEFAULT_STATE.lightIntensity,
    rotationSpeed: DEFAULT_STATE.rotationSpeed,

    // 🔥 NUEVO
    shape: "cube",
    rotationEnabled: true,

    floorY: -1.5,
    floorColor: 0xfefffe    
  };
}

function createGeometry(type) {
  switch(type) {
    case "sphere":
      return new THREE.SphereGeometry(1, 32, 32);
    case "torus":
      return new THREE.TorusGeometry(0.7, 0.3, 16, 100);
    default:
      return new THREE.BoxGeometry();
  }
}

function updateProgress() {
  progress.textContent = `Paso ${Math.min(step + 1, steps.length)} de ${steps.length}`;
}

function updateHelp() {
  const current = steps[step];
  instruction.textContent = current.question;
  explanation.textContent = current.explanation;
  hint.textContent = `💡 ${current.hint}`;
  example.textContent = current.example;
  codeBlock.textContent = current.question;
  updateProgress();
}

function updateCodeEditor() {
  if (!editorLocked) return;

  codeEditor.value = codeLines.length
    ? codeLines.join("\n")
    : "// El código se construirá aquí paso a paso...";
}

function renderSceneOnce() {
  if (renderer && scene && camera) {
    renderer.render(scene, camera);
  }
}

function startAnimation() {
  if (animationStarted) return;
  animationStarted = true;

  function animate() {
    requestAnimationFrame(animate);

    if (currentMesh && sceneState.rotationEnabled) {
      currentMesh.rotation.y += rotationSpeed;
    }

    if (controls) {
      controls.update();
    }

    if (renderer && scene && camera) {
      renderer.render(scene, camera);
    }
  }

  animate();
}

function finalizeLaboratory() {
  setupControls();
  editorLocked = false;
  codeEditor.removeAttribute("readonly");
  applyBtn.disabled = false;
  feedback.textContent = "🎉 Laboratorio completado. Ahora puedes editar el código y aplicar cambios.";
  updateProgress();
}

function applyState() {
  if (scene) {
    scene.background = new THREE.Color(sceneState.background);
  }

  if (camera) {
    camera.position.set(
      sceneState.camera.x,
      sceneState.camera.y,
      sceneState.camera.z
    );
    camera.updateProjectionMatrix();
  }

  if (material) {
    material.color.set(sceneState.materialColor);
    material.needsUpdate = true;
  }

  if (currentMesh) {
    scene.remove(currentMesh);
  }

  geometry = createGeometry(sceneState.shape);

  material = new THREE.MeshStandardMaterial({
    color: sceneState.materialColor,
    metalness: 0.5,
    roughness: 0.2
  });

  currentMesh = new THREE.Mesh(geometry, material);
  currentMesh.castShadow = true;

  scene.add(currentMesh);

  // ===== FLOOR =====
  if (floor) {
    scene.remove(floor);
  }

  floor = new THREE.Mesh(
    new THREE.PlaneGeometry(20, 20),
    new THREE.MeshStandardMaterial({
      color: sceneState.floorColor,
      metalness: 0.2,
      roughness: 0.8
    })
  );

  floor.rotation.x = -Math.PI / 2;
  floor.position.y = sceneState.floorY;
  floor.receiveShadow = true;

  scene.add(floor);


  if (ambientLight) {
    ambientLight.intensity = sceneState.ambientIntensity;
  }

  if (light) {
    light.intensity = sceneState.lightIntensity;
  }

  rotationSpeed = sceneState.rotationSpeed;

    // 🔥 AQUÍ VA LO NUEVO
  if (shapeSelector) {
    shapeSelector.value = sceneState.shape;
  }


  renderSceneOnce();
}

function parseEditedCode(code) {
  const nextState = createDefaultSceneState();

  nextState.background = sceneState.background;
  nextState.camera = { ...sceneState.camera };
  nextState.materialColor = sceneState.materialColor;
  nextState.ambientIntensity = sceneState.ambientIntensity;
  nextState.lightIntensity = sceneState.lightIntensity;
  nextState.rotationSpeed = sceneState.rotationSpeed;

  // 🔥 IMPORTANTE: mantener shape actual
  nextState.shape = sceneState.shape;

  const bgMatch = code.match(/scene\.background\s*=\s*new THREE\.Color\(\s*(0x[0-9a-fA-F]{6})\s*\)/);
  if (bgMatch) {
    nextState.background = Number(bgMatch[1]);
  }

  const cameraPosMatch = code.match(
    /camera\.position\.set\(\s*([-\d.]+)\s*,\s*([-\d.]+)\s*,\s*([-\d.]+)\s*\)/
  );
  if (cameraPosMatch) {
    const x = Number(cameraPosMatch[1]);
    const y = Number(cameraPosMatch[2]);
    const z = Number(cameraPosMatch[3]);

    if ([x, y, z].every(Number.isFinite)) {
      nextState.camera = { x, y, z };
    }
  }

  const materialMatch = code.match(
    /material\s*=\s*new THREE\.MeshStandardMaterial\(\{\s*color:\s*(0x[0-9a-fA-F]{6})/
  );
  if (materialMatch) {
    nextState.materialColor = Number(materialMatch[1]);
  }

  const ambientMatch = code.match(
    /ambientLight\s*=\s*new THREE\.AmbientLight\(\s*0xffffff\s*,\s*([-\d.]+)\s*\)/
  );
  if (ambientMatch) {
    const intensity = Number(ambientMatch[1]);
    if (Number.isFinite(intensity) && intensity >= 0) {
      nextState.ambientIntensity = intensity;
    }
  }

  const lightMatch = code.match(
    /light\s*=\s*new THREE\.PointLight\(\s*0xffffff\s*,\s*([-\d.]+)\s*\)/
  );
  if (lightMatch) {
    const intensity = Number(lightMatch[1]);
    if (Number.isFinite(intensity) && intensity > 0) {
      nextState.lightIntensity = intensity;
    }
  }

  const rotationMatch = code.match(/rotationSpeed\s*=\s*([-\d.]+)/);
  if (rotationMatch) {
    const speed = Number(rotationMatch[1]);
    if (Number.isFinite(speed) && speed > 0) {
      nextState.rotationSpeed = speed;
    }
  }

  // 🔥 NUEVO: detección de geometría
  if (code.includes("SphereGeometry")) {
    nextState.shape = "sphere";
  } else if (code.includes("TorusGeometry")) {
    nextState.shape = "torus";
  } else if (code.includes("BoxGeometry")) {
    nextState.shape = "cube";
  }

  // 🔥 FLOOR POSITION
  const floorYMatch = code.match(/floor\.position\.y\s*=\s*([-\d.]+)/);
  if (floorYMatch) {
    const y = Number(floorYMatch[1]);
    if (Number.isFinite(y)) {
      nextState.floorY = y;
    }
  }

  // 🔥 FLOOR COLOR
  const floorColorMatch = code.match(
    /PlaneGeometry[\s\S]*?MeshStandardMaterial\(\{\s*color:\s*(0x[0-9a-fA-F]{6})/
  );
  if (floorColorMatch) {
    nextState.floorColor = Number(floorColorMatch[1]);
  }

  return nextState;
}

function applyEditedCode() {
  const code = codeEditor.value;

  // ===== VALIDACIONES =====

  // Background
  if (code.includes("scene.background") && 
      !/scene\.background\s*=\s*new THREE\.Color\(\s*0x[0-9a-fA-F]{6}\s*\)/.test(code)) {
    const lineIndex = code.split("\n").findIndex(line => line.includes("scene.background"));
    highlightErrorLine(lineIndex);
    feedback.textContent = "❌ Error en background → usa formato 0x000000";
    return;
  }

  // Camera
  if (code.includes("camera.position.set") &&
      !/camera\.position\.set\(\s*[-\d.]+\s*,\s*[-\d.]+\s*,\s*[-\d.]+\s*\)/.test(code)) {
    const lineIndex = code.split("\n").findIndex(line => line.includes("camera.position.set"));
    highlightErrorLine(lineIndex);

    feedback.textContent = "❌ Error en cámara → usa camera.position.set(x, y, z)";
    return;
  }

  // Material
  if (code.includes("MeshStandardMaterial") &&
      !/color:\s*0x[0-9a-fA-F]{6}/.test(code)) {
    const lineIndex = code.split("\n").findIndex(line => line.includes("MeshStandardMaterial"));
    highlightErrorLine(lineIndex);
    feedback.textContent = "❌ Error en material → color debe ser hexadecimal (0xff0000)";
    return;
  }

  // Ambient Light
  if (code.includes("AmbientLight") &&
      !/AmbientLight\(\s*0xffffff\s*,\s*[-\d.]+\s*\)/.test(code)) {
    const lineIndex = code.split("\n").findIndex(line => line.includes("AmbientLight"));
    highlightErrorLine(lineIndex);
    feedback.textContent = "❌ Error en luz ambiental → usa intensidad numérica";
    return;
  }

  // Point Light
  if (code.includes("PointLight") &&
      !/PointLight\(\s*0xffffff\s*,\s*[-\d.]+\s*\)/.test(code)) {
    const lineIndex = code.split("\n").findIndex(line => line.includes("PointLight"));
    highlightErrorLine(lineIndex);
    feedback.textContent = "❌ Error en luz puntual → usa intensidad válida";
    return;
  }

  // Rotation
  if (code.includes("rotationSpeed") &&
      !/rotationSpeed\s*=\s*[-\d.]+/.test(code)) {
    const lineIndex = code.split("\n").findIndex(line => line.includes("rotationSpeed"));
    highlightErrorLine(lineIndex);
    feedback.textContent = "❌ Error en rotación → usa número (ej: 0.01)";
    return;
  }

  // ===== SI TODO PASA =====
  sceneState = parseEditedCode(code);
  applyState();

  feedback.textContent = "✅ Cambios aplicados correctamente";
  clearHighlight();
}

function highlightErrorLine(lineNumber) {
  const lines = codeEditor.value.split("\n");

  const overlayContent = lines.map((line, index) => {
    if (index === lineNumber) {
      return `<span class="error-line">${line || " "}</span>`;
    }
    return line || " ";
  }).join("\n");

  document.getElementById("editorOverlay").innerHTML = overlayContent;
}

function clearHighlight() {
  document.getElementById("editorOverlay").innerHTML = codeEditor.value;
}

function disposeCurrentObjects() {
  if (controls) {
    controls.dispose();
    controls = null;
  }

  if (currentMesh && scene) {
    scene.remove(currentMesh);
  }
  if (currentMesh?.geometry) {
    currentMesh.geometry.dispose();
  }
  if (currentMesh?.material) {
    if (Array.isArray(currentMesh.material)) {
      currentMesh.material.forEach((m) => m.dispose && m.dispose());
    } else if (currentMesh.material.dispose) {
      currentMesh.material.dispose();
    }
  }

  if (ambientLight && scene) {
    scene.remove(ambientLight);
  }

  if (light && scene) {
    scene.remove(light);
  }

  if (renderer) {
    renderer.dispose();
    if (renderer.domElement && renderer.domElement.parentNode) {
      renderer.domElement.parentNode.removeChild(renderer.domElement);
    }
  }

  if (container) {
    container.innerHTML = '';
  }

  scene = null;
  camera = null;
  renderer = null;
  geometry = null;
  material = null;
  currentMesh = null;
  ambientLight = null;
  light = null;
}

function hardResetLab() {
  disposeCurrentObjects();

  step = 0;
  codeLines = [];
  sceneState = createDefaultSceneState();

  editorLocked = true;
  codeEditor.setAttribute("readonly", "readonly");
  codeEditor.value = "// El código se construirá aquí paso a paso...";
  applyBtn.disabled = true;
  input.value = "";
  feedback.textContent = "↩ Laboratorio reiniciado desde cero.";

  updateHelp();
  updateCodeEditor();
}

btn.addEventListener("click", () => {
  if (step >= steps.length) return;

  const rawValue = input.value.trim();
  const userValue = rawValue.toLowerCase();
  const current = steps[step];

  let isCorrect = false;

  if (typeof current.validator === "function") {
    isCorrect = current.validator(rawValue);
  } else {
    isCorrect = userValue === current.answer;
  }

  if (isCorrect) {
    const result = current.action(rawValue);

    if (result) {
      codeLines.push(result);
      updateCodeEditor();
    }

    feedback.textContent = "✅ Correcto";
    step++;
    input.value = "";

    if (step < steps.length) {
      updateHelp();
    } else {
      finalizeLaboratory();
    }
  } else {
    feedback.textContent = "❌ Intenta de nuevo";
  }
});

applyBtn.addEventListener("click", applyEditedCode);
resetBtn.addEventListener("click", hardResetLab);

window.addEventListener("resize", () => {
  if (!renderer || !camera) return;

  const width = container.clientWidth;
  const height = container.clientHeight;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);

  renderSceneOnce();
});

function setupControls() {
  ambientSlider.value = sceneState.ambientIntensity;
  lightSlider.value = sceneState.lightIntensity;
  rotationSlider.value = sceneState.rotationSpeed;

  ambientSlider.addEventListener("input", () => {
    sceneState.ambientIntensity = Number(ambientSlider.value);
    applyState();
    syncCodeFromState();
  });

  lightSlider.addEventListener("input", () => {
    sceneState.lightIntensity = Number(lightSlider.value);
    applyState();
    syncCodeFromState();
  });

  rotationSlider.addEventListener("input", () => {
    sceneState.rotationSpeed = Number(rotationSlider.value);
    applyState();
    syncCodeFromState();
  });
}


function syncCodeFromState() {
  let code = codeEditor.value;

  code = code.replace(
    /ambientLight\s*=\s*new THREE\.AmbientLight\(0xffffff,\s*[-\d.]+\)/,
    `ambientLight = new THREE.AmbientLight(0xffffff, ${sceneState.ambientIntensity})`
  );

  code = code.replace(
    /light\s*=\s*new THREE\.PointLight\(0xffffff,\s*[-\d.]+\)/,
    `light = new THREE.PointLight(0xffffff, ${sceneState.lightIntensity})`
  );

  code = code.replace(
    /rotationSpeed\s*=\s*[-\d.]+/,
    `rotationSpeed = ${sceneState.rotationSpeed}`
  );

  // 🔥 NUEVO: sincronizar geometry
  const geometryLine = `geometry = new THREE.${
    sceneState.shape === "sphere"
      ? "SphereGeometry(1, 32, 32)"
      : sceneState.shape === "torus"
      ? "TorusGeometry(0.7, 0.3, 16, 100)"
      : "BoxGeometry()"
  };`;

  if (/geometry\s*=\s*new THREE\./.test(code)) {
    code = code.replace(
      /geometry\s*=\s*new THREE\.(BoxGeometry|SphereGeometry|TorusGeometry)\([^\)]*\)/,
      geometryLine
    );
  } else {
    code += "\n" + geometryLine;
  }

  codeEditor.value = code;
}

const shapeSelector = document.getElementById("shapeSelector");
const rotationToggle = document.getElementById("rotationToggle");

shapeSelector.addEventListener("change", (e) => {
  sceneState.shape = e.target.value;
  applyState();
  syncCodeFromState();
});

rotationToggle.addEventListener("change", (e) => {
  sceneState.rotationEnabled = e.target.value === "true";
});


updateHelp();
updateCodeEditor();
applyBtn.disabled = true;
codeEditor.setAttribute("readonly", "readonly");


