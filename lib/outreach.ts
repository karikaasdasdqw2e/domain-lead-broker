import type { Lead } from "./types";

export function buildEmail(domain: string, lead: Lead) {
  const subject = `${domain} for ${lead.companyName}`;
  const body = `Hi ${lead.companyName} Team,

I own ${domain} and thought it could be a strong fit for your business.

${lead.fitReason}

${lead.upgradeReason}

It could be used as a focused landing page, campaign redirect, or strategic brand asset. Would you be open to reviewing it for possible acquisition?

Best regards,
Mohamed`;

  return { subject, body };
}

export function buildWhatsappMessage(domain: string) {
  return `Hi, I own ${domain} and noticed your company is active in this market. The domain is short, memorable, and could work well as a landing page, lead-generation campaign, or strategic redirect. Are you open to reviewing it for acquisition?`;
}

export function buildLinkedInMessage(domain: string) {
  return `Hi, I own ${domain} and thought it could be a strong strategic fit for your company. It is short, brandable, and suitable for a focused landing page or acquisition campaign. Open to reviewing it?`;
}
