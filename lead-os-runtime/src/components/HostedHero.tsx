import Link from "next/link";
import { buildDefaultFunnelGraphs } from "@/lib/funnel-library";
import { tenantConfig } from "@/lib/tenant";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function HostedHero() {
  const funnelCount = Object.keys(buildDefaultFunnelGraphs(tenantConfig.tenantId)).length;
  return (
    <section className="relative overflow-hidden" aria-labelledby="hosted-hero-heading">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
      <div className="relative max-w-4xl mx-auto text-center px-4 pt-12 pb-8">
        <Badge variant="secondary" className="mb-4 text-sm px-4 py-1.5">
          {tenantConfig.brandName} Runtime
        </Badge>
        <h1 id="hosted-hero-heading" className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground leading-[1.1] mb-4">
          {tenantConfig.brandName} as a funnel operating system
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-6">
          Deploy this runtime on a lead-focused subdomain and let external sites hand off chat,
          forms, assessments, webinars, checkout flows, and retention journeys into a centralized
          intelligence layer.
        </p>
        <div className="flex gap-3 justify-center flex-wrap mb-4">
          <Button asChild size="lg" className="text-base px-8 h-11">
            <Link href="/assess/general">Start Qualification Flow</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="text-base px-8 h-11">
            <Link href="/funnel/lead-magnet">View Default Funnel Graphs</Link>
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">Enabled funnel families: {funnelCount}</p>
      </div>
    </section>
  );
}
