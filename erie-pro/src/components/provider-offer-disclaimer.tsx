// erie-pro/src/components/provider-offer-disclaimer.tsx

import { PROVIDER_OFFER_DISCLAIMERS } from "@/lib/provider-offer-compliance"

export function ProviderOfferDisclaimer({ variant = "general" }: { variant?: keyof typeof PROVIDER_OFFER_DISCLAIMERS }) {
  return (
    <p className="text-xs leading-relaxed text-muted-foreground" role="note">
      {PROVIDER_OFFER_DISCLAIMERS[variant]}
    </p>
  )
}
