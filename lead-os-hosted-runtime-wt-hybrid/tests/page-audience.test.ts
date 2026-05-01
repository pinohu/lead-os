import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { getPageAudienceForPath, getVisibleAudienceRules, PAGE_AUDIENCE_RULES } from "../src/lib/page-audience.ts";

const repoRoot = process.cwd();
const appRoot = join(repoRoot, "src", "app");

function collectPageFiles(dir: string): string[] {
  const entries = readdirSync(dir);
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stats = statSync(fullPath);
    if (stats.isDirectory()) {
      files.push(...collectPageFiles(fullPath));
    } else if (entry === "page.tsx") {
      files.push(fullPath);
    }
  }

  return files;
}

function routeFromPageFile(filePath: string) {
  const relativePath = relative(appRoot, filePath).split(sep).join("/");
  const route = relativePath.replace(/\/page\.tsx$/, "").replace(/^page\.tsx$/, "");
  return route ? `/${route}` : "/";
}

describe("page audience map", () => {
  it("maps every rendered app page to an explicit audience profile", () => {
    const pageRoutes = collectPageFiles(appRoot).map(routeFromPageFile);

    for (const route of pageRoutes) {
      const profile = getPageAudienceForPath(route);

      assert.notEqual(profile.id, "fallback", `${route} is using fallback audience copy`);
      assert.ok(profile.servedAudience.length > 35, `${route} servedAudience is too thin`);
      assert.ok(profile.primaryPersona.length > 25, `${route} primaryPersona is too thin`);
      assert.ok(profile.pagePurpose.length > 35, `${route} pagePurpose is too thin`);
      assert.ok(profile.expectedOutcome.length > 35, `${route} expectedOutcome is too thin`);
      assert.ok(profile.notFor.length > 20, `${route} notFor is too thin`);
    }
  });

  it("keeps page audience language free of placeholder and internal-only copy", () => {
    const disallowed = /Used by X|No no|LeadOS shifts|This sells|TBD|TODO/i;

    for (const profile of getVisibleAudienceRules()) {
      const visibleCopy = [
        profile.routeLabel,
        profile.kind,
        profile.servedAudience,
        profile.primaryPersona,
        profile.pagePurpose,
        profile.expectedOutcome,
        profile.notFor,
      ].join("\n");

      assert.doesNotMatch(visibleCopy, disallowed, `${profile.id} contains placeholder or internal copy`);
    }
  });

  it("keeps route rules unique and intentionally labeled", () => {
    const ids = new Set(PAGE_AUDIENCE_RULES.map((rule) => rule.id));
    const labels = new Set(PAGE_AUDIENCE_RULES.map((rule) => rule.routeLabel));

    assert.equal(ids.size, PAGE_AUDIENCE_RULES.length);
    assert.equal(labels.size, PAGE_AUDIENCE_RULES.length);
  });
});
