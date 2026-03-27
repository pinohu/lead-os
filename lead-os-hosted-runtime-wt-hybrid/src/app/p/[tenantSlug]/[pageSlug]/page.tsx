import { notFound } from "next/navigation";
import { getTenantBySlug } from "@/lib/tenant-store";
import { getPageBySlug, renderPageToHtml } from "@/lib/page-builder";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ tenantSlug: string; pageSlug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { tenantSlug, pageSlug } = await params;
  const tenant = await getTenantBySlug(tenantSlug);
  if (!tenant) return { title: "Page Not Found" };

  const page = getPageBySlug(tenant.tenantId, pageSlug);
  if (!page || page.status !== "published") return { title: "Page Not Found" };

  return {
    title: page.seo.title || page.title,
    description: page.seo.description || page.description,
    openGraph: {
      title: page.seo.title || page.title,
      description: page.seo.description || page.description,
      images: page.seo.ogImage ? [page.seo.ogImage] : undefined,
    },
  };
}

export default async function PublicPage({ params }: PageProps) {
  const { tenantSlug, pageSlug } = await params;

  const tenant = await getTenantBySlug(tenantSlug);
  if (!tenant) notFound();

  const page = getPageBySlug(tenant.tenantId, pageSlug);
  if (!page || page.status !== "published") notFound();

  const html = renderPageToHtml(page);

  return (
    <div
      dangerouslySetInnerHTML={{ __html: html }}
      suppressHydrationWarning
    />
  );
}
