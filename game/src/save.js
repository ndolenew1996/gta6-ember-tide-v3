// EMBER TIDE — save: progress in localStorage. Cash, REP, completed
// missions, garage cars, shells and mute state survive a reload.

import { SAVE_KEY } from './config.js';

export function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (typeof s !== 'object' || s === null) return null;
    return s;
  } catch { return null; }
}

export function storeSave(game) {
  try {
    const s = {
      cash: game.player.cash, rep: game.player.rep,
      completed: game.missions.completed, unlocked: game.missions.unlocked,
      shells: game.player.shells, garageCars: game.garageCars,
      taxiFares: game.taxiFares, racesWon: game.racesWon,
      muted: game.audio.muted, savedAt: new Date().toISOString(),
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(s));
    return true;
  } catch { return false; }
}

export function clearSave() {
  try { localStorage.removeItem(SAVE_KEY); } catch { /* no storage */ }
}
