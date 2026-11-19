// EMBER TIDE — config: every number, name and label the game shares.
// Port Vela is a new city; Dante Vane, Selma Duarte, Anton Kessler and the
// Vela PD are original characters. Nothing here comes from any other game.

export const SEED = 20261118;
export const WORLD = { half: 340, roadGap: 68, groundY: 0 };
export const GOLDEN_HOUR = { label: 'FRI 18:36', day: 'FRI', time: '18:36', dayNum: 2 };

export const DISTRICTS = [
  { id: 'coral', name: 'CORAL ROW', sub: 'BEACHFRONT', color: '#ffb37a', ground: '#e8c98f', cx: -190, cz: 150, w: 300, h: 180 },
  { id: 'glass', name: 'GLASS QUARTER', sub: 'DOWNTOWN', color: '#7fd4ff', ground: '#3d4a63', cx: 40, cz: 150, w: 260, h: 180 },
  { id: 'foundry', name: 'OLD FOUNDRY', sub: 'DOCKS', color: '#ff8a5c', ground: '#6b6259', cx: 210, cz: -40, w: 260, h: 220 },
  { id: 'pier', name: 'LUMEN PIER', sub: 'BOARDWALK', color: '#ffd23f', ground: '#8a6f4d', cx: -190, cz: -140, w: 300, h: 200 },
  { id: 'palm', name: 'PALM COURT', sub: 'OLD TOWN', color: '#c98f5f', ground: '#7a5c40', cx: 40, cz: -160, w: 260, h: 200 },
  { id: 'marina', name: 'VELA MARINA', sub: 'HARBOUR', color: '#4ad2c8', ground: '#46606e', cx: 210, cz: 190, w: 260, h: 140 },
];

export const RANKS = ['UNKNOWN', 'HUSTLER', 'FIXER', 'WHEELMAN', 'TIDE RUNNER', 'STORM CAPTAIN'];
export const REP_THRESHOLDS = [0, 300, 700, 1000, 2000, 3000];

export const MISSIONS = [
  { n: 1, title: 'SALTWATER DEBT', short: 'Saltwater Debt', obj: 'Deliver Selma\u2019s package to Lumen Pier', counter: 'PACKAGE 1/1', next: 'The Marina Job', timer: 150, x: -190, z: -140, speaker: 'SELMA', line: '\u201CDante, that package is worth more than my garage. Don\u2019t stop for anyone.\u201D' },
  { n: 2, title: 'THE MARINA JOB', short: 'The Marina Job', obj: 'Steal the Solstice GT from Vela Marina', counter: 'CAR 0/1', next: 'Tidegate Chase', timer: 0, x: 210, z: 190, speaker: 'PILAR', line: '\u201CThe Solstice GT is docked at berth 7. Cameras loop in thirty seconds. Go.\u201D' },
  { n: 3, title: 'TIDEGATE CHASE', short: 'Tidegate Chase', obj: 'Lose the VPD at 3 stars \u00B7 break line of sight', counter: 'HEAT 3 STARS', next: 'Kessler\u2019s Ledger', timer: 84, x: -190, z: 150, speaker: 'SELMA', line: '\u201CDante, the tide waits for no one. Lose them on Coral Row \u2014 then come home.\u201D' },
  { n: 4, title: 'KESSLER\u2019S LEDGER', short: 'Kessler\u2019s Ledger', obj: 'Take out Kessler\u2019s crew at Old Foundry', counter: 'CREW 2/6', next: 'Night Causeway', timer: 0, x: 210, z: -40, speaker: 'BRAM', line: '\u201CSix of Kessler\u2019s crew guard the ledger. I\u2019ll hold the gate \u2014 you take them down.\u201D' },
  { n: 5, title: 'NIGHT CAUSEWAY', short: 'Night Causeway', obj: 'Checkpoint race across the causeway at night', counter: 'CHECKPOINT 9/11', next: 'Taxi Run', timer: 43, x: 40, z: -160, speaker: 'ODETTE', line: '\u201CEleven gates, one causeway, no headlights off. The tide runs at midnight \u2014 run it.\u201D' },
  { n: 6, title: 'TAXI RUN', short: 'Taxi Run', obj: 'Run 3 fares from the Taxi Stand before the tide turns', counter: 'FARES 1/3', next: 'Sunset Sprint', timer: 180, x: 10, z: 240, speaker: 'PILAR', line: '\u201CThree fares, no questions, cash up front. The stand is yours till the tide comes in.\u201D' },
  { n: 7, title: 'SUNSET SPRINT', short: 'Sunset Sprint', obj: 'Run the causeway gates at dusk before the sun sets', counter: 'GATES 0/11', next: 'Garage Delivery', timer: 120, x: -120, z: 330, speaker: 'ODETTE', line: '\u201CEleven gates, one causeway, and the sun going down. Beat the dark \u2014 the sprint pays double.\u201D' },
  { n: 8, title: 'GARAGE DELIVERY', short: 'Garage Delivery', obj: 'Bring the tuned Solstice GT home to Selma\u2019s Garage', counter: 'DELIVERY 0/1', next: 'Storm Captain', timer: 150, x: -120, z: 90, speaker: 'SELMA', line: '\u201CThe tide comes in at midnight, Dante. Bring my car home before the causeway floods.\u201D' },
];

export const WEAPONS = [
  { slot: 1, name: 'FISTS', ammo: '', locked: false },
  { slot: 2, name: 'TIDE 9MM', ammo: '12/60', locked: false },
  { slot: 3, name: 'SQUALL SMG', ammo: '32/160', locked: false },
  { slot: 4, name: 'BREAKER 12', ammo: '', locked: true, lockText: 'LOCKED REP 4' },
  { slot: 5, name: 'TIDE AR', ammo: '', locked: true, lockText: 'LOCKED REP 5' },
];

export const CAR_MODELS = [
  { name: 'SOLSTICE GT', color: 0xff5d3d, top: 46, accel: 26 },
  { name: 'CORTINA S', color: 0x3d7dff, top: 34, accel: 18 },
  { name: 'LAGUNA COUPE', color: 0xffd23f, top: 38, accel: 20 },
  { name: 'PALMA VAN', color: 0x9be7a8, top: 28, accel: 14 },
  { name: 'DUNE RUNNER', color: 0xc98fff, top: 32, accel: 16 },
];

export const ECONOMY = {
  startCash: 4820, drift: 150, nearMiss: 250, respray: 250, gun: 600,
  taxiFare: 120, raceWin: 800, missionPay: 3600, shellBonus: 500,
};

export const POLICE_UNITS = [
  { id: 'BARRACUDA-12', role: 'RAMMING' },
  { id: 'MANTA-07', role: 'PURSUIT' },
  { id: 'REEF-03', role: 'ROADBLOCK' },
  { id: 'AIR-2', role: 'SEARCHLIGHT' },
];

export const SHOPS = [
  { name: "Selma's Garage", kind: 'garage', x: -120, z: 90, color: '#ffb37a' },
  { name: 'Bayside Arms', kind: 'gun', x: -240, z: 200, color: '#ff5d5d' },
  { name: 'Spray Palace', kind: 'spray', x: 120, z: 60, color: '#4aa8ff' },
  { name: 'Vela General Hospital', kind: 'hospital', x: 90, z: -90, color: '#37d67a' },
  { name: 'Sunset Sprint', kind: 'race', x: -240, z: -60, color: '#ffd23f' },
  { name: 'Taxi Stand', kind: 'taxi', x: 10, z: 240, color: '#b07cff' },
];

export const CREW = [
  { key: 'Z', name: 'PILAR', ability: 'HACK CAMERAS', desc: 'Blinds VPD cameras for 10 s' },
  { key: 'X', name: 'BRAM', ability: 'RAM BOOST', desc: 'Next hit knocks a cruiser aside' },
  { key: 'V', name: 'ODETTE', ability: 'SPOT PATROLS', desc: 'Reveals every patrol on the map' },
];

export const RADIO = { station: 'TIDE FM 92.7', song: 'SUNSET SYNTH', track: 'Amber Coast — Midnight Tide', station2: 'CORAL FM 88.1', song2: 'PALM STATIC' };

export const GARAGE_UPGRADES = [
  { name: 'ENGINE', price: 5000, note: 'TOP SPEED +18' },
  { name: 'ARMOUR', price: 1800, note: 'PLATING · RAM PROOF' },
  { name: 'NITRO', price: 3000, note: 'BOOST +45% · 2 TANKS' },
  { name: 'REPAIR', price: 250, note: 'FULL RESTORE' },
  { name: 'RESPRAY', price: 250, note: 'CLEAR WANTED' },
  { name: 'BREAKER 12', price: 0, note: 'REP 5 · LOCKED', locked: true },
];
export const SAVE_KEY = 'ember-tide-save-v1';
