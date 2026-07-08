import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForTokens } from "../../../../lib/gmail";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const code = request.nextUrl.searchParams.get("code");
    if (!code) {
      return NextResponse.json({ error: "Missing Google OAuth code." }, { status: 400 });
    }

    const tokens = await exchangeCodeForTokens(code);
    if (!tokens.refresh_token) {
      return NextResponse.json({
        error: "Google did not return a refresh token. Remove the app access from your Google Account, then connect again."
      }, { status: 400 });
    }

    const response = NextResponse.redirect(new URL("/?gmail=connected", request.url));
    response.cookies.set("gmail_refresh_token", tokens.refresh_token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    return response;
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Gmail connection failed" }, { status: 500 });
  }
}
