import { getDeployment } from "@/lib/auto-deploy";
import { notFound } from "next/navigation";

export default async function SiteViewerPage({
  params,
}: {
  params: Promise<{ deploymentId: string }>;
}) {
  const { deploymentId } = await params;
  const deployment = getDeployment(deploymentId);

  if (!deployment) {
    notFound();
  }

  const statusColors: Record<string, string> = {
    pending: "#f59e0b",
    "creating-repo": "#3b82f6",
    "pushing-assets": "#3b82f6",
    deploying: "#8b5cf6",
    live: "#059669",
    failed: "#ef4444",
  };

  return (
    <main
      style={{
        maxWidth: 800,
        margin: "0 auto",
        padding: "40px 24px",
        fontFamily: "system-ui, -apple-system, sans-serif",
        color: "#1a1a2e",
      }}
    >
      <header style={{ marginBottom: 32 }}>
        <p
          style={{
            fontSize: "0.82rem",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: 1.5,
            color: "#6c757d",
            marginBottom: 8,
          }}
        >
          Deployment
        </p>
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: "0 0 8px" }}>
          {deployment.nicheSlug}
        </h1>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <span
            style={{
              display: "inline-block",
              padding: "4px 12px",
              borderRadius: 999,
              background: `${statusColors[deployment.status] || "#6c757d"}20`,
              color: statusColors[deployment.status] || "#6c757d",
              fontSize: "0.82rem",
              fontWeight: 700,
            }}
          >
            {deployment.status}
          </span>
          <span style={{ fontSize: "0.85rem", color: "#6c757d" }}>
            Tenant: {deployment.tenantId}
          </span>
          <span style={{ fontSize: "0.85rem", color: "#6c757d" }}>
            Created: {new Date(deployment.createdAt).toLocaleDateString()}
          </span>
        </div>
      </header>

      {deployment.repoUrl ? (
        <section
          style={{
            background: "#f8f9fa",
            padding: 20,
            borderRadius: 8,
            marginBottom: 24,
            border: "1px solid #e5e7eb",
          }}
        >
          <h2 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 8px" }}>URLs</h2>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {deployment.repoUrl ? (
              <li style={{ marginBottom: 8 }}>
                <strong style={{ fontSize: 13, color: "#6c757d" }}>Repository: </strong>
                <a
                  href={deployment.repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "#14b8a6", fontWeight: 600, textDecoration: "none" }}
                >
                  {deployment.repoUrl}
                </a>
              </li>
            ) : null}
            {deployment.liveUrl ? (
              <li>
                <strong style={{ fontSize: 13, color: "#6c757d" }}>Live site: </strong>
                <a
                  href={deployment.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "#14b8a6", fontWeight: 600, textDecoration: "none" }}
                >
                  {deployment.liveUrl}
                </a>
              </li>
            ) : null}
          </ul>
        </section>
      ) : null}

      {deployment.error ? (
        <section
          style={{
            background: "#fef2f2",
            padding: 16,
            borderRadius: 8,
            marginBottom: 24,
            border: "1px solid #fecaca",
          }}
          role="alert"
        >
          <p style={{ color: "#dc2626", fontWeight: 600, margin: 0 }}>
            Error: {deployment.error}
          </p>
        </section>
      ) : null}

      <section>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 16px" }}>
          Deployed Assets ({deployment.assets.length})
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {deployment.assets.map((asset) => {
            const assetUrl = deployment.liveUrl
              ? `${deployment.liveUrl.replace(/\/$/, "")}/${asset.path}`
              : undefined;

            return (
              <article
                key={asset.path}
                style={{
                  background: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: 8,
                  padding: 16,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                  <div>
                    <p style={{ fontWeight: 600, margin: "0 0 4px" }}>{asset.title}</p>
                    <p style={{ fontSize: 13, color: "#6c757d", margin: 0 }}>
                      {asset.type} &mdash; {asset.path}
                    </p>
                  </div>
                  {assetUrl ? (
                    <a
                      href={assetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "inline-block",
                        padding: "6px 16px",
                        background: "#14b8a6",
                        color: "#fff",
                        borderRadius: 6,
                        fontSize: 13,
                        fontWeight: 600,
                        textDecoration: "none",
                      }}
                    >
                      View
                    </a>
                  ) : null}
                </div>

                {(asset.type === "form" || asset.type === "widget") && assetUrl ? (
                  <details style={{ marginTop: 12 }}>
                    <summary
                      style={{
                        cursor: "pointer",
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#6c757d",
                      }}
                    >
                      Embed code
                    </summary>
                    <pre
                      style={{
                        background: "#f1f5f9",
                        padding: 12,
                        borderRadius: 6,
                        fontSize: 12,
                        overflowX: "auto",
                        marginTop: 8,
                      }}
                    >
                      {`<iframe src="${assetUrl}" width="100%" height="600" frameborder="0" title="${asset.title}"></iframe>`}
                    </pre>
                  </details>
                ) : null}
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
