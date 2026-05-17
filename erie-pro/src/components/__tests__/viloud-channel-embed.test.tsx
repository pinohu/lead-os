// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { ViloudChannelEmbed } from "../viloud-channel-embed";

// Mock the channel lookup so tests are deterministic regardless of real config
vi.mock("@/lib/viloud-channels", () => ({
  getViloudChannelId: (slug: string) => {
    if (slug === "configured-niche") return "abc123def456abc123def456abc123de";
    return null;
  },
}));

describe("ViloudChannelEmbed", () => {
  it("renders nothing when no channel ID is configured for the niche", () => {
    const { container } = render(
      <ViloudChannelEmbed nicheSlug="not-configured" nicheLabel="Not Configured" />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders an iframe with the correct Viloud embed URL when configured", () => {
    render(
      <ViloudChannelEmbed nicheSlug="configured-niche" nicheLabel="Plumbing" />
    );
    const iframe = screen.getByTitle("Plumbing TV channel");
    expect(iframe).toBeTruthy();
    const src = iframe.getAttribute("src") ?? "";
    expect(src).toContain("app.viloud.tv/player/embed/channel/abc123def456abc123def456abc123de");
    expect(src).toContain("autoplay=1");
    expect(iframe.getAttribute("allow")).toContain("autoplay");
    expect(iframe.hasAttribute("allowfullscreen")).toBe(true);
  });

  it("uses lazy loading on the iframe to avoid blocking page render", () => {
    render(
      <ViloudChannelEmbed nicheSlug="configured-niche" nicheLabel="Plumbing" />
    );
    const iframe = screen.getByTitle("Plumbing TV channel");
    expect(iframe.getAttribute("loading")).toBe("lazy");
  });

  it("renders the header section by default with the niche label", () => {
    render(
      <ViloudChannelEmbed nicheSlug="configured-niche" nicheLabel="HVAC" />
    );
    expect(screen.getByText(/HVAC TV — always on/)).toBeTruthy();
  });

  it("hides the header when withHeader is false", () => {
    render(
      <ViloudChannelEmbed
        nicheSlug="configured-niche"
        nicheLabel="HVAC"
        withHeader={false}
      />
    );
    expect(screen.queryByText(/HVAC TV — always on/)).toBeNull();
    // But iframe still renders
    expect(screen.getByTitle("HVAC TV channel")).toBeTruthy();
  });

  it("passes through aria-label for screen readers", () => {
    render(
      <ViloudChannelEmbed nicheSlug="configured-niche" nicheLabel="Roofing" />
    );
    const section = screen.getByLabelText("Roofing TV channel");
    expect(section).toBeTruthy();
  });
});
