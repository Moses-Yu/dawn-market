# Dawn Market (새벽시장)

AI-powered daily market briefing for Korean retail investors. Delivers overnight US market moves, sector analysis, geopolitical risk, and currency data every morning before the KRX opens.

## What It Does

- **7-report pipeline** -- US market summary, semiconductor, shipbuilding/defense, AI infrastructure, secondary battery, geopolitics, currency/FX, Asian pre-market, technical analysis, and a consolidated dawn briefing
- **AI summarization** -- Claude processes RSS feeds and raw data into actionable Korean-language briefings
- **Sector impact dashboard** -- traffic-light risk indicators across key Korean sectors
- **Real-time alerts** -- severity-classified notifications with web push support
- **Glossary** -- finance/market terms for beginner traders
- **PWA** -- installable on mobile, works offline via service worker

## Tech Stack

- **Next.js 16** / React 19 / TypeScript
- **Supabase** -- auth, Postgres storage, row-level security
- **Anthropic Claude** -- report generation pipeline
- **Tailwind CSS 4** -- styling
- **web-push** -- VAPID-based push notifications

## Getting Started

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.local.example .env.local
# Fill in Supabase, Anthropic, VAPID, and pipeline keys

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

See `.env.local.example` for the full list. Key variables:

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side) |
| `ANTHROPIC_API_KEY` | Claude API for report generation |
| `PIPELINE_API_KEY` | Protects `/api/pipeline/*` endpoints |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Web push public key |
| `VAPID_PRIVATE_KEY` | Web push private key |

## Project Structure

```
src/
  app/              # Next.js App Router pages
    briefing/       # Daily briefing views + archive
    sectors/        # Sector impact dashboard
    alerts/         # Alert feed
    glossary/       # Market term glossary
    settings/       # User preferences
    api/            # API routes (pipeline, push)
  components/       # React components
  lib/
    pipeline/       # Report generation pipeline
      reports/      # Individual report modules (1-7)
    glossary/       # Glossary data
    push/           # Push notification helpers
supabase/
  migrations/       # Database schema (8 migrations)
```

## Report Pipeline

Reports run sequentially via the orchestrator at `/api/pipeline/reports`. Each report module fetches data, sends it to Claude for analysis, and stores the result in Supabase. The final dawn briefing (report 7) synthesizes all prior reports into a single morning summary.

## Scripts

```bash
npm run dev          # Development server
npm run build        # Production build
npm run lint         # ESLint
npm run format       # Prettier (write)
npm run format:check # Prettier (check)
```

## License

Private.
