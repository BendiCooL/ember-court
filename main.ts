// Ember Court — submission entrypoint (Node 22, stdlib only + vendored kit code).
//
// Builds the submission output directory:
//   out/game/        — the playable game, copied unchanged
//   out/screenshots/ — the four screenshots, copied unchanged
//   out/dossier.json — the judge's dossier, built by the kit's vendored
//                      buildDossier (it RETURNS the dossier bytes; this
//                      file writes them out itself).
//
// Usage: node main.ts [out-dir]   (default out-dir is "out" in the repo root)
import { cpSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDossier } from "./vendor/makefun-game.ts";

const repoRoot = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(repoRoot, process.argv[2] ?? "out");

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });
cpSync(join(repoRoot, "game"), join(outDir, "game"), { recursive: true });
cpSync(join(repoRoot, "screenshots"), join(outDir, "screenshots"), { recursive: true });

// The dossier covers the whole game tree and its screenshots; the text
// cap is far above the ~40 KB outline this game produces, so nothing is cut.
const dossier = await buildDossier(repoRoot, { text_max_bytes: 1_000_000 });
writeFileSync(join(outDir, "dossier.json"), dossier);

console.log(`Ember Court output written to ${outDir}`);
console.log(`  game/         — copied`);
console.log(`  screenshots/  — copied`);
console.log(`  dossier.json  — ${dossier.length} bytes`);
