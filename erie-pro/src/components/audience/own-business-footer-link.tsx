// erie-pro/src/components/audience/own-business-footer-link.tsx
import Link from "next/link"
import { getClaimProfileLinkPlacement, getPageAudienceConfig } from "@/lib/audience-context"

interface OwnBusinessFooterLinkProps {
  href: string
  className?: string
}

/** Small footer utility for unclaimed listings on consumer profile pages. */
export function OwnBusinessFooterLink({ href, className }: OwnBusinessFooterLinkProps) {
  const placement = getClaimProfileLinkPlacement(getPageAudienceConfig("consumer"), {
    isUnclaimedListing: true,
  })

  if (placement !== "footer-utility") return null

  return (
    <footer
      className={`border-t bg-muted/30 py-4 text-center text-sm text-muted-foreground ${className ?? ""}`}
      aria-label="Business owner"
    >
      <p>
        Own this business?{" "}
        <Link href={href} className="font-medium text-foreground underline-offset-4 hover:underline">
          Claim or update this listing
        </Link>
      </p>
    </footer>
  )
}
