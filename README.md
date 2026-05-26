# ChartMind — AI Chart Analysis Platform

> Upload trading chart screenshots. Get structured technical analysis powered by Claude Vision AI.

**This app does NOT execute trades. It provides technical analysis only.**

---

## Quick Start

```bash
# 1. Clone and install
git clone https://github.com/youruser/chart-ai-agent
cd chart-ai-agent
npm install

# 2. Set up environment
cp .env.example .env.local
# Fill in your Anthropic and Supabase keys

# 3. Set up Supabase
# Run supabase/migrations/001_initial_schema.sql in your Supabase SQL editor
# Create a storage bucket named "chart-uploads"

# 4. Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — works best on mobile.

---

## Architecture

```
chart-ai-agent/
├── app/                        # Next.js App Router
│   ├── api/
│   │   ├── analyze/route.ts    # POST: run analysis pipeline
│   │   ├── history/route.ts    # GET:  paginated analysis history
│   │   └── upload/route.ts     # POST: image upload only
│   ├── page.tsx                # Main app page (mobile-first)
│   ├── layout.tsx              # Root layout + fonts
│   └── globals.css             # Design tokens + utilities
│
├── components/
│   ├── chart/
│   │   └── UploadComponent.tsx # Image upload + timeframe select
│   └── analysis/
│       ├── AnalysisCard.tsx    # Full analysis result display
│       └── HistoryList.tsx     # Paginated analysis history
│
├── services/                   # Business logic + external calls
│   ├── ai.service.ts           # Claude API integration
│   ├── storage.service.ts      # Supabase Storage
│   └── db.service.ts           # Supabase Postgres
│
├── analysis-engine/
│   └── pipeline.ts             # Main orchestration pipeline
│
├── indicator-engine/
│   └── composite-signal.ts     # Rule-based signal scoring
│
├── prompts/
│   └── prompt-builder.ts       # Modular prompt construction
│
├── types/
│   └── index.ts                # All TypeScript types
│
└── supabase/
    └── migrations/
        └── 001_initial_schema.sql
```

---

## How It Works

1. User uploads a chart screenshot (JPG/PNG/WebP, max 10MB)
2. User selects the timeframe (5m, 15m, 1h, 4h, 1D)
3. Image is stored in Supabase Storage
4. Analysis pipeline starts:
   - Claude Vision reads the chart image
   - Extracts: MAs, RSI, Stochastic, price structure, S/R levels
   - Rule engine scores signals independently
   - Confidence is blended (AI 70% + rules 30%)
5. Structured result is saved to Supabase
6. Frontend renders the analysis with trade setup details

---

## AI Model

Primary: `claude-opus-4-5` (Claude Vision — best chart reading accuracy)

The AI is instructed to:
- Read indicator values visually from the chart
- Apply professional technical analysis methodology
- Output structured JSON (no freeform text)
- Be conservative with confidence scores
- Never guarantee future price movement

See `SYSTEM_PROMPT.md` for the full prompt specification.

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `ANTHROPIC_API_KEY` | Claude API key (console.anthropic.com) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-only) |

---

## Deployment (Vercel)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard or:
vercel env add ANTHROPIC_API_KEY
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
```

---

## For AI Agents Continuing This Project

1. **Read first**: `PLAN.md` → `ROADMAP.md` → `SYSTEM_PROMPT.md`
2. **Types**: All types are in `/types/index.ts` — extend, never duplicate
3. **AI calls**: Only through `/services/ai.service.ts`
4. **DB calls**: Only through `/services/db.service.ts`
5. **Prompts**: Only through `/prompts/prompt-builder.ts`
6. **Analysis logic**: Only in `/analysis-engine/` and `/indicator-engine/`
7. **Never**: Call AI directly from components or routes
8. **Never**: Build trade execution functionality

Current phase: **Phase 1 — MVP**
See `ROADMAP.md` for what's next.

---

## Disclaimer

This software is for **informational and educational purposes only**.
It does not constitute financial advice.
Past analysis accuracy does not predict future market outcomes.
Always consult a licensed financial advisor before making trading decisions.
