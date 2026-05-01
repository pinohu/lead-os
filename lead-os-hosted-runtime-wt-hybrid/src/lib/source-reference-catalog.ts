import path from "node:path";

export interface SourceReferenceEntry {
  relative: string;
  title: string;
  absolutePath: string;
}

export const sourceReferenceCatalog: SourceReferenceEntry[] = [
  {
    relative: "src/lib/erie/directory-lead-flow.ts",
    title: "Erie directory lead flow",
    absolutePath: path.join(process.cwd(), "src", "lib", "erie", "directory-lead-flow.ts"),
  },
  {
    relative: "src/lib/integrations/lead-delivery-hub.ts",
    title: "Lead delivery hub integration",
    absolutePath: path.join(process.cwd(), "src", "lib", "integrations", "lead-delivery-hub.ts"),
  },
  {
    relative: "db/migrations/010_erie_directory_seed.sql",
    title: "Erie directory seed migration",
    absolutePath: path.join(process.cwd(), "db", "migrations", "010_erie_directory_seed.sql"),
  },
];

export function getSourceReference(relative: string): SourceReferenceEntry | undefined {
  return sourceReferenceCatalog.find((entry) => entry.relative === relative);
}
