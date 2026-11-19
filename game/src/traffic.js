// EMBER TIDE — traffic: ambient cars and pedestrians on the Port Vela road
// grid. They loop the grid, stop at red lights, and swerve from the player.

import * as THREE from '../vendor/three.module.min.js';
import { CAR_MODELS, WORLD } from './config.js';
import { makeRng, pick, range, rangeInt } from './random.js';
import { Car } from './vehicles.js';

export function spawnTraffic(scene, seed) {
  const rng = makeRng(seed + 31);
  const traffic = new Traffic(scene, rng);
  traffic.spawnCars(14);
  traffic.spawnPeds(18);
  return traffic;
}

function pedMesh(color) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.45, 1.1, 3, 8),
    new THREE.MeshStandardMaterial({ color }));
  body.position.y = 1.1; g.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.32, 8, 8),
    new THREE.MeshStandardMaterial({ color: 0xe8b88a }));
  head.position.y = 2.15; g.add(head);
  return g;
}

export class Traffic {
  constructor(scene, rng) {
    this.scene = scene; this.rng = rng;
    this.cars = []; this.peds = [];
    this.lightPhase = 0; // 0 = NS green, 1 = EW green
    this.lightTimer = 0;
  }

  spawnCars(n) {
    for (let i = 0; i < n; i++) {
      const model = pick(this.rng, CAR_MODELS.slice(1));
      const alongX = this.rng() < 0.5;
      const lane = rangeInt(this.rng, -4, 4) * WORLD.roadGap;
      const x = alongX ? range(this.rng, -300, 300) : lane;
      const z = alongX ? lane : range(this.rng, -300, 300);
      const heading = alongX ? (lane > 0 ? Math.PI / 2 : -Math.PI / 2) : (lane > 0 ? Math.PI : 0);
      const car = new Car(this.scene, model, x, z, heading);
      car.speed = range(this.rng, 8, 16);
      car.cruise = car.speed;
      this.cars.push(car);
    }
  }

  spawnPeds(n) {
    const colors = [0xff8a5c, 0x4aa8ff, 0xffd23f, 0x37d67a, 0xff5d8f, 0xffffff];
    for (let i = 0; i < n; i++) {
      const m = pedMesh(pick(this.rng, colors));
      const x = range(this.rng, -280, 280);
      const z = range(this.rng, -280, 280);
      m.position.set(x, 0, z);
      this.scene.add(m);
      this.peds.push({ mesh: m, x, z, heading: range(this.rng, 0, Math.PI * 2), speed: range(this.rng, 1, 2.2), panic: 0 });
    }
  }

  update(dt, playerX, playerZ) {
    this.lightTimer += dt;
    if (this.lightTimer > 9) { this.lightTimer = 0; this.lightPhase = 1 - this.lightPhase; }
    for (const car of this.cars) {
      // Slow near the player, keep cruising otherwise.
      const dx = car.x - playerX; const dz = car.z - playerZ;
      const d2 = dx * dx + dz * dz;
      const target = d2 < 100 ? 4 : car.cruise;
      car.speed += (target - car.speed) * Math.min(1, dt * 1.5);
      car.x += Math.sin(car.heading) * car.speed * dt;
      car.z += Math.cos(car.heading) * car.speed * dt;
      if (car.x > 330) car.x = -330; if (car.x < -330) car.x = 330;
      if (car.z > 330) car.z = -330; if (car.z < -330) car.z = 330;
      car.mesh.position.set(car.x, 0, car.z);
      car.mesh.rotation.y = car.heading;
    }
    for (const p of this.peds) {
      const dx = p.x - playerX; const dz = p.z - playerZ;
      const d2 = dx * dx + dz * dz;
      if (d2 < 36) { p.panic = 1.5; p.heading = Math.atan2(dx, dz); }
      if (p.panic > 0) p.panic -= dt;
      const sp = p.panic > 0 ? 4.5 : p.speed;
      p.x += Math.sin(p.heading) * sp * dt;
      p.z += Math.cos(p.heading) * sp * dt;
      if (Math.abs(p.x) > 320 || Math.abs(p.z) > 320) p.heading += Math.PI;
      p.mesh.position.set(p.x, 0, p.z);
      p.mesh.rotation.y = p.heading;
      p.mesh.position.y = p.panic > 0 ? Math.abs(Math.sin(p.panic * 14)) * 0.25 : 0;
    }
  }
}
