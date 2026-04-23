import { requireAuth } from "@/lib/auth-middleware";
import { subscribe } from "@/lib/realtime";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { context, response } = await requireAuth(request);
  if (response) return response;

  const tenantId = context.tenantId;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const enqueue = (text: string) => {
        try {
          controller.enqueue(encoder.encode(text));
        } catch {
          // Controller already closed
        }
      };

      enqueue(`: connected\n\n`);

      const unsubscribe = subscribe(tenantId, (event) => {
        enqueue(`id: ${event.id}\n`);
        enqueue(`event: ${event.type}\n`);
        enqueue(`data: ${JSON.stringify(event)}\n\n`);
      });

      const heartbeat = setInterval(() => {
        enqueue(`: heartbeat\n\n`);
      }, 30000);

      request.signal.addEventListener("abort", () => {
        unsubscribe();
        clearInterval(heartbeat);
        try {
          controller.close();
        } catch {
          // Already closed
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
