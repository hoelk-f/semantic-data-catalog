/** Keep independently deployable apps on the same standalone design contract. */
import { readFile, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const catalog = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repos = resolve(catalog, '../..');
const targets = ['solid-data-manager', 'solid-health-app', 'solid-health-questionnaire', 'solid-tours', 'environmental-monitoring'];
const write = process.argv.includes('--write');
let different = false;
for (const file of ['shell.css', 'legalContent.json', 'LoginParticleCloud.jsx', 'LoginParticleCloud.css', 'LoginParticleCloud.d.ts']) {
  const source = await readFile(resolve(catalog, 'src/standalone', file), 'utf8');
  for (const repo of targets) {
    if (file.startsWith("LoginParticleCloud") && repo === "environmental-monitoring") continue;
    const target = resolve(repos, repo, 'src/standalone', file);
    if (await readFile(target, 'utf8') === source) continue;
    if (write) { await writeFile(target, source); console.log(`Updated ${repo}/${file}`); }
    else { console.error(`Standalone design differs: ${repo}/${file}`); different = true; }
  }
}
if (different) process.exitCode = 1;
