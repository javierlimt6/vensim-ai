import {
  buildSystemPrompt,
  buildImagePrompt,
  type GenerateOptions,
} from "@/lib/mdl-format";

export const runtime = 'edge';
export const maxDuration = 120;

// Helper: strip <think>...</think> blocks from thinking models
function stripThinkingTags(text: string): string {
  return text.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
}

// Helper: send an SSE event
function sseEvent(data: Record<string, unknown>): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

// Helper: call OpenRouter
async function callOpenRouter(
  apiKey: string,
  model: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  messages: any[],
  temperature: number,
  maxTokens: number
) {
  return fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://vensim-ai.local",
      "X-Title": "Vensim AI",
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
    }),
  });
}

const MODEL = "qwen/qwen3-vl-235b-a22b-thinking";

export async function POST(request: Request) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(sseEvent(data)));
      };

      try {
        const body = await request.json();
        const {
          description,
          initialTime,
          finalTime,
          timeStep,
          timeUnits,
          diagramType,
          imageBase64,
          imageMimeType,
        } = body;

        if (!description && !imageBase64) {
          send({ type: "error", error: "Please provide a description or upload a diagram image." });
          controller.close();
          return;
        }

        const openRouterKey = process.env.OPENROUTER_API_KEY;
        if (!openRouterKey || openRouterKey === "YOUR_OPENROUTER_API_KEY_HERE") {
          send({ type: "error", error: "OPENROUTER_API_KEY is not configured on the server." });
          controller.close();
          return;
        }

        const options: GenerateOptions = {
          initialTime,
          finalTime,
          timeStep,
          timeUnits,
          diagramType,
        };

        const totalSteps = 2;

        // ── Step 1: Call the model ───────────────────────────────────────
        let messages;

        if (imageBase64) {
          // Image path: multimodal message
          const prompt = buildImagePrompt(options, description || "");
          const dataUrl = `data:${imageMimeType || "image/png"};base64,${imageBase64}`;

          send({
            type: "progress",
            step: 1,
            totalSteps,
            message: "Analyzing diagram and generating model...",
            detail: `Using ${MODEL} to read diagram and create .mdl file`,
          });

          messages = [
            {
              role: "user",
              content: [
                { type: "image_url", image_url: { url: dataUrl } },
                { type: "text", text: prompt },
              ],
            },
          ];
        } else {
          // Text path: text-only message
          const prompt = buildSystemPrompt(description!, options);

          send({
            type: "progress",
            step: 1,
            totalSteps,
            message: "Generating Vensim model from description...",
            detail: `Using ${MODEL} to create .mdl file`,
          });

          messages = [{ role: "user", content: prompt }];
        }

        const response = await callOpenRouter(
          openRouterKey,
          MODEL,
          messages,
          imageBase64 ? 0.3 : 0.5,
          32768
        );

        if (!response.ok) {
          const errText = await response.text();
          console.error("OpenRouter error:", errText);
          send({ type: "error", error: `Model returned ${response.status}: ${errText}` });
          controller.close();
          return;
        }

        const data = await response.json();
        let mdlContent = data.choices?.[0]?.message?.content || "";

        // ── Step 2: Cleanup ─────────────────────────────────────────────
        send({
          type: "progress",
          step: 2,
          totalSteps,
          message: "Cleaning up and validating model...",
          detail: "Stripping thinking blocks and formatting",
        });

        // Strip thinking tags from thinking model
        mdlContent = stripThinkingTags(mdlContent);

        // Strip markdown fences
        mdlContent = mdlContent
          .replace(/^```(?:vensim|mdl|text)?\s*\n?/i, "")
          .replace(/\n?```\s*$/i, "")
          .trim();

        // Find {UTF-8} start
        if (!mdlContent.startsWith("{UTF-8}")) {
          const idx = mdlContent.indexOf("{UTF-8}");
          if (idx > 0) {
            mdlContent = mdlContent.substring(idx);
          }
        }

        if (!mdlContent || mdlContent.length < 50) {
          console.error("Model output too short:", mdlContent.substring(0, 300));
          send({
            type: "error",
            error: "The model returned an empty or invalid response. Please try again.",
          });
          controller.close();
          return;
        }

        send({ type: "done", mdl: mdlContent });
        controller.close();
      } catch (err: unknown) {
        console.error("Generation error:", err);
        controller.enqueue(
          encoder.encode(
            sseEvent({
              type: "error",
              error: err instanceof Error ? err.message : "Internal server error",
            })
          )
        );
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
