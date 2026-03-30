import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getDynastySite,
  generateSiteJsonLd,
  generateSiteMeta,
  listDynastySites,
  saveDynastySite,
  seedAllPresetConfigs,
} from "../../../lib/dynasty-landing-engine.ts";
import { DynastyLandingPage } from "../../../components/DynastyLandingPage.tsx";

export const dynamicParams = false;

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  const presets = seedAllPresetConfigs();
  for (const config of presets) {
    await saveDynastySite(config);
  }
  const all = await listDynastySites({ status: "published" });
  return all.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const config = await getDynastySite(slug);
  if (!config) return { title: "Not Found" };
  const meta = generateSiteMeta(config);
  return {
    title: meta.title,
    description: meta.description,
    openGraph: {
      title: meta.openGraph.title,
      description: meta.openGraph.description,
      url: meta.canonical,
      type: "website",
    },
    alternates: { canonical: meta.canonical },
  };
}

export default async function SitePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Re-seed on first render so the store is populated in SSG context.
  const presets = seedAllPresetConfigs();
  for (const config of presets) {
    await saveDynastySite(config);
  }

  const config = await getDynastySite(slug);
  if (!config) notFound();

  const jsonLd = generateSiteJsonLd(config);

  return (
    <>
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: controlled JSON-LD — no user content
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <DynastyLandingPage config={config} />
    </>
  );
}
