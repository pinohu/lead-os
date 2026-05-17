// ── YouTube Data API v3 client ───────────────────────────────────────
// Thin wrapper around the public YouTube Data API v3. Used by the
// curation vetting pipeline to fetch candidate videos.
//
// Requires YOUTUBE_API_KEY env var. Get a key at:
//   https://console.cloud.google.com/apis/credentials
// Enable "YouTube Data API v3" on the project.
//
// Quota notes: as of 2026, default daily quota is 10,000 units.
//   • search.list = 100 units per call
//   • videos.list = 1 unit per video (we batch up to 50)
//   • channels.list = 1 unit per call
// A full cluster vet (10 channels, 30 vids each, scored) ≈ 50-100 units.

import type { VideoCandidate } from "@/lib/youtube/score-video";
import { iso8601DurationToSeconds } from "@/lib/youtube/score-video";

const API_BASE = "https://www.googleapis.com/youtube/v3";

function requireApiKey(): string {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) {
    throw new Error(
      "YOUTUBE_API_KEY not set. Get a key from https://console.cloud.google.com/apis/credentials and add to .env.local"
    );
  }
  return key;
}

interface RawSearchItem {
  id: { videoId?: string; kind: string };
  snippet: {
    title: string;
    description: string;
    channelTitle: string;
    publishedAt: string;
  };
}

interface RawVideoItem {
  id: string;
  snippet: {
    title: string;
    description: string;
    channelTitle: string;
    publishedAt: string;
  };
  contentDetails: { duration: string };
  statistics: {
    viewCount?: string;
    likeCount?: string;
    commentCount?: string;
  };
  status?: { madeForKids?: boolean };
}

interface RawChannelItem {
  id: string;
  snippet: {
    title: string;
    customUrl?: string;
  };
  contentDetails?: {
    relatedPlaylists?: { uploads?: string };
  };
}

// ── Resolve channel handle → uploads playlist ID ─────────────────────

/**
 * Convert a channel handle (e.g. "@thisoldhouse") into the channel's
 * uploads playlist ID. We fetch from uploads because it's the cheapest
 * way to get a channel's recent videos (vs. search.list which is 100×
 * more expensive per call).
 */
export async function resolveChannelHandleToUploadsPlaylist(
  handleOrId: string
): Promise<{ channelId: string; uploadsPlaylistId: string; channelTitle: string } | null> {
  const key = requireApiKey();
  const isHandle = handleOrId.startsWith("@");
  const params = new URLSearchParams({
    key,
    part: "snippet,contentDetails",
    ...(isHandle ? { forHandle: handleOrId } : { id: handleOrId }),
  });

  const res = await fetch(`${API_BASE}/channels?${params}`);
  if (!res.ok) {
    throw new Error(`channels.list failed: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as { items?: RawChannelItem[] };
  const item = data.items?.[0];
  if (!item) return null;
  const uploads = item.contentDetails?.relatedPlaylists?.uploads;
  if (!uploads) return null;

  return {
    channelId: item.id,
    uploadsPlaylistId: uploads,
    channelTitle: item.snippet.title,
  };
}

// ── Fetch recent videos from a playlist (= channel uploads) ──────────

interface PlaylistItemRow {
  contentDetails: { videoId: string; videoPublishedAt?: string };
}

export async function getRecentVideoIdsFromPlaylist(
  playlistId: string,
  maxResults = 25
): Promise<string[]> {
  const key = requireApiKey();
  const params = new URLSearchParams({
    key,
    part: "contentDetails",
    playlistId,
    maxResults: String(Math.min(50, maxResults)),
  });
  const res = await fetch(`${API_BASE}/playlistItems?${params}`);
  if (!res.ok) {
    throw new Error(`playlistItems.list failed: ${res.status}`);
  }
  const data = (await res.json()) as { items?: PlaylistItemRow[] };
  return (data.items ?? [])
    .map((i) => i.contentDetails.videoId)
    .filter(Boolean);
}

// ── Fetch full metadata for a batch of video IDs ─────────────────────

export async function getVideoMetadata(
  videoIds: string[]
): Promise<VideoCandidate[]> {
  if (videoIds.length === 0) return [];
  const key = requireApiKey();

  // API caps id list at 50 per call
  const chunks: string[][] = [];
  for (let i = 0; i < videoIds.length; i += 50) {
    chunks.push(videoIds.slice(i, i + 50));
  }

  const out: VideoCandidate[] = [];
  for (const chunk of chunks) {
    const params = new URLSearchParams({
      key,
      part: "snippet,contentDetails,statistics,status",
      id: chunk.join(","),
    });
    const res = await fetch(`${API_BASE}/videos?${params}`);
    if (!res.ok) {
      throw new Error(`videos.list failed: ${res.status}`);
    }
    const data = (await res.json()) as { items?: RawVideoItem[] };
    for (const v of data.items ?? []) {
      out.push({
        videoId: v.id,
        title: v.snippet.title,
        description: v.snippet.description,
        channelTitle: v.snippet.channelTitle,
        publishedAt: v.snippet.publishedAt,
        durationSec: iso8601DurationToSeconds(v.contentDetails.duration),
        viewCount: parseInt(v.statistics.viewCount ?? "0", 10),
        likeCount: parseInt(v.statistics.likeCount ?? "0", 10),
        commentCount: parseInt(v.statistics.commentCount ?? "0", 10),
        commentsDisabled: v.statistics.commentCount === undefined,
      });
    }
  }
  return out;
}

// ── Search ───────────────────────────────────────────────────────────

export async function searchVideoIds(
  query: string,
  maxResults = 10
): Promise<string[]> {
  const key = requireApiKey();
  const params = new URLSearchParams({
    key,
    part: "snippet",
    q: query,
    type: "video",
    maxResults: String(Math.min(50, maxResults)),
    relevanceLanguage: "en",
    videoEmbeddable: "true", // ensure embedding allowed (needed for Viloud)
  });
  const res = await fetch(`${API_BASE}/search?${params}`);
  if (!res.ok) {
    throw new Error(`search.list failed: ${res.status}`);
  }
  const data = (await res.json()) as { items?: RawSearchItem[] };
  return (data.items ?? [])
    .map((i) => i.id.videoId)
    .filter((id): id is string => Boolean(id));
}

// ── Combined helper: channel handle → scored-ready candidates ────────

/**
 * For a given channel handle, fetch recent videos with full metadata.
 * Single entry point used by the vetting CLI.
 */
export async function getChannelCandidates(
  handle: string,
  maxResults = 20
): Promise<{ channelTitle: string; videos: VideoCandidate[] } | null> {
  const resolved = await resolveChannelHandleToUploadsPlaylist(handle);
  if (!resolved) return null;
  const videoIds = await getRecentVideoIdsFromPlaylist(
    resolved.uploadsPlaylistId,
    maxResults
  );
  if (videoIds.length === 0) {
    return { channelTitle: resolved.channelTitle, videos: [] };
  }
  const videos = await getVideoMetadata(videoIds);
  return { channelTitle: resolved.channelTitle, videos };
}
