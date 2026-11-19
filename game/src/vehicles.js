// EMBER TIDE — vehicles: car meshes and car physics. One builder makes the
// player car, traffic cars and police cruisers; only paint and lights differ.

import * as THREE from '../vendor/three.module.min.js';
import { CAR_MODELS } from './config.js';
import { makeRng, pick, range } from './random.js';

export function makeRngForCars(seed) { return makeRng(seed + 77); }
export function randomPaint(rng) { return pick(rng, CAR_MODELS).color; }

export function buildCarMesh(model, isPolice) {
  const g = new THREE.Group();
  const paint = new THREE.MeshStandardMaterial({ color: isPolice ? 0x1a2a44 : model.color, roughness: 0.3, metalness: 0.6 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.8, 4.6), paint);
  body.position.y = 0.75; g.add(body);
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.7, 2.4),
    new THREE.MeshStandardMaterial({ color: 0x101826, roughness: 0.15, metalness: 0.8 }));
  cabin.position.set(0, 1.45, -0.3); g.add(cabin);
  const wheelGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.35, 10);
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
  const wheels = [];
  for (const [wx, wz] of [[-1.05, 1.5], [1.05, 1.5], [-1.05, -1.5], [1.05, -1.5]]) {
    const w = new THREE.Mesh(wheelGeo, wheelMat);
    w.rotation.z = Math.PI / 2;
    w.position.set(wx, 0.42, wz);
    g.add(w); wheels.push(w);
  }
  if (isPolice) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.25, 0.5),
      new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xff2233, emissiveIntensity: 1.5 }));
    bar.position.set(0, 1.95, -0.3); g.add(bar);
    g.userData.lightBar = bar;
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.24, 0.3, 4.62),
      new THREE.MeshBasicMaterial({ color: 0xffffff }));
    stripe.position.y = 0.9; g.add(stripe);
  }
  const head = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.25, 0.2),
    new THREE.MeshBasicMaterial({ color: 0xfff2b0 }));
  head.position.set(0, 0.8, 2.32); g.add(head);
  g.userData.wheels = wheels;
  return g;
}

export class Car {
  constructor(scene, model, x, z, heading, isPolice = false) {
    this.model = model;
    this.mesh = buildCarMesh(model, isPolice);
    this.mesh.position.set(x, 0, z);
    this.mesh.rotation.y = heading;
    scene.add(this.mesh);
    this.x = x; this.z = z; this.heading = heading;
    this.speed = 0; this.isPolice = isPolice;
    this.hp = 100; this.nitro = 100;
    this.wheelSpin = 0;
  }

  drive(throttle, steer, dt, nitroBoost) {
    const top = this.model.top * (nitroBoost ? 1.45 : 1);
    this.speed += throttle * this.model.accel * dt;
    if (throttle === 0) this.speed *= Math.max(0, 1 - 1.4 * dt);
    if (throttle < 0) this.speed = Math.max(this.speed, -10);
    this.speed = Math.max(-10, Math.min(top, this.speed));
    this.heading += steer * dt * (0.9 + Math.abs(this.speed) / 30) * (this.speed >= 0 ? 1 : -1);
    this.x += Math.sin(this.heading) * this.speed * dt;
    this.z += Math.cos(this.heading) * this.speed * dt;
    this.mesh.position.set(this.x, 0, this.z);
    this.mesh.rotation.y = this.heading;
    this.wheelSpin += this.speed * dt * 2;
    for (const w of this.mesh.userData.wheels) w.rotation.x = this.wheelSpin;
    if (nitroBoost) this.nitro = Math.max(0, this.nitro - 30 * dt);
    else this.nitro = Math.min(100, this.nitro + 4 * dt);
  }

  place(x, z, heading, speed = 0) {
    this.x = x; this.z = z; this.heading = heading; this.speed = speed;
    this.mesh.position.set(x, 0, z);
    this.mesh.rotation.y = heading;
  }
}

export function nearestCar(cars, x, z, maxDist) {
  let best = null; let bestD = maxDist * maxDist;
  for (const c of cars) {
    const d = (c.x - x) * (c.x - x) + (c.z - z) * (c.z - z);
    if (d < bestD) { bestD = d; best = c; }
  }
  return best;
}
