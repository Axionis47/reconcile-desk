import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
const source = /\.(tsx?|mjs|css|svg)$/;
const walk = dir => readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
  const path = join(dir, entry.name);
  return entry.isDirectory() ? walk(path) : source.test(path) ? [path] : [];
});
const files = ['app', 'tests', 'scripts', 'public'].flatMap(walk);
let total = 0;
for (const file of files) {
  const count = readFileSync(file, 'utf8').split(/\r?\n/).filter(line => line.trim()).length;
  total += count;
  console.log(`${String(count).padStart(4)}  ${file}`);
}
console.log(`${total} authored nonblank source lines / 1000 maximum`);
if (total > 1000) process.exitCode = 1;
