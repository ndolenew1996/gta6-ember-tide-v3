// EMBER TIDE — shots: the four staged scenes behind ?shot=. Each one sets
// the live game to a fixed, deterministic state — sunset chase, on-foot
// dialogue, night combat, garage — and pins the camera, so the same seed
// always gives the same frame. Nothing here is composited: every pixel is
// the live game rendering. In shot mode the game loop freezes gameplay
// (main.js skips _update) so the staged frame never drifts.

import { MISSIONS, CAR_MODELS } from './config.js';
import { Car } from './vehicles.js';

export const SHOT_NAMES = ['cover', 'street', 'night', 'garage'];

function placeNear(game, list, cx, cz, offsets) {
  // Move list items (traffic cars / peds) to fixed offsets around a centre.
  for (let i = 0; i < Math.min(list.length, offsets.length); i++) {
    const it = list[i];
    const [ox, oz, heading] = offsets[i];
    it.x = cx + ox; it.z = cz + oz;
    if (it.mesh) {
      it.mesh.position.set(it.x, 0, it.z);
      if (heading !== undefined) { it.heading = heading; it.mesh.rotation.y = heading; }
    }
    if (it.place) it.place(it.x, it.z, heading ?? 0, it.speed ?? 0);
  }
}

export function applyShot(game, name) {
  const g = game;
  const p = g.player;
  g.shotMode = true;
  document.getElementById('start-screen').classList.add('hidden');
  document.getElementById('map-screen').classList.add('hidden');
  document.getElementById('garage-screen').classList.add('hidden');

  if (name === 'cover') {
    // S1: sunset beachfront chase on Coral Row avenue (x = -272). The
    // camera sits close and low just north of the player car, looking
    // slightly south-west, so the player car is large, both VPD cruisers
    // are close behind it with their light bars facing the camera, traffic
    // and peds fill the frame edges, and the beach, water and sun glow
    // are on the right. The chase is shown, not told.
    g.setNight(false);
    g.state = 'playing';
    g.missions.setMission(3);
    p.place(-272, 55, Math.PI);
    p.car = g.playerCar;
    p.car.place(-272, 55, Math.PI, 24);
    p.onFoot = false; p.mesh.visible = false;
    p.health = 82; p.armour = 64; p.cash = 4820; p.rep = 1240;
    g.police.setWanted(3, p.x, p.z);
    g.police.cruisers[0].place(-272, 63, Math.PI, 26);
    g.police.cruisers[1].place(-271, 72, Math.PI, 26);
    g.police.units = [
      { id: 'BARRACUDA-12', role: 'RAMMING', dist: 5 },
      { id: 'MANTA-07', role: 'PURSUIT', dist: 9 },
      { id: 'REEF-03', role: 'ROADBLOCK', dist: 31 },
      { id: 'AIR-2', role: 'SEARCHLIGHT', dist: 76 },
    ];
    g.police.placeHelicopter(-280, 60);
    g.police.heli.position.y = 14;
    g.police.heliLight.position.y = 14;
    g.police.trace = 68; g.police.inSight = true;
    g.scoreLine = '+ $150 DRIFT x3 · NEAR MISS +$250';
    g.raceCheckpoint = 0;
    placeNear(g, g.traffic.cars, -272, 55, [[5, 35, 0], [32, 13, Math.PI / 2], [-5, 45, 0]]);
    placeNear(g, g.traffic.peds, -272, 55, [[-10, -7, 0.5], [-12, 5, 2.4], [10, -3, 1.2]]);
    g.fixedCamera = { pos: [-264, 6, 46], look: [-280, 1, 64] };
  } else if (name === 'street') {
    // S2: on foot at Coral Row at dusk, talking to Selma outside Bayside Arms.
    // The camera sits south-east of the shop so its sign sits left of
    // centre and the street, the patrol cruiser and the peds fill the rest
    // of the frame. A VPD patrol car is parked on the avenue to the east.
    g.setNight(false);
    g.state = 'playing';
    g.missions.setMission(1);
    p.place(-240, 222, Math.PI);
    p.onFoot = true; p.mesh.visible = true; p.car = null;
    p.health = 96; p.armour = 40; p.cash = 4820; p.rep = 1240;
    g.police.setWanted(0, p.x, p.z);
    g.police.trace = 0; g.police.inSight = false;
    g.scoreLine = 'SIDE JOB · SUNSET SPRINT — RACE AT LUMEN PIER · $800';
    g.raceCheckpoint = 0;
    g.promptText = '[E] BAYSIDE ARMS — BUY AMMO $600';
    placeNear(g, g.traffic.cars, -240, 222, [[36, -18, 0], [-32, -18, 0], [20, -42, Math.PI / 2]]);
    placeNear(g, g.traffic.peds, -240, 222, [[-10, -6, 0.3], [10, -2, 2.8], [-6, 8, 1.4], [14, 4, 0.9], [-16, -2, 2.2]]);
    // A parked VPD patrol cruiser on the cross street (not a chase unit — 0 stars).
    const patrol = new Car(g.render.scene, CAR_MODELS[0], -226, 206, Math.PI / 2, true);
    patrol.mesh.position.set(-226, 0, 206);
    g.fixedCamera = { pos: [-224, 5, 236], look: [-250, 3, 198] };
  } else if (name === 'night') {
    // S3: night combat on the Old Foundry road (x = 204). Player on foot
    // facing Kessler's crew up the road, containers and the lattice crane
    // to the sides, neon signs lit, helicopter closer and lower overhead.
    g.setNight(true);
    g.state = 'playing';
    g.missions.setMission(4);
    g.missions.counter = 'CREW 2/6';
    p.place(204, -8, Math.PI);
    p.onFoot = true; p.mesh.visible = true; p.car = null;
    p.weapon = 3; p.health = 74; p.armour = 52; p.cash = 4820; p.rep = 1240;
    g.police.setWanted(3, p.x, p.z);
    g.police.units = [
      { id: 'BARRACUDA-12', role: 'RAMMING', dist: 8 },
      { id: 'MANTA-07', role: 'PURSUIT', dist: 14 },
      { id: 'REEF-03', role: 'ROADBLOCK', dist: 22 },
      { id: 'AIR-2', role: 'SEARCHLIGHT', dist: 76 },
    ];
    g.police.placeHelicopter(214, -38);
    g.police.heli.position.y = 18;
    g.police.heliLight.position.y = 18;
    g.police.trace = 74; g.police.inSight = true;
    g.combat.takedowns = 2;
    // Kessler's crew, on the road ahead of the player.
    const spots = [[198, -32], [210, -44], [197, -56], [211, -30]];
    g.combat.thugs.forEach((t, i) => {
      if (!t.alive || i >= spots.length) return;
      t.x = spots[i][0]; t.z = spots[i][1];
      t.mesh.position.set(t.x, 0, t.z);
      t.mesh.visible = true;
    });
    g.scoreLine = 'KESSLER’S CREW 2/6 · +$120 PER TAKEDOWN · AMMO +24 ON ROAD';
    g.raceCheckpoint = 0;
    g.promptText = '';
    placeNear(g, g.traffic.cars, 204, -8, [[-24, -40, 0], [18, -52, 0]]);
    g.fixedCamera = { pos: [204, 4, 2], look: [204, 6, -45] };
  } else {
    // S4: Selma's Garage. The Solstice GT sits on the lift, Dante stands
    // beside it, and the garage panel shows the upgrade rows, the
    // REP-gated Breaker 12, the mechanic's line and the crew on call.
    // The map stays in the pause screen (M/P) — it is not a shot.
    g.setNight(false);
    g.state = 'paused';
    g.missions.setMission(8);
    g.missions.counter = 'DELIVERY 0/1';
    p.place(-116, 106, Math.PI);
    p.onFoot = true; p.mesh.visible = true;
    p.car = g.playerCar;
    p.car.place(-120, 102, Math.PI / 2, 0);
    p.car.mesh.position.y = 0.3;
    p.health = 82; p.armour = 64; p.cash = 4820; p.rep = 1240;
    g.police.setWanted(0, p.x, p.z);
    g.police.trace = 0; g.police.inSight = false;
    g.scoreLine = 'GARAGE DELIVERY · BRING THE SOLSTICE GT HOME';
    g.raceCheckpoint = 0;
    g.promptText = '';
    placeNear(g, g.traffic.peds, -120, 102, [[-6, -4, 0.5], [8, -6, 2.2]]);
    document.getElementById('garage-screen').classList.remove('hidden');
    document.getElementById('garage-cash').textContent = '$4,820';
    // The garage panel carries this shot: hide the HUD blocks it would
    // cover (mission, crew, minimap, dialogue, score line, flavour).
    for (const id of ['mission-box', 'crew', 'minimap-wrap', 'dialogue', 'score-line', 'flavour']) {
      document.getElementById(id).style.display = 'none';
    }
    // Camera on the x = -136 road, low and level, so the car's red sides
    // read (a high camera only shows its black roof).
    g.fixedCamera = { pos: [-134, 2.5, 118], look: [-121, 1.5, 100] };
  }
  g.hud.render();
  const pe = document.getElementById('prompt');
  if (g.promptText) { pe.textContent = g.promptText; pe.style.display = 'block'; }
  else pe.style.display = 'none';
  g.render.draw();
  window.__shotReady = true;
  return name;
}
