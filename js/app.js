import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

const canvas = document.querySelector("#sceneCanvas");
const modelList = document.querySelector("#modelList");
const animationClipList = document.querySelector("#animationClipList");
const lightingControls = document.querySelector("#lightingControls");
const brightnessRange = document.querySelector("#brightnessRange");
const brightnessValue = document.querySelector("#brightnessValue");
const objectType = document.querySelector("#objectType");
const objectTitle = document.querySelector("#objectTitle");
const objectDescription = document.querySelector("#objectDescription");
const startExperienceButton = document.querySelector("#startExperience");
const backgroundMusic = document.querySelector("#backgroundMusic");
const musicToggle = document.querySelector("#musicToggle");
const musicVolume = document.querySelector("#musicVolume");
const musicVolumeValue = document.querySelector("#musicVolumeValue");

const modelCatalog = [
  {
    id: "car-treadmill",
    source: "assets/models/car_treadmill.gltf",
    title: "Formula Test Rig Scene",
    shortTitle: "Test rig",
    category: "glTF scene",
    subtitle: "Formula car motion test with animationrun",
    brief: "A Formula car test rig scene for viewing the car and its running animation.",
    description: "This scene presents a Formula-style race car inside a workshop test rig. The support frame, wheels and surrounding equipment create a preparation space where the car can be checked before returning to the track.",
    facts: [
      { label: "Meshes", value: "149" },
      { label: "Textures", value: "3 embedded PNG maps" },
      { label: "Animation", value: "Vehicle test run" }
    ]
  },
  {
    id: "pit-room-tyre-change",
    source: "assets/models/pitroom_tyre_change.gltf",
    title: "Formula Pit Stop Scene",
    shortTitle: "Pit stop",
    category: "glTF scene",
    subtitle: "Pit room tyre change with its own animation",
    brief: "A pit stop scene showing a Formula car service area and tyre-change animation.",
    description: "This scene recreates a pit-room service bay. The car, tools and tyre-change area show the maintenance moment during a race, where fast repair work and wheel replacement are the centre of the scene.",
    facts: [
      { label: "Meshes", value: "133" },
      { label: "Textures", value: "2 embedded PNG maps" },
      { label: "Animation", value: "Pit stop tyre change" }
    ]
  },
  {
    id: "car-showcase",
    source: "assets/models/car_showcase.gltf",
    title: "Formula Showcase Scene",
    shortTitle: "Showcase",
    category: "glTF scene",
    subtitle: "Display scene with two separate clips",
    brief: "A Formula car display scene with steering and disassembly animation clips.",
    description: "This scene presents the Formula car as a showcase model in a display garage. It is designed for close inspection of the vehicle body, wheels, cockpit and mechanical parts from different viewing angles.",
    facts: [
      { label: "Meshes", value: "201" },
      { label: "Textures", value: "5 embedded PNG maps" },
      { label: "Animations", value: "Steering turn, car disassembly" }
    ]
  }
];

const state = {
  catalog: modelCatalog,
  models: new Map(),
  selectedId: "",
  selectedClip: "",
  selectedClipIndex: -1,
  paused: false,
  wireframe: false,
  autoCamera: true,
  showGrid: false,
  lightPreset: "focus",
  exposure: 0.9,
  speed: 0.8,
  backgroundMusicPlaying: false
};

const lightPresets = {
  studio: {
    ambient: 0.34,
    hemisphere: 0.48,
    key: { color: 0xfff1d8, intensity: 2.05, position: [-4.5, 6.8, 4.2] },
    fill: { color: 0xd9ecff, intensity: 0.72, position: [5, 3.2, -3.5] },
    rim: { color: 0xffd9a3, intensity: 0.7, position: [0, 4.5, -6] },
    red: { color: 0xd71920, intensity: 0.08 },
    blue: { color: 0x5f8dff, intensity: 0.08 },
    background: 0xf4efe4,
    fogNear: 34,
    fogFar: 115,
    environmentIntensity: 0.72,
    shadowOpacity: 0.09,
    exposureFactor: 1.05
  },
  focus: {
    ambient: 0.045,
    hemisphere: 0.08,
    key: { color: 0xffc568, intensity: 4.35, position: [-2.2, 8.4, 2.1] },
    fill: { color: 0xffedd2, intensity: 0.05, position: [5.2, 2, -2.8] },
    rim: { color: 0xff3b32, intensity: 2.4, position: [0, 4.8, -7.4] },
    red: { color: 0xff1d25, intensity: 0.75 },
    blue: { color: 0x365bff, intensity: 0.04 },
    background: 0x2b2520,
    fogNear: 15,
    fogFar: 54,
    environmentIntensity: 0.22,
    shadowOpacity: 0.28,
    exposureFactor: 0.95
  },
  night: {
    ambient: 0.018,
    hemisphere: 0.055,
    key: { color: 0x9fbfff, intensity: 0.52, position: [-5.8, 5.8, 1.6] },
    fill: { color: 0x375cff, intensity: 0.1, position: [4.2, 1.8, -4.8] },
    rim: { color: 0x69dcff, intensity: 3.2, position: [0, 5.6, -8.8] },
    red: { color: 0xff2a2a, intensity: 0.02 },
    blue: { color: 0x2a65ff, intensity: 1.35 },
    background: 0x0c1320,
    fogNear: 10,
    fogFar: 42,
    environmentIntensity: 0.08,
    shadowOpacity: 0.36,
    exposureFactor: 0.62
  }
};

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  powerPreference: "high-performance"
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = state.exposure;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf4efe4);
scene.fog = new THREE.Fog(0xf4efe4, 28, 90);

const pmremGenerator = new THREE.PMREMGenerator(renderer);
scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.48;

const camera = new THREE.PerspectiveCamera(38, 1, 0.01, 400);
camera.position.set(-6.5, 3.8, 0);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.autoRotate = state.autoCamera;
controls.autoRotateSpeed = 1.25;
controls.minDistance = 1.4;
controls.maxDistance = 60;

const modelStage = new THREE.Group();
scene.add(modelStage);

const soundEffects = {
  pitWrench: {
    src: "assets/audio/pit_impact_wrench.mp3",
    label: "pit stop wrench",
    volume: 0.72,
    loop: false
  },
  garageEngine: {
    src: "assets/audio/garage_engine_hum.mp3",
    label: "garage engine",
    volume: 0.38,
    loop: true
  },
  tyreFriction: {
    src: "assets/audio/tire_rubber_squeak.mp3",
    label: "tyre friction",
    volume: 0.38,
    loop: false
  },
  disassemblyImpact: {
    src: "assets/audio/pit_impact_wrench.mp3",
    label: "disassembly impact",
    volume: 0.58,
    loop: false
  }
};

const soundCueTimelines = {
  "car-treadmill:animationrun": [
    { time: 0.35, type: "play", effect: soundEffects.garageEngine },
    { time: 5.55, type: "stop", effect: soundEffects.garageEngine }
  ],
  "pit-room-tyre-change:animation": [
    { time: 1.6, type: "play", effect: soundEffects.pitWrench },
    { time: 6, type: "play", effect: soundEffects.pitWrench }
  ],
  "car-showcase:animationturn": [
    { time: 0.12, type: "play", effect: soundEffects.tyreFriction },
    { time: 0.86, type: "play", effect: soundEffects.tyreFriction }
  ],
  "car-showcase:animation\u62c6\u89e3": [
    { time: 0.18, type: "play", effect: soundEffects.disassemblyImpact },
    { time: 0.82, type: "play", effect: soundEffects.disassemblyImpact },
    { time: 1.42, type: "play", effect: soundEffects.disassemblyImpact }
  ]
};

const audioPlayers = new Map();
let activeSound = null;

const ambientLight = new THREE.AmbientLight(0xffffff, 0.22);
const hemisphereLight = new THREE.HemisphereLight(0xfff4df, 0x252a33, 0.3);
const keyLight = new THREE.DirectionalLight(0xffffff, 1.75);
keyLight.castShadow = true;
keyLight.shadow.mapSize.width = 2048;
keyLight.shadow.mapSize.height = 2048;
keyLight.shadow.camera.top = 10;
keyLight.shadow.camera.bottom = -10;
keyLight.shadow.camera.left = -10;
keyLight.shadow.camera.right = 10;
keyLight.shadow.bias = -0.0005;
keyLight.shadow.normalBias = 0.02;
const fillLight = new THREE.DirectionalLight(0xf4fbff, 0.28);
const rimLight = new THREE.DirectionalLight(0xffe1b0, 0.95);
const redMoodLight = new THREE.PointLight(0xd71920, 0.22, 28, 2);
const blueMoodLight = new THREE.PointLight(0x4f77ff, 0.16, 26, 2);
redMoodLight.position.set(-6, 3.2, -5);
blueMoodLight.position.set(6, 2.8, 5);
scene.add(ambientLight, hemisphereLight, keyLight, fillLight, rimLight, redMoodLight, blueMoodLight);

const grid = new THREE.GridHelper(24, 24, 0x98917f, 0xd3cab7);
grid.position.y = -0.02;
grid.visible = state.showGrid;
scene.add(grid);

const shadowPlane = new THREE.Mesh(
  new THREE.PlaneGeometry(100, 100),
  new THREE.ShadowMaterial({ opacity: 0.12, color: 0x000000 })
);
shadowPlane.rotation.x = -Math.PI / 2;
shadowPlane.position.y = -0.02;
shadowPlane.receiveShadow = true;
scene.add(shadowPlane);

const loader = new GLTFLoader();
const clock = new THREE.Clock();

init();

async function init() {
  initNavigation();
  initControls();
  initBackgroundMusicControls();
  applyLightPreset();
  applyBrightness();
  updateLightButtons();
  updateBrightnessValue();

  try {
    setStatus("Loading racing model gallery");
    renderModelList();
    await selectModel(state.catalog[0].id);
    animate();
  } catch (error) {
    console.error(error);
    setStatus("Loading failed. Check the model paths and browser console.");
  }
}

function initNavigation() {
  const sectionButtons = [...document.querySelectorAll("[data-section]")];
  sectionButtons.forEach((button) => {
    button.addEventListener("click", () => showPage(button.dataset.section));
  });
  const initial = location.hash.slice(1);
  showPage(["home", "studio", "about"].includes(initial) ? initial : "home");
}

function showPage(id) {
  const tabs = [...document.querySelectorAll(".nav-tab[data-section]")];
  const pages = [...document.querySelectorAll("[data-page]")];
  pages.forEach((page) => page.classList.toggle("is-visible", page.id === id));
  tabs.forEach((tab) => tab.classList.toggle("is-active", tab.dataset.section === id));
  updateModelTabState();
  if (location.hash.slice(1) !== id) {
    history.replaceState(null, "", `#${id}`);
  }
}

function isStudioVisible() {
  return document.querySelector("#studio")?.classList.contains("is-visible") || false;
}

function updateModelTabState() {
  document.querySelectorAll("[data-model]").forEach((button) => {
    button.classList.toggle("is-active", isStudioVisible() && button.dataset.model === state.selectedId);
  });
}

function initControls() {
  startExperienceButton?.addEventListener("click", () => {
    enterExperience();
  });

  document.querySelector("#animateToggle").addEventListener("click", (event) => {
    state.paused = !state.paused;
    event.currentTarget.setAttribute("aria-pressed", String(!state.paused));
    event.currentTarget.textContent = state.paused ? "Resume animation" : "Pause animation";
    currentRuntime()?.actions.forEach((action) => {
      action.paused = state.paused;
    });
    if (state.paused) {
      pauseActiveSound();
    } else {
      resumeActiveSound();
    }
    setStatus(state.paused ? "Selected model animation paused" : "Selected model animation resumed");
  });

  document.querySelector("#stopAnimation").addEventListener("click", () => {
    stopCurrentAnimations();
    stopActiveSound();
    setStatus("Selected model animation stopped");
  });

  document.querySelector("#wireToggle").addEventListener("click", (event) => {
    state.wireframe = !state.wireframe;
    event.currentTarget.setAttribute("aria-pressed", String(state.wireframe));
    event.currentTarget.classList.toggle("is-active", state.wireframe);
    applyMaterialState();
    setStatus(state.wireframe ? "Wireframe inspection enabled" : "Original textured material view enabled");
  });

  document.querySelector("#cameraSpinToggle").addEventListener("click", (event) => {
    state.autoCamera = !state.autoCamera;
    controls.autoRotate = state.autoCamera;
    event.currentTarget.setAttribute("aria-pressed", String(state.autoCamera));
    event.currentTarget.classList.toggle("is-active", state.autoCamera);
    event.currentTarget.textContent = state.autoCamera ? "Stop camera" : "Auto camera";
    setStatus(state.autoCamera ? "Camera auto rotation enabled" : "Camera auto rotation stopped");
  });

  document.querySelector("#resetView").addEventListener("click", () => {
    focusCurrentModel();
    setStatus("Camera reset to selected model");
  });

  document.querySelector("#gridToggle").addEventListener("click", (event) => {
    state.showGrid = !state.showGrid;
    grid.visible = state.showGrid;
    event.currentTarget.setAttribute("aria-pressed", String(state.showGrid));
    event.currentTarget.classList.toggle("is-active", state.showGrid);
    event.currentTarget.textContent = state.showGrid ? "Hide grid" : "Show grid";
    setStatus(state.showGrid ? "Floor grid enabled" : "Floor grid hidden");
  });

  lightingControls?.querySelectorAll("[data-light-preset]").forEach((button) => {
    button.addEventListener("click", () => {
      state.lightPreset = button.dataset.lightPreset;
      applyLightPreset(state.lightPreset);
      updateLightButtons();
      setStatus(`Scene lighting preset: ${button.textContent}`);
    });
  });

  brightnessRange?.addEventListener("input", (event) => {
    state.exposure = Number(event.currentTarget.value);
    applyBrightness();
    updateBrightnessValue();
  });
}

async function enterExperience() {
  showPage("studio");
  playBackgroundMusic();
  if (state.selectedId !== state.catalog[0].id) {
    await selectModel(state.catalog[0].id);
  } else {
    focusCurrentModel();
  }
}

function initBackgroundMusicControls() {
  if (!backgroundMusic) {
    return;
  }
  backgroundMusic.loop = true;
  backgroundMusic.volume = Number(musicVolume?.value || 0.2);
  backgroundMusic.addEventListener("pause", () => {
    state.backgroundMusicPlaying = false;
    updateMusicControls();
  });
  backgroundMusic.addEventListener("play", () => {
    state.backgroundMusicPlaying = true;
    updateMusicControls();
  });
  musicToggle?.addEventListener("click", () => {
    if (backgroundMusic.paused) {
      playBackgroundMusic();
    } else {
      pauseBackgroundMusic();
    }
  });
  musicVolume?.addEventListener("input", (event) => {
    backgroundMusic.volume = Number(event.currentTarget.value);
    updateMusicControls();
  });
  updateMusicControls();
}

function playBackgroundMusic() {
  if (!backgroundMusic) {
    return;
  }
  backgroundMusic.loop = true;
  const playRequest = backgroundMusic.play();
  if (playRequest?.then) {
    playRequest
      .then(() => {
        state.backgroundMusicPlaying = true;
        updateMusicControls();
      })
      .catch(() => {
        state.backgroundMusicPlaying = false;
        updateMusicControls();
        setStatus("Background music could not start. Use the music button after interacting with the page.");
      });
  }
}

function pauseBackgroundMusic() {
  if (!backgroundMusic) {
    return;
  }
  backgroundMusic.pause();
  state.backgroundMusicPlaying = false;
  updateMusicControls();
}

function updateMusicControls() {
  if (musicToggle) {
    const isPlaying = Boolean(backgroundMusic && !backgroundMusic.paused);
    musicToggle.textContent = isPlaying ? "Pause music" : "Play music";
    musicToggle.setAttribute("aria-pressed", String(isPlaying));
    musicToggle.classList.toggle("is-active", isPlaying);
  }
  if (musicVolume && backgroundMusic) {
    musicVolume.value = backgroundMusic.volume.toFixed(2);
  }
  if (musicVolumeValue && backgroundMusic) {
    musicVolumeValue.textContent = `${Math.round(backgroundMusic.volume * 100)}%`;
  }
}

function renderModelList() {
  modelList.replaceChildren(...state.catalog.map((model) => {
    const button = document.createElement("button");
    button.className = "scene-tab";
    button.type = "button";
    button.dataset.model = model.id;
    button.textContent = model.shortTitle;
    button.addEventListener("click", () => {
      showPage("studio");
      selectModel(model.id);
    });
    return button;
  }));
}

async function selectModel(id) {
  const meta = state.catalog.find((item) => item.id === id);
  if (!meta) {
    return;
  }

  setStatus(`Loading ${meta.shortTitle}`);
  const runtime = await ensureModel(meta);
  state.selectedId = id;
  state.selectedClip = "";
  state.selectedClipIndex = -1;
  state.paused = false;
  stopActiveSound();

  state.models.forEach((item) => {
    item.scene.visible = item.meta.id === id;
    item.audioCueState = null;
    item.actions.forEach((action) => {
      action.paused = true;
    });
  });
  runtime.actions.forEach((action) => {
    action.stop();
    action.paused = true;
  });

  document.querySelector("#animateToggle").textContent = "Pause animation";
  document.querySelector("#animateToggle").setAttribute("aria-pressed", "true");
  updateModelTabState();

  updateObjectInfo(meta);
  renderAnimationButtons(runtime);
  applyMaterialState();
  focusCurrentModel();
  setStatus(`${meta.shortTitle} ready. Choose an animation clip to play.`);
}

async function ensureModel(meta) {
  if (state.models.has(meta.id)) {
    return state.models.get(meta.id);
  }

  const gltf = await loader.loadAsync(meta.source);
  const runtime = createRuntime(meta, gltf);
  runtime.scene.visible = false;
  modelStage.add(runtime.scene);
  state.models.set(meta.id, runtime);
  return runtime;
}

function createRuntime(meta, gltf) {
  const originalMaterials = new Map();

  gltf.scene.traverse((object) => {
    if (!object.isMesh) {
      return;
    }

    object.castShadow = true;
    object.receiveShadow = true;
    object.frustumCulled = false;

    const materials = Array.isArray(object.material) ? object.material : [object.material];
    materials.filter(Boolean).forEach((material) => {
      material.side = THREE.DoubleSide;
      if ("envMapIntensity" in material) {
        material.envMapIntensity = Math.max(material.envMapIntensity || 0, 0.55);
      }
      material.needsUpdate = true;
      originalMaterials.set(material.uuid, {
        color: material.color ? material.color.clone() : new THREE.Color(0xffffff),
        map: material.map || null,
        transparent: material.transparent,
        opacity: material.opacity
      });
    });
  });

  const mixer = new THREE.AnimationMixer(gltf.scene);
  mixer.timeScale = state.speed;
  const actions = gltf.animations.map((clip, index) => {
    const action = mixer.clipAction(clip);
    action.loop = THREE.LoopOnce;
    action.clampWhenFinished = true;
    action.enabled = true;
    action.paused = true;
    return action;
  });

  normalizeScene(gltf.scene);

  const runtime = {
    meta,
    gltf,
    scene: gltf.scene,
    mixer,
    clips: gltf.animations,
    actions,
    originalMaterials,
    audioCueState: null
  };
  mixer.addEventListener("finished", (event) => finishAnimation(runtime, event.action));
  return runtime;
}

function normalizeScene(root) {
  const box = new THREE.Box3().setFromObject(root);
  if (box.isEmpty()) {
    return;
  }

  const center = new THREE.Vector3();
  const size = new THREE.Vector3();
  box.getCenter(center);
  box.getSize(size);
  const maxAxis = Math.max(size.x, size.y, size.z, 0.001);
  const scale = 6 / maxAxis;

  root.scale.setScalar(scale);
  root.position.set(-center.x * scale, -center.y * scale, -center.z * scale);

  const normalizedBox = new THREE.Box3().setFromObject(root);
  const yOffset = -normalizedBox.min.y;
  root.position.y += yOffset;
}

function renderAnimationButtons(runtime) {
  if (!runtime.clips.length) {
    animationClipList.replaceChildren(emptyAnimationMessage());
    return;
  }

  animationClipList.replaceChildren(...runtime.clips.map((clip, index) => {
    const button = document.createElement("button");
    button.className = "control-button clip-button btn btn-primary btn-sm fw-semibold";
    button.type = "button";
    button.dataset.clipIndex = String(index);
    button.textContent = formatClipName(clip, index);
    button.addEventListener("click", () => playClip(index));
    return button;
  }));
}

function emptyAnimationMessage() {
  const message = document.createElement("p");
  message.className = "small-note";
  message.textContent = "No glTF animation clips found for this model.";
  return message;
}

function playClip(index) {
  const runtime = currentRuntime();
  if (!runtime || !runtime.actions[index]) {
    return;
  }

  runtime.actions.forEach((action, actionIndex) => {
    action.stop();
    action.paused = actionIndex !== index;
  });

  const action = runtime.actions[index];
  action.reset();
  action.paused = false;
  action.play();
  state.selectedClip = formatClipName(runtime.clips[index], index);
  state.selectedClipIndex = index;
  state.paused = false;

  document.querySelector("#animateToggle").textContent = "Pause animation";
  document.querySelector("#animateToggle").setAttribute("aria-pressed", "true");
  document.querySelectorAll("[data-clip-index]").forEach((button) => {
    button.classList.toggle("is-active", Number(button.dataset.clipIndex) === index);
  });
  updateObjectInfo(runtime.meta, runtime.clips[index]);
  armAnimationSoundCues(runtime, index);
  setStatus(`${runtime.meta.shortTitle}: playing ${state.selectedClip}`);
}

function stopCurrentAnimations() {
  const runtime = currentRuntime();
  if (!runtime) {
    return;
  }
  runtime.actions.forEach((action) => {
    action.stop();
    action.paused = true;
  });
  state.selectedClip = "";
  state.selectedClipIndex = -1;
  runtime.audioCueState = null;
  document.querySelectorAll("[data-clip-index]").forEach((button) => button.classList.remove("is-active"));
  updateObjectInfo(runtime.meta);
}

function finishAnimation(runtime, action) {
  const finishedIndex = runtime.actions.indexOf(action);
  if (finishedIndex === -1 || runtime.meta.id !== state.selectedId || finishedIndex !== state.selectedClipIndex) {
    return;
  }

  action.paused = true;
  state.selectedClip = "";
  state.selectedClipIndex = -1;
  state.paused = false;
  runtime.audioCueState = null;
  stopActiveSound();
  document.querySelectorAll("[data-clip-index]").forEach((button) => button.classList.remove("is-active"));
  document.querySelector("#animateToggle").textContent = "Pause animation";
  document.querySelector("#animateToggle").setAttribute("aria-pressed", "true");
  updateObjectInfo(runtime.meta);
  setStatus(`${runtime.meta.shortTitle}: animation finished`);
}

function applyMaterialState() {
  state.models.forEach((runtime) => {
    runtime.scene.traverse((object) => {
      if (!object.isMesh || !object.material) {
        return;
      }

      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.filter(Boolean).forEach((material) => {
        const original = runtime.originalMaterials.get(material.uuid);
        if (original && material.color) {
          material.color.copy(original.color);
          material.map = original.map;
          material.transparent = original.transparent;
          material.opacity = original.opacity;
        }
        material.wireframe = state.wireframe;
        material.needsUpdate = true;
      });
    });
  });
}

function applyLightPreset(presetName = state.lightPreset) {
  const preset = lightPresets[presetName] || lightPresets.studio;
  ambientLight.intensity = preset.ambient;
  hemisphereLight.intensity = preset.hemisphere;
  keyLight.color.setHex(preset.key.color);
  keyLight.intensity = preset.key.intensity;
  fillLight.color.setHex(preset.fill.color);
  fillLight.intensity = preset.fill.intensity;
  rimLight.color.setHex(preset.rim.color);
  rimLight.intensity = preset.rim.intensity;
  redMoodLight.color.setHex(preset.red.color);
  redMoodLight.intensity = preset.red.intensity;
  blueMoodLight.color.setHex(preset.blue.color);
  blueMoodLight.intensity = preset.blue.intensity;
  keyLight.position.set(...preset.key.position);
  fillLight.position.set(...preset.fill.position);
  rimLight.position.set(...preset.rim.position);
  scene.background.setHex(preset.background);
  scene.fog.color.setHex(preset.background);
  scene.fog.near = preset.fogNear;
  scene.fog.far = preset.fogFar;
  scene.environmentIntensity = preset.environmentIntensity;
  shadowPlane.material.opacity = preset.shadowOpacity;
  applyBrightness();
}

function updateLightButtons() {
  lightingControls?.querySelectorAll("[data-light-preset]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.lightPreset === state.lightPreset);
  });
}

function applyBrightness() {
  const preset = lightPresets[state.lightPreset] || lightPresets.studio;
  renderer.toneMappingExposure = state.exposure * (preset.exposureFactor || 1);
}

function updateBrightnessValue() {
  if (brightnessRange) {
    brightnessRange.value = state.exposure.toFixed(2);
  }
  if (brightnessValue) {
    brightnessValue.textContent = `${state.exposure.toFixed(2)}x`;
  }
}

function focusCurrentModel() {
  const box = currentBox();
  if (box.isEmpty()) {
    return;
  }

  const center = new THREE.Vector3();
  const size = new THREE.Vector3();
  box.getCenter(center);
  box.getSize(size);
  const radius = Math.max(size.x, size.y, size.z, 0.8);
  const distanceMultiplier = {
    "car-treadmill": 0.88,
    "car-showcase": 0.9
  }[state.selectedId] || 1;
  const distance = Math.max((radius * 1.12 + 1.6) * distanceMultiplier, 3.9);
  const target = center.clone();
  target.y += size.y * 0.12;
  camera.near = Math.max(distance / 120, 0.01);
  camera.far = Math.max(distance * 20, 120);
  camera.updateProjectionMatrix();

  const frontDirection = new THREE.Vector3(-1.08, 0.18, 0).normalize();
  camera.position.set(
    target.x + frontDirection.x * distance,
    target.y + Math.abs(frontDirection.y) * distance,
    target.z + frontDirection.z * distance
  );
  controls.target.copy(target);
  controls.update();
}

function currentBox() {
  const runtime = currentRuntime();
  const box = new THREE.Box3();
  if (runtime) {
    box.setFromObject(runtime.scene);
  }
  return box;
}

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  state.models.forEach((runtime) => {
    runtime.mixer.update(delta);
    updateAnimationSoundCues(runtime);
  });
  controls.update();
  resizeRenderer();
  renderer.render(scene, camera);
}

function resizeRenderer() {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const pixelRatio = renderer.getPixelRatio();
  const needsResize = canvas.width !== Math.floor(width * pixelRatio)
    || canvas.height !== Math.floor(height * pixelRatio);
  if (needsResize) {
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }
}

function updateObjectInfo(meta, clip = null) {
  if (objectType) {
    objectType.textContent = meta.category;
  }
  if (objectTitle) {
    objectTitle.textContent = meta.title;
  }
  if (objectDescription) {
    objectDescription.textContent = clip
      ? `${meta.description} Playing animation: ${state.selectedClip}.`
      : meta.description;
  }
}

function armAnimationSoundCues(runtime, clipIndex) {
  stopActiveSound();
  const clip = runtime.clips[clipIndex];
  const timeline = resolveClipSoundTimeline(runtime, clip);
  runtime.audioCueState = {
    actionIndex: clipIndex,
    previousTime: 0,
    firedCueIds: new Set(),
    timeline
  };
}

function updateAnimationSoundCues(runtime) {
  const cueState = runtime.audioCueState;
  if (!cueState || !cueState.timeline.length) {
    return;
  }

  const action = runtime.actions[cueState.actionIndex];
  if (!action || action.paused || state.paused || !runtime.scene.visible) {
    return;
  }

  let previousTime = cueState.previousTime;
  const currentTime = action.time;
  if (currentTime < previousTime) {
    cueState.firedCueIds.clear();
    stopActiveSound();
    previousTime = 0;
  }

  cueState.timeline.forEach((cue, index) => {
    const cueId = `${cue.time}-${cue.type}-${index}`;
    if (cueState.firedCueIds.has(cueId)) {
      return;
    }
    if (previousTime <= cue.time && currentTime >= cue.time) {
      triggerSoundCue(cue);
      cueState.firedCueIds.add(cueId);
    }
  });

  cueState.previousTime = currentTime;
}

function triggerSoundCue(cue) {
  if (cue.type === "stop") {
    stopSoundEffect(cue.effect);
    return;
  }
  playSoundEffect(cue.effect);
}

function resolveClipSoundTimeline(runtime, clip) {
  const timelineKey = `${runtime.meta.id}:${clip?.name || ""}`;
  return soundCueTimelines[timelineKey] || [];
}

function resolveClipSound(runtime, clip) {
  const clipName = clip?.name || "";
  if (runtime.meta.id === "pit-room-tyre-change") {
    return soundEffects.pitWrench;
  }
  if (runtime.meta.id === "car-treadmill" && clipName === "animationrun") {
    return soundEffects.garageEngine;
  }
  if (runtime.meta.id === "car-showcase" && clipName === "animationturn") {
    return soundEffects.tyreFriction;
  }
  if (runtime.meta.id === "car-showcase" && clipName === "animation\u62c6\u89e3") {
    return soundEffects.disassemblyImpact;
  }
  return null;
}

function resolveSceneSound(meta) {
  const sceneSounds = {
    "pit-room-tyre-change": soundEffects.pitWrench,
    "car-treadmill": soundEffects.garageEngine,
    "car-showcase": soundEffects.tyreFriction
  };
  return sceneSounds[meta.id] || null;
}

function playSoundEffect(effect) {
  stopActiveSound();
  if (!effect) {
    return;
  }

  const audio = getAudioPlayer(effect.src);
  audio.loop = Boolean(effect.loop);
  audio.volume = effect.volume;
  audio.currentTime = 0;
  activeSound = { audio, effect };

  const playRequest = audio.play();
  if (playRequest?.catch) {
    playRequest.catch(() => {
      if (activeSound?.audio === audio) {
        activeSound = null;
      }
      setStatus("Sound could not start. Click the animation button again.");
    });
  }
}

function getAudioPlayer(src) {
  if (!audioPlayers.has(src)) {
    const audio = new Audio(src);
    audio.preload = "auto";
    audio.addEventListener("ended", () => {
      if (activeSound?.audio === audio) {
        activeSound = null;
      }
    });
    audioPlayers.set(src, audio);
  }
  return audioPlayers.get(src);
}

function pauseActiveSound() {
  if (activeSound?.audio && !activeSound.audio.paused) {
    activeSound.audio.pause();
  }
}

function resumeActiveSound() {
  if (!activeSound?.audio) {
    return;
  }
  const playRequest = activeSound.audio.play();
  if (playRequest?.catch) {
    playRequest.catch(() => setStatus("Sound could not resume in this browser"));
  }
}

function stopSoundEffect(effect) {
  if (activeSound?.effect === effect) {
    stopActiveSound();
  }
}

function stopActiveSound() {
  if (!activeSound?.audio) {
    return;
  }
  activeSound.audio.pause();
  activeSound.audio.currentTime = 0;
  activeSound = null;
}

function currentRuntime() {
  return state.models.get(state.selectedId);
}

function formatClipName(clip, index) {
  const name = clip.name || `Animation ${index + 1}`;
  const names = {
    animationrun: "Vehicle test run",
    animation: "Pit stop tyre change",
    animationturn: "Steering turn",
    "animation\u62c6\u89e3": "Car disassembly"
  };
  return names[name] || name.replace(/[^\x20-\x7E]/g, "").trim() || `Animation ${index + 1}`;
}

function setStatus(message) {
  console.log("[Status]:", message);
}
