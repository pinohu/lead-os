import { spawn } from "node:child_process";
import { nanoid } from "nanoid";
import { flags } from "../../../config/src/flags.js";
import { HermesTaskPacket, newPacket } from "./hermesTaskPacket.js";
import { HermesResult, parseHermesResult } from "./hermesResultParser.js";
import { runHermesMock } from "./hermesMockRunner.js";

export interface InvokeHermesArgs {
  agentId: string;
  agentDefinition: HermesTaskPacket["agentDefinition"];
  context: HermesTaskPacket["context"];
  task: HermesTaskPacket["task"];
  guardrails?: Partial<HermesTaskPacket["guardrails"]>;
}

/**
 * Invoke a Hermes agent.
 *
 * Behavior:
 * - If HERMES_ENABLED is false, return a deterministic mock result.
 * - If HERMES_ENABLED is true, spawn `HERMES_COMMAND` and pipe the packet
 *   to stdin. We capture stdout and parse it via parseHermesResult.
 *
 * The shape of the spawn call is intentionally minimal so it can be swapped
 * for a Hermes Gateway HTTP call later (HERMES_GATEWAY_ENABLED).
 */
export async function invokeHermes(args: InvokeHermesArgs): Promise<HermesResult> {
  const packet = newPacket({
    agentId: args.agentId,
    agentDefinition: args.agentDefinition,
    context: args.context,
    task: args.task,
    guardrails: {
      forbidden: args.guardrails?.forbidden ?? [],
      consentRequired: args.guardrails?.consentRequired ?? false,
      publicPublishing: args.guardrails?.publicPublishing ?? false,
    },
    correlationId: nanoid(),
  });

  if (!flags.hermesEnabled) {
    return runHermesMock(packet);
  }

  // Real Hermes path. This is intentionally cautious — if anything fails,
  // we fall back to the mock with the error in `notes` so the pipeline
  // doesn't stall.
  try {
    const command = process.env.HERMES_COMMAND ?? "hermes";
    const workspace = process.env.HERMES_WORKSPACE_PATH;
    const out = await runChild(command, ["run", "--stdin"], JSON.stringify(packet), workspace);
    return parseHermesResult(out, packet);
  } catch (err) {
    const fallback = await runHermesMock(packet);
    return {
      ...fallback,
      notes: `Hermes invocation failed; mock fallback used. Error: ${(err as Error).message}`,
    };
  }
}

function runChild(cmd: string, argv: string[], stdin: string, cwd?: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, argv, { cwd, env: process.env });
    let out = "";
    let err = "";
    child.stdout.on("data", (d) => (out += d.toString()));
    child.stderr.on("data", (d) => (err += d.toString()));
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve(out);
      else reject(new Error(`Hermes exited ${code}: ${err}`));
    });
    child.stdin.write(stdin);
    child.stdin.end();
  });
}
