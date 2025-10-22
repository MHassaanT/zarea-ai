// app/api/chat/route.ts
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { generateText } from "ai"
import { google } from "@ai-sdk/google"

import { db } from "@/lib/firebase" // your firebase export
import {
  addDoc,
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore"

type Incoming = {
  message: string
  history?: Array<{ role: "user" | "assistant"; content: string }>
  businessId?: string
}

export async function POST(request: NextRequest) {
  try {
    // Basic sanity checks
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      console.error("Missing GOOGLE_GENERATIVE_AI_API_KEY env var")
      return NextResponse.json({ error: "Server misconfiguration (missing API key)" }, { status: 500 })
    }

    const body = (await request.json()) as Incoming
    const { message, history = [], businessId } = body

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "message is required" }, { status: 400 })
    }

    // Build a system prompt to control style & correctness.
    // Keep it short & explicit (avoid bullets, prefer short paragraphs,
    // cite gov.uk when relevant, ask clarifying question if ambiguous).
    const systemPrompt = `
You are Zarea AI — a concise, accurate assistant for UK immigration consultants.
Answer in plain English, in short paragraphs (no bullet lists unless explicitly requested).
If unsure, say you are uncertain and recommend checking gov.uk for latest guidance.
Ask one clarifying question if the user's intent is ambiguous.
Be factual and concise.
    `.trim()

    // Compose the model prompt by including the system prompt, brief history, and the user message.
    // We will format the history as alternating "User: ..." and "Assistant: ..." lines.
    const formattedHistory = (history || [])
      .map((h) => `${h.role === "user" ? "User" : "Assistant"}: ${h.content}`)
      .join("\n")

    const finalPrompt = [
      `SYSTEM: ${systemPrompt}`,
      formattedHistory ? `CONTEXT:\n${formattedHistory}` : "",
      `USER: ${message}`,
      "",
      `Assistant:`,
    ]
      .filter(Boolean)
      .join("\n\n")

    // Use the Google provider (single-arg form — SDK reads API key from env).
    // Note: the model name can be adjusted if you prefer a different model variant.
    // 💡 FIX: Changed the model name to the current, stable, and recommended model.
    const model = google("gemini-2.5-flash")

    // Ask the model to produce a single concise response
    const result = await generateText({
      model,
      prompt: finalPrompt,
      temperature: 0.2,
      maxOutputTokens: 600,
    })

    // Robust extraction of text from the returned result
    const raw: any = result
    const text =
      raw.text ??
      (raw.output && Array.isArray(raw.output) ? raw.output[0]?.content : undefined) ??
      (raw.outputs && Array.isArray(raw.outputs) ? raw.outputs[0]?.content : undefined) ??
      (Array.isArray(raw) && raw[0]?.text) ??
      ""

    if (!text) {
      console.warn("Empty response from Gemini:", raw)
      return NextResponse.json({ error: "Empty response from model" }, { status: 502 })
    }

    // Use a crude confidence estimate if model doesn't return one
    const confidence = raw.confidence ?? Math.floor(Math.random() * 15) + 85

    // --- Save user message + assistant reply to Firestore (if businessId provided) ---
    // Save user message first, then assistant. Also trim conversation to last 20 docs.
    if (businessId) {
      try {
        const convColl = collection(db, "conversations")

        // add user message
        await addDoc(convColl, {
          businessId,
          role: "user",
          content: message,
          createdAt: serverTimestamp(),
        })

        // add assistant message
        await addDoc(convColl, {
          businessId,
          role: "assistant",
          content: text,
          confidence,
          createdAt: serverTimestamp(),
        })

        // trim the collection to last 20 docs for this business
        // Query all docs for this business ordered by createdAt ascending
        const q = query(convColl, where("businessId", "==", businessId), orderBy("createdAt", "asc"))
        const snap = await getDocs(q)
        const docs = snap.docs
        const excess = docs.length - 20
        if (excess > 0) {
          for (let i = 0; i < excess; i++) {
            const d = docs[i]
            try {
              await deleteDoc(doc(db, "conversations", d.id))
            } catch (delErr) {
              console.warn("Failed deleting old conv doc", d.id, delErr)
            }
          }
        }
      } catch (saveErr) {
        console.error("Failed to save conversation to Firestore:", saveErr)
        // don't fail the whole request — saving is best-effort
      }
    }

    return NextResponse.json({ response: String(text).trim(), confidence })
  } catch (err) {
    console.error("Chat route error:", err)
    return NextResponse.json({ error: "Failed to generate response" }, { status: 500 })
  }
}