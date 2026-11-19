// EMBER TIDE — player: Dante Vane on foot and behind the wheel. Walking,
// entering and stealing cars, nitro, stamina and the handbrake live here.

import * as THREE from '../vendor/three.module.min.js';
import { CAR_MODELS } from './config.js';
import { nearestCar } from './vehicles.js';
import { clampToCity } from './world.js';

export class Player {
  constructor(scene) {
    this.scene = scene;
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.45, 1.1, 3, 8),
      new THREE.MeshStandardMaterial({ color: 0x8a2a2a }));
    body.position.y = 1.1; g.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.32, 8, 8),
      new THREE.MeshStandardMaterial({ color: 0xe8b88a }));
    head.position.y = 2.15; g.add(head);
    const jacket = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.5, 0.55),
      new THREE.MeshStandardMaterial({ color: 0x2a1a3a }));
    jacket.position.y = 1.5; g.add(jacket);
    this.mesh = g;
    this.mesh.position.set(0, 0, 0);
    scene.add(this.mesh);
    this.x = 0; this.z = 0; this.heading = 0;
    this.speed = 0; this.stamina = 100;
    this.car = null; this.onFoot = true;
    this.health = 82; this.armour = 64;
    this.weapon = 2; this.ammo = { 2: 12, 3: 32 };
    this.reserve = { 2: 60, 3: 160 };
    this.cash = 4820; this.rep = 1240;
    this.shells = 4; this.carsStolen = 1; this.takedowns = 2;
  }

  place(x, z, heading) {
    this.x = x; this.z = z; this.heading = heading;
    this.mesh.position.set(x, 0, z);
    this.mesh.rotation.y = heading;
  }

  walk(f, s, dt, sprint) {
    const sp = sprint && this.stamina > 0 ? 9 : 5;
    if (sprint && (f || s)) this.stamina = Math.max(0, this.stamina - 12 * dt);
    else this.stamina = Math.min(100, this.stamina + 8 * dt);
    const moveHeading = this.heading + (s ? s * Math.PI / 2 : 0);
    if (f) {
      this.x += Math.sin(moveHeading) * sp * dt * f;
      this.z += Math.cos(moveHeading) * sp * dt * f;
    } else if (s) {
      this.x += Math.sin(moveHeading) * sp * dt;
      this.z += Math.cos(moveHeading) * sp * dt;
    }
    const c = clampToCity(this.x, this.z);
    this.x = c.x; this.z = c.z;
    this.mesh.position.set(this.x, 0, this.z);
    this.mesh.rotation.y = this.heading;
    this.mesh.position.y = (f || s) ? Math.abs(Math.sin(performance.now() / 140)) * 0.12 : 0;
  }

  tryEnterCar(cars) {
    const car = nearestCar(cars, this.x, this.z, 7);
    if (!car) return null;
    this.car = car; this.onFoot = false;
    this.mesh.visible = false;
    return car;
  }

  exitCar() {
    if (!this.car) return;
    const c = this.car;
    this.x = c.x - Math.sin(c.heading) * 3;
    this.z = c.z - Math.cos(c.heading) * 3;
    this.heading = c.heading;
    this.car = null; this.onFoot = true;
    this.mesh.visible = true;
    this.place(this.x, this.z, this.heading);
  }

  driveCar(throttle, steer, dt, nitro) {
    if (!this.car) return;
    this.car.drive(throttle, steer, dt, nitro && this.car.nitro > 0);
    this.x = this.car.x; this.z = this.car.z; this.heading = this.car.heading;
  }

  takeDamage(n) {
    const absorbed = Math.min(this.armour, n);
    this.armour -= absorbed;
    this.health -= (n - absorbed);
    if (this.health < 0) this.health = 0;
  }

  heal(n) { this.health = Math.min(100, this.health + n); }
  addAmmo(slot, n) { this.reserve[slot] = (this.reserve[slot] || 0) + n; }
}
