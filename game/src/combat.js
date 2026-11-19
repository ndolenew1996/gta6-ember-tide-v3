// EMBER TIDE — combat: shooting, Kessler's crew, drive-by fire, pickups
// and the ammo/health economy. Thugs are named characters with health bars.

import * as THREE from '../vendor/three.module.min.js';
import { makeRng, range } from './random.js';

const THUG_NAMES = ['VICO', 'MARLOWE', 'SABLE', 'DARIO', 'KETTLE', 'ROOK'];

export class Combat {
  constructor(scene) {
    this.scene = scene;
    this.thugs = [];
    this.takedowns = 2;
    this.shots = [];
    this._spawnThugs();
  }

  _spawnThugs() {
    const rng = makeRng(4242);
    for (let i = 0; i < 6; i++) {
      const g = new THREE.Group();
      const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.45, 1.1, 3, 8),
        new THREE.MeshStandardMaterial({ color: 0x2a2a2a }));
      body.position.y = 1.1; g.add(body);
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.32, 8, 8),
        new THREE.MeshStandardMaterial({ color: 0xc89878 }));
      head.position.y = 2.15; g.add(head);
      const vest = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.5, 0.5),
        new THREE.MeshStandardMaterial({ color: 0x8a1a1a, emissive: 0x8a1a1a, emissiveIntensity: 0.5 }));
      vest.position.y = 1.5; g.add(vest);
      // Red marker above the head: the crew reads as silhouettes at night.
      const marker = new THREE.Mesh(new THREE.OctahedronGeometry(0.35),
        new THREE.MeshBasicMaterial({ color: 0xff2233 }));
      marker.position.y = 2.9; g.add(marker);
      g.userData.marker = marker;
      g.position.set(185 + range(rng, -25, 25), 0, -40 + range(rng, -30, 30));
      this.scene.add(g);
      this.thugs.push({ mesh: g, name: THUG_NAMES[i], hp: 100, alive: i >= 2, x: g.position.x, z: g.position.z });
      if (i < 2) g.visible = false; // two already taken down in the staged shot
    }
  }

  fire(fromX, fromZ, heading, weapon, player) {
    if (weapon === 1) return null; // fists: no ranged shot
    const slot = player.ammo[weapon];
    if (slot === undefined || slot <= 0) return null;
    player.ammo[weapon] -= 1;
    const geo = new THREE.SphereGeometry(0.12, 6, 6);
    const mat = new THREE.MeshBasicMaterial({ color: 0xffe9a8 });
    const tracer = new THREE.Mesh(geo, mat);
    tracer.position.set(fromX, 1.4, fromZ);
    this.scene.add(tracer);
    const shot = { mesh: tracer, x: fromX, z: fromZ, heading, life: 0.4, dmg: weapon === 3 ? 34 : 25 };
    this.shots.push(shot);
    return shot;
  }

  update(dt, playerX, playerZ, game) {
    for (const s of this.shots) {
      s.x += Math.sin(s.heading) * 90 * dt;
      s.z += Math.cos(s.heading) * 90 * dt;
      s.mesh.position.set(s.x, 1.4, s.z);
      s.life -= dt;
      for (const t of this.thugs) {
        if (!t.alive) continue;
        if (Math.hypot(t.x - s.x, t.z - s.z) < 1.6) {
          t.hp -= s.dmg;
          s.life = 0;
          if (t.hp <= 0) {
            t.alive = false; t.mesh.visible = false;
            this.takedowns += 1;
            game.player.cash += 120;
            game.showToast(`${t.name} DOWN · +$120`);
          }
        }
      }
      if (s.life <= 0) { this.scene.remove(s.mesh); }
    }
    this.shots = this.shots.filter((s) => s.life > 0);
    // Thugs advance on the player when close.
    for (const t of this.thugs) {
      if (!t.alive) continue;
      const d = Math.hypot(playerX - t.x, playerZ - t.z);
      if (d < 40 && d > 3) {
        const h = Math.atan2(playerX - t.x, playerZ - t.z);
        t.x += Math.sin(h) * 2.2 * dt;
        t.z += Math.cos(h) * 2.2 * dt;
        t.mesh.position.set(t.x, 0, t.z);
        t.mesh.rotation.y = h;
      }
      if (d < 12 && Math.random() < dt * 0.3) game.player.takeDamage(4);
    }
  }
}
