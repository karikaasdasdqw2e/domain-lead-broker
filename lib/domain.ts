export function cleanDomain(input: string) {
  return input
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .split("/")[0]
    .toLowerCase();
}

export function domainName(domain: string) {
  return cleanDomain(domain).replace(/\.[a-z]{2,}$/i, "");
}

export function splitDomainWords(domain: string) {
  const name = domainName(domain)
    .replace(/[-_]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2");

  const camelSplit = name
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .split(/\s+/)
    .flatMap((part) => part.split(/(?=[A-Z])/));

  const compact = camelSplit.join(" ") || name;
  return compact
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .split(/[^a-z0-9]+/i)
    .filter(Boolean);
}

export function buildQueries(domain: string, categories: string[]) {
  const words = splitDomainWords(domain);
  const core = words.join(" ");
  const safeCategories = categories.length ? categories : [core];
  const suffixes = [
    "contact email",
    "sales email",
    "support email",
    "contact us phone",
    "WhatsApp contact",
    "LinkedIn company",
  ];

  return safeCategories.flatMap((category) =>
    suffixes.map((suffix) => `${category} ${core} ${suffix}`)
  ).slice(0, 24);
}

export function inferIndustry(domain: string, category: string) {
  const lower = `${domain} ${category}`.toLowerCase();
  if (lower.includes("hvac")) return "HVAC / home services";
  if (lower.includes("auction") || lower.includes("bid")) return "Auction / bidding";
  if (lower.includes("tender") || lower.includes("procurement")) return "Tender / procurement";
  if (lower.includes("law")) return "Legal services";
  if (lower.includes("plumb")) return "Plumbing / home services";
  return category || "B2B services";
}
