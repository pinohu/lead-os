import { flags } from "../../../config/src/flags.js";

export interface ComfyUIWorkflowRequest {
  jobId: string;
  workflow: Record<string, unknown>;
  prompt: string;
  width?: number;
  height?: number;
  steps?: number;
  seed?: number;
}

export interface ComfyUIResult {
  jobId: string;
  status: "queued" | "completed" | "failed" | "mocked";
  outputUris: string[];
  error?: string;
  mode: "mock" | "api";
}

export async function invokeComfyUI(req: ComfyUIWorkflowRequest): Promise<ComfyUIResult> {
  if (!flags.comfyuiEnabled || !process.env.COMFYUI_BASE_URL) {
    return {
      jobId: req.jobId,
      status: "mocked",
      outputUris: [`comfyui://mock/${req.jobId}/0001.png`],
      mode: "mock",
    };
  }
  try {
    const url = `${process.env.COMFYUI_BASE_URL!.replace(/\/$/, "")}/prompt`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: req.workflow }),
    });
    if (!res.ok) throw new Error(`ComfyUI HTTP ${res.status}`);
    const data = (await res.json()) as { prompt_id?: string };
    return {
      jobId: req.jobId,
      status: "queued",
      outputUris: [],
      mode: "api",
      // Real implementation would poll /history/<prompt_id> and translate to URIs.
      error: data.prompt_id ? undefined : "ComfyUI returned no prompt_id",
    };
  } catch (err) {
    return {
      jobId: req.jobId,
      status: "failed",
      outputUris: [],
      mode: "api",
      error: (err as Error).message,
    };
  }
}
