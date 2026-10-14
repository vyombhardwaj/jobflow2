import { GoogleGenAI, type GenerateContentConfig } from "@google/genai";

const DEFAULT_MODEL = "gemini-2.5-flash";

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
