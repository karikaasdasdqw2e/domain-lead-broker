import type { Lead, SearchResult } from "./types";
import { cleanDomain, inferIndustry } from "./domain";

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const PHONE_RE = /(\+?\d[\d\s().-]{7,}\d)/g;
const BAD_EMAIL_PARTS = ["example.com", "domain.com", "yourcompany", "sentry", "wixpress", "schema.org"];

export async function buildLeads(results: SearchResult[], domain: string, categories: string[], maxResults: number): Promise<Lead[]> {
  const grouped = groupByHost(results);
  const leads: Lead[] = [];

  for (const [host, entries] of grouped) {
    if (leads.length >= maxResults) break;
    const rootUrl = `https://${host}`;
    const contactCandidates = unique([
      ...entries.map((entry) => entry.url),
      rootUrl,
      `${rootUrl}/contact`,
      `${rootUrl}/contact-us`,
      `${rootUrl}/about`,
    ]).slice(0, 5);

    const pages = await fetchPages(contactCandidates);
    const text = `${entries.map((e) => `${e.title} ${e.snippet}`).join("\n")}\n${pages.map((p) => p.text).join("\n")}`;
    const emails = extractEmails(text);
    const phones = extractPhones(text);
    const whatsapp = extractWhatsApp(text, pages.map((p) => p.html).join("\n"));
    const contactPage = pages.find((p) => /contact/i.test(p.url))?.url || entries.find((e) => /contact/i.test(e.url))?.url || "";
    const linkedin = extractLinkedIn(text, pages.map((p) => p.html).join("\n"));

    const companyName = guessCompanyName(entries[0]?.title, host);
    const category = categories.find((cat) => text.toLowerCase().includes(cat.toLowerCase().split(" ")[0])) || categories[0] || "B2B services";
    const industry = inferIndustry(domain, category);
    const score = scoreLead({ emails, phones, whatsapp, host, text, domain });

    leads.push({
      id: host,
      companyName,
      website: rootUrl,
      country: guessCountry(host, text),
      industry,
      fitReason: `${companyName} is active in ${industry.toLowerCase()}, so ${domain} could work as a targeted landing page, redirect, or niche brand asset.`,
      upgradeReason: makeUpgradeReason(host, domain, text),
      publicEmail: emails[0] || "",
      salesEmail: emails.find((e) => /sales|support|info|contact|hello/i.test(e)) || emails[0] || "",
      whatsapp,
      publicPhone: phones[0] || "",
      contactPage,
      linkedin,
      decisionMakerName: "",
      decisionMakerRole: "",
      score,
      outreachAngle: makeAngle(domain, industry, score),
      sourceUrls: unique(entries.map((e) => e.url).concat(pages.map((p) => p.url))).slice(0, 6),
    });
  }

  return leads.sort((a, b) => b.score - a.score);
}

function groupByHost(results: SearchResult[]) {
  const map = new Map<string, SearchResult[]>();
  for (const result of results) {
    try {
      const host = cleanDomain(new URL(result.url).hostname);
      if (!host || isLowQualityHost(host)) continue;
      map.set(host, [...(map.get(host) ?? []), result]);
    } catch {}
  }
  return map;
}

function isLowQualityHost(host: string) {
  return ["facebook.com", "instagram.com", "linkedin.com", "youtube.com", "x.com", "twitter.com", "wikipedia.org", "yelp.com"].some((blocked) => host.endsWith(blocked));
}

async function fetchPages(urls: string[]) {
  const pages: { url: string; html: string; text: string }[] = [];
  for (const url of urls) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 6500);
      const response = await fetch(url, {
        headers: { "User-Agent": "DomainLeadBroker/1.0 (+https://github.com/karikaasdasdqw2e/domain-lead-broker)" },
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (!response.ok) continue;
      const contentType = response.headers.get("content-type") || "";
      if (!contentType.includes("text/html")) continue;
      const html = await response.text();
      pages.push({ url, html, text: stripHtml(html) });
    } catch {}
  }
  return pages;
}

function stripHtml(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function extractEmails(text: string) {
  return unique((text.match(EMAIL_RE) ?? [])
    .map((email) => email.toLowerCase())
    .filter((email) => !BAD_EMAIL_PARTS.some((bad) => email.includes(bad)))
    .filter((email) => !/\.(png|jpg|jpeg|gif|webp)$/i.test(email)));
}

function extractPhones(text: string) {
  return unique((text.match(PHONE_RE) ?? [])
    .map((phone) => phone.replace(/\s+/g, " ").trim())
    .filter((phone) => phone.replace(/\D/g, "").length >= 8)
    .slice(0, 5));
}

function extractWhatsApp(text: string, html: string) {
  const waLink = html.match(/(?:wa\.me\/|api\.whatsapp\.com\/send\?phone=)(\+?\d{8,15})/i)?.[1];
  if (waLink) return waLink.startsWith("+") ? waLink : `+${waLink}`;
  if (/whatsapp/i.test(text)) return "WhatsApp mentioned, number not found";
  return "";
}

function extractLinkedIn(text: string, html: string) {
  const match = `${html}\n${text}`.match(/https?:\/\/(?:www\.)?linkedin\.com\/company\/[^\s"'<>]+/i);
  return match?.[0] || "";
}

function guessCompanyName(title = "", host: string) {
  const cleanTitle = title.split(/[|-]/)[0]?.trim();
  if (cleanTitle && cleanTitle.length <= 60) return cleanTitle;
  return host.split(".")[0].replace(/[-_]/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

function guessCountry(host: string, text: string) {
  const tld = host.split(".").pop();
  const map: Record<string, string> = { uk: "United Kingdom", ca: "Canada", au: "Australia", in: "India", ae: "UAE", eg: "Egypt", za: "South Africa" };
  if (tld && map[tld]) return map[tld];
  if (/united states|usa|california|texas|florida|virginia|new york/i.test(text)) return "USA";
  return "Not found";
}

function scoreLead(input: { emails: string[]; phones: string[]; whatsapp: string; host: string; text: string; domain: string }) {
  let score = 3;
  if (input.emails.length) score += 2;
  if (input.phones.length) score += 1;
  if (input.whatsapp) score += 1;
  if (/contact|sales|support|demo|get quote|contractor|software|marketplace|auction|tender|hvac/i.test(input.text)) score += 1;
  const words = input.domain.replace(/\.[a-z]+$/i, "").split(/(?=[A-Z])|[-_]/).filter(Boolean);
  if (words.some((word) => input.text.toLowerCase().includes(word.toLowerCase()))) score += 1;
  if (input.host.length > 18 || input.host.split("-").length > 1) score += 1;
  return Math.max(1, Math.min(10, score));
}

function makeUpgradeReason(host: string, domain: string, text: string) {
  if (host.length > 20) return `Current domain ${host} is relatively long; ${domain} is shorter and easier for a campaign.`;
  if (host.includes("-")) return `Current domain uses a hyphen; ${domain} is cleaner for advertising and recall.`;
  if (/contact form|request demo|get a quote/i.test(text)) return `${domain} could be used as a focused lead-generation landing page.`;
  return `${domain} could work as a niche redirect, campaign domain, or brand-protection asset.`;
}

function makeAngle(domain: string, industry: string, score: number) {
  if (/hvac/i.test(industry)) return `${domain} as a focused HVAC lead-generation or contractor resource domain.`;
  if (/auction|bidding/i.test(industry)) return `${domain} as a bidder-facing campaign or auction landing domain.`;
  if (/procurement|tender/i.test(industry)) return `${domain} as a tender/RFQ campaign domain for better bid intent.`;
  return score >= 7 ? `${domain} as a clean acquisition domain for paid campaigns.` : `${domain} as a low-cost strategic redirect.`;
}

function unique<T>(items: T[]) {
  return Array.from(new Set(items.filter(Boolean)));
}
