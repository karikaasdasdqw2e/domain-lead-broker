# Domain Lead Broker

Professional lead research and Gmail draft-generation app for domain outbound sales.

Built for domain investors who want to research likely end-user buyers, extract publicly listed business contacts, score buyer likelihood, and create reviewable Gmail drafts.

> The app creates **Gmail Drafts only**. It does not send emails automatically.

## Features

- Domain analysis and buyer-category generation
- Search query builder for domain-specific outbound research
- Web lead discovery through Serper or Brave Search
- Public contact extraction from websites/contact pages
- Email, phone, WhatsApp, contact page, and LinkedIn detection
- Buyer likelihood scoring from 1 to 10
- Personalized outreach angle and email copy per lead
- CSV export
- Gmail OAuth connection
- Bulk Gmail draft creation with rate limiting
- Manual review workflow before sending
- Compliance guardrails: no invented emails, no hidden scraping, no automatic sending

## Tech Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Gmail API via Google OAuth
- Serper.dev or Brave Search API for web search

## Quick Start

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open:

```text
http://localhost:3000
```

## Environment Variables

Create `.env.local`:

```env
SEARCH_PROVIDER=serper
SERPER_API_KEY=your_serper_key
BRAVE_SEARCH_API_KEY=your_brave_key

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/gmail/callback

APP_URL=http://localhost:3000
```

## Google OAuth Setup

1. Open Google Cloud Console.
2. Create OAuth Client ID: Web application.
3. Add redirect URI:

```text
http://localhost:3000/api/gmail/callback
```

4. Enable Gmail API.
5. Add scope:

```text
https://www.googleapis.com/auth/gmail.compose
```

## Search Providers

Use either:

- `serper` with `SERPER_API_KEY`
- `brave` with `BRAVE_SEARCH_API_KEY`

The app uses only public search results and publicly visible website/contact-page data.

## Important Notes

This tool is designed for legitimate B2B domain brokerage outreach. Keep outreach targeted, honest, and low-volume. Always review drafts before sending and respect unsubscribe/no-contact requests.

## Suggested Deployment

Vercel is recommended.

Set the same environment variables in Vercel Project Settings, then update `GOOGLE_REDIRECT_URI` to:

```text
https://your-domain.com/api/gmail/callback
```

## License

MIT
