export type Lead = {
  id: string;
  companyName: string;
  website: string;
  country: string;
  industry: string;
  fitReason: string;
  upgradeReason: string;
  publicEmail: string;
  salesEmail: string;
  whatsapp: string;
  publicPhone: string;
  contactPage: string;
  linkedin: string;
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
  categories: string[];
  countries?: string[];
  maxResults: number;
};

export type ResearchResponse = {
  domain: string;
  queries: string[];
  leads: Lead[];
};

export type SearchResult = {
  title: string;
  url: string;
  snippet: string;
};

export type DraftRequest = {
  domain: string;
  leads: Lead[];
};
