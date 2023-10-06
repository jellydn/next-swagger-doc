import { NextResponse } from 'next/server';

/**
 * @route
 * description: This is a get request
 */
export async function GET() {
  return NextResponse.json({ data: 'sheesh' });
}
