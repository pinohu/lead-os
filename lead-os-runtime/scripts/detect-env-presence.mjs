// scripts/detect-env-presence.mjs — report which keys from .env.example are set (no values).
import { readFileSync, existsSync } from "fs";
import { join } from "path";

const root = join(process.cwd());
const examplePath = join(root, ".env.example");
if (!existsSync(examplePath)) {
  console.error("Missing .env.example");
  process.exit(1);
}

const text = readFileSync(examplePath, "utf8");
const keys = [];
for (const line of text.split("\n")) {
  const m = line.match(/^([A-Z][A-Z0-9_]+)=/);
  if (m) keys.push(m[1]);
}

const set = [];
const unset = [];
for (const k of keys) {
  if (process.env[k] !== undefined && String(process.env[k]).length > 0) {
    set.push(k);
  } else {
    unset.push(k);
  }
}

console.log(
  JSON.stringify(
    {
      totalKeys: keys.length,
      setCount: set.length,
      unsetCount: unset.length,
      set,
      unset,
    },
    null,
    2,
  ),
);
