import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function fallbackPrepGuide(app: { company: string; role: string; description?: string | null }, focusArea: string, extraContext: string) {
  const company = app.company || "the company";
  const role = app.role || "this role";
  return `Interview Prep Guide for ${role} at ${company}\n\n1. Likely questions\n- Tell me about yourself and why this role interests you.\n- Describe a project you are proud of and how you contributed.\n- How would you approach a challenge in a fast-moving team?\n- What interests you about ${company}, and how do you see your skills fitting in?\n\n2. How to answer well\n- Use examples from your experience and tie them directly to the role.\n- Keep answers structured: situation, action, result.\n- Show curiosity, ownership, and a willingness to learn.\n\n3. Great questions to ask\n- What does success look like in this role in the first 90 days?\n- What are the biggest challenges the team is currently facing?\n- How is performance and growth supported here?\n\n4. Research focus\n- Review ${company}'s products, values, and recent news.\n- Understand the key skills needed for ${role}.\n\n5. Day-of checklist\n- Rehearse your top 3 stories.\n- Prepare one question for each interviewer.\n- Bring a copy of your CV and notes on the role.\n\nFocus area: ${focusArea}${extraContext ? `\nExtra context: ${extraContext}` : ""}`;
}

export async function POST(req: NextRequest) {
  const hasRealKey = Boolean(process.env.ANTHROPIC_API_KEY) && process.env.ANTHROPIC_API_KEY !== "your-anthropic-api-key";
  if (!hasRealKey) {
    const { applicationId, focusArea, extraContext } = await req.json();
    const app = await prisma.application.findUnique({ where: { id: applicationId } });
    if (!app) return NextResponse.json({ error: "Application not found" }, { status: 404 });
    return NextResponse.json({ prep: fallbackPrepGuide(app, focusArea, extraContext) });
  }
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id as string;

  const { applicationId, focusArea, extraContext } = await req.json();

  const app = await prisma.application.findUnique({ where: { id: applicationId, userId } });
  if (!app) return NextResponse.json({ error: "Application not found" }, { status: 404 });

  const prompt = `You are an expert interview coach. Create a detailed interview preparation guide for:

Company: ${app.company}
Role: ${app.role}
${app.description ? `Job notes: ${app.description}` : ""}
Focus area: ${focusArea}
${extraContext ? `Additional context: ${extraContext}` : ""}

Provide:
1. 5-7 likely interview questions for this specific role and focus area
2. Tips for answering each question
3. 3-5 smart questions the candidate should ask the interviewer
4. Key things to research about ${app.company} before the interview
5. A brief "day of" checklist

Format clearly with sections and bullet points. Be specific to the role and company.`;

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }],
    });

    const prep = (message.content[0] as any).text as string;
    return NextResponse.json({ prep });
  } catch (error) {
    console.error("Interview prep generation failed", error);
    return NextResponse.json({ error: "Failed to generate interview prep. Please check your AI configuration." }, { status: 500 });
  }
}
