// erie-pro/src/components/emergency-mobile-call-bar.tsx
"use client"

import { Phone } from "lucide-react"
import { usePathname } from "next/navigation"
import { TrackedPhoneLink } from "@/components/tracked-phone-link"
import { organizationNap } from "@/lib/organization-nap"

export function EmergencyMobileCallBar() {
  const pathname = usePathname()
  const isEmergency =
    pathname === "/emergency" || pathname.endsWith("/emergency")

  if (!isEmergency) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background p-3 shadow-lg md:hidden">
      <TrackedPhoneLink
        phone={organizationNap.phone}
        className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-3 text-base font-semibold text-primary-foreground"
        sourcePageType="emergency_mobile_bar"
        routingModel="general"
      >
        <Phone className="h-5 w-5" aria-hidden />
        Call {organizationNap.phoneDisplay}
      </TrackedPhoneLink>
    </div>
  )
}
