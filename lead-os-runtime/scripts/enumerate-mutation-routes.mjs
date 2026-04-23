// scripts/enumerate-mutation-routes.mjs — list App Router API route files that export mutating methods.
import { readFileSync, readdirSync } from "fs";
import { join } from "path";

const root = join(process.cwd(), "src", "app", "api");

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, name.name);
    if (name.isDirectory()) out.push(...walk(p));
    else if (name.name === "route.ts") out.push(p);
  }
  return out;
}

const mutators = [];
for (const file of walk(root)) {
  const src = readFileSync(file, "utf8");
  const methods = ["POST", "PUT", "PATCH", "DELETE"].filter((m) =>
    new RegExp(`export\\s+async\\s+function\\s+${m}\\b`).test(src),
  );
  if (methods.length) mutators.push({ file, methods });
}

const cwd = process.cwd();
mutators.sort((a, b) => a.file.localeCompare(b.file));
const normalized = mutators.map((m) => ({
  ...m,
  file: m.file.startsWith(cwd) ? m.file.slice(cwd.length + 1).replace(/\\/g, "/") : m.file,
}));
console.log(JSON.stringify({ count: normalized.length, routes: normalized }, null, 2));
