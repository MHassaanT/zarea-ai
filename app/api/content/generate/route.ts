// app/api/content/generate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { template, clientName, visaType, tone, customPrompt } = body;

    if (!template) {
      return NextResponse.json({ error: "Template is required" }, { status: 400 });
    }

    // ✅ Load API key
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
      console.error("❌ GOOGLE_GENERATIVE_AI_API_KEY is missing in env");
      return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }); // ✅ Correct model name

    const systemPrompt = `
You are Zarea AI, a professional assistant for UK immigration consultants.
Always write from the consultant’s perspective to the client.
Tone: ${tone}.
`;

    const contentPrompt = `
Template: ${template.name}
Visa Type: ${visaType || "N/A"}
Client: ${clientName || "N/A"}
${customPrompt || ""}
`;

    console.log("🟡 Sending prompt:", contentPrompt.slice(0, 150) + "...");

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: `${systemPrompt}\n\n${contentPrompt}` }],
        },
      ],
    });

    const text = result.response.text();
    console.log("✅ Gemini response:", text.slice(0, 150) + "...");

    return NextResponse.json({
      content: text,
      template: template.name,
      type: template.type,
    });
  } catch (error: any) {
    console.error("❌ Content generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate content", details: String(error) },
      { status: 500 }
    );
  }
}
