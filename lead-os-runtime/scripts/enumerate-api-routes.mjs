// scripts/enumerate-api-routes.mjs — list App Router API routes for security classification workflows.
import { readdirSync, statSync } from "fs";
import { dirname, join, relative } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..", "src", "app", "api");

function walk(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, acc);
    else if (name === "route.ts" || name === "route.js") acc.push(p);
  }
  return acc;
}

const files = walk(root).sort();
for (const f of files) {
  const rel = relative(join(__dirname, ".."), f).replace(/\\/g, "/");
  const urlPath =
    "/api/" +
    relative(root, dirname(f))
      .replace(/\\/g, "/")
      .replace(/^\.$/, "");
  console.log(`${urlPath}\t${rel}`);
}
console.error(`Total API route files: ${files.length}`);
