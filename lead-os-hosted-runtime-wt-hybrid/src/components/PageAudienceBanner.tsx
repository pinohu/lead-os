import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { getPageAudienceForPath } from "@/lib/page-audience";

export function PageAudienceBanner({ pathname }: { pathname: string }) {
  const audience = getPageAudienceForPath(pathname);

  if (!audience.showBanner) return null;

  return (
    <section className="border-b border-border/60 bg-muted/30" aria-label="Page audience">
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-3 text-sm md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <Badge variant="outline">{audience.kind}</Badge>
          <span className="font-semibold text-foreground">Serves:</span>
          <span className="min-w-0 text-muted-foreground">{audience.servedAudience}</span>
        </div>
        <div className="flex min-w-0 flex-wrap items-center gap-2 text-muted-foreground">
          <span className="font-semibold text-foreground">Purpose:</span>
          <span>{audience.pagePurpose}</span>
          <Link href="/audience-map" className="font-semibold text-primary hover:underline">
            Audience map
          </Link>
        </div>
      </div>
    </section>
  );
}
