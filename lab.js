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
const codeBlock = document.getElementById('exerciseCode');
const progress = document.getElementById('progress');
const instruction = document.getElementById('instruction');
const explanation = document.getElementById('explanation');
const hint = document.getElementById('hint');
const example = document.getElementById('example');

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

      return [
        "currentMesh = new THREE.Mesh(geometry, material);",
        "scene.add(currentMesh);"
      ].join("\n");
    }
  },
  {
    question: "ambientLight = new THREE.____(0xffffff, ____);",
    validator: (inputValue) => !Number.isNaN(Number(inputValue)) && Number(inputValue) >= 0,
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
    validator: (inputValue) => !Number.isNaN(Number(inputValue)) && Number(inputValue) > 0,
    explanation: "La luz puntual ilumina una zona específica y da profundidad al objeto.",
    hint: "Puedes usar un número mayor que 0, como 0.8, 1 o 2.",
    example:
`light = new THREE.PointLight(0xffffff, 1);
light.position.set(5, 5, 5);
scene.add(light);`,
    action: (inputValue) => {
      const intensity = Number(inputValue);

      light = new THREE.PointLight(0xffffff, intensity);
      light.position.set(5, 5, 5);
      scene.add(light);

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
    validator: (inputValue) => !Number.isNaN(Number(inputValue)) && Number(inputValue) > 0,
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

    if (currentMesh) {
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
  editorLocked = false;
  codeEditor.removeAttribute("readonly");
  applyBtn.disabled = false;
  feedback.textContent = "🎉 Laboratorio completado. Ahora puedes editar el código y aplicar cambios.";
  updateProgress();
}

function applyEditedCode() {
  const code = codeEditor.value;

  const bgMatch = code.match(/scene\.background\s*=\s*new THREE\.Color\(\s*(0x[0-9a-fA-F]{6})\s*\)/);
  if (bgMatch && scene) {
    scene.background = new THREE.Color(bgMatch[1]);
  }

  const cameraPosMatch = code.match(/camera\.position\.set\(\s*([-\d.]+)\s*,\s*([-\d.]+)\s*,\s*([-\d.]+)\s*\)/);
  if (cameraPosMatch && camera) {
    camera.position.set(
      Number(cameraPosMatch[1]),
      Number(cameraPosMatch[2]),
      Number(cameraPosMatch[3])
    );
  }

  const materialMatch = code.match(/material\s*=\s*new THREE\.MeshStandardMaterial\(\{\s*color:\s*(0x[0-9a-fA-F]{6})/);
  if (materialMatch) {
    const colorValue = materialMatch[1];

    if (!material) {
      material = new THREE.MeshStandardMaterial({
        color: Number(colorValue),
        metalness: 0.5,
        roughness: 0.2
      });
    } else {
      material.color.set(colorValue);
      material.needsUpdate = true;
    }

    if (currentMesh) {
      currentMesh.material = material;
    }
  }

  const ambientMatch = code.match(/ambientLight\s*=\s*new THREE\.AmbientLight\(\s*0xffffff\s*,\s*([-\d.]+)\s*\)/);
  if (ambientMatch && ambientLight) {
    ambientLight.intensity = Number(ambientMatch[1]);
  }

  const lightMatch = code.match(/light\s*=\s*new THREE\.PointLight\(\s*0xffffff\s*,\s*([-\d.]+)\s*\)/);
  if (lightMatch && light) {
    light.intensity = Number(lightMatch[1]);
  }

  const rotationMatch = code.match(/rotationSpeed\s*=\s*([-\d.]+)/);
  if (rotationMatch) {
    rotationSpeed = Number(rotationMatch[1]);
  }

  renderSceneOnce();
  feedback.textContent = "✅ Cambios aplicados al laboratorio.";
}

function restoreGeneratedCode() {
  codeEditor.value = codeLines.join("\n");
  feedback.textContent = "↩ Código restaurado al generado por el laboratorio.";
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
resetBtn.addEventListener("click", restoreGeneratedCode);

window.addEventListener("resize", () => {
  if (!renderer || !camera) return;

  const width = container.clientWidth;
  const height = container.clientHeight;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);

  renderSceneOnce();
});

updateHelp();
updateCodeEditor();