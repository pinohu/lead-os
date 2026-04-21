import { resolveNode } from "@/lib/geo/node-resolver";
import { buildPageModel } from "@/lib/geo/page-builder";
import { getAllowedOffers } from "@/lib/growth/rules-engine";
import NodeLeadForm from "@/components/geo/node-lead-form";
import TerritoryClaimPanel from "@/components/ownership/territory-claim-panel";
import { getOwnership } from "@/lib/ownership/node-ownership-store";

export default function NodePage({ params }) {
  const node = resolveNode(params);
  const page = buildPageModel(node);

  const offers = getAllowedOffers("directory");
  const ownership = getOwnership(node.id);

  return (
    <main style={{ padding: 40, maxWidth: 900, margin: "0 auto" }}>
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

      {/* Ownership-aware UI */}
      <TerritoryClaimPanel
        nodeId={node.id}
        initialState={ownership?.state || "unclaimed"}
      />

      {/* Lead Capture */}
      <NodeLeadForm
        state={node.state}
        county={node.county}
        city={node.city}
        niche={node.niche}
      />

      <section style={{ marginTop: 40 }}>
        <h3>Partner Offers</h3>
        <pre>{JSON.stringify(offers, null, 2)}</pre>
      </section>
    </main>
  );
}
