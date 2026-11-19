// EMBER TIDE — police: the Vela PD response. Wanted stars, named cruiser
// units with distances and statuses, the AIR-2 helicopter with its
// searchlight, and the line-of-sight TRACE meter the player must cool down.

import * as THREE from '../vendor/three.module.min.js';
import { CAR_MODELS, POLICE_UNITS } from './config.js';
import { makeRng } from './random.js';
import { Car } from './vehicles.js';

export class PoliceChase {
  constructor(scene, graph, seed) {
    this.scene = scene;
    this.rng = makeRng(seed + 55);
    this.wanted = 0;
    this.trace = 0; // 0–100: how hot the line of sight is
    this.inSight = false;
    this.units = [];
    this.cruisers = [];
    this.heli = null; this.heliLight = null; this.heliAngle = 0;
    this.sirenPhase = 0;
    this._buildHelicopter();
  }

  _buildHelicopter() {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.6, 6),
      new THREE.MeshStandardMaterial({ color: 0x1a2a44, roughness: 0.4, metalness: 0.5 }));
    g.add(body);
    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 5),
      new THREE.MeshStandardMaterial({ color: 0x1a2a44 }));
    tail.position.set(0, 0.4, -5); g.add(tail);
    const rotor = new THREE.Mesh(new THREE.BoxGeometry(11, 0.15, 0.8),
      new THREE.MeshStandardMaterial({ color: 0x222222 }));
    rotor.position.y = 1.2; g.add(rotor);
    g.userData.rotor = rotor;
    const cone = new THREE.Mesh(new THREE.ConeGeometry(7, 46, 16, 1, true),
      new THREE.MeshBasicMaterial({ color: 0xfff2b0, transparent: true, opacity: 0.16, side: THREE.DoubleSide, depthWrite: false }));
    cone.position.y = -24; cone.rotation.x = Math.PI; g.add(cone);
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xfff2b0 }));
    lamp.position.y = -1.2; g.add(lamp);
    // Navigation lights so the helicopter reads at night.
    const navL = new THREE.Mesh(new THREE.SphereGeometry(0.35, 6, 6),
      new THREE.MeshBasicMaterial({ color: 0xff2233 }));
    navL.position.set(-1.7, 0.3, 2); g.add(navL);
    const navR = new THREE.Mesh(new THREE.SphereGeometry(0.35, 6, 6),
      new THREE.MeshBasicMaterial({ color: 0x37ff7a }));
    navR.position.set(1.7, 0.3, 2); g.add(navR);
    const belly = new THREE.Mesh(new THREE.SphereGeometry(0.6, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xffffff }));
    belly.position.set(0, -0.9, 3); g.add(belly);
    g.position.set(0, 55, 0);
    g.visible = false;
    this.scene.add(g);
    this.heli = g;
    this.heliLight = new THREE.SpotLight(0xfff2b0, 60, 90, 0.35, 0.5);
    this.heliLight.position.set(0, 55, 0);
    this.scene.add(this.heliLight);
    this.heliLight.target = new THREE.Object3D();
    this.scene.add(this.heliLight.target);
  }

  placeHelicopter(x, z) {
    this.heli.position.set(x, 48, z);
    this.heliLight.position.set(x, 48, z);
    this.heliLight.target.position.set(x, 0, z);
  }

  setWanted(n, playerX, playerZ) {
    this.wanted = Math.max(0, Math.min(5, n));
    const wantCruisers = this.wanted >= 1 ? Math.min(3, this.wanted) : 0;
    while (this.cruisers.length < wantCruisers) {
      const model = CAR_MODELS[0];
      const i = this.cruisers.length;
      const car = new Car(this.scene, model, playerX + 14 + i * 8, playerZ - 18 - i * 6, 0, true);
      this.cruisers.push(car);
    }
    while (this.cruisers.length > wantCruisers) {
      const c = this.cruisers.pop();
      this.scene.remove(c.mesh);
    }
    this.heli.visible = this.wanted >= 3;
    this.heliLight.visible = this.wanted >= 3;
    this.units = POLICE_UNITS.slice(0, wantCruisers + (this.wanted >= 3 ? 1 : 0)).map((u, i) => ({
      id: u.id, role: u.role, dist: 5 + i * 4 + Math.floor(this.rng() * 8),
    }));
  }

  update(dt, playerX, playerZ, playerHeading, playerSpeed, hidden) {
    this.sirenPhase += dt * 6;
    // Line of sight: the VPD sees the player unless they are hidden behind
    // cover (mission logic) or far from every unit.
    let nearest = Infinity;
    for (const c of this.cruisers) nearest = Math.min(nearest, Math.hypot(c.x - playerX, c.z - playerZ));
    this.inSight = this.wanted > 0 && !hidden && nearest < 90;
    this.trace += (this.inSight ? 14 : -22) * dt;
    this.trace = Math.max(0, Math.min(100, this.trace));
    if (this.trace <= 0 && this.wanted > 0 && !this.inSight) this.wanted = Math.max(0, this.wanted - 1);

    for (let i = 0; i < this.cruisers.length; i++) {
      const c = this.cruisers[i];
      const dx = playerX - c.x; const dz = playerZ - c.z;
      const d = Math.hypot(dx, dz) || 1;
      const wantHeading = Math.atan2(dx, dz);
      let dh = wantHeading - c.heading;
      while (dh > Math.PI) dh -= Math.PI * 2;
      while (dh < -Math.PI) dh += Math.PI * 2;
      c.heading += Math.max(-1.6 * dt, Math.min(1.6 * dt, dh));
      const target = Math.min(40, 12 + Math.abs(playerSpeed) * 1.1);
      c.speed += (target - c.speed) * Math.min(1, dt);
      // Keep a chase gap: don't ram through the player, hover a few metres back.
      if (d < 7) c.speed = Math.min(c.speed, Math.max(0, playerSpeed));
      c.x += Math.sin(c.heading) * c.speed * dt;
      c.z += Math.cos(c.heading) * c.speed * dt;
      c.mesh.position.set(c.x, 0, c.z);
      c.mesh.rotation.y = c.heading;
      if (c.mesh.userData.lightBar) {
        c.mesh.userData.lightBar.material.emissive.setHex(Math.sin(this.sirenPhase + i * 2) > 0 ? 0xff2233 : 0x2244ff);
      }
      if (this.units[i]) this.units[i].dist = Math.max(3, Math.round(d));
    }
    if (this.heli.visible) {
      this.heliAngle += dt * 0.25;
      const hx = playerX + Math.cos(this.heliAngle) * 26;
      const hz = playerZ + Math.sin(this.heliAngle) * 26;
      this.heli.position.set(hx, 52 + Math.sin(this.heliAngle * 2) * 2, hz);
      this.heli.rotation.y = Math.atan2(playerX - hx, playerZ - hz);
      this.heli.userData.rotor.rotation.y += dt * 22;
      this.heliLight.position.set(hx, 52, hz);
      this.heliLight.target.position.set(playerX, 0, playerZ);
      if (this.units[this.units.length - 1]) this.units[this.units.length - 1].dist = 76;
    }
  }
}
