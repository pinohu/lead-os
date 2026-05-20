import { spawn } from "node:child_process";
import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { nanoid } from "nanoid";
import { flags } from "../../../config/src/flags.js";
import { VimaxPlanningPacket } from "./vimaxPlanningPacket.js";
import { VimaxResult, parseVimaxResult } from "./vimaxResultParser.js";
import { runVimaxMock } from "./vimaxMockRunner.js";

export interface InvokeVimaxArgs {
  jobId: string;
  packet: Omit<VimaxPlanningPacket, "packetVersion" | "meta">;
}

export async function invokeVimax(args: InvokeVimaxArgs): Promise<{ packet: VimaxPlanningPacket; result: VimaxResult }> {
  const packet: VimaxPlanningPacket = {
    packetVersion: "kwode/vimax/1",
    ...args.packet,
    meta: { createdAt: new Date().toISOString(), correlationId: nanoid() },
  };

  if (!flags.vimaxEnabled) {
    return { packet, result: await runVimaxMock(packet) };
  }

  try {
    // Persist the packet to disk in the configured ViMax workspace so the
    // user can inspect it or run ViMax against it manually.
    const workspace = process.env.VIMAX_WORKSPACE_PATH ?? "storage/generated/vimax";
    await mkdir(workspace, { recursive: true });
    const packetPath = join(workspace, `${args.jobId}-${packet.meta.correlationId}.packet.json`);
    await writeFile(packetPath, JSON.stringify(packet, null, 2), "utf8");

    const command = process.env.VIMAX_COMMAND;
    if (!command) {
      const mock = await runVimaxMock(packet);
      return {
        packet,
        result: {
          ...mock,
          notes: `VIMAX_ENABLED=true but VIMAX_COMMAND is empty. Packet was written to ${packetPath} for manual ViMax invocation. Returning mock manifest.`,
        },
      };
    }
    const out = await runChild(command, ["plan", "--packet", packetPath], "");
    return { packet, result: parseVimaxResult(out, args.jobId) };
  } catch (err) {
    const fallback = await runVimaxMock(packet);
    return {
      packet,
      result: {
        ...fallback,
        status: "failed",
        error: (err as Error).message,
        notes: `ViMax invocation failed; mock manifest used. Error: ${(err as Error).message}`,
      },
    };
  }
}

function runChild(cmd: string, argv: string[], stdin: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, argv, { env: process.env });
    let out = "";
    let err = "";
    child.stdout.on("data", (d) => (out += d.toString()));
    child.stderr.on("data", (d) => (err += d.toString()));
    child.on("error", reject);
    child.on("close", (code) => (code === 0 ? resolve(out) : reject(new Error(`ViMax exited ${code}: ${err}`))));
    if (stdin) {
      child.stdin.write(stdin);
    }
    child.stdin.end();
  });
}
