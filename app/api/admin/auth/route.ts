import { NextRequest, NextResponse } from "next/server";
import {
  createOwnerSessionToken,
  matchesOwnerCredentials,
  ownerAdminConfiguration,
  OWNER_SESSION_COOKIE,
} from "@/lib/admin";

const ATTEMPT_WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const failedAttempts = new Map<string, { count: number; expiresAt: number }>();

function clientKey(request: NextRequest) {
  return request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown";
}

export async function POST(request: NextRequest) {
  if (!ownerAdminConfiguration()) {
    return NextResponse.json(
      { error: "Owner access is not configured. Set OWNER_USERNAME and a six-digit OWNER_ADMIN_CODE." },
      { status: 503 },
    );
  }

  const key = clientKey(request);
  const attemptState = failedAttempts.get(key);
  if (attemptState && attemptState.expiresAt <= Date.now()) failedAttempts.delete(key);
  else if (attemptState && attemptState.count >= MAX_ATTEMPTS) {
    return NextResponse.json(
      { error: "Too many attempts. Wait 15 minutes before trying again." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((attemptState.expiresAt - Date.now()) / 1000)) } },
    );
  }

  const body = await request.json().catch(() => null);
  if (
    !body ||
    typeof body.username !== "string" ||
    typeof body.code !== "string" ||
    !matchesOwnerCredentials(body.username, body.code)
  ) {
    const previous = failedAttempts.get(key);
    const count = (previous?.expiresAt && previous.expiresAt > Date.now() ? previous.count : 0) + 1;
    failedAttempts.set(key, { count, expiresAt: Date.now() + ATTEMPT_WINDOW_MS });
    return NextResponse.json({ error: "Incorrect owner username or six-digit code." }, { status: 401 });
  }
  failedAttempts.delete(key);

  const ownerSession = createOwnerSessionToken();
  if (!ownerSession) {
    return NextResponse.json({ error: "Owner access is not configured." }, { status: 503 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(OWNER_SESSION_COOKIE, ownerSession.value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: ownerSession.maxAge,
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(OWNER_SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
  return response;
}
