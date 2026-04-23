import type { Metadata } from "next";
import { getDeployment } from "@/lib/auto-deploy";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "Site Preview | CX React",
  description: "Preview and manage your deployed CX React site.",
};

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
    <main className="max-w-4xl mx-auto px-6 py-10 text-foreground">
      <header className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
          Deployment
        </p>
        <h1 className="text-foreground text-3xl font-bold mb-2">
          {deployment.nicheSlug}
        </h1>
        <div className="flex gap-3 items-center flex-wrap">
          <span
            className="inline-block px-3 py-1 rounded-full text-xs font-bold"
            style={{
              background: `${statusColors[deployment.status] || "#6c757d"}20`,
              color: statusColors[deployment.status] || "#6c757d",
            }}
          >
            {deployment.status}
          </span>
          <span className="text-sm text-muted-foreground">
            Tenant: {deployment.tenantId}
          </span>
          <span className="text-sm text-muted-foreground">
            Created: {new Date(deployment.createdAt).toLocaleDateString()}
          </span>
        </div>
      </header>

      {deployment.repoUrl ? (
        <section className="bg-muted p-5 rounded-lg mb-6 border border-border">
          <h2 className="text-foreground text-base font-semibold mb-2">URLs</h2>
          <ul className="list-none p-0 m-0">
            {deployment.repoUrl ? (
              <li className="mb-2">
                <strong className="text-xs text-muted-foreground">Repository: </strong>
                <a
                  href={deployment.repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary font-semibold no-underline"
                >
                  {deployment.repoUrl}
                </a>
              </li>
            ) : null}
            {deployment.liveUrl ? (
              <li>
                <strong className="text-xs text-muted-foreground">Live site: </strong>
                <a
                  href={deployment.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary font-semibold no-underline"
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
          className="bg-red-50 p-4 rounded-lg mb-6 border border-red-200"
          role="alert"
        >
          <p className="text-destructive font-semibold m-0">
            Error: {deployment.error}
          </p>
        </section>
      ) : null}

      <section>
        <h2 className="text-foreground text-xl font-bold mb-4">
          Deployed Assets ({deployment.assets.length})
        </h2>
        <div className="flex flex-col gap-3">
          {deployment.assets.map((asset) => {
            const assetUrl = deployment.liveUrl
              ? `${deployment.liveUrl.replace(/\/$/, "")}/${asset.path}`
              : undefined;

            return (
              <article
                key={asset.path}
                className="bg-card border border-border rounded-lg p-4"
              >
                <div className="flex justify-between items-center flex-wrap gap-2">
                  <div>
                    <p className="font-semibold m-0 mb-1">{asset.title}</p>
                    <p className="text-xs text-muted-foreground m-0">
                      {asset.type} &mdash; {asset.path}
                    </p>
                  </div>
                  {assetUrl ? (
                    <a
                      href={assetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block px-4 py-1.5 bg-primary text-primary-foreground rounded-md text-xs font-semibold no-underline"
                    >
                      View
                    </a>
                  ) : null}
                </div>

                {(asset.type === "form" || asset.type === "widget") && assetUrl ? (
                  <details className="mt-3">
                    <summary className="cursor-pointer text-xs font-semibold text-muted-foreground">
                      Embed code
                    </summary>
                    <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto mt-2">
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
