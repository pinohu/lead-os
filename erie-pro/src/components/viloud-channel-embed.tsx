/**
 * ViloudChannelEmbed
 *
 * Embeds a Viloud 24/7 linear TV channel for a niche. Renders nothing when no
 * channel ID is configured for that niche — safe to drop on every niche page
 * and populate channels incrementally.
 *
 * The wrapping div maintains a 16:9 aspect ratio via padding-bottom trick so
 * the iframe scales cleanly across breakpoints.
 *
 * Channel ID source: `src/lib/viloud-channels.ts` → `VILOUD_CHANNEL_IDS`.
 */

import { getViloudChannelId } from "@/lib/viloud-channels";

interface ViloudChannelEmbedProps {
  nicheSlug: string;
  nicheLabel: string;
  /** Show the section header + description? Defaults true. */
  withHeader?: boolean;
  /** Optional className for the outer section. */
  className?: string;
}

export function ViloudChannelEmbed({
  nicheSlug,
  nicheLabel,
  withHeader = true,
  className = "",
}: ViloudChannelEmbedProps) {
  const channelId = getViloudChannelId(nicheSlug);

  // No channel configured for this niche yet — render nothing.
  if (!channelId) return null;

  // Audit M9: dropped autoplay=1 from the URL. WCAG 1.4.2 discourages
  // unconditional autoplay > 3s; also reduces mobile data cost on landing.
  // Visitor presses the iframe play control to begin.
  const embedUrl = `https://app.viloud.tv/player/embed/channel/${channelId}?volume=1&controls=1&title=1&share=1`;

  return (
    <section
      className={`my-10 ${className}`}
      aria-label={`${nicheLabel} TV channel`}
      data-testid="viloud-channel-embed"
    >
      {withHeader && (
        <div className="mb-4">
          <h2 className="text-2xl font-semibold tracking-tight">
            {nicheLabel} TV — always on
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            A 24/7 stream of educational {nicheLabel.toLowerCase()} content
            curated for Erie homeowners. New programs drop weekly.
          </p>
        </div>
      )}

      {/* 16:9 responsive wrapper */}
      <div
        className="relative w-full overflow-hidden rounded-lg bg-black shadow-md"
        style={{ paddingBottom: "56.25%" }}
      >
        <iframe
          src={embedUrl}
          title={`${nicheLabel} TV channel`}
          className="absolute inset-0 h-full w-full"
          frameBorder={0}
          allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
    </section>
  );
}

export default ViloudChannelEmbed;
