import { handleError } from "@/lib/auth-helpers";
import { transcribeAudio } from "@/lib/openai";
import {
  checkRateLimit,
  getGuestIdOrIp,
  GUEST_RATE_LIMIT_CONFIG,
} from "@/lib/rate-limit";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    // Check for authentication
    const authHeader = req.headers.get("authorization");
    const isAuthenticated = authHeader?.startsWith("Bearer ");

    // Apply rate limiting for unauthenticated (guest) requests
    let rateLimitResult: ReturnType<typeof checkRateLimit> | undefined;
    if (!isAuthenticated) {
      const guestIdOrIp = getGuestIdOrIp(req);
      rateLimitResult = checkRateLimit(guestIdOrIp, GUEST_RATE_LIMIT_CONFIG);

      if (!rateLimitResult.allowed) {
        const resetDate = new Date(rateLimitResult.resetTime);
        const minutesUntilReset = Math.ceil((rateLimitResult.resetTime - Date.now()) / 60000);
        return NextResponse.json(
          {
            error: `Free trial limit reached. Please sign up to create unlimited drafts. Try again in ${minutesUntilReset} minutes.`,
            resetTime: resetDate.toISOString(),
            minutesUntilReset,
          },
          {
            status: 429,
            headers: {
              "X-RateLimit-Limit": String(GUEST_RATE_LIMIT_CONFIG.maxRequests),
              "X-RateLimit-Remaining": "0",
              "X-RateLimit-Reset": String(rateLimitResult.resetTime),
            },
          },
        );
      }
    }

    const body = await req.json();
    const { audio, format } = body;

    if (!audio) {
      return NextResponse.json(
        { error: "Audio data is required" },
        { status: 400 },
      );
    }

    // Convert base64 to buffer
    const buffer = Buffer.from(audio, "base64");

    const mimeType = format === "m4a" ? "audio/m4a" : "audio/mpeg";

    const result = await transcribeAudio(buffer, mimeType);

    // Add rate limit headers to successful response for guests
    if (!isAuthenticated && rateLimitResult) {
      return NextResponse.json(result, {
        headers: {
          "X-RateLimit-Limit": String(GUEST_RATE_LIMIT_CONFIG.maxRequests),
          "X-RateLimit-Remaining": String(rateLimitResult.remaining),
          "X-RateLimit-Reset": String(rateLimitResult.resetTime),
        },
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    return handleError(error, "Transcription failed");
  }
}
