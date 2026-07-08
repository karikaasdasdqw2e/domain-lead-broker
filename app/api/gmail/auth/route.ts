import { NextResponse } from "next/server";
import { getGmailAuthUrl } from "../../../../lib/gmail";

export const runtime = "nodejs";

export async function GET() {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_REDIRECT_URI) {
    return NextResponse.json({ error: "Missing Google OAuth environment variables." }, { status: 400 });
  }

  return NextResponse.redirect(getGmailAuthUrl());
}
