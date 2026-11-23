// Ember Court — submission entrypoint (Node 22, stdlib only + vendored kit code).
//
// Builds the submission output directory:
//   out/game/        — the playable game, copied unchanged
//   out/screenshots/ — the four screenshots, copied unchanged
//   out/dossier.json — the judge's dossier, built by the kit's vendored
//                      buildDossier (it RETURNS the dossier bytes; this
//                      file writes them out itself).
//
// Usage: node main.ts — output goes to MAKEFUN_OUTPUT_DIR (default /output)
import { cpSync, mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDossier } from "./vendor/makefun-game.ts";

const repoRoot = dirname(fileURLToPath(import.meta.url));
// The grader gives main.ts a writable /output; outside the grader the
// MAKEFUN_OUTPUT_DIR environment variable stands in for it.
const outDir = resolve(process.env.MAKEFUN_OUTPUT_DIR ?? "/output");

// The grader mounts the output directory itself, so the directory must
// never be removed (removing a mount point fails with EBUSY): create it
// if it is missing, then clear only the entries inside it.
mkdirSync(outDir, { recursive: true });
for (const entry of readdirSync(outDir)) {
  rmSync(join(outDir, entry), { recursive: true, force: true });
}
cpSync(join(repoRoot, "game"), join(outDir, "game"), { recursive: true });
cpSync(join(repoRoot, "screenshots"), join(outDir, "screenshots"), { recursive: true });

// The dossier covers the whole game tree and its screenshots; the text
// cap is the one RULES.txt names (163,840 bytes), far above the ~38 KB
// outline this game produces, so nothing is cut.
const dossier = await buildDossier(repoRoot, { text_max_bytes: 163_840 });
writeFileSync(join(outDir, "dossier.json"), dossier);

console.log(`Ember Court output written to ${outDir}`);
console.log(`  game/         — copied`);
console.log(`  screenshots/  — copied`);
console.log(`  dossier.json  — ${dossier.length} bytes`);
