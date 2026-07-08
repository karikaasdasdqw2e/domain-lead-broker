import { NextRequest, NextResponse } from "next/server";
import { buildQueries, cleanDomain } from "../../../lib/domain";
import { searchWeb } from "../../../lib/search";
import { buildLeads } from "../../../lib/extract";
import type { ResearchRequest } from "../../../lib/types";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ResearchRequest;
    const domain = cleanDomain(body.domain || "");
    const categories = Array.isArray(body.categories) ? body.categories.filter(Boolean) : [];
    const maxResults = Math.min(Math.max(Number(body.maxResults || 20), 5), 50);

    if (!domain || !domain.includes(".")) {
      return NextResponse.json({ error: "Please enter a valid domain." }, { status: 400 });
    }

    if (!process.env.SERPER_API_KEY && !process.env.BRAVE_SEARCH_API_KEY) {
      return NextResponse.json({
        error: "Missing search API key. Add SERPER_API_KEY or BRAVE_SEARCH_API_KEY to .env.local."
      }, { status: 400 });
    }

    const queries = buildQueries(domain, categories);
    const results = await searchWeb(queries);
    const leads = await buildLeads(results, domain, categories, maxResults);

    return NextResponse.json({ domain, queries, leads });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Research failed" }, { status: 500 });
  }
}
