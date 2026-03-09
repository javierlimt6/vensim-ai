import { NextRequest, NextResponse } from "next/server";
import { buildSystemPrompt, type GenerateOptions } from "@/lib/mdl-format";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      description,
      initialTime,
      finalTime,
      timeStep,
      timeUnits,
    } = body as {
      description: string;
      initialTime?: number;
      finalTime?: number;
      timeStep?: number;
      timeUnits?: string;
    };

    if (!description || description.trim().length === 0) {
      return NextResponse.json(
        { error: "Please provide a system description." },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "YOUR_GEMINI_API_KEY_HERE") {
      return NextResponse.json(
        {
          error:
            "Gemini API key is not configured. Please set GEMINI_API_KEY in .env.local",
        },
        { status: 500 }
      );
    }

    const options: GenerateOptions = {};
    if (initialTime !== undefined) options.initialTime = initialTime;
    if (finalTime !== undefined) options.finalTime = finalTime;
    if (timeStep !== undefined) options.timeStep = timeStep;
    if (timeUnits) options.timeUnits = timeUnits;

    const prompt = buildSystemPrompt(description, options);

    // Call Gemini API
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const geminiResponse = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 16384,
        },
      }),
    });

    if (!geminiResponse.ok) {
      const errText = await geminiResponse.text();
      console.error("Gemini API error:", errText);
      return NextResponse.json(
        { error: `Gemini API returned ${geminiResponse.status}: ${errText}` },
        { status: 502 }
      );
    }

    const geminiData = await geminiResponse.json();

    // Extract the text from the Gemini response
    const candidates = geminiData.candidates;
    if (!candidates || candidates.length === 0) {
      return NextResponse.json(
        { error: "Gemini returned no candidates." },
        { status: 502 }
      );
    }

    let mdlContent =
      candidates[0]?.content?.parts?.[0]?.text ?? "";

    // Clean up: strip markdown code fences if the model wrapped it
    mdlContent = mdlContent
      .replace(/^```[\w]*\n?/gm, "")
      .replace(/\n?```$/gm, "")
      .trim();

    // Ensure it starts with {UTF-8}
    if (!mdlContent.startsWith("{UTF-8}")) {
      mdlContent = "{UTF-8}\n" + mdlContent;
    }

    return NextResponse.json({ mdl: mdlContent });
  } catch (err: unknown) {
    console.error("Generate error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
