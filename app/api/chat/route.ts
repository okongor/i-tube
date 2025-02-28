import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message } = body;

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "Google Gemini API key is not configured" }, { status: 500 });
    }

    // Use the correct model that works with free tier (Gemini 1.5 models may work)
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: message }] }],
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.error("Google Gemini API Error:", error);
      return NextResponse.json(
        { error: error.error?.message || `API responded with status ${response.status}` },
        { status: response.status }
      );
    }

    const result = await response.json();

    if (!result?.candidates || result.candidates.length === 0) {
      return NextResponse.json({ error: "Empty response from AI service" }, { status: 500 });
    }

    const aiResponse = result.candidates[0]?.content?.parts?.[0]?.text?.trim() || "No response generated.";

    return NextResponse.json({ response: aiResponse });
  } catch (error) {
    console.error("Chat API Error:", error);
    return NextResponse.json(
      {
        error: "Failed to process request",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
