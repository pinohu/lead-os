import { resolveNode } from "@/lib/geo/node-resolver";
import { buildPageModel } from "@/lib/geo/page-builder";
import { getAllowedOffers } from "@/lib/growth/rules-engine";

export default function NodePage({ params }) {
  const node = resolveNode(params);
  const page = buildPageModel(node);

  const offers = getAllowedOffers("directory");

  return (
    <main style={{ padding: 40 }}>
      <h1>{page.title}</h1>
      <p>{page.summary}</p>

      <section>
        <h2>Why Choose Us</h2>
        <p>{page.trust}</p>
      </section>

      <section>
        <h2>Local Service</h2>
        <p>{page.localContext}</p>
      </section>

      <button>{page.cta}</button>

      <section style={{ marginTop: 40 }}>
        <h3>Available Partner Offers</h3>
        <pre>{JSON.stringify(offers, null, 2)}</pre>
      </section>
    </main>
  );
}
