// scripts/write-build-id.mjs — emit public/build-id.json for runtime version probes.
import { writeFileSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const outDir = join(root, "public");
const outFile = join(outDir, "build-id.json");

const fromEnv =
  process.env.LEAD_OS_BUILD_ID ||
  process.env.VERCEL_GIT_COMMIT_SHA ||
  process.env.GITHUB_SHA ||
  "";

let id = fromEnv;
if (!id) {
  try {
    id = execSync("git rev-parse --short HEAD", { cwd: root, encoding: "utf8" }).trim();
  } catch {
    id = "unknown";
  }
}

mkdirSync(outDir, { recursive: true });
writeFileSync(outFile, JSON.stringify({ id, builtAt: new Date().toISOString() }, null, 2), "utf8");
console.log("[write-build-id]", outFile, id);
