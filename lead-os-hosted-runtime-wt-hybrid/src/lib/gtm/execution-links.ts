// src/lib/gtm/execution-links.ts
// Derive actionable in-site links from technicalAnchors + known repo paths (no invented metrics).

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

function docHref(pathLike: string): string {
  const filename = pathLike.replace(/^\.\//, "").split("/").pop() ?? "";
  const slug = filename
    .replace(/\.md$/i, "")
    .toLowerCase()
    .replace(/_/g, "-");
  return slug ? `/docs/${slug}` : "/docs";
}

const exposedSourceReferences = new Set([
  "src/lib/erie/directory-lead-flow.ts",
  "src/lib/integrations/lead-delivery-hub.ts",
  "db/migrations/010_erie_directory_seed.sql",
]);

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
    return [{ label: t, href: docHref(rel), kind: "doc" }];
  }
  if (pathLike.startsWith("src/") || pathLike.startsWith("db/")) {
    return [
      {
        label: t,
        href: exposedSourceReferences.has(pathLike) ? `/docs/source/${pathLike}` : undefined,
        kind: "source",
      },
    ];
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
