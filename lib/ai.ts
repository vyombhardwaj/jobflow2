import { GoogleGenAI, type GenerateContentConfig } from "@google/genai";

const DEFAULT_MODEL = "gemini-3.5-flash-lite";

export function getGeminiServiceFailure(error: unknown) {
  if (!error || typeof error !== "object" || !("status" in error) || typeof error.status !== "number") {
    return null;
  }

  if (error.status === 429) {
    return { status: 429, message: "Gemini is rate-limited right now. Please wait a moment and try again." };
  }
  if (error.status === 503) {
    return { status: 503, message: "Gemini is temporarily busy. Please try again shortly." };
  }
  return null;
}

export function isGeminiConfigured() {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  return Boolean(apiKey && apiKey !== "your-gemini-api-key");
}

export async function generateWithGemini(prompt: string, config: GenerateContentConfig = {}) {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey || apiKey === "your-gemini-api-key") {
    throw new Error("Gemini AI is not configured. Set GEMINI_API_KEY in the server environment.");
  }

  const client = new GoogleGenAI({ apiKey });
  const response = await client.models.generateContent({
    model: process.env.GEMINI_MODEL?.trim() || DEFAULT_MODEL,
    contents: prompt,
    config,
  });
  const text = response.text?.trim();
  if (!text) throw new Error("Gemini returned an empty response.");
  return text;
}
