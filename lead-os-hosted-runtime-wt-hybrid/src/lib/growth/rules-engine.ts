import { offers } from "./offer-registry";

export function getAllowedOffers(pageType) {
  if (pageType === "authority") {
    return offers.filter(o => o.type === "affiliate");
  }

  if (pageType === "directory") {
    return offers.filter(o => o.type === "partner");
  }

  if (pageType === "post_lead") {
    return offers;
  }

  return [];
}

export function canDisplayOffer(pageType, offerId) {
  const allowed = getAllowedOffers(pageType);
  return allowed.some(o => o.id === offerId);
}
