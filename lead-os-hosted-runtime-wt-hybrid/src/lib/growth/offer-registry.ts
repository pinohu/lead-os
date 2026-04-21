export const offers = [
  {
    id: "lead-response-system",
    type: "affiliate",
    placement: ["authority", "post_lead"],
  },
  {
    id: "territory-node",
    type: "partner",
    placement: ["directory"],
  }
];

export function getOffersByPlacement(placement) {
  return offers.filter(o => o.placement.includes(placement));
}
