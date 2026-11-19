// EMBER TIDE — missions: five story jobs across Port Vela. Each mission
// has an objective, a counter, a timer and a dialogue line; startMission
// stages it, update advances it, and completing one pays out and unlocks
// the next.

import * as THREE from '../vendor/three.module.min.js';
import { MISSIONS, ECONOMY } from './config.js';

export class Missions {
  constructor(scene) {
    this.scene = scene;
    this.current = 3; // Tidegate Chase is the live mission in the cover
    this.completed = 2;
    this.unlocked = 3;
    this.timer = MISSIONS[2].timer;
    this.objective = MISSIONS[2].obj;
    this.counter = MISSIONS[2].counter;
    this.done = false;
    this.marker = null;
    this._buildMarker();
    this.setMission(3);
  }

  _buildMarker() {
    const geo = new THREE.CylinderGeometry(0.4, 0.4, 26, 8);
    const mat = new THREE.MeshBasicMaterial({ color: 0xffd23f, transparent: true, opacity: 0.55 });
    this.marker = new THREE.Mesh(geo, mat);
    this.scene.add(this.marker);
  }

  setMission(n) {
    this.current = n;
    const m = MISSIONS[n - 1];
    this.objective = m.obj;
    this.counter = m.counter;
    this.timer = m.timer;
    this.done = false;
    this.marker.position.set(m.x, 13, m.z);
    return m;
  }

  startMission(n) {
    const m = this.setMission(n);
    return m;
  }

  update(dt, playerX, playerZ, game) {
    const m = MISSIONS[this.current - 1];
    if (this.timer > 0) this.timer = Math.max(0, this.timer - dt);
    this.marker.rotation.y += dt * 1.5;
    const d = Math.hypot(playerX - m.x, playerZ - m.z);
    this.distance = Math.round(d);
    // Objective counters follow live state.
    if (this.current === 3) {
      this.counter = `HEAT ${game.police.wanted} STARS`;
      if (game.police.trace <= 0 && game.police.wanted === 0) this.complete(game);
    } else if (this.current === 4) {
      this.counter = `CREW ${game.combat.takedowns}/6`;
      if (game.combat.takedowns >= 6) this.complete(game);
    } else if (this.current === 5 || this.current === 7) {
      this.counter = this.current === 7
        ? `GATES ${game.raceCheckpoint}/11`
        : `CHECKPOINT ${game.raceCheckpoint}/11`;
      if (game.raceCheckpoint >= 11) this.complete(game);
    } else if (this.current === 6) {
      this.counter = `FARES ${game.taxiFares}/3`;
      if (game.taxiFares >= 3) this.complete(game);
    } else if (this.current === 8) {
      this.counter = 'DELIVERY 0/1';
      if (!game.player.onFoot && game.player.car && d < 8) this.complete(game);
    } else if (this.current === 1) {
      if (d < 8) this.complete(game);
    } else if (this.current === 2) {
      if (!game.player.onFoot && game.player.car) this.complete(game);
    }
    if (this.timer === 0 && this.current === 1) this.fail(game);
  }

  complete(game) {
    if (this.done) return;
    this.done = true;
    this.completed = Math.max(this.completed, this.current);
    this.unlocked = Math.min(8, this.current + 1);
    game.player.cash += ECONOMY.missionPay;
    game.player.rep += 260;
    game.showToast(`MISSION PASSED · ${MISSIONS[this.current - 1].title} · +$${ECONOMY.missionPay}`);
    game.audio.playSting();
  }

  fail(game) {
    game.showToast('MISSION FAILED · TIME UP');
    this.timer = MISSIONS[this.current - 1].timer;
  }

  nextMission() {
    return MISSIONS[Math.min(7, this.current) - 1 + (this.current < 8 ? 1 : 0)];
  }
}
