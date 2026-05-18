// erie-pro/src/scripts/paths.ts
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const scriptDir = dirname(fileURLToPath(import.meta.url))
export const erieProRoot = join(scriptDir, "..", "..")

export function erieDocsPath(...segments: string[]): string {
  return join(erieProRoot, "docs", ...segments)
}
