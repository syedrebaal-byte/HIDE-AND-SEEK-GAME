import * as THREE from 'three';
import { MapData, CollisionBox, HidingSpot } from '../types/game';
import {
  getCyberpunkFloorTexture,
  getAncientStoneTexture,
  getSciFiHullTexture,
  getSandstoneTexture,
  getCargoCrateTexture,
  getNeonSignTexture
} from './proceduralTextures';

// Definition of 4 playable maps
export const MAPS: MapData[] = [
  {
    id: 'cyberpunk_sector',
    name: 'Neon Sector 7',
    tagline: 'Cyberpunk Industrial Alley & Cargo Yard',
    theme: 'cyberpunk',
    skyColor: 0x070913,
    fogColor: 0x090c18,
    fogDensity: 0.022,
    ambientColor: 0x1e293b,
    ambientIntensity: 0.6,
    keyLightColor: 0x06b6d4,
    keyLightIntensity: 1.2,
    hiderSpawn: { x: 18, y: 1.5, z: 18 },
    seekerSpawn: { x: -18, y: 1.5, z: -18 },
    bounds: { minX: -26, maxX: 26, minZ: -26, maxZ: 26 },
    hidingSpots: [
      { id: 'spot_vent', name: 'Alley Dumpster Recess', position: { x: 14, y: 0, z: -12 }, description: 'Shadowed nook behind industrial dumpsters', stealthBonus: 0.9 },
      { id: 'spot_crates_high', name: 'Cargo Container Stack', position: { x: -10, y: 0, z: 14 }, description: 'Narrow crevice between metallic containers', stealthBonus: 0.85 },
      { id: 'spot_scaffold', name: 'Generator Transformer Bay', position: { x: 20, y: 0, z: 8 }, description: 'Behind the high-voltage turbine conduits', stealthBonus: 0.8 },
      { id: 'spot_catwalk', name: 'Underground Drain Sump', position: { x: 4, y: 0, z: -18 }, description: 'Under the rusted steel catwalk ramp', stealthBonus: 0.95 }
    ]
  },
  {
    id: 'sun_temple',
    name: 'Ruins of Solaria',
    tagline: 'Ancient Jungle Temple & Stone Columns',
    theme: 'temple',
    skyColor: 0x1e1510,
    fogColor: 0x271e16,
    fogDensity: 0.02,
    ambientColor: 0x3d3024,
    ambientIntensity: 0.7,
    keyLightColor: 0xf59e0b,
    keyLightIntensity: 1.4,
    hiderSpawn: { x: 16, y: 1.5, z: 16 },
    seekerSpawn: { x: -16, y: 1.5, z: -16 },
    bounds: { minX: -26, maxX: 26, minZ: -26, maxZ: 26 },
    hidingSpots: [
      { id: 'temple_sarcophagus', name: 'Inner Tomb Sarcophagus', position: { x: 16, y: 0, z: -10 }, description: 'Concealed behind carved stone sarcophagi', stealthBonus: 0.9 },
      { id: 'temple_overhang', name: 'Altar Sun Pillar', position: { x: 0, y: 0, z: 18 }, description: 'Shadowed blind spot behind the central monolith', stealthBonus: 0.85 },
      { id: 'temple_crypt', name: 'Sunken Crypt Entrance', position: { x: -14, y: 0, z: 12 }, description: 'Down the moss-covered stone staircase', stealthBonus: 0.95 }
    ]
  },
  {
    id: 'space_station',
    name: 'Sub-Zero Station',
    tagline: 'Deep Space Cryo-Lab & Airlock Hub',
    theme: 'space_station',
    skyColor: 0x050810,
    fogColor: 0x0a101d,
    fogDensity: 0.018,
    ambientColor: 0x1e293b,
    ambientIntensity: 0.65,
    keyLightColor: 0x38bdf8,
    keyLightIntensity: 1.3,
    hiderSpawn: { x: 17, y: 1.5, z: 17 },
    seekerSpawn: { x: -17, y: 1.5, z: -17 },
    bounds: { minX: -26, maxX: 26, minZ: -26, maxZ: 26 },
    hidingSpots: [
      { id: 'lab_cryo', name: 'Stasis Pod Matrix', position: { x: 12, y: 0, z: -14 }, description: 'Tucked between cryogenic preservation tanks', stealthBonus: 0.9 },
      { id: 'lab_server', name: 'Server Core Rack 04', position: { x: -16, y: 0, z: 10 }, description: 'Concealed by humming mainframe towers', stealthBonus: 0.85 },
      { id: 'lab_airlock', name: 'Decontamination Chamber', position: { x: 18, y: 0, z: 12 }, description: 'Behind heavy titanium blast doors', stealthBonus: 0.95 }
    ]
  },
  {
    id: 'canyon_citadel',
    name: 'Canyon Citadel',
    tagline: 'Desert Fortress & Watchtower Pass',
    theme: 'canyon',
    skyColor: 0x22130c,
    fogColor: 0x362115,
    fogDensity: 0.024,
    ambientColor: 0x523624,
    ambientIntensity: 0.75,
    keyLightColor: 0xf97316,
    keyLightIntensity: 1.5,
    hiderSpawn: { x: 18, y: 1.5, z: 18 },
    seekerSpawn: { x: -18, y: 1.5, z: -18 },
    bounds: { minX: -26, maxX: 26, minZ: -26, maxZ: 26 },
    hidingSpots: [
      { id: 'citadel_tent', name: 'Nomad Supply Pavilion', position: { x: 15, y: 0, z: -12 }, description: 'Inside draped canvas supply shelter', stealthBonus: 0.9 },
      { id: 'citadel_tower', name: 'Watchtower Underside', position: { x: -12, y: 0, z: 16 }, description: 'Crouched under wooden timber scaffold', stealthBonus: 0.85 },
      { id: 'citadel_rampart', name: 'North Rampart Alcove', position: { x: 18, y: 0, z: 8 }, description: 'Stone battlement corner overlooking canyon', stealthBonus: 0.95 }
    ]
  }
];

export function getMapById(id: string): MapData {
  return MAPS.find((m) => m.id === id) || MAPS[0];
}

/**
 * Builds the 3D environment geometry, lights, props, and collision boxes into the scene
 */
export function buildMapEnvironment(
  scene: THREE.Scene,
  mapData: MapData
): { collisionBoxes: CollisionBox[]; hidingSpots: HidingSpot[] } {
  const collisions: CollisionBox[] = [];

  // Helper to register collision box
  const addBox = (minX: number, minY: number, minZ: number, maxX: number, maxY: number, maxZ: number, type: 'wall' | 'obstacle' | 'hiding_spot' = 'obstacle') => {
    collisions.push({
      min: { x: minX, y: minY, z: minZ },
      max: { x: maxX, y: maxY, z: maxZ },
      type
    });
  };

  // 1. Floor Ground
  let floorTexture: THREE.CanvasTexture;
  if (mapData.theme === 'cyberpunk') floorTexture = getCyberpunkFloorTexture();
  else if (mapData.theme === 'temple') floorTexture = getAncientStoneTexture();
  else if (mapData.theme === 'space_station') floorTexture = getSciFiHullTexture();
  else floorTexture = getSandstoneTexture();

  floorTexture.repeat.set(16, 16);

  const floorGeo = new THREE.PlaneGeometry(60, 60);
  const floorMat = new THREE.MeshStandardMaterial({
    map: floorTexture,
    roughness: mapData.theme === 'cyberpunk' ? 0.3 : 0.7,
    metalness: mapData.theme === 'space_station' ? 0.6 : 0.1
  });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  // 2. Perimeter Walls
  const wallMat = new THREE.MeshStandardMaterial({
    map: floorTexture,
    roughness: 0.8,
    metalness: 0.2
  });
  const wallHeight = 6;
  const wallThickness = 1.5;
  const halfSpan = 25;

  // North wall
  const nWall = new THREE.Mesh(new THREE.BoxGeometry(52, wallHeight, wallThickness), wallMat);
  nWall.position.set(0, wallHeight / 2, -halfSpan);
  nWall.castShadow = true;
  nWall.receiveShadow = true;
  scene.add(nWall);
  addBox(-26, 0, -halfSpan - 1, 26, wallHeight, -halfSpan + 1, 'wall');

  // South wall
  const sWall = new THREE.Mesh(new THREE.BoxGeometry(52, wallHeight, wallThickness), wallMat);
  sWall.position.set(0, wallHeight / 2, halfSpan);
  sWall.castShadow = true;
  sWall.receiveShadow = true;
  scene.add(sWall);
  addBox(-26, 0, halfSpan - 1, 26, wallHeight, halfSpan + 1, 'wall');

  // West wall
  const wWall = new THREE.Mesh(new THREE.BoxGeometry(wallThickness, wallHeight, 52), wallMat);
  wWall.position.set(-halfSpan, wallHeight / 2, 0);
  wWall.castShadow = true;
  wWall.receiveShadow = true;
  scene.add(wWall);
  addBox(-halfSpan - 1, 0, -26, -halfSpan + 1, wallHeight, 26, 'wall');

  // East wall
  const eWall = new THREE.Mesh(new THREE.BoxGeometry(wallThickness, wallHeight, 52), wallMat);
  eWall.position.set(halfSpan, wallHeight / 2, 0);
  eWall.castShadow = true;
  eWall.receiveShadow = true;
  scene.add(eWall);
  addBox(halfSpan - 1, 0, -26, halfSpan + 1, wallHeight, 26, 'wall');

  // 3. Theme Specific Props & Hiding Structures
  if (mapData.theme === 'cyberpunk') {
    buildCyberpunkProps(scene, addBox);
  } else if (mapData.theme === 'temple') {
    buildTempleProps(scene, addBox);
  } else if (mapData.theme === 'space_station') {
    buildSpaceStationProps(scene, addBox);
  } else {
    buildCanyonProps(scene, addBox);
  }

  return { collisionBoxes: collisions, hidingSpots: mapData.hidingSpots };
}

// Map 1 Props: Cyberpunk Containers, Signs, Dumpsters, Generators
function buildCyberpunkProps(scene: THREE.Scene, addBox: any) {
  const crateTexture = getCargoCrateTexture('#06b6d4');
  const crateMat = new THREE.MeshStandardMaterial({
    map: crateTexture,
    roughness: 0.4,
    metalness: 0.6
  });

  // Center Container Stack (Creates a multi-alley maze)
  const placeContainer = (x: number, y: number, z: number, rotY = 0) => {
    const geo = new THREE.BoxGeometry(6, 2.8, 2.6);
    const mesh = new THREE.Mesh(geo, crateMat);
    mesh.position.set(x, y + 1.4, z);
    mesh.rotation.y = rotY;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);

    const halfW = rotY === 0 ? 3 : 1.3;
    const halfD = rotY === 0 ? 1.3 : 3;
    addBox(x - halfW, y, z - halfD, x + halfW, y + 2.8, z + halfD);
  };

  placeContainer(0, 0, 0);
  placeContainer(0, 2.8, 0); // Stacked
  placeContainer(8, 0, -6, Math.PI / 2);
  placeContainer(-8, 0, 6, Math.PI / 2);
  placeContainer(-12, 0, -10);
  placeContainer(12, 0, 10);
  placeContainer(-10, 0, 14, Math.PI / 2); // Near hiding spot

  // Dumpsters / Hiding Nook at (14, 0, -12)
  const dumpsterMat = new THREE.MeshStandardMaterial({ color: 0x164e63, roughness: 0.5, metalness: 0.5 });
  const dumpster = new THREE.Mesh(new THREE.BoxGeometry(2.5, 1.8, 1.5), dumpsterMat);
  dumpster.position.set(14, 0.9, -12);
  dumpster.castShadow = true;
  scene.add(dumpster);
  addBox(12.75, 0, -12.75, 15.25, 1.8, -11.25, 'hiding_spot');

  // Generator Transformer at (20, 0, 8)
  const genGeo = new THREE.CylinderGeometry(1.2, 1.2, 3, 16);
  const genMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.2 });
  const generator = new THREE.Mesh(genGeo, genMat);
  generator.position.set(20, 1.5, 8);
  generator.castShadow = true;
  scene.add(generator);
  addBox(18.5, 0, 6.5, 21.5, 3, 9.5, 'hiding_spot');

  // Neon Signs & Ambient Billboards
  const signMat1 = new THREE.MeshBasicMaterial({ map: getNeonSignTexture('CYBER DECK', '#06b6d4') });
  const sign1 = new THREE.Mesh(new THREE.PlaneGeometry(5, 2), signMat1);
  sign1.position.set(0, 4.8, -24.1);
  scene.add(sign1);

  const signMat2 = new THREE.MeshBasicMaterial({ map: getNeonSignTexture('SECTOR-07', '#ec4899') });
  const sign2 = new THREE.Mesh(new THREE.PlaneGeometry(5, 2), signMat2);
  sign2.position.set(-24.1, 4.8, 0);
  sign2.rotation.y = Math.PI / 2;
  scene.add(sign2);

  // Atmospheric Cyberpunk Point Lights
  const p1 = new THREE.PointLight(0x06b6d4, 2.5, 18);
  p1.position.set(0, 4, 0);
  scene.add(p1);

  const p2 = new THREE.PointLight(0xec4899, 2.2, 16);
  p2.position.set(14, 3, -12);
  scene.add(p2);
}

// Map 2 Props: Ancient Stone Pillars, Altar, Ruined Walls
function buildTempleProps(scene: THREE.Scene, addBox: any) {
  const stoneMat = new THREE.MeshStandardMaterial({
    color: 0x574a38,
    roughness: 0.85,
    metalness: 0.05
  });

  // Stone Pillar generator
  const placePillar = (x: number, z: number, h = 6) => {
    const geo = new THREE.CylinderGeometry(0.8, 0.9, h, 12);
    const mesh = new THREE.Mesh(geo, stoneMat);
    mesh.position.set(x, h / 2, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    addBox(x - 0.9, 0, z - 0.9, x + 0.9, h, z + 0.9);
  };

  // Center Altar Colonnade
  placePillar(-6, -6);
  placePillar(6, -6);
  placePillar(-6, 6);
  placePillar(6, 6);
  placePillar(-14, -14);
  placePillar(14, 14);
  placePillar(0, 18, 7); // Altar Sun pillar (hiding spot)

  // Stepped Center Altar
  const altar1 = new THREE.Mesh(new THREE.BoxGeometry(8, 0.6, 8), stoneMat);
  altar1.position.set(0, 0.3, 0);
  scene.add(altar1);
  const altar2 = new THREE.Mesh(new THREE.BoxGeometry(5, 0.6, 5), stoneMat);
  altar2.position.set(0, 0.9, 0);
  scene.add(altar2);
  addBox(-4, 0, -4, 4, 1.2, 4);

  // Stone Sarcophagus Hiding Spot at (16, 0, -10)
  const sarcGeo = new THREE.BoxGeometry(3, 1.6, 1.6);
  const sarc = new THREE.Mesh(sarcGeo, stoneMat);
  sarc.position.set(16, 0.8, -10);
  sarc.castShadow = true;
  scene.add(sarc);
  addBox(14.5, 0, -10.8, 17.5, 1.6, -9.2, 'hiding_spot');

  // Fire Braziers with Flickering Flame Light
  const flame1 = new THREE.PointLight(0xf59e0b, 2.5, 15);
  flame1.position.set(0, 2.5, 0);
  scene.add(flame1);

  const flame2 = new THREE.PointLight(0xf97316, 2.0, 14);
  flame2.position.set(16, 2, -10);
  scene.add(flame2);
}

// Map 3 Props: Sci-Fi Lab Mainframes, Cryo Pods, Airlock Blast Doors
function buildSpaceStationProps(scene: THREE.Scene, addBox: any) {
  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.35,
    metalness: 0.85
  });

  const glowMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x38bdf8,
    emissiveIntensity: 1.5
  });

  // Cryo Pods at (12, 0, -14)
  for (let i = 0; i < 3; i++) {
    const podGeo = new THREE.CylinderGeometry(0.7, 0.7, 3, 16);
    const pod = new THREE.Mesh(podGeo, metalMat);
    pod.position.set(10 + i * 2, 1.5, -14);
    pod.castShadow = true;
    scene.add(pod);

    // Glowing core window
    const winGeo = new THREE.BoxGeometry(0.3, 1.5, 0.1);
    const win = new THREE.Mesh(winGeo, glowMat);
    win.position.set(10 + i * 2, 1.5, -13.3);
    scene.add(win);
  }
  addBox(9, 0, -15, 15, 3, -13, 'hiding_spot');

  // Server Mainframe Racks at (-16, 0, 10)
  for (let j = 0; j < 3; j++) {
    const rackGeo = new THREE.BoxGeometry(1.5, 3.2, 3.5);
    const rack = new THREE.Mesh(rackGeo, metalMat);
    rack.position.set(-16 + j * 2.2, 1.6, 10);
    rack.castShadow = true;
    scene.add(rack);
  }
  addBox(-17, 0, 8.2, -11, 3.2, 11.8, 'hiding_spot');

  // Central Reactor Core
  const coreGeo = new THREE.CylinderGeometry(2.5, 2.5, 5, 24);
  const core = new THREE.Mesh(coreGeo, metalMat);
  core.position.set(0, 2.5, 0);
  core.castShadow = true;
  scene.add(core);
  addBox(-2.6, 0, -2.6, 2.6, 5, 2.6);

  const coreLight = new THREE.PointLight(0x38bdf8, 3, 18);
  coreLight.position.set(0, 3, 0);
  scene.add(coreLight);
}

// Map 4 Props: Canyon Sandstone Ramparts, Tents, Timber Towers
function buildCanyonProps(scene: THREE.Scene, addBox: any) {
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x452312, roughness: 0.9, metalness: 0.1 });
  const tentMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.8, metalness: 0.05 });

  // Supply Tent at (15, 0, -12)
  const tentGeo = new THREE.ConeGeometry(3, 2.5, 4);
  const tent = new THREE.Mesh(tentGeo, tentMat);
  tent.position.set(15, 1.25, -12);
  tent.rotation.y = Math.PI / 4;
  tent.castShadow = true;
  scene.add(tent);
  addBox(13, 0, -14, 17, 2.5, -10, 'hiding_spot');

  // Wooden Watchtower at (-12, 0, 16)
  const towerPlatform = new THREE.Mesh(new THREE.BoxGeometry(4, 0.4, 4), woodMat);
  towerPlatform.position.set(-12, 3, 16);
  scene.add(towerPlatform);

  // 4 Legs
  const legGeo = new THREE.BoxGeometry(0.3, 3, 0.3);
  [
    [-1.8, -1.8], [1.8, -1.8], [-1.8, 1.8], [1.8, 1.8]
  ].forEach(([lx, lz]) => {
    const leg = new THREE.Mesh(legGeo, woodMat);
    leg.position.set(-12 + lx, 1.5, 16 + lz);
    scene.add(leg);
  });
  addBox(-14, 0, 14, -10, 3.4, 18, 'hiding_spot');

  // Center Canyon Rocks
  const rockGeo = new THREE.DodecahedronGeometry(2.5, 1);
  const rockMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 });
  const rock = new THREE.Mesh(rockGeo, rockMat);
  rock.position.set(0, 2, 0);
  rock.castShadow = true;
  scene.add(rock);
  addBox(-2.5, 0, -2.5, 2.5, 4, 2.5);

  const desertLight = new THREE.PointLight(0xf97316, 2.5, 16);
  desertLight.position.set(0, 4, 0);
  scene.add(desertLight);
}
