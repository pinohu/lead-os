import { tools, getToolByName } from "./tools.ts";
import * as readline from "readline";

const SERVER_NAME = "lead-os";
const SERVER_VERSION = "0.1.0";
const PROTOCOL_VERSION = "2024-11-05";

interface JsonRpcRequest {
  jsonrpc: "2.0";
  id: number | string;
  method: string;
  params?: Record<string, unknown>;
}

interface JsonRpcResponse {
  jsonrpc: "2.0";
  id: number | string;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
}

interface JsonRpcNotification {
  jsonrpc: "2.0";
  method: string;
  params?: Record<string, unknown>;
}

type JsonRpcMessage = JsonRpcRequest | JsonRpcNotification;

function isRequest(msg: JsonRpcMessage): msg is JsonRpcRequest {
  return "id" in msg && msg.id !== undefined;
}

function successResponse(id: number | string, result: unknown): JsonRpcResponse {
  return { jsonrpc: "2.0", id, result };
}

function errorResponse(id: number | string, code: number, message: string, data?: unknown): JsonRpcResponse {
  return { jsonrpc: "2.0", id, error: { code, message, data } };
}

const METHOD_NOT_FOUND = -32601;
const INVALID_PARAMS = -32602;
const INTERNAL_ERROR = -32603;
const PARSE_ERROR = -32700;

function handleInitialize(id: number | string): JsonRpcResponse {
  return successResponse(id, {
    protocolVersion: PROTOCOL_VERSION,
    capabilities: {
      tools: {},
    },
    serverInfo: {
      name: SERVER_NAME,
      version: SERVER_VERSION,
    },
  });
}

function handleToolsList(id: number | string): JsonRpcResponse {
  const toolDefinitions = tools.map((t) => ({
    name: t.name,
    description: t.description,
    inputSchema: t.inputSchema,
  }));
  return successResponse(id, { tools: toolDefinitions });
}

async function handleToolsCall(id: number | string, params: Record<string, unknown>): Promise<JsonRpcResponse> {
  const toolName = params.name as string | undefined;
  if (!toolName) {
    return errorResponse(id, INVALID_PARAMS, "Missing required parameter: name");
  }

  const tool = getToolByName(toolName);
  if (!tool) {
    return errorResponse(id, METHOD_NOT_FOUND, `Unknown tool: ${toolName}`);
  }

  const toolArguments = (params.arguments ?? {}) as Record<string, unknown>;

  const required = (tool.inputSchema.required ?? []) as string[];
  const missingParams: string[] = [];
  for (const param of required) {
    if (toolArguments[param] === undefined || toolArguments[param] === null) {
      missingParams.push(param);
    }
  }

  if (missingParams.length > 0) {
    return errorResponse(
      id,
      INVALID_PARAMS,
      `Missing required parameters: ${missingParams.join(", ")}`,
      { missing: missingParams },
    );
  }

  try {
    const result = await tool.handler(toolArguments);
    return successResponse(id, {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return successResponse(id, {
      content: [
        {
          type: "text",
          text: JSON.stringify({ error: message }),
        },
      ],
      isError: true,
    });
  }
}

async function dispatch(msg: JsonRpcMessage): Promise<JsonRpcResponse | null> {
  if (!isRequest(msg)) {
    return null;
  }

  switch (msg.method) {
    case "initialize":
      return handleInitialize(msg.id);

    case "tools/list":
      return handleToolsList(msg.id);

    case "tools/call":
      return handleToolsCall(msg.id, msg.params ?? {});

    case "ping":
      return successResponse(msg.id, {});

    default:
      return errorResponse(msg.id, METHOD_NOT_FOUND, `Unknown method: ${msg.method}`);
  }
}

function send(response: JsonRpcResponse): void {
  const json = JSON.stringify(response);
  process.stdout.write(json + "\n");
}

export async function startMcpServer(): Promise<void> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false,
  });

  rl.on("line", async (line: string) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    let msg: JsonRpcMessage;
    try {
      msg = JSON.parse(trimmed) as JsonRpcMessage;
    } catch {
      send(errorResponse(0, PARSE_ERROR, "Invalid JSON"));
      return;
    }

    if (msg.jsonrpc !== "2.0") {
      if (isRequest(msg)) {
        send(errorResponse(msg.id, PARSE_ERROR, "Invalid JSON-RPC version"));
      }
      return;
    }

    const response = await dispatch(msg);
    if (response) {
      send(response);
    }
  });

  rl.on("close", () => {
    process.exit(0);
  });

  process.on("SIGINT", () => {
    process.exit(0);
  });

  process.on("SIGTERM", () => {
    process.exit(0);
  });
}
