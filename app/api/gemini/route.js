export const dynamic = "force-dynamic";

// POST /api/gemini
// Body: { image: "<base64 string>", mimeType: "image/jpeg" | "image/png" }
// Returns: { balance: number, currency: string, confidence: "high"|"medium"|"low", raw: string }

import { NextResponse } from "next/server";
import { getDb, initDb, getSetting } from "@/lib/db";

export async function POST(request) {
  try {
    await initDb();

    const apiKey = await getSetting("gemini_api_key");
    if (!apiKey) {
      return NextResponse.json(
        { error: "Gemini API key not configured. Go to Admin → Credentials to add it." },
        { status: 503 }
      );
    }

    const model = (await getSetting("gemini_model")) || "gemini-2.5-flash-preview-04-17";
    const body  = await request.json();
    const { image, mimeType = "image/jpeg" } = body;

    if (!image) {
      return NextResponse.json({ error: "image (base64) required" }, { status: 400 });
    }

    // ── Build Gemini request ──────────────────────────────────────────────────
    const prompt = `You are reading a financial account screenshot.
Your job is to extract the CURRENT account balance shown on screen.

Rules:
- Return ONLY valid JSON, nothing else.
- The balance must be a plain number (no currency symbols, no commas).
- If you see multiple balances (available, current, total), prefer the TOTAL or CURRENT balance.
- currency should be "AUD" or "USD" based on what you see — default to "AUD" if unclear.
- confidence: "high" if the number is clear, "medium" if there's some ambiguity, "low" if you're guessing.
- If you cannot find any balance at all, return { "balance": null, "currency": "AUD", "confidence": "low", "raw": "not found" }

Respond with exactly this JSON shape:
{
  "balance": 12345.67,
  "currency": "AUD",
  "confidence": "high",
  "raw": "the exact text you read from the image"
}`;

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              { inline_data: { mime_type: mimeType, data: image } },
            ],
          }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 256,
          },
        }),
      }
    );

    if (!geminiRes.ok) {
      const err = await geminiRes.text();
      console.error("Gemini API error:", err);
      return NextResponse.json({ error: "Gemini API error", detail: err }, { status: 502 });
    }

    const geminiData = await geminiRes.json();

    // Extract text from response
    const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Parse JSON from response — strip any markdown fences
    const clean = rawText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(clean);
    } catch {
      console.error("Gemini non-JSON response:", rawText);
      return NextResponse.json(
        { error: "Could not parse Gemini response", raw: rawText },
        { status: 422 }
      );
    }

    if (parsed.balance === null || parsed.balance === undefined) {
      return NextResponse.json({ balance: null, currency: "AUD", confidence: "low", raw: parsed.raw });
    }

    return NextResponse.json({
      balance:    parseFloat(parsed.balance),
      currency:   parsed.currency || "AUD",
      confidence: parsed.confidence || "medium",
      raw:        parsed.raw || "",
    });

  } catch (err) {
    console.error("POST /api/gemini:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
