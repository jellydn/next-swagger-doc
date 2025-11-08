import { NextResponse } from "next/server";

/**
 * Health check endpoint
 *
 * Simple endpoint demonstrating fully auto-generated documentation.
 */
export async function GET(): Promise<NextResponse<{ status: string; timestamp: string }>> {
  return NextResponse.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
}
