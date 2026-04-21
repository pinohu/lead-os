export function buildPageModel(node) {
  return {
    title: `${node.city} ${node.niche} Services in ${node.county}, ${node.state}`,
    summary: `Find trusted ${node.niche} services in ${node.city}.`,
    trust: `Verified providers and fast response times.`,
    localContext: `Serving ${node.city} and surrounding areas in ${node.county}.`,
    cta: `Request ${node.niche} service now`,
  };
}
