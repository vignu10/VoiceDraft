import { handleError } from "@/lib/auth-helpers";
import { generateBlogPost } from "@/lib/openai";
import {
  checkRateLimit,
  getGuestIdOrIp,
  GUEST_RATE_LIMIT_CONFIG,
} from "@/lib/rate-limit";
import type { GenerationOptions } from "@/lib/types";
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

    const body: GenerationOptions = await req.json();

    const { transcript, target_keyword, tone, target_length } = body;

    if (!transcript) {
      return NextResponse.json(
        { error: "Transcript is required" },
        { status: 400 },
      );
    }

    const result = await generateBlogPost({
      transcript,
      target_keyword: target_keyword,
      tone: tone || "professional",
      target_length: target_length || "medium",
    });

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
    return handleError(error, "Blog generation failed");
  }
}
