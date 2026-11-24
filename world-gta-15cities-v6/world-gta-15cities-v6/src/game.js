import { CITIES, MISSIONS, GARAGE_CARS, RADIO_STATIONS, CITY_SIZE, BRIDGE_LEN, STEP } from './worldData.js';
import { createFacadeTexture, createRoadTexture } from './textures.js';
import { sfx } from './audio.js';

const scene = new THREE.Scene();
let isNight = false;
let isRaining = false;
let gameMinutes = 14 * 60;
scene.background = new THREE.Color(0x7dd3fc);
scene.fog = new THREE.FogExp2(0x7dd3fc, 0.00018);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.2, 24000);
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
document.body.appendChild(renderer.domElement);

const hemiLight = new THREE.HemisphereLight(0xffffff, 0x334155, 0.95);
scene.add(hemiLight);

const sunLight = new THREE.DirectionalLight(0xfffbeb, 1.85);
sunLight.position.set(3000, 4800, 2200);
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 2048;
sunLight.shadow.mapSize.height = 2048;
scene.add(sunLight);

const roadTex = createRoadTexture();

// Ғарыш, Орбиталық станция және Ай
const starGeo = new THREE.BufferGeometry();
const starVerts = [];
for (let i = 0; i < 7000; i++) {
  starVerts.push((Math.random() - 0.5) * 42000, 1400 + Math.random() * 14000, (Math.random() - 0.5) * 42000);
}
starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starVerts, 3));
scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 15 })));

const spaceStation = new THREE.Mesh(
  new THREE.TorusGeometry(150, 20, 16, 48),
  new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.15 })
);
spaceStation.position.set(5600, 2200, 2800);
spaceStation.rotation.x = Math.PI / 3;
scene.add(spaceStation);

const moonPlanet = new THREE.Mesh(
  new THREE.SphereGeometry(420, 32, 32),
  new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.9 })
);
moonPlanet.position.set(8400, 4200, 5600);
scene.add(moonPlanet);

// Жауын-шашын
const rainGeo = new THREE.BufferGeometry();
const rainVerts = [];
for (let i = 0; i < 3500; i++) {
  rainVerts.push((Math.random() - 0.5) * 300, Math.random() * 120, (Math.random() - 0.5) * 300);
}
rainGeo.setAttribute('position', new THREE.Float32BufferAttribute(rainVerts, 3));
const rainSystem = new THREE.Points(rainGeo, new THREE.PointsMaterial({ color: 0x93c5fd, size: 0.6, transparent: true, opacity: 0.7 }));
rainSystem.visible = false;
scene.add(rainSystem);

// Мұхит
const ocean = new THREE.Mesh(
  new THREE.PlaneGeometry(65000, 65000),
  new THREE.MeshStandardMaterial({ color: 0x0369a1, roughness: 0.15, metalness: 0.72 })
);
ocean.rotation.x = -Math.PI / 2;
ocean.position.y = -2;
scene.add(ocean);

// Ойыншының 3D көлік моделі (қорап + дөңгелектер + фаралар)
function createDetailedCarMesh(colorHex) {
  const group = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(2.7, 1.15, 5.2),
    new THREE.MeshStandardMaterial({ color: colorHex, metalness: 0.75, roughness: 0.2 })
  );
  body.position.y = 0.9;
  body.castShadow = true;
  const cabin = new THREE.Mesh(
    new THREE.BoxGeometry(2.2, 0.85, 2.5),
    new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9, roughness: 0.1 })
  );
  cabin.position.set(0, 1.75, -0.2);
  group.add(body, cabin);

  const wheelGeo = new THREE.CylinderGeometry(0.55, 0.55, 0.45, 16);
  wheelGeo.rotateZ(Math.PI / 2);
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.85 });
  [[-1.4, 0.55, 1.6], [1.4, 0.55, 1.6], [-1.4, 0.55, -1.6], [1.4, 0.55, -1.6]].forEach(([wx, wy, wz]) => {
    const w = new THREE.Mesh(wheelGeo, wheelMat);
    w.position.set(wx, wy, wz);
    group.add(w);
  });
  return group;
}

const playerCarMesh = createDetailedCarMesh(0xef4444);
playerCarMesh.visible = false;
scene.add(playerCarMesh);

const cityCoords = [];
const npcs = [];
const trafficCars = [];
const policeCars = [];
const helicopters = [];
const boats = [];
const interactZones = [];
const buildingMaterials = [];
const colliders = [];
const selectEl = document.getElementById('city-select');
const missionSelectEl = document.getElementById('mission-select');
const garageSelectEl = document.getElementById('garage-select');
const radioSelectEl = document.getElementById('radio-select');

MISSIONS.forEach(m => {
  const opt = document.createElement('option');
  opt.value = m.id;
  opt.textContent = `${m.title} (+$${m.reward})`;
  missionSelectEl.appendChild(opt);
});

GARAGE_CARS.forEach(gc => {
  const opt = document.createElement('option');
  opt.value = gc.id;
  opt.textContent = `${gc.name} ($${gc.price})`;
  garageSelectEl.appendChild(opt);
});

RADIO_STATIONS.forEach(rs => {
  const opt = document.createElement('option');
  opt.value = rs.id;
  opt.textContent = rs.name;
  radioSelectEl.appendChild(opt);
});

CITIES.forEach((city, idx) => {
  const col = idx % 5;
  const row = Math.floor(idx / 5);
  const cx = col * STEP;
  const cz = row * STEP;
  cityCoords.push({ ...city, cx, cz });

  const opt = document.createElement('option');
  opt.value = idx;
  opt.textContent = `${idx + 1}. ${city.name} (${city.country})`;
  selectEl.appendChild(opt);

  const platform = new THREE.Mesh(
    new THREE.BoxGeometry(CITY_SIZE, 4, CITY_SIZE),
    new THREE.MeshStandardMaterial({ color: 0x273549, roughness: 0.9 })
  );
  platform.position.set(cx, -2, cz);
  platform.receiveShadow = true;
  scene.add(platform);

  // Саябақ пен ағаштар
  const park = new THREE.Mesh(
    new THREE.BoxGeometry(260, 0.4, 260),
    new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.95 })
  );
  park.position.set(cx - 240, 0.2, cz - 240);
  park.receiveShadow = true;
  scene.add(park);

  for (let t = 0; t < 10; t++) {
    const tx = cx - 340 + (t % 5) * 45;
    const tz = cz - 340 + Math.floor(t / 5) * 45;
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.9, 5, 8), new THREE.MeshStandardMaterial({ color: 0x78350f }));
    trunk.position.set(tx, 2.5, tz);
    const crown = new THREE.Mesh(new THREE.ConeGeometry(3.8, 9, 8), new THREE.MeshStandardMaterial({ color: 0x166534 }));
    crown.position.set(tx, 9, tz);
    scene.add(trunk, crown);
  }

  // Магистральдар
  const roadMat = new THREE.MeshStandardMaterial({ map: roadTex, roughness: 0.75 });
  const roadX = new THREE.Mesh(new THREE.BoxGeometry(CITY_SIZE, 0.35, 42), roadMat);
  roadX.position.set(cx, 0.18, cz);
  roadX.receiveShadow = true;
  scene.add(roadX);

  const roadZ = new THREE.Mesh(new THREE.BoxGeometry(42, 0.35, CITY_SIZE), roadMat);
  roadZ.position.set(cx, 0.18, cz);
  roadZ.receiveShadow = true;
  scene.add(roadZ);

  // Аймақтар
  const zoneTypes = [
    { type: 'food', label: '🍔 Мейрамхана ($50)', color: 0xf59e0b, dx: 85, dz: 85 },
    { type: 'work', label: '💼 Офис / Жұмыс (+$600+)', color: 0x3b82f6, dx: -85, dz: 85 },
    { type: 'study', label: '🎓 Университет (+15 🧠)', color: 0x8b5cf6, dx: 85, dz: -85 },
    { type: 'bank', label: '💰 Банк тонау (+$3500)', color: 0xef4444, dx: -85, dz: -85 },
    { type: 'rescue', label: '🚑 Аурухана / Құтқару (+$1800)', color: 0x10b981, dx: 135, dz: 40 },
    { type: 'shop', label: '🛒 Дүкен / Бронь ($300)', color: 0xec4899, dx: -135, dz: 40 },
    { type: 'taxi', label: '🚕 Такси / Жеткізу (+$450)', color: 0xeab308, dx: 135, dz: -40 },
    { type: 'estate', label: '🏢 Бизнес сатып алу ($4000)', color: 0x06b6d4, dx: -135, dz: -40 }
  ];
  zoneTypes.forEach(z => {
    const marker = new THREE.Mesh(
      new THREE.CylinderGeometry(8, 8, 0.5, 24),
      new THREE.MeshBasicMaterial({ color: z.color, transparent: true, opacity: 0.78 })
    );
    marker.position.set(cx + z.dx, 0.3, cz + z.dz);
    scene.add(marker);
    interactZones.push({ x: cx + z.dx, z: cz + z.dz, type: z.type, label: z.label, city: city.name });
  });

  const mats = city.palette.map(hex => {
    const m = new THREE.MeshStandardMaterial({
      map: createFacadeTexture(hex, false),
      roughness: 0.25,
      metalness: 0.55
    });
    buildingMaterials.push({ mat: m, hex });
    return m;
  });

  // Монумент
  const landmarkH = city.style === 'skyscraper' ? 460 : 240;
  const landmark = new THREE.Mesh(
    new THREE.CylinderGeometry(5, 26, landmarkH, 12),
    new THREE.MeshStandardMaterial({ color: 0xf1f5f9, metalness: 0.85, roughness: 0.15 })
  );
  landmark.position.set(cx + 185, landmarkH / 2, cz + 185);
  landmark.castShadow = true;
  scene.add(landmark);

  // Ғимараттар + Коллизия
  for (let b = 0; b < 80; b++) {
    const bx = cx + (Math.random() - 0.5) * (CITY_SIZE - 160);
    const bz = cz + (Math.random() - 0.5) * (CITY_SIZE - 160);
    if (Math.abs(bx - cx) < 175 && Math.abs(bz - cz) < 175) continue;
    if (Math.abs(bx - cx) < 55 || Math.abs(bz - cz) < 55) continue;
    const w = 24 + Math.random() * 48;
    const d = 24 + Math.random() * 48;
    const h = city.style === 'skyscraper' ? 75 + Math.random() * 310
            : city.style === 'europe' ? 30 + Math.random() * 80
            : 45 + Math.random() * 180;
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mats[b % mats.length]);
    mesh.position.set(bx, h / 2, bz);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    colliders.push({ minX: bx - w / 2 - 1.2, maxX: bx + w / 2 + 1.2, minZ: bz - d / 2 - 1.2, maxZ: bz + d / 2 + 1.2, topY: h });
  }

  // Көлік трафигі
  for (let c = 0; c < 6; c++) {
    const car = new THREE.Mesh(
      new THREE.BoxGeometry(2.5, 1.4, 5.0),
      new THREE.MeshStandardMaterial({ color: [0xef4444, 0xf8fafc, 0x0f172a, 0x3b82f6][c % 4], metalness: 0.7, roughness: 0.2 })
    );
    const alongX = c % 2 === 0;
    car.position.set(
      alongX ? cx + (Math.random() - 0.5) * CITY_SIZE : cx + (c % 2 === 0 ? 10 : -10),
      0.9,
      alongX ? cz + (c % 3 === 0 ? 10 : -10) : cz + (Math.random() - 0.5) * CITY_SIZE
    );
    car.userData = { alongX, speed: 26 + Math.random() * 20, minX: cx - CITY_SIZE / 2, maxX: cx + CITY_SIZE / 2, minZ: cz - CITY_SIZE / 2, maxZ: cz + CITY_SIZE / 2 };
    scene.add(car);
    trafficCars.push(car);
  }

  // Катер / Яхта
  const boat = new THREE.Mesh(
    new THREE.BoxGeometry(4.2, 1.6, 11.0),
    new THREE.MeshStandardMaterial({ color: 0xf8fafc, metalness: 0.6, roughness: 0.2 })
  );
  boat.position.set(cx + CITY_SIZE / 2 + 25, -0.6, cz + 140);
  scene.add(boat);
  boats.push(boat);

  // Полиция патрулі және Тікұшағы
  const cop = new THREE.Mesh(
    new THREE.BoxGeometry(2.6, 1.5, 5.2),
    new THREE.MeshStandardMaterial({ color: 0x1d4ed8, emissive: 0xef4444, emissiveIntensity: 0.35 })
  );
  cop.position.set(cx + 48, 0.95, cz + 48);
  scene.add(cop);
  policeCars.push(cop);

  const heli = new THREE.Mesh(
    new THREE.BoxGeometry(3.2, 2.2, 8.0),
    new THREE.MeshStandardMaterial({ color: 0x0f172a, emissive: 0x3b82f6, emissiveIntensity: 0.4 })
  );
  heli.position.set(cx, 140, cz);
  scene.add(heli);
  helicopters.push(heli);

  // NPC тұрғындар мен мафия
  for (let n = 0; n < 12; n++) {
    const isHostile = n % 3 === 0;
    const npc = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.55, 1.35, 4, 8),
      new THREE.MeshStandardMaterial({ color: isHostile ? 0xf43f5e : 0x38bdf8 })
    );
    npc.position.set(cx + (Math.random() - 0.5) * 500, 1.3, cz + (Math.random() - 0.5) * 500);
    npc.userData = { hp: 100, dir: Math.random() * Math.PI * 2, hostile: isHostile };
    scene.add(npc);
    npcs.push(npc);
  }

  // 1000 МЕТРЛІК КӨПІРЛЕР
  if (col < 4) buildBridge(cx + CITY_SIZE / 2, cz, cx + STEP - CITY_SIZE / 2, cz, true);
  if (row < 2) buildBridge(cx, cz + CITY_SIZE / 2, cx, cz + STEP - CITY_SIZE / 2, false);
});

function buildBridge(x1, z1, x2, z2, alongX) {
  const midX = (x1 + x2) / 2;
  const midZ = (z1 + z2) / 2;
  const deckGeo = alongX ? new THREE.BoxGeometry(BRIDGE_LEN, 2.4, 42) : new THREE.BoxGeometry(42, 2.4, BRIDGE_LEN);
  const deck = new THREE.Mesh(deckGeo, new THREE.MeshStandardMaterial({ map: roadTex, roughness: 0.7 }));
  deck.position.set(midX, 1.2, midZ);
  deck.receiveShadow = true;
  scene.add(deck);

  const pylonMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, metalness: 0.65 });
  const lightMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
  [-330, 0, 330].forEach(offset => {
    const px = alongX ? midX + offset : midX;
    const pz = alongX ? midZ : midZ + offset;
    const pylon = new THREE.Mesh(new THREE.BoxGeometry(5, 95, 5), pylonMat);
    pylon.position.set(px, 47, pz);
    scene.add(pylon);

    const beacon = new THREE.Mesh(new THREE.SphereGeometry(2.8), lightMat);
    beacon.position.set(px, 96, pz);
    scene.add(beacon);
  });
}

// Үй іші интерьеры (еден, қабырғалар, төсек, үстел, диван)
const apartmentGroup = new THREE.Group();
const floorMesh = new THREE.Mesh(new THREE.BoxGeometry(30, 0.5, 30), new THREE.MeshStandardMaterial({ color: 0x78350f }));
const wall1 = new THREE.Mesh(new THREE.BoxGeometry(30, 8, 0.5), new THREE.MeshStandardMaterial({ color: 0xe2e8f0 }));
wall1.position.set(0, 4, -15);
const wall2 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 8, 30), new THREE.MeshStandardMaterial({ color: 0xcbd5e1 }));
wall2.position.set(-15, 4, 0);
const bedMesh = new THREE.Mesh(new THREE.BoxGeometry(4.5, 1.2, 6), new THREE.MeshStandardMaterial({ color: 0x2563eb }));
bedMesh.position.set(-8, 0.8, -9);
const sofaMesh = new THREE.Mesh(new THREE.BoxGeometry(7, 1.4, 2.6), new THREE.MeshStandardMaterial({ color: 0x0f766e }));
sofaMesh.position.set(5, 0.9, -9);
const deskMesh = new THREE.Mesh(new THREE.BoxGeometry(4, 1.5, 2), new THREE.MeshStandardMaterial({ color: 0x92400e }));
deskMesh.position.set(6, 0.9, 5);
apartmentGroup.add(floorMesh, wall1, wall2, bedMesh, sofaMesh, deskMesh);
apartmentGroup.position.set(0, 600, 0);
scene.add(apartmentGroup);

// Мини-карта
const miniCanvas = document.getElementById('minimap');
const miniCtx = miniCanvas.getContext('2d');

function drawMinimap() {
  miniCtx.fillStyle = '#070d19';
  miniCtx.fillRect(0, 0, 150, 150);

  cityCoords.forEach((c, idx) => {
    const mx = 18 + (idx % 5) * 28;
    const mz = 22 + Math.floor(idx / 5) * 48;
    miniCtx.fillStyle = '#334155';
    miniCtx.fillRect(mx - 8, mz - 8, 16, 16);
    if (idx % 5 < 4) {
      miniCtx.fillStyle = '#38bdf8';
      miniCtx.fillRect(mx + 8, mz - 1.5, 12, 3);
    }
    if (Math.floor(idx / 5) < 2) {
      miniCtx.fillStyle = '#38bdf8';
      miniCtx.fillRect(mx - 1.5, mz + 8, 3, 32);
    }
  });

  const px = 18 + (player.pos.x / STEP) * 28;
  const pz = 22 + (player.pos.z / STEP) * 48;
  miniCtx.fillStyle = '#22c55e';
  miniCtx.beginPath();
  miniCtx.arc(Math.max(6, Math.min(144, px)), Math.max(6, Math.min(144, pz)), 4, 0, Math.PI * 2);
  miniCtx.fill();
}

const saved = JSON.parse(localStorage.getItem('world15_save_v6') || 'null');
const player = Object.assign({
  pos: new THREE.Vector3(0, 2.2, 0),
  velY: 0,
  yaw: 0,
  pitch: 0,
  hp: 100,
  armor: 50,
  food: 100,
  stamina: 100,
  intellect: 10,
  businesses: 0,
  money: 5000,
  wanted: 0,
  mode: 'walk',
  weapon: 'Тапанша',
  carSpeed: 120,
  ownedCars: ['gt_coupe'],
  activeMission: null,
  missionKills: 0,
  missionStartPos: null,
  completedMissions: [],
  insideHome: false,
  savedPos: new THREE.Vector3(0, 2.2, 0)
}, saved ? {
  hp: saved.hp, armor: saved.armor, food: saved.food, intellect: saved.intellect || 10,
  businesses: saved.businesses || 0, money: saved.money, wanted: saved.wanted, weapon: saved.weapon,
  carSpeed: saved.carSpeed || 120, ownedCars: saved.ownedCars || ['gt_coupe'],
  completedMissions: saved.completedMissions || []
} : {});
if (saved && saved.pos) player.pos.set(saved.pos.x, saved.pos.y, saved.pos.z);

playerCarMesh.children[0].material.color.setHex(
  (GARAGE_CARS.find(c => c.speed === player.carSpeed) || GARAGE_CARS[0]).color
);

window.saveGame = () => {
  localStorage.setItem('world15_save_v6', JSON.stringify({
    pos: { x: player.pos.x, y: player.pos.y, z: player.pos.z },
    hp: player.hp, armor: player.armor, food: player.food, intellect: player.intellect,
    businesses: player.businesses, money: player.money, wanted: player.wanted, weapon: player.weapon,
    carSpeed: player.carSpeed, ownedCars: player.ownedCars, completedMissions: player.completedMissions
  }));
  logMsg("Ойын прогресі толық сақталды (Save V6)!");
};

window.startMission = () => {
  const id = parseInt(missionSelectEl.value, 10);
  const m = MISSIONS.find(item => item.id === id);
  if (!m) return;
  player.activeMission = m;
  player.missionKills = 0;
  player.missionStartPos = player.pos.clone();
  if (m.heistMission) {
    player.wanted = Math.min(5, player.wanted + m.wantedGain);
    sfx.playAlert();
  }
  document.getElementById('mission-box').textContent = `Миссия: ${m.title} — ${m.desc}`;
  logMsg(`Миссия басталды: ${m.title}`);
};

function checkMissionProgress() {
  const m = player.activeMission;
  if (!m) return;
  let done = false;
  if (m.targetDist && player.missionStartPos && player.pos.distanceTo(player.missionStartPos) >= m.targetDist) {
    done = true;
  }
  if (m.targetKills && player.missionKills >= m.targetKills) {
    done = true;
  }
  if (m.crossBridge) {
    const nearBridge = cityCoords.some(c => Math.hypot(player.pos.x - c.cx, player.pos.z - c.cz) > CITY_SIZE * 0.52);
    if (nearBridge) done = true;
  }
  if (m.heistMission && player.pos.distanceTo(player.missionStartPos) >= 120) {
    done = true;
  }
  if (done) {
    player.money += m.reward;
    if (!player.completedMissions.includes(m.id)) player.completedMissions.push(m.id);
    player.activeMission = null;
    document.getElementById('mission-box').textContent = `Белсенді миссия жоқ (Аяқталды: ${player.completedMissions.length}/${MISSIONS.length})`;
    sfx.playCoin();
    logMsg(`Миссия орындалды: ${m.title}! Сыйақы: +$${m.reward}`);
  }
}

window.buyOrSelectCar = () => {
  const id = garageSelectEl.value;
  const gc = GARAGE_CARS.find(c => c.id === id);
  if (!gc) return;
  if (!player.ownedCars.includes(gc.id)) {
    if (player.money < gc.price) return logMsg(`Көлікке $${gc.price} жетпейді!`);
    player.money -= gc.price;
    player.ownedCars.push(gc.id);
    sfx.playCoin();
  }
  player.carSpeed = gc.speed;
  playerCarMesh.children[0].material.color.setHex(gc.color);
  window.setMode('car');
  logMsg(`Гараж көлігі таңдалды: ${gc.name} (Жылдамдық: ${gc.speed})`);
};

window.changeRadio = () => {
  const st = RADIO_STATIONS.find(r => r.id === radioSelectEl.value) || RADIO_STATIONS[0];
  sfx.setRadio(st);
  logMsg(`Радио: ${st.name}`);
};

function syncWorldToServer() {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'world',
      worldState: { timeMinutes: gameMinutes, isNight, isRaining }
    }));
  }
}

window.toggleTime = () => {
  isNight = !isNight;
  scene.background = new THREE.Color(isNight ? 0x050814 : 0x7dd3fc);
  scene.fog.color.setHex(isNight ? 0x050814 : 0x7dd3fc);
  sunLight.intensity = isNight ? 0.25 : 1.85;
  hemiLight.intensity = isNight ? 0.35 : 0.95;
  buildingMaterials.forEach(item => {
    item.mat.map = createFacadeTexture(item.hex, isNight);
    item.mat.needsUpdate = true;
  });
  syncWorldToServer();
  logMsg(isNight ? "Түнгі режим қосылды." : "Күндізгі режим қосылды.");
};

window.toggleWeather = () => {
  isRaining = !isRaining;
  rainSystem.visible = isRaining;
  syncWorldToServer();
  logMsg(isRaining ? "Жаңбырлы ауа-райы қосылды." : "Аспан ашылды.");
};

window.toggleHome = () => {
  if (!player.insideHome) {
    player.savedPos.copy(player.pos);
    player.pos.set(0, 602.2, 5);
    player.insideHome = true;
    player.hp = 100;
    player.food = 100;
    logMsg("Үйге кірдіңіз: демалып, HP мен Тамақ 100% толды!");
  } else {
    player.pos.copy(player.savedPos);
    player.insideHome = false;
    logMsg("Қалаға қайта шықтыңыз.");
  }
};

selectEl.addEventListener('change', (e) => {
  const c = cityCoords[parseInt(e.target.value, 10)];
  player.insideHome = false;
  player.pos.set(c.cx, 2.2, c.cz);
  logMsg(`Қалаға жеттіңіз: ${c.name} (${c.country}) — ${c.landmark}`);
});

const gunGroup = new THREE.Group();
const gunBody = new THREE.Mesh(
  new THREE.BoxGeometry(0.13, 0.17, 0.68),
  new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.85, roughness: 0.18 })
);
gunBody.position.set(0.32, -0.25, -0.55);
gunGroup.add(gunBody);
camera.add(gunGroup);
scene.add(camera);

const bullets = [];
const keys = {};
window.addEventListener('keydown', (e) => {
  keys[e.code] = true;
  if (e.code === 'KeyF') window.shootOrFight();
  if (e.code === 'KeyE') interactNearest();
  if (e.code === 'KeyG') hijackNearestVehicle();
  if (e.code === 'Digit1') { player.weapon = 'Жұдырық'; gunBody.scale.set(0.5, 0.5, 0.4); }
  if (e.code === 'Digit2') { player.weapon = 'Тапанша'; gunBody.scale.set(1, 1, 1); }
  if (e.code === 'Digit3') { player.weapon = 'Автомат'; gunBody.scale.set(1.2, 1.2, 1.6); }
  if (e.code === 'Digit4') { player.weapon = 'Снайпер'; gunBody.scale.set(1.1, 1.1, 2.3); }
  document.getElementById('weapon-name').textContent = player.weapon;
});
window.addEventListener('keyup', (e) => keys[e.code] = false);

renderer.domElement.addEventListener('click', () => {
  if (document.pointerLockElement !== renderer.domElement) {
    renderer.domElement.requestPointerLock();
  } else {
    window.shootOrFight();
  }
});

window.addEventListener('mousemove', (e) => {
  if (document.pointerLockElement === renderer.domElement) {
    player.yaw -= e.movementX * 0.0022;
    player.pitch = Math.max(-1.45, Math.min(1.45, player.pitch - e.movementY * 0.0022));
  }
});

window.rotateMobile = (delta) => { player.yaw += delta; };

window.setMode = (m) => {
  player.mode = m;
  player.insideHome = false;
  gunGroup.visible = (m === 'walk');
  playerCarMesh.visible = (m === 'car');
  if (m === 'walk' && player.pos.y > 10) player.pos.y = 2.2;
  if (m === 'car') player.pos.y = 2.5;
  if (m === 'boat') player.pos.set(player.pos.x + 20, 0.4, player.pos.z);
  if (m === 'plane' && player.pos.y < 90) player.pos.y = 150;
  if (m === 'space') player.pos.set(5600, 2180, 2950);
  const labels = { walk: 'Жаяу', car: 'Спорткар', boat: 'Яхта / Катер', plane: 'Ұшақ', space: 'Ғарышкер' };
  logMsg(`Режим: ${labels[m]}`);
};

function hijackNearestVehicle() {
  for (const car of trafficCars) {
    if (player.pos.distanceTo(car.position) < 12) {
      player.pos.copy(car.position);
      window.setMode('car');
      player.wanted = Math.min(5, player.wanted + 1);
      sfx.playAlert();
      logMsg("Көшедегі көлікті айдап әкеттіңіз! (+1⭐)");
      return;
    }
  }
  for (const boat of boats) {
    if (player.pos.distanceTo(boat.position) < 18) {
      player.pos.copy(boat.position);
      window.setMode('boat');
      logMsg("Катерге отырдыңыз!");
      return;
    }
  }
  window.setMode(player.mode === 'car' ? 'walk' : 'car');
}

window.shootOrFight = () => {
  const wMap = { 'Жұдырық': 'punch', 'Тапанша': 'pistol', 'Автомат': 'rifle', 'Снайпер': 'sniper' };
  sfx.playShot(wMap[player.weapon] || 'pistol');
  const b = new THREE.Mesh(
    new THREE.SphereGeometry(0.24),
    new THREE.MeshBasicMaterial({ color: 0xfacc15 })
  );
  b.position.copy(camera.position);
  const dir = new THREE.Vector3(0, 0, -1).applyEuler(new THREE.Euler(player.pitch, player.yaw, 0, 'YXZ'));
  const speed = player.weapon === 'Снайпер' ? 320 : 185;
  const dmg = player.weapon === 'Снайпер' ? 120 : player.weapon === 'Автомат' ? 75 : 50;
  b.userData = { vel: dir.multiplyScalar(speed), life: player.weapon === 'Жұдырық' ? 0.08 : 2.2, dmg };
  scene.add(b);
  bullets.push(b);
};

window.eatFood = () => {
  if (player.money < 50) return logMsg("Ақша жетпейді!");
  player.money -= 50;
  player.food = Math.min(100, player.food + 35);
  player.hp = Math.min(100, player.hp + 30);
  sfx.playCoin();
  logMsg("Тамақ ішілді: +35 Тоқтық, +30 HP.");
};

window.buyArmor = () => {
  if (player.money < 300) return logMsg("Бронежилетке $300 керек!");
  player.money -= 300;
  player.armor = 100;
  sfx.playCoin();
  logMsg("Бронежилет алынды (Armor 100%).");
};

window.doWork = () => {
  const bonus = player.intellect * 15;
  player.money += 600 + bonus;
  player.food = Math.max(0, player.food - 8);
  sfx.playCoin();
  logMsg(`Офис жұмысы аяқталды: +$${600 + bonus}!`);
};

window.doTaxi = () => {
  player.money += 450;
  player.food = Math.max(0, player.food - 5);
  sfx.playCoin();
  logMsg("Такси / Жеткізу тапсырысы орындалды: +$450!");
};

window.doStudy = () => {
  player.intellect += 15;
  player.food = Math.max(0, player.food - 6);
  sfx.playCoin();
  logMsg(`Университет дәрісі: Интеллект ${player.intellect} деңгейіне өсті!`);
};

window.buyBusiness = () => {
  if (player.money < 4000) return logMsg("Бизнес ашу үшін $4000 қажет!");
  player.money -= 4000;
  player.businesses += 1;
  sfx.playCoin();
  logMsg(`Жаңа бизнес сатып алынды! Барлығы: ${player.businesses} (әр 10 сек пассив табыс).`);
};

window.doHeist = () => {
  player.money += 3500;
  player.wanted = Math.min(5, player.wanted + 2);
  sfx.playAlert();
  logMsg("Банк тоналды! +$3500, полиция мен тікұшақ ізіңізге түсті (+2⭐)!");
};

window.doRescue = () => {
  player.money += 1800;
  player.wanted = Math.max(0, player.wanted - 1);
  sfx.playCoin();
  logMsg("Құтқару миссиясы сәтті өтті! +$1800.");
};

function interactNearest() {
  for (const z of interactZones) {
    if (Math.hypot(player.pos.x - z.x, player.pos.z - z.z) < 16) {
      if (z.type === 'food') return window.eatFood();
      if (z.type === 'work') return window.doWork();
      if (z.type === 'study') return window.doStudy();
      if (z.type === 'bank') return window.doHeist();
      if (z.type === 'rescue') return window.doRescue();
      if (z.type === 'shop') return window.buyArmor();
      if (z.type === 'taxi') return window.doTaxi();
      if (z.type === 'estate') return window.buyBusiness();
    }
  }
  logMsg("Жақын маңда белсенді ғимарат жоқ.");
}

function logMsg(t) { document.getElementById('log').textContent = t; }

const remotePlayers = new Map();
let ws = null;
try {
  const proto = location.protocol === 'https:' ? 'wss' : 'ws';
  ws = new WebSocket(`${proto}://${location.host}`);
  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.type === 'init' && msg.worldState) {
      gameMinutes = msg.worldState.timeMinutes ?? gameMinutes;
      if (msg.worldState.isRaining !== undefined && msg.worldState.isRaining !== isRaining) {
        isRaining = msg.worldState.isRaining;
        rainSystem.visible = isRaining;
      }
    } else if (msg.type === 'world' && msg.worldState) {
      gameMinutes = msg.worldState.timeMinutes ?? gameMinutes;
      if (msg.worldState.isRaining !== undefined) {
        isRaining = msg.worldState.isRaining;
        rainSystem.visible = isRaining;
      }
    } else if (msg.type === 'sync') {
      msg.players.forEach(p => {
        if (!remotePlayers.has(p.id)) {
          const mesh = new THREE.Mesh(
            new THREE.CapsuleGeometry(0.7, 1.5, 4, 8),
            new THREE.MeshStandardMaterial({ color: 0x10b981 })
          );
          scene.add(mesh);
          remotePlayers.set(p.id, mesh);
        }
        remotePlayers.get(p.id).position.set(p.x, p.y, p.z);
      });
    } else if (msg.type === 'chat') {
      logMsg(`[Чат ${msg.id}]: ${msg.text}`);
    }
  };
} catch (e) {}

window.sendChat = () => {
  const inp = document.getElementById('chat-input');
  if (!inp.value.trim()) return;
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'chat', text: inp.value }));
  } else {
    logMsg(`[Сіз]: ${inp.value}`);
  }
  inp.value = '';
};

function checkCollision(nx, nz) {
  if (player.mode === 'plane' || player.mode === 'space' || player.insideHome) return false;
  for (let i = 0; i < colliders.length; i++) {
    const c = colliders[i];
    if (nx > c.minX && nx < c.maxX && nz > c.minZ && nz < c.maxZ && player.pos.y < c.topY) {
      return true;
    }
  }
  return false;
}

let passiveTimer = 0;
let lastTime = performance.now();
function animate(now) {
  requestAnimationFrame(animate);
  const dt = Math.min((now - lastTime) / 1000, 0.05);
  lastTime = now;

  spaceStation.rotation.z += 0.15 * dt;
  gameMinutes = (gameMinutes + dt * 4) % 1440;
  const hh = String(Math.floor(gameMinutes / 60)).padStart(2, '0');
  const mm = String(Math.floor(gameMinutes % 60)).padStart(2, '0');

  if (player.businesses > 0) {
    passiveTimer += dt;
    if (passiveTimer >= 10) {
      passiveTimer = 0;
      const income = player.businesses * 350;
      player.money += income;
      logMsg(`Бизнес табысы түсті: +$${income}`);
    }
  }

  if (isRaining) rainSystem.position.set(player.pos.x, 0, player.pos.z);

  const isSprint = keys['ShiftLeft'] && player.mode === 'walk' && player.stamina > 5;
  const speeds = { walk: isSprint ? 40 : 24, car: player.carSpeed, boat: 75, plane: 280, space: 640 };
  const spd = speeds[player.mode];

  if (isSprint) player.stamina = Math.max(0, player.stamina - 18 * dt);
  else player.stamina = Math.min(100, player.stamina + 11 * dt);

  const forward = new THREE.Vector3(-Math.sin(player.yaw), 0, -Math.cos(player.yaw));
  const right = new THREE.Vector3(Math.cos(player.yaw), 0, -Math.sin(player.yaw));

  let moveX = 0, moveZ = 0;
  if (keys['KeyW']) { moveX += forward.x * spd * dt; moveZ += forward.z * spd * dt; }
  if (keys['KeyS']) { moveX -= forward.x * spd * dt; moveZ -= forward.z * spd * dt; }
  if (keys['KeyA']) { moveX -= right.x * spd * dt; moveZ -= right.z * spd * dt; }
  if (keys['KeyD']) { moveX += right.x * spd * dt; moveZ += right.z * spd * dt; }

  if (!checkCollision(player.pos.x + moveX, player.pos.z)) player.pos.x += moveX;
  if (!checkCollision(player.pos.x, player.pos.z + moveZ)) player.pos.z += moveZ;

  if (player.mode === 'walk') {
    const floorY = player.insideHome ? 602.2 : 2.2;
    if (keys['Space'] && player.pos.y <= floorY + 0.05) player.velY = 11.5;
    player.velY -= 26 * dt;
    player.pos.y += player.velY * dt;
    if (player.pos.y < floorY) { player.pos.y = floorY; player.velY = 0; }
  } else if (player.mode === 'plane' || player.mode === 'space') {
    if (keys['Space']) player.pos.y += spd * 0.6 * dt;
    if (keys['ControlLeft']) player.pos.y = Math.max(10, player.pos.y - spd * 0.6 * dt);
  }

  if (player.mode === 'car') {
    playerCarMesh.visible = true;
    playerCarMesh.position.set(player.pos.x + forward.x * 3.2, 0, player.pos.z + forward.z * 3.2);
    playerCarMesh.rotation.y = player.yaw;
  } else {
    playerCarMesh.visible = false;
  }

  camera.position.copy(player.pos);
  camera.rotation.order = 'YXZ';
  camera.rotation.y = player.yaw;
  camera.rotation.x = player.pitch;

  // Оқтар
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    b.position.addScaledVector(b.userData.vel, dt);
    b.userData.life -= dt;
    npcs.forEach(npc => {
      if (npc.visible && b.position.distanceTo(npc.position) < 2.2) {
        npc.userData.hp -= b.userData.dmg;
        b.userData.life = 0;
        if (npc.userData.hp <= 0) {
          npc.visible = false;
          player.money += 250;
          player.wanted = Math.min(5, player.wanted + 1);
          player.missionKills += 1;
          sfx.playCoin();
          logMsg("Қарсылас жойылды! +$250");
        }
      }
    });
    if (b.userData.life <= 0) { scene.remove(b); bullets.splice(i, 1); }
  }

  // Трафик
  trafficCars.forEach(car => {
    if (car.userData.alongX) {
      car.position.x += car.userData.speed * dt;
      if (car.position.x > car.userData.maxX) car.position.x = car.userData.minX;
    } else {
      car.position.z += car.userData.speed * dt;
      if (car.position.z > car.userData.maxZ) car.position.z = car.userData.minZ;
    }
  });

  // Полиция қуғыны
  if (player.wanted > 0 && !player.insideHome) {
    policeCars.forEach(cop => {
      const dist = Math.hypot(player.pos.x - cop.position.x, player.pos.z - cop.position.z);
      if (dist < 900 && dist > 6) {
        cop.position.x += ((player.pos.x - cop.position.x) / dist) * 35 * dt;
        cop.position.z += ((player.pos.z - cop.position.z) / dist) * 35 * dt;
      } else if (dist <= 6) {
        if (player.armor > 0) player.armor = Math.max(0, player.armor - 12 * dt);
        else player.hp = Math.max(1, player.hp - 10 * dt);
      }
    });
    if (player.wanted >= 3) {
      helicopters.forEach(h => {
        const dist = Math.hypot(player.pos.x - h.position.x, player.pos.z - h.position.z);
        if (dist < 1400 && dist > 15) {
          h.position.x += ((player.pos.x - h.position.x) / dist) * 48 * dt;
          h.position.z += ((player.pos.z - h.position.z) / dist) * 48 * dt;
        }
      });
    }
  }

  // NPC қозғалысы және мафия шабуылы
  npcs.forEach(npc => {
    if (!npc.visible) return;
    const dist = player.pos.distanceTo(npc.position);
    if (npc.userData.hostile && player.wanted > 0 && dist < 35) {
      npc.position.x += ((player.pos.x - npc.position.x) / dist) * 7 * dt;
      npc.position.z += ((player.pos.z - npc.position.z) / dist) * 7 * dt;
      if (dist < 2.5) {
        if (player.armor > 0) player.armor = Math.max(0, player.armor - 8 * dt);
        else player.hp = Math.max(1, player.hp - 8 * dt);
      }
    } else {
      npc.position.x += Math.cos(npc.userData.dir) * 3.2 * dt;
      npc.position.z += Math.sin(npc.userData.dir) * 3.2 * dt;
      if (Math.random() < 0.01) npc.userData.dir += (Math.random() - 0.5) * 2;
    }
  });

  checkMissionProgress();

  player.food = Math.max(0, player.food - 0.25 * dt);
  if (player.food <= 0) player.hp = Math.max(1, player.hp - 1.0 * dt);

  let nearest = cityCoords[0];
  let bestDist = Infinity;
  cityCoords.forEach(c => {
    const d = Math.hypot(player.pos.x - c.cx, player.pos.z - c.cz);
    if (d < bestDist) { bestDist = d; nearest = c; }
  });
  const locText = player.insideHome
    ? `Жеке пәтер (${nearest.name})`
    : bestDist > CITY_SIZE * 0.52
      ? `1000м Көпір (${nearest.name} — ${nearest.country} шекарасы)`
      : `${nearest.name} (${nearest.country}) — ${nearest.landmark}`;

  document.getElementById('city-title').textContent = locText;
  document.getElementById('mode-badge').textContent = `Режим: ${player.mode.toUpperCase()} | Уақыт: ${hh}:${mm} | Онлайн: ${remotePlayers.size + 1}`;
  document.getElementById('hp-fill').style.width = player.hp + '%';
  document.getElementById('hp-txt').textContent = Math.round(player.hp);
  document.getElementById('armor-fill').style.width = player.armor + '%';
  document.getElementById('armor-txt').textContent = Math.round(player.armor);
  document.getElementById('food-fill').style.width = player.food + '%';
  document.getElementById('food-txt').textContent = Math.round(player.food);
  document.getElementById('stam-fill').style.width = player.stamina + '%';
  document.getElementById('stam-txt').textContent = Math.round(player.stamina);
  document.getElementById('money').textContent = player.money;
  document.getElementById('wanted').textContent = player.wanted;
  document.getElementById('intellect').textContent = player.intellect;
  document.getElementById('biz').textContent = player.businesses;

  drawMinimap();

  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'state',
      state: { x: player.pos.x, y: player.pos.y, z: player.pos.z, mode: player.mode, city: nearest.name }
    }));
  }

  renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

animate(performance.now());
