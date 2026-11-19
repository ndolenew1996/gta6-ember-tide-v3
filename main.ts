// EMBER TIDE — entrypoint (Node 22, standard library only). The grader runs
// this program twice, and both runs must write the same bytes: it copies the
// game (game/) and the screenshots (screenshots/) beside this file into the
// output directory, then writes the dossier the judge reads, using the kit's
// buildDossier library from vendor/makefun-game.ts. Outside the grader,
// MAKEFUN_OUTPUT_DIR stands in for /output.
//
// The entry is EMBER TIDE, an original open-world crime game set in Port
// Vela: six districts, eight story missions, a wanted system with a police
// helicopter, a full HUD with a street-grid minimap and a speedometer gauge,
// a garage tuning screen, and four staged screenshots of the live game. No
// file is read from outside this repository and nothing is fetched over the
// network at build time.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Fail loudly, instead of handing in an empty bundle, when the game entry
// point is missing: a bundle without game/index.html cannot be played.
if (!existsSync(join(here, 'game', 'index.html'))) {
  throw new Error('EMBER TIDE: game/index.html is missing, refusing to build an empty entry');
}

// The output directory holds game/, screenshots/ and dossier.json, and
// nothing else. Copy the whole game tree, then the screenshots if any.
// Dotfiles are left out of the output on purpose: a stray .DS_Store or
// editor backup in the bundle would count against the game file budget.
const noDotfiles = (src: string) => !/(^|\/)\.[^/]+$/.test(src);
mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true, filter: noDotfiles });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true, filter: noDotfiles });
}

// The dossier is the judge's view of the entry: the game summary plus the
// screenshots, built by the kit library so the scorer can rebuild it byte
// for byte. The caps below are the scorer's own limits.
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
