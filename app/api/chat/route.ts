import { runAgentLoop } from "@/lib/agent/loop";
import type { Message } from "@/lib/agent/types";

export async function POST(request: Request) {
  let body: { message: string; history: Message[]; guideMode?: boolean };
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const { message, history, guideMode } = body;
  if (!message || typeof message !== "string") {
    return new Response("message is required", { status: 400 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of runAgentLoop(message, history || [], { guideMode })) {
          const data = `data: ${JSON.stringify(event)}\n\n`;
          controller.enqueue(encoder.encode(data));
        }
      } catch (error) {
        const errorEvent = {
          type: "error",
          message:
            error instanceof Error ? error.message : "Unknown error",
        };
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(errorEvent)}\n\n`)
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
