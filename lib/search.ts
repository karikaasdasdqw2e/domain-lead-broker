import type { SearchResult } from "./types";

async function serperSearch(query: string): Promise<SearchResult[]> {
  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) return [];

  const response = await fetch("https://google.serper.dev/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": apiKey,
    },
    body: JSON.stringify({ q: query, num: 10 }),
  });

  if (!response.ok) return [];
  const data = await response.json();
  return (data.organic ?? []).map((item: any) => ({
    title: item.title ?? "Untitled",
    url: item.link ?? "",
    snippet: item.snippet ?? "",
  })).filter((item: SearchResult) => item.url);
}

async function braveSearch(query: string): Promise<SearchResult[]> {
  const apiKey = process.env.BRAVE_SEARCH_API_KEY;
  if (!apiKey) return [];

  const response = await fetch(`https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=10`, {
    headers: {
      Accept: "application/json",
      "X-Subscription-Token": apiKey,
    },
  });

  if (!response.ok) return [];
  const data = await response.json();
  return (data.web?.results ?? []).map((item: any) => ({
    title: item.title ?? "Untitled",
    url: item.url ?? "",
    snippet: item.description ?? "",
  })).filter((item: SearchResult) => item.url);
}

export async function searchWeb(queries: string[]) {
  const provider = process.env.SEARCH_PROVIDER ?? "serper";
  const results: SearchResult[] = [];

  for (const query of queries) {
    const batch = provider === "brave" ? await braveSearch(query) : await serperSearch(query);
    results.push(...batch);
    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  const seen = new Set<string>();
  return results.filter((result) => {
    const key = normalizeUrl(result.url);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function normalizeUrl(url: string) {
  try {
    const parsed = new URL(url);
    parsed.hash = "";
    parsed.search = "";
    return parsed.toString().replace(/\/$/, "");
  } catch {
    return "";
  }
}
