// ── Viloud channel config schema ─────────────────────────────────────
// Types describing the YAML config that the auto-provision script reads.
// One config file per channel. Sample config alongside this file.

import { z } from "zod";

/** A single video in the channel rotation. */
export const ViloudVideoSchema = z.object({
  /** YouTube video ID (the part after v= in the URL) */
  youtubeId: z.string().min(8).max(20),
  /** Display title in Viloud's playlist (defaults to YouTube's title) */
  title: z.string().min(1).max(200).optional(),
  /** Which programming block this video belongs to (informational only) */
  block: z.number().int().min(1).max(20).optional(),
  /** Free-form notes for the curator (not pushed to Viloud) */
  notes: z.string().max(500).optional(),
});

export type ViloudVideo = z.infer<typeof ViloudVideoSchema>;

/** A full channel config: name, description, list of videos. */
export const ViloudChannelConfigSchema = z.object({
  /** Channel slug used in this repo (matches VILOUD_CHANNEL_IDS keys) */
  slug: z.string().min(1).max(60).regex(/^[a-z0-9-]+$/),
  /** Display name in Viloud (e.g. "Erie Plumbing TV") */
  name: z.string().min(1).max(80),
  /** Public channel description */
  description: z.string().min(1).max(500),
  /** Erie-pro niche slugs this channel serves (for VILOUD_CHANNEL_IDS mapping) */
  niches: z.array(z.string().regex(/^[a-z0-9-]+$/)).min(1),
  /** Ordered list of videos to add */
  videos: z.array(ViloudVideoSchema).min(1).max(200),
  /** Optional: existing Viloud channel ID if updating rather than creating */
  existingChannelId: z.string().length(32).optional(),
});

export type ViloudChannelConfig = z.infer<typeof ViloudChannelConfigSchema>;

/** Multi-channel config (top-level YAML structure). */
export const ViloudProvisionConfigSchema = z.object({
  /** Login credentials are read from env, not the config file */
  channels: z.array(ViloudChannelConfigSchema).min(1),
});

export type ViloudProvisionConfig = z.infer<typeof ViloudProvisionConfigSchema>;
