export interface VimaxResult {
  packetVersion: "kwode/vimax/1";
  jobId: string;
  status: "completed" | "failed" | "planned" | "mocked";
  assets: Array<{
    sceneOrder: number;
    kind: "image" | "video" | "audio";
    uri: string;
    durationSec?: number;
    mimeType?: string;
    notes?: string;
  }>;
  notes?: string;
  error?: string;
}

export function parseVimaxResult(raw: string, jobId: string): VimaxResult {
  try {
    const parsed = JSON.parse(raw);
    if (parsed?.packetVersion === "kwode/vimax/1") return parsed as VimaxResult;
    return {
      packetVersion: "kwode/vimax/1",
      jobId,
      status: "completed",
      assets: Array.isArray(parsed?.assets) ? parsed.assets : [],
      notes: typeof parsed?.notes === "string" ? parsed.notes : undefined,
    };
  } catch {
    return {
      packetVersion: "kwode/vimax/1",
      jobId,
      status: "failed",
      assets: [],
      error: "Unparseable ViMax output",
      notes: raw.slice(0, 4000),
    };
  }
}
