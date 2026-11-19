// EMBER TIDE — city: builds Port Vela as three.js meshes. Six districts
// that each look different: sand + palms on Coral Row, glass towers in the
// Glass Quarter, containers + crane at Old Foundry, a ferris wheel on Lumen
// Pier, brick old town in Palm Court, boats at Vela Marina.

import * as THREE from '../vendor/three.module.min.js';
import { DISTRICTS, SHOPS, WORLD } from './config.js';
import { makeRng, range, rangeInt } from './random.js';
import { windowTexture } from './render.js';

function signTexture(text, sub, bg, fg) {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 96;
  const g = c.getContext('2d');
  g.fillStyle = bg; g.fillRect(0, 0, 256, 96);
  g.strokeStyle = fg; g.lineWidth = 4; g.strokeRect(4, 4, 248, 88);
  g.fillStyle = fg; g.font = 'bold 30px Arial'; g.textAlign = 'center';
  g.fillText(text, 128, 46);
  g.font = 'bold 18px Arial';
  g.fillText(sub, 128, 76);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function box(scene, w, h, d, x, y, z, color, opts = {}) {
  const mat = opts.map
    ? new THREE.MeshStandardMaterial({ map: opts.map, emissive: opts.emissive || 0x000000, emissiveIntensity: opts.emissiveIntensity || 0, roughness: 0.85 })
    : new THREE.MeshStandardMaterial({ color, roughness: opts.rough ?? 0.85, metalness: opts.metal ?? 0.05, emissive: opts.emissive || 0x000000, emissiveIntensity: opts.emissiveIntensity || 0 });
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  if (opts.ry) m.rotation.y = opts.ry;
  scene.add(m);
  return m;
}

export function buildCity(scene, seed) {
  const rng = makeRng(seed);
  const winDay = windowTexture(false);
  const winNight = windowTexture(true);
  const city = { winDay, winNight, buildings: [], trafficLights: [], ferrisWheel: null, crane: null, gates: [], pickups: [] };

  // District ground slabs, each its own colour.
  for (const d of DISTRICTS) {
    const g = new THREE.Mesh(new THREE.PlaneGeometry(d.w, d.h),
      new THREE.MeshStandardMaterial({ color: d.ground, roughness: 0.95 }));
    g.rotation.x = -Math.PI / 2;
    g.position.set(d.cx, 0.01, d.cz);
    scene.add(g);
  }
  // The bay: open water west of Coral Row and south of the causeway.
  const water = new THREE.Mesh(new THREE.PlaneGeometry(360, 700),
    new THREE.MeshStandardMaterial({ color: 0x35a5d8, roughness: 0.15, metalness: 0, emissive: 0x1e7fb8, emissiveIntensity: 0.55 }));
  water.rotation.x = -Math.PI / 2;
  water.position.set(-480, 0.05, 0);
  scene.add(water);
  const waterSouth = water.clone();
  waterSouth.position.set(0, 0.05, 480);
  waterSouth.scale.set(2.4, 1, 0.4);
  scene.add(waterSouth);
  // Sand beach strip along Coral Row.
  const sand = new THREE.Mesh(new THREE.PlaneGeometry(60, 340),
    new THREE.MeshStandardMaterial({ color: 0xf2d9a0, roughness: 1 }));
  sand.rotation.x = -Math.PI / 2;
  sand.position.set(-310, 0.06, 0);
  scene.add(sand);
  // Roads: dark asphalt strips on the grid.
  const roadMat = new THREE.MeshStandardMaterial({ color: 0x35353f, roughness: 0.9 });
  for (let x = -WORLD.half; x <= WORLD.half; x += WORLD.roadGap) {
    const r = new THREE.Mesh(new THREE.PlaneGeometry(12, WORLD.half * 2), roadMat);
    r.rotation.x = -Math.PI / 2; r.position.set(x, 0.08, 0); scene.add(r);
    const dash = new THREE.Mesh(new THREE.PlaneGeometry(0.7, WORLD.half * 2),
      new THREE.MeshStandardMaterial({ color: 0xffd23f }));
    dash.rotation.x = -Math.PI / 2; dash.position.set(x, 0.09, 0); scene.add(dash);
  }
  for (let z = -WORLD.half; z <= WORLD.half; z += WORLD.roadGap) {
    const r = new THREE.Mesh(new THREE.PlaneGeometry(WORLD.half * 2, 12), roadMat);
    r.rotation.x = -Math.PI / 2; r.position.set(0, 0.08, z); scene.add(r);
  }

  // Buildings, per district look.
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x8fc7e8, roughness: 0.15, metalness: 0.7 });
  const brickMat = new THREE.MeshStandardMaterial({ color: 0x9a5f43, roughness: 0.95 });
  const dockMat = new THREE.MeshStandardMaterial({ color: 0x6e6a60, roughness: 0.9 });
  for (const d of DISTRICTS) {
    const count = d.id === 'glass' ? 22 : 14;
    for (let i = 0; i < count; i++) {
      const bx = d.cx + range(rng, -d.w / 2 + 18, d.w / 2 - 18);
      const bz = d.cz + range(rng, -d.h / 2 + 18, d.h / 2 - 18);
      if (Math.abs(bx % WORLD.roadGap) < 9 || Math.abs(bz % WORLD.roadGap) < 9) continue;
      // Keep the Coral Row beachfront clear so the bay reads from the avenue.
      if (d.id === 'coral' && bx < -285) continue;
      // Keep shopfronts clear so their signs are always visible.
      let nearShop = false;
      for (const s of SHOPS) if (Math.hypot(bx - s.x, bz - s.z) < 18) nearShop = true;
      if (nearShop) continue;
      const h = d.id === 'glass' ? range(rng, 45, 110) : d.id === 'foundry' ? range(rng, 8, 18) : range(rng, 10, 30);
      const w = range(rng, 14, 26); const dep = range(rng, 14, 26);
      let mat;
      if (d.id === 'glass') mat = glassMat;
      else if (d.id === 'palm') mat = brickMat;
      else if (d.id === 'foundry') mat = dockMat;
      else mat = new THREE.MeshStandardMaterial({ map: winDay, roughness: 0.85 });
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, dep), mat);
      m.position.set(bx, h / 2, bz);
      scene.add(m);
      city.buildings.push(m);
      // Lit windows on taller blocks, and on every Foundry block so the
      // docks stay readable at night.
      if ((h > 25 || d.id === 'foundry') && d.id !== 'glass') {
        const win = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.8, h * 0.8),
          new THREE.MeshStandardMaterial({ map: winNight, emissive: 0xffd98a, emissiveIntensity: 0.7, transparent: true }));
        win.position.set(bx, h / 2, bz + dep / 2 + 0.05);
        scene.add(win);
      }
    }
  }

  // Palms along Coral Row beachfront.
  for (let i = 0; i < 26; i++) {
    const px = -296 + range(rng, -6, 6);
    const pz = -300 + i * 24 + range(rng, -6, 6);
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.8, 9, 6),
      new THREE.MeshStandardMaterial({ color: 0x7a5c40 }));
    trunk.position.set(px, 4.5, pz); trunk.rotation.z = 0.12; scene.add(trunk);
    const top = new THREE.Mesh(new THREE.ConeGeometry(4.5, 5, 6),
      new THREE.MeshStandardMaterial({ color: 0x2fae5f }));
    top.position.set(px + 1, 10.5, pz); scene.add(top);
  }

  // Lumen Pier ferris wheel + string lights.
  const wheelGroup = new THREE.Group();
  const rim = new THREE.Mesh(new THREE.TorusGeometry(22, 1.1, 8, 32),
    new THREE.MeshStandardMaterial({ color: 0xffd23f, emissive: 0xff9a3d, emissiveIntensity: 0.8 }));
  wheelGroup.add(rim);
  for (let i = 0; i < 8; i++) {
    const spoke = new THREE.Mesh(new THREE.BoxGeometry(1, 44, 1),
      new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffd23f, emissiveIntensity: 0.5 }));
    spoke.rotation.z = (i * Math.PI) / 8;
    wheelGroup.add(spoke);
    const cab = new THREE.Mesh(new THREE.BoxGeometry(3, 3, 3),
      new THREE.MeshStandardMaterial({ color: [0xff5d5d, 0x4aa8ff, 0x37d67a, 0xffd23f][i % 4], emissiveIntensity: 0.4, emissive: 0x222222 }));
    cab.position.set(Math.cos((i * Math.PI) / 4) * 22, Math.sin((i * Math.PI) / 4) * 22, 0);
    wheelGroup.add(cab);
  }
  wheelGroup.position.set(-260, 30, -200);
  scene.add(wheelGroup);
  city.ferrisWheel = wheelGroup;
  // Boardwalk string lights.
  for (let i = 0; i < 12; i++) {
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.7, 6, 6),
      new THREE.MeshBasicMaterial({ color: 0xffe9a8 }));
    bulb.position.set(-280 + i * 8, 12, -160);
    scene.add(bulb);
  }

  // Old Foundry: container stacks + a dock crane (lattice, not a slab).
  const contColors = [0xd94f3d, 0x3d7dff, 0x37d67a, 0xffd23f, 0xff8a5c];
  for (let i = 0; i < 30; i++) {
    const cx = 150 + (i % 6) * 22 + range(rng, -4, 4);
    const cz = -120 + Math.floor(i / 6) * 18 + range(rng, -3, 3);
    const cc = contColors[i % contColors.length];
    box(scene, 16, 5, 6, cx, 2.5 + (i % 3) * 5, cz, cc, { emissive: cc, emissiveIntensity: 0.18 });
  }
  const crane = new THREE.Group();
  const mastMat = new THREE.MeshStandardMaterial({ color: 0xffd23f });
  for (const [px, pz] of [[-1.5, -1.5], [1.5, -1.5], [-1.5, 1.5], [1.5, 1.5]]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.7, 60, 0.7), mastMat);
    post.position.set(px, 30, pz); crane.add(post);
  }
  for (let y = 6; y < 60; y += 8) {
    const rung = new THREE.Mesh(new THREE.BoxGeometry(3.7, 0.6, 0.6), mastMat);
    rung.position.set(0, y, 1.5); crane.add(rung);
    const rung2 = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 3.7), mastMat);
    rung2.position.set(1.5, y, 0); crane.add(rung2);
  }
  const jibMat = new THREE.MeshStandardMaterial({ color: 0xff8a3d });
  for (const pz of [-1.2, 1.2]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(70, 0.8, 0.8), jibMat);
    rail.position.set(20, 58, pz); crane.add(rail);
  }
  const chord = new THREE.Mesh(new THREE.BoxGeometry(70, 0.8, 0.8), jibMat);
  chord.position.set(20, 52, 0); crane.add(chord);
  for (let x = -12; x <= 52; x += 8) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.6, 6, 0.6), jibMat);
    post.position.set(x, 55, 0); crane.add(post);
  }
  const hook = new THREE.Mesh(new THREE.BoxGeometry(3, 3, 3), new THREE.MeshStandardMaterial({ color: 0x222222 }));
  hook.position.set(48, 40, 0); crane.add(hook);
  crane.position.set(260, 0, -100);
  scene.add(crane);
  city.crane = crane;
  // Neon signs at Old Foundry — the docks stay readable at night.
  const neonSigns = [
    ['FOUNDRY', 'DOCKS · 24H', '#ff5d8f', '#ffffff', 140, 16, -60],
    ['KESSLER', 'IMPORT · EXPORT', '#37d6ff', '#ffffff', 280, 16, -100],
  ];
  for (const [text, sub, bg, fg, nx, ny, nz] of neonSigns) {
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(20, 7.5),
      new THREE.MeshBasicMaterial({ map: signTexture(text, sub, bg, fg), side: THREE.DoubleSide }));
    sign.position.set(nx, ny, nz);
    scene.add(sign);
  }

  // Selma's Garage: a lift platform + posts so the Solstice GT can sit on
  // a lift for the garage shot.
  const lift = new THREE.Group();
  const deck = new THREE.Mesh(new THREE.BoxGeometry(6, 0.3, 3.4),
    new THREE.MeshStandardMaterial({ color: 0x3a3a44, roughness: 0.6, metalness: 0.4 }));
  deck.position.y = 0.15; lift.add(deck);
  for (const [lx, lz] of [[-2.4, -1.4], [2.4, -1.4], [-2.4, 1.4], [2.4, 1.4]]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.5, 2.4, 0.5),
      new THREE.MeshStandardMaterial({ color: 0xffd23f }));
    post.position.set(lx, 1.2, lz); lift.add(post);
  }
  lift.position.set(-120, 0, 102);
  scene.add(lift);
  city.lift = lift;

  // Vela Marina: boats in the harbour.
  for (let i = 0; i < 8; i++) {
    const boat = new THREE.Group();
    const hull = new THREE.Mesh(new THREE.BoxGeometry(4, 2, 12),
      new THREE.MeshStandardMaterial({ color: [0xffffff, 0xff5d3d, 0x4aa8ff][i % 3] }));
    hull.position.y = 1; boat.add(hull);
    const mastB = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 9, 5),
      new THREE.MeshStandardMaterial({ color: 0xdddddd }));
    mastB.position.y = 6; boat.add(mastB);
    boat.position.set(240 + (i % 4) * 22, 0, 150 + Math.floor(i / 4) * 30);
    boat.rotation.y = range(rng, -0.4, 0.4);
    scene.add(boat);
  }

  // Shopfronts with signs.
  const shopSigns = [
    ["Selma's Garage", 'GARAGE · REPAIRS', '#ffb37a', '#1a0f2e'],
    ['BAYSIDE ARMS', 'GUNS · AMMO', '#ff5d5d', '#ffffff'],
    ['SPRAY PALACE', 'RESPRAY $250', '#4aa8ff', '#ffffff'],
    ['HOSPITAL', 'VELA GENERAL', '#37d67a', '#ffffff'],
    ['SUNSET SPRINT', 'RACES · $800', '#ffd23f', '#1a0f2e'],
    ['TAXI STAND', 'FARES $120', '#b07cff', '#ffffff'],
  ];
  SHOPS.forEach((s, i) => {
    box(scene, 18, 5, 10, s.x, 2.5, s.z, 0x554a68);
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(16, 6),
      new THREE.MeshBasicMaterial({ map: signTexture(shopSigns[i][0], shopSigns[i][1], shopSigns[i][2], shopSigns[i][3]), side: THREE.DoubleSide }));
    sign.position.set(s.x, 8.5, s.z + 6.2);
    scene.add(sign);
    // Neon glow strip under the sign.
    const strip = new THREE.Mesh(new THREE.BoxGeometry(16, 0.6, 0.4),
      new THREE.MeshBasicMaterial({ color: 0xffd23f }));
    strip.position.set(s.x, 5.2, s.z + 6.2);
    scene.add(strip);
  });

  // Streetlights along the main avenue.
  for (let i = 0; i < 18; i++) {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 9, 5),
      new THREE.MeshStandardMaterial({ color: 0x333333 }));
    pole.position.set(-250 + (i % 2) * 500, 4.5, -280 + Math.floor(i / 2) * 68);
    scene.add(pole);
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.9, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xffe9a8 }));
    lamp.position.set(-250 + (i % 2) * 500, 9.2, -280 + Math.floor(i / 2) * 68);
    scene.add(lamp);
  }

  // Traffic lights at four intersections.
  const tlSpots = [[-68, 68], [68, 68], [-68, -68], [68, -68], [-272, 204], [-272, 68]];
  for (const [tx, tz] of tlSpots) {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 8, 5),
      new THREE.MeshStandardMaterial({ color: 0x222222 }));
    pole.position.set(tx + 7, 4, tz + 7); scene.add(pole);
    const head = new THREE.Mesh(new THREE.BoxGeometry(1.6, 4.5, 1.6),
      new THREE.MeshStandardMaterial({ color: 0x111111 }));
    head.position.set(tx + 7, 8.5, tz + 7); scene.add(head);
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.55, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0x37d67a }));
    lamp.position.set(tx + 7, 9.6, tz + 7.8); scene.add(lamp);
    city.trafficLights.push(lamp);
  }

  // Causeway bridge over the southern water.
  box(scene, 340, 2, 16, 0, 1.5, 330, 0x4a4a55);
  for (let i = 0; i < 9; i++) {
    const pylon = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 12, 6),
      new THREE.MeshStandardMaterial({ color: 0x888888 }));
    pylon.position.set(-150 + i * 38, -4, 330);
    scene.add(pylon);
  }

  // Checkpoint gates for the Night Causeway race.
  for (let i = 0; i < 11; i++) {
    const gate = new THREE.Group();
    const mat = new THREE.MeshBasicMaterial({ color: i < 9 ? 0x37d67a : 0xffd23f, transparent: true, opacity: 0.85 });
    const left = new THREE.Mesh(new THREE.BoxGeometry(0.8, 9, 0.8), mat); left.position.set(-7, 4.5, 0);
    const right = left.clone(); right.position.x = 7;
    const top = new THREE.Mesh(new THREE.BoxGeometry(15, 1, 1), mat); top.position.y = 9;
    gate.add(left, right, top);
    gate.position.set(-120 + i * 24, 0, 330);
    gate.visible = false;
    scene.add(gate);
    city.gates.push(gate);
  }

  // Pickups on the road: health (+) and ammo.
  const pickupDefs = [
    { kind: 'health', x: 190, z: -20, color: 0x37d67a, label: '+' },
    { kind: 'ammo', x: 205, z: -60, color: 0xffd23f, label: 'A' },
    { kind: 'health', x: -170, z: 120, color: 0x37d67a, label: '+' },
    { kind: 'ammo', x: -150, z: 180, color: 0xffd23f, label: 'A' },
  ];
  for (const p of pickupDefs) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.4, 2.4),
      new THREE.MeshStandardMaterial({ color: p.color, emissive: p.color, emissiveIntensity: 0.7 }));
    m.position.set(p.x, 1.6, p.z);
    m.rotation.y = Math.PI / 4;
    scene.add(m);
    city.pickups.push({ mesh: m, kind: p.kind, x: p.x, z: p.z, taken: false });
  }

  // Amber Shells collectibles, glowing on the beach and pier.
  city.shells = [];
  for (let i = 0; i < 20; i++) {
    const s = new THREE.Mesh(new THREE.SphereGeometry(0.9, 8, 8),
      new THREE.MeshStandardMaterial({ color: 0xffb37a, emissive: 0xff9a3d, emissiveIntensity: 1 }));
    s.position.set(-300 + range(rng, -8, 8), 1, -280 + i * 28);
    scene.add(s);
    city.shells.push(s);
  }
  return city;
}
