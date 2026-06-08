import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function fallbackCoverLetter(app: { company: string; role: string; location?: string | null; description?: string | null }, background: string, tone: string) {
  const company = app.company || "the company";
  const role = app.role || "this role";
  const toneIntro = tone === "enthusiastic" ? "I am excited to apply" : tone === "concise" ? "I am pleased to apply" : "I am writing to express my interest";
  return `Dear Hiring Manager,\n\n${toneIntro} for the ${role} position at ${company}. With a background in ${background || "relevant experience and strong problem-solving skills"}, I bring a practical and motivated approach to delivering results. I am particularly drawn to this opportunity because it aligns with my experience in building strong relationships, learning quickly, and contributing to impactful work.\n\nI would welcome the chance to discuss how my skills and enthusiasm can support your team. Thank you for your time and consideration.\n\nSincerely,\nYour Name`;
}

export async function POST(req: NextRequest) {
  const hasRealKey = Boolean(process.env.ANTHROPIC_API_KEY) && process.env.ANTHROPIC_API_KEY !== "your-anthropic-api-key";
  if (!hasRealKey) {
    const { applicationId, background, tone } = await req.json();
    const app = await prisma.application.findUnique({ where: { id: applicationId } });
    if (!app) return NextResponse.json({ error: "Application not found" }, { status: 404 });
    return NextResponse.json({ coverLetter: fallbackCoverLetter(app, background, tone) });
  }
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id as string;

  const { applicationId, background, tone } = await req.json();

  const app = await prisma.application.findUnique({ where: { id: applicationId, userId } });
  if (!app) return NextResponse.json({ error: "Application not found" }, { status: 404 });

  const prompt = `You are an expert career coach. Write a compelling cover letter for the following job application.

Company: ${app.company}
Role: ${app.role}
${app.location ? `Location: ${app.location}` : ""}
${app.description ? `Job description / notes: ${app.description}` : ""}

Candidate background:
${background}

Tone: ${tone}

Write a complete, ready-to-send cover letter. Start directly with "Dear Hiring Manager," or similar. 
Do not include any meta-commentary, just the letter itself. Keep it to 3-4 paragraphs.`;

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
    });

    const coverLetter = (message.content[0] as any).text as string;
    return NextResponse.json({ coverLetter });
  } catch (error) {
    console.error("Cover letter generation failed", error);
    return NextResponse.json({ error: "Failed to generate cover letter. Please check your AI configuration." }, { status: 500 });
  }
}
