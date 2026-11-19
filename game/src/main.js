// EMBER TIDE — main: the game. Boots every system, runs the loop, and owns
// the state machine (start → playing → paused → busted / wasted). Dante
// drives, walks, steals, fights and runs five jobs across Port Vela; the
// police, the traffic, the missions and the HUD all hang off this one loop.

import * as THREE from '../vendor/three.module.min.js';
import { SEED, CAR_MODELS, ECONOMY, SHOPS, MISSIONS } from './config.js';
import { Render } from './render.js';
import { Input } from './input.js';
import { buildCity } from './city.js';
import { Player } from './player.js';
import { Car, nearestCar, makeRngForCars } from './vehicles.js';
import { Traffic } from './traffic.js';
import { PoliceChase } from './police.js';
import { Missions } from './missions.js';
import { Combat } from './combat.js';
import { Hud } from './hud.js';
import { Audio } from './audio.js';
import { loadSave, storeSave, clearSave } from './save.js';
import { applyShot, SHOT_NAMES } from './shots.js';
import { groundHeight, districtAt, buildRoadGraph, nearestNode } from './world.js';
import { makeRng } from './random.js';

export class Game {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.render = new Render(this.canvas);
    this.input = new Input(this.canvas);
    this.audio = new Audio();
    this.hud = new Hud(this);
    this.now = 0;
    this.state = 'start';
    this.night = false;
    this.shotMode = false;
    this.fixedCamera = null;
    this.scoreLine = '+ $150 DRIFT x3 · NEAR MISS +$250';
    this.promptText = '';
    this.raceCheckpoint = 0;
    this.garageCars = 1; this.taxiFares = 1; this.racesWon = 1;
    this._lastSaveAt = 0;
    this._sirenTimer = 0;
    this._driftTime = 0; this._nearMissCd = 0;
    this._toastTimer = 0;

    // The world.
    this.city = buildCity(this.render.scene, SEED);
    this.render.place(120, 95, -260, -20, 6, 140);
    this.graph = buildRoadGraph();
    this.player = new Player(this.render.scene);
    this.player.place(0, 0, Math.PI);
    this.traffic = new Traffic(this.render.scene, makeRng(SEED + 31));
    this.traffic.spawnCars(14);
    this.traffic.spawnPeds(18);
    this.police = new PoliceChase(this.render.scene, this.graph, SEED);
    this.missions = new Missions(this.render.scene);
    this.combat = new Combat(this.render.scene);
    this.rng = makeRng(SEED + 5);
    this._carRng = makeRngForCars(SEED);

    // The player's Solstice GT, parked outside Selma's Garage.
    this.playerCar = new Car(this.render.scene, CAR_MODELS[0], -120, 70, Math.PI / 2);
    // Parked cars Dante can steal, scattered on the roads.
    this.parkedCars = [];
    this._spawnParkedCars();
    // Race gates for the Night Causeway mission.
    this._gates = this.city.gates;

    // Load a save, if there is one.
    const save = loadSave();
    if (save) {
      this.player.cash = save.cash;
      this.player.rep = save.rep;
      this.missions.completed = save.completed;
      this.missions.unlocked = save.unlocked;
      this.player.shells = save.shells ?? 4;
      this.garageCars = save.garageCars ?? 1;
      this.taxiFares = save.taxiFares ?? 0;
      this.racesWon = save.racesWon ?? 0;
      this.audio.setMuted(save.muted);
      document.getElementById('save-line').textContent =
        `SAVE FOUND · ${save.completed}/8 MISSIONS · $${save.cash} · REP ${save.rep}`;
    }
    this._hasSave = !!save;

    // Start-screen buttons.
    document.getElementById('btn-new').addEventListener('click', () => this._startNew());
    document.getElementById('btn-continue').addEventListener('click', () => this._startContinue());
    document.getElementById('map-screen').addEventListener('click', () => this._togglePause(false));
    document.getElementById('garage-screen').addEventListener('click', () => this._togglePause(false));

    // A ?shot= URL stages one of the four screenshot scenes deterministically.
    const params = new URLSearchParams(window.location.search);
    const shot = params.get('shot');
    if (shot && SHOT_NAMES.includes(shot)) {
      applyShot(this, shot);
    } else {
      this.hud.render();
      this.render.draw();
    }
    window.__game = this;
    window.game = this;
    this._last = performance.now();
    const loop = (t) => { this._tick(t); requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
  }

  _spawnParkedCars() {
    const spots = [[-68, 140, 0], [68, -68, Math.PI / 2], [-204, 68, Math.PI], [204, 150, -Math.PI / 2]];
    for (let i = 0; i < spots.length; i++) {
      const [x, z, h] = spots[i];
      const car = new Car(this.render.scene, CAR_MODELS[1 + (i % 4)], x, z, h);
      this.parkedCars.push(car);
    }
  }

  _startNew() {
    clearSave();
    document.getElementById('start-screen').classList.add('hidden');
    this.state = 'playing';
    this.missions.startMission(1);
    this.player.place(-120, 75, Math.PI / 2);
    this.audio.ensure(); this.audio.startMusic();
  }

  _startContinue() {
    document.getElementById('start-screen').classList.add('hidden');
    this.state = 'playing';
    this.missions.setMission(Math.min(8, this.missions.unlocked));
    this.audio.ensure(); this.audio.startMusic();
  }

  _togglePause(on) {
    // on === true forces pause, on === false forces resume, no argument
    // toggles. M / P call it with no argument; the map overlay click
    // passes false.
    if (on === true && this.state !== 'playing') return;
    if (on === false && this.state !== 'paused') return;
    if (this.state === 'playing') {
      this.state = 'paused';
      document.getElementById('map-screen').classList.remove('hidden');
      storeSave(this);
    } else if (this.state === 'paused') {
      this.state = 'playing';
      document.getElementById('map-screen').classList.add('hidden');
      document.getElementById('garage-screen').classList.add('hidden');
    }
    this.hud.render();
  }

  showGarage() {
    if (this.state !== 'playing') return;
    this.state = 'paused';
    document.getElementById('map-screen').classList.add('hidden');
    document.getElementById('garage-screen').classList.remove('hidden');
    document.getElementById('garage-cash').textContent = `$${this.player.cash.toLocaleString('en-US')}`;
    storeSave(this);
    this.hud.render();
  }

  setNight(night) {
    this.night = night;
    this.render.setNight(night);
    // At night the race gates glow for the causeway run.
    for (const g of this._gates) g.visible = (night && this.missions.current === 5) || this.missions.current === 7;
  }

  showToast(text) {
    const t = document.getElementById('toast');
    t.textContent = text;
    t.style.display = 'block';
    this._toastTimer = 2.4;
  }

  _tick(t) {
    const dt = Math.min(0.05, Math.max(0.001, (t - this._last) / 1000));
    this._last = t;
    this.now += dt;
    if (this._toastTimer > 0) {
      this._toastTimer -= dt;
      if (this._toastTimer <= 0) document.getElementById('toast').style.display = 'none';
    }
    // Pause / map lives here, not in _update: _update does not run while
    // paused, so a key listened for only there could never resume the game.
    if ((this.input.hit('KeyM') || this.input.hit('KeyP')) && this.state !== 'start') {
      this._togglePause();
    }
    if (this.state === 'playing' && !this.shotMode) this._update(dt);
    else if (this.state === 'paused') this.hud.render();
    else if (this.shotMode) this.hud.render();
    // Camera.
    if (this.fixedCamera && this.shotMode) {
      const c = this.fixedCamera;
      this.render.place(c.pos[0], c.pos[1], c.pos[2], c.look[0], c.look[1], c.look[2]);
    } else if (this.state !== 'start') {
      const p = this.player;
      if (p.car) this.render.follow(p.x, 0, p.z, p.heading, 15, 6.5, 14);
      else this.render.follow(p.x, 0, p.z, p.heading, 8, 4.5, 10);
    }
    // Ferris wheel turns slowly; crane hook sways.
    if (this.city.ferrisWheel) this.city.ferrisWheel.rotation.z += dt * 0.12;
    this.render.draw();
    this.input.endFrame();
  }

  _update(dt) {
    const p = this.player;
    const inp = this.input;
    const axis = inp.axis();

    // Radio.
    if (inp.hit('KeyR')) { this.audio.musicOn ? this.audio.stopMusic() : this.audio.startMusic(); }
    // Weapons.
    for (let i = 1; i <= 5; i++) if (inp.hit(`Digit${i}`)) p.weapon = i;
    // Crew abilities.
    if (inp.hit('KeyZ')) { this.police.trace = Math.max(0, this.police.trace - 40); this.showToast('PILAR — CAMERAS HACKED · TRACE DOWN'); }
    if (inp.hit('KeyX')) { this.showToast('BRAM — RAM BOOST READY'); }
    if (inp.hit('KeyV')) { this.showToast('ODETTE — PATROLS MARKED ON MAP'); }

    // Driving vs on foot.
    if (p.car) {
      const nitro = inp.down('ShiftLeft') || inp.down('ShiftRight');
      p.driveCar(axis.f, -axis.s, dt, nitro);
      const handbrake = inp.down('Space');
      if (handbrake) p.car.speed *= Math.max(0, 1 - 3 * dt);
      // Drift scoring: hard steering at speed.
      if (Math.abs(axis.s) > 0 && Math.abs(p.car.speed) > 20) {
        this._driftTime += dt;
        if (this._driftTime > 2) {
          this._driftTime = 0;
          p.cash += ECONOMY.drift;
          this.scoreLine = `+ $${ECONOMY.drift} DRIFT x3 · NEAR MISS +$${ECONOMY.nearMiss}`;
        }
      } else this._driftTime = 0;
      // Near miss.
      this._nearMissCd -= dt;
      for (const c of this.traffic.cars) {
        const d = Math.hypot(c.x - p.x, c.z - p.z);
        if (d < 4.5 && Math.abs(p.car.speed) > 15 && this._nearMissCd <= 0) {
          this._nearMissCd = 4;
          p.cash += ECONOMY.nearMiss;
          this.scoreLine = `NEAR MISS +$${ECONOMY.nearMiss} · + $${ECONOMY.drift} DRIFT x3`;
        }
      }
      if (inp.hit('KeyE')) p.exitCar();
      // Respray: clear wanted for $250 at Spray Palace.
      const spray = SHOPS[2];
      if (Math.hypot(p.x - spray.x, p.z - spray.z) < 12 && this.police.wanted > 0) {
        this.promptText = '[E] SPRAY PALACE — RESPRAY $250 · CLEAR WANTED';
        if (inp.hit('KeyF') && p.cash >= ECONOMY.respray) {
          p.cash -= ECONOMY.respray;
          this.police.setWanted(0, p.x, p.z);
          this.showToast('RESPRAYED · WANTED CLEARED · -$250');
        }
      }
    } else {
      p.walk(axis.f, axis.s, dt, inp.down('ShiftLeft') || inp.down('ShiftRight'));
      if (inp.hit('KeyE')) {
        const car = p.tryEnterCar([...this.parkedCars, this.playerCar]);
        if (car) {
          if (car !== this.playerCar) {
            p.carsStolen += 1;
            this.showToast(`${car.model.name} STOLEN`);
            this.police.setWanted(Math.max(this.police.wanted, 1), p.x, p.z);
          }
          this.audio.playPickup();
        }
      }
      // Gun shop: buy ammo.
      const gun = SHOPS[1];
      if (Math.hypot(p.x - gun.x, p.z - gun.z) < 12) {
        this.promptText = '[E] BAYSIDE ARMS — BUY AMMO $600';
        if (inp.hit('KeyF') && p.cash >= ECONOMY.gun) {
          p.cash -= ECONOMY.gun;
          p.reserve[2] += 60; p.reserve[3] += 160;
          this.showToast('AMMO RESTOCKED · -$600');
        }
      }
      // Selma's Garage: tuning screen.
      const garage = SHOPS[0];
      if (Math.hypot(p.x - garage.x, p.z - garage.z) < 14) {
        this.promptText = '[F] SELMA\u2019S GARAGE \u2014 TUNING & REPAIRS';
        if (inp.hit('KeyF')) this.showGarage();
      }
      // Taxi fare.
      const taxi = SHOPS[5];
      if (Math.hypot(p.x - taxi.x, p.z - taxi.z) < 10) {
        this.promptText = '[E] TAXI STAND — TAKE A FARE $120';
        if (inp.hit('KeyF')) { p.cash += ECONOMY.taxiFare; this.taxiFares += 1; this.showToast(`TAXI FARE DONE · +$${ECONOMY.taxiFare}`); }
      }
      // Shooting.
      if (inp.mouseDown && p.weapon > 1) {
        const shot = this.combat.fire(p.x, p.z, p.heading, p.weapon, p);
        if (shot) {
          this.audio.playShot();
          if (this.police.wanted < 2) this.police.setWanted(2, p.x, p.z);
        }
      }
    }

    // Pickups.
    for (const pk of this.city.pickups) {
      if (pk.taken) continue;
      if (Math.hypot(p.x - pk.x, p.z - pk.z) < 3.5) {
        pk.taken = true; pk.mesh.visible = false;
        if (pk.kind === 'health') { p.heal(30); this.showToast('HEALTH +30'); }
        else { p.addAmmo(p.weapon > 1 ? p.weapon : 2, 24); this.showToast('AMMO +24'); }
        this.audio.playPickup();
      }
    }
    // Amber Shells.
    for (const s of this.city.shells) {
      if (!s.visible) continue;
      if (Math.hypot(p.x - s.position.x, p.z - s.position.z) < 2.5) {
        s.visible = false;
        p.shells += 1; p.rep += 40;
        this.showToast(`AMBER SHELL ${p.shells}/20 · +40 REP`);
      }
    }
    // Race gates (mission 5).
    if (this.missions.current === 5 || this.missions.current === 7) {
      for (const g of this._gates) g.visible = true;
      const gate = this._gates[this.raceCheckpoint];
      if (gate && Math.hypot(p.x - gate.position.x, p.z - gate.position.z) < 10) {
        this.raceCheckpoint += 1;
        this.showToast(`CHECKPOINT ${this.raceCheckpoint}/11`);
        this.audio.playPickup();
      }
    } else {
      for (const g of this._gates) g.visible = false;
    }

    // Systems.
    this.traffic.update(dt, p.x, p.z);
    this.combat.update(dt, p.x, p.z, this);
    const hidden = this.missions.current === 3 && this.police.trace < 30;
    this.police.update(dt, p.x, p.z, p.heading, p.car ? p.car.speed : 0, hidden);
    this.missions.update(dt, p.x, p.z, this);
    if (this.police.wanted >= 1) {
      this._sirenTimer -= dt;
      if (this._sirenTimer <= 0) { this._sirenTimer = 3.2; this.audio.playSiren(); }
    }
    // Busted / wasted.
    if (p.health <= 0) {
      this.state = 'start';
      document.getElementById('start-screen').classList.remove('hidden');
      document.getElementById('save-line').textContent = 'WASTED · THE TIDE TAKES YOU — START AGAIN';
      p.health = 82; p.armour = 0; p.cash = Math.max(0, p.cash - 400);
    }
    // Autosave every 20 s.
    if (this.now - this._lastSaveAt > 20) { this._lastSaveAt = this.now; storeSave(this); }

    // Prompt line.
    const promptEl = document.getElementById('prompt');
    if (this.promptText) {
      promptEl.textContent = this.promptText;
      promptEl.style.display = 'block';
      this.promptText = '';
    } else promptEl.style.display = 'none';
    this.hud.render();
  }
}

new Game();
