import { getNiche, nicheCatalog } from "@/lib/catalog";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ niche: string }> };

export function generateStaticParams() {
  return Object.keys(nicheCatalog).map((niche) => ({ niche }));
}

export default async function EmbedPage({ params }: Props) {
  const { niche: slug } = await params;
  const niche = getNiche(slug);
  if (!niche) notFound();

  // Minimal embed page — no nav, no footer, just the lead capture essentials
  return (
    <main style={{
      fontFamily: "'Trebuchet MS', 'Gill Sans', 'Helvetica Neue', sans-serif",
      maxWidth: 480, margin: "0 auto", padding: 24,
      color: "#14211d",
    }}>
      <h2 style={{ fontSize: "1.2rem", fontWeight: 800, marginBottom: 8 }}>
        {niche.assessmentTitle}
      </h2>
      <p style={{ fontSize: "0.88rem", color: "#385145", marginBottom: 16 }}>
        {niche.summary}
      </p>
      <form
        action="/api/intake"
        method="POST"
        style={{ display: "flex", flexDirection: "column", gap: 12 }}
      >
        <input type="hidden" name="source" value="widget" />
        <input type="hidden" name="niche" value={niche.slug} />
        <input name="firstName" placeholder="First name" required
          style={{ padding: "12px 14px", border: "1px solid #d4d4d4", borderRadius: 8, fontSize: "0.92rem" }} />
        <input name="email" type="email" placeholder="Email" required
          style={{ padding: "12px 14px", border: "1px solid #d4d4d4", borderRadius: 8, fontSize: "0.92rem" }} />
        <button type="submit" style={{
          padding: "12px 20px", border: "none", borderRadius: 8,
          background: "#c4632d", color: "white", fontWeight: 700,
          fontSize: "0.92rem", cursor: "pointer",
        }}>
          Get your free assessment →
        </button>
      </form>
      <p style={{ fontSize: "0.72rem", color: "#8a8a8a", marginTop: 8 }}>
        No commitment required. Results in under 2 minutes.
      </p>
    </main>
  );
}
