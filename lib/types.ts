export type Lead = {
  id: string;
  companyName: string;
  website: string;
  country: string;
  industry: string;
  fitReason: string;
  domainWeakness: string;
  publicEmail: string;
  salesEmail: string;
  whatsapp: string;
  phone: string;
  contactPageUrl: string;
  linkedInCompanyPage: string;
  decisionMakerName: string;
  decisionMakerRole: string;
  score: number;
  outreachAngle: string;
  sourceUrls: string[];
  emailSubject?: string;
  emailBody?: string;
};

export type ResearchRequest = {
  domain: string;
  niche: string;
  buyerCategories: string[];
  countries?: string[];
  maxResults: number;
};

export type SearchResult = {
  title: string;
  link: string;
  snippet: string;
};

export type DraftRequest = {
  domain: string;
  leads: Lead[];
};
