import { NextRequest, NextResponse } from "next/server";
import type { DraftRequest } from "../../../../lib/types";
import { buildEmail } from "../../../../lib/outreach";
import { createGmailDraft } from "../../../../lib/gmail";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get("gmail_refresh_token")?.value;
    if (!refreshToken) {
      return NextResponse.json({ error: "Gmail is not connected. Click Connect Gmail first." }, { status: 401 });
    }

    const body = (await request.json()) as DraftRequest;
    if (!body.domain || !Array.isArray(body.leads)) {
      return NextResponse.json({ error: "Invalid draft request." }, { status: 400 });
    }

    const eligibleLeads = body.leads.filter((lead) => lead.publicEmail).slice(0, 25);
    const created = [];

    for (const lead of eligibleLeads) {
      const { subject, body: emailBody } = buildEmail(body.domain, lead);
      const draft = await createGmailDraft(refreshToken, lead.publicEmail, subject, emailBody);
      created.push({ companyName: lead.companyName, to: lead.publicEmail, draftId: draft.id });
      await new Promise((resolve) => setTimeout(resolve, 600));
    }

    return NextResponse.json({ created: created.length, drafts: created });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not create Gmail drafts" }, { status: 500 });
  }
}
