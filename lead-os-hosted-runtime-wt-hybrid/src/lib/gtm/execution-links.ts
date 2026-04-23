// src/lib/gtm/execution-links.ts
// Derive actionable links from technicalAnchors + known repo paths (no invented metrics).

const REPO_BLOB_BASE =
  "https://github.com/pinohu/lead-os/blob/main/lead-os/lead-os-hosted-runtime-wt-hybrid";

export interface ExecutionSurfaceLink {
  label: string;
  /** Present when the surface is directly openable in the browser or repo. */
  href?: string;
  kind: "dashboard" | "api" | "doc" | "source" | "other";
}

function trimMethod(prefix: string, anchor: string): string {
  const m = anchor.match(new RegExp(`^${prefix}\\s+`, "i"));
  return m ? anchor.slice(m[0].length).trim() : anchor;
}

/** Map a technical anchor string to zero or more concrete links. */
export function executionSurfacesForAnchor(anchor: string): ExecutionSurfaceLink[] {
  const t = anchor.trim();
  if (!t) return [];

  const pathLike = trimMethod("GET", trimMethod("POST", trimMethod("PUT", trimMethod("PATCH", t))));

  if (pathLike.startsWith("/dashboard/")) {
    return [{ label: t, href: pathLike, kind: "dashboard" }];
  }
  if (pathLike.startsWith("/api/")) {
    return [{ label: t, href: pathLike, kind: "api" }];
  }
  if (pathLike.startsWith("docs/") || pathLike.startsWith("./docs/")) {
    const rel = pathLike.replace(/^\.\//, "");
    return [{ label: t, href: `${REPO_BLOB_BASE}/${rel}`, kind: "doc" }];
  }
  if (pathLike.startsWith("src/") || pathLike.startsWith("db/")) {
    return [{ label: t, href: `${REPO_BLOB_BASE}/${pathLike}`, kind: "source" }];
  }
  return [{ label: t, kind: "other" }];
}

export function executionSurfacesForUseCase(anchors: readonly string[]): ExecutionSurfaceLink[] {
  const out: ExecutionSurfaceLink[] = [];
  for (const a of anchors) {
    out.push(...executionSurfacesForAnchor(a));
  }
  return out;
}
