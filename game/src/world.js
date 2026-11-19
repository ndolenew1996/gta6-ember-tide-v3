// EMBER TIDE — world: the Port Vela map model. Districts, roads and the
// causeway live here as data; city.js turns them into meshes.

import { DISTRICTS, WORLD } from './config.js';

export function districtAt(x, z) {
  let best = DISTRICTS[0];
  let bestD = Infinity;
  for (const d of DISTRICTS) {
    const dx = (x - d.cx) / (d.w / 2);
    const dz = (z - d.cz) / (d.h / 2);
    const dd = dx * dx + dz * dz;
    if (dd < bestD) { bestD = dd; best = d; }
  }
  return best;
}

export function districtName(x, z) { return districtAt(x, z).name; }
export function groundHeight(x, z) { return 0; }

// Roads run on a grid every roadGap metres, plus the beachfront avenue
// along Coral Row and the causeway bridge over the water at z = 300.
export function buildRoadGraph() {
  const nodes = [];
  for (let x = -WORLD.half; x <= WORLD.half; x += WORLD.roadGap) {
    for (let z = -WORLD.half; z <= WORLD.half; z += WORLD.roadGap) {
      nodes.push({ x, z });
    }
  }
  return nodes;
}

export function nearestNode(nodes, x, z) {
  let best = nodes[0];
  let bestD = Infinity;
  for (const n of nodes) {
    const d = (n.x - x) * (n.x - x) + (n.z - z) * (n.z - z);
    if (d < bestD) { bestD = d; best = n; }
  }
  return best;
}

export function isWater(x, z) {
  // The bay: west of Coral Row's sand, and the marina basin east.
  if (x < -300) return true;
  if (x > 300 && z > 120) return true;
  if (z > 300) return true; // causeway water south of the map
  return false;
}

export function clampToCity(x, z) {
  return {
    x: Math.max(-WORLD.half, Math.min(WORLD.half, x)),
    z: Math.max(-WORLD.half, Math.min(WORLD.half, z)),
  };
}
