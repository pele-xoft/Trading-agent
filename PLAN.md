# CHART AI AGENT — PROJECT PLAN

> An AI-powered trading chart analysis platform. Upload chart screenshots, receive structured market analysis. No automated trading. No financial guarantees.

---

## WHAT THIS IS

A mobile-first web application that lets traders upload screenshots of trading charts and receive structured technical analysis powered by a multimodal AI (Claude / GPT-4V compatible).

The system reads visual chart data, interprets indicators (Moving Averages, RSI, Stochastic), detects market structure, and generates actionable trade setups with entries, stop losses, take profit levels, and confidence scores.

---

## WHAT THIS IS NOT

- NOT an automated trading bot
- NOT financial advice
- NOT a signal service
- NOT connected to any broker

---

## CORE ARCHITECTURE

```
User uploads chart image
        ↓
Image stored in Supabase Storage
        ↓
Analysis Engine orchestrates:
  1. Vision AI reads chart (Claude Vision / GPT-4V)
  2. Indicator Engine interprets extracted data
  3. Rule Engine detects patterns
  4. Prompt Builder composes final analysis prompt
  5. LLM generates structured analysis output
        ↓
Result stored in Supabase DB
        ↓
Frontend renders structured analysis
```

---

## TECH STACK

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router) |
| Language | TypeScript (strict) |
| Styling | TailwindCSS |
| Database | Supabase (Postgres) |
| Storage | Supabase Storage |
| AI Provider | Claude (Anthropic) — OpenAI compatible fallback |
| Deployment | Vercel |
| Testing | Vitest + Playwright |

---

## INDICATOR SET (Phase 1)

| Indicator | Purpose |
|-----------|---------|
| MA Fast (20) | Short-term trend |
| MA Slow (50) | Medium-term trend |
| RSI (14) | Momentum / overbought / oversold |
| Stochastic (14,3,3) | Momentum confirmation / divergence |

---

## TIMEFRAME SUPPORT

- 5m (scalping context)
- 15m (primary entry)
- 1h (trend confirmation)
- 4h (bias direction)
- 1D (macro structure)

---

## ANALYSIS OUTPUT STRUCTURE

Every analysis produces:

```typescript
{
  marketBias: 'bullish' | 'bearish' | 'neutral',
  tradeSetup: {
    type: 'buy' | 'sell' | 'wait',
    entryZone: { low: number, high: number },
    stopLoss: number,
    takeProfits: [{ level: number, label: string }],
  },
  confidence: number,           // 0–100
  reasoning: string,            // human-readable explanation
  indicators: {
    trend: TrendAnalysis,
    rsi: RSIAnalysis,
    stochastic: StochasticAnalysis,
    structure: StructureAnalysis,
  },
  invalidationConditions: string[],
  timeframe: string,
  analyzedAt: string,
}
```

---

## PHASE BREAKDOWN

### Phase 1 — MVP (Current)
- Image upload UI
- Single-timeframe analysis
- Claude Vision integration
- Analysis history list
- Mobile-first UI

### Phase 2 — Multi-Timeframe
- Upload multiple timeframe charts
- MTF confluence scoring
- Timeframe alignment detection

### Phase 3 — Intelligence Layer
- Pattern memory (learn from past analyses)
- User feedback on analysis accuracy
- Confidence calibration over time

### Phase 4 — Pro Features
- Watchlist + alert system
- PDF export of analysis
- Shareable analysis cards
- Team accounts (Supabase Auth)

---

## FILE OWNERSHIP MAP

| Directory | Responsibility |
|-----------|---------------|
| `/app` | Next.js pages and API routes |
| `/components` | UI components (dumb) |
| `/services` | Business logic and external calls |
| `/analysis-engine` | Core analysis orchestration |
| `/indicator-engine` | Per-indicator interpretation logic |
| `/prompts` | All AI prompt templates |
| `/lib` | Shared utilities, constants, config |
| `/types` | All TypeScript type definitions |
| `/supabase` | DB schema, migrations, RLS policies |

---

## CONTRIBUTING / AI AGENT HANDOFF

If you are an AI agent continuing this project:

1. Read `ROADMAP.md` to understand current phase
2. Read `SYSTEM_PROMPT.md` to understand how we prompt the AI
3. Types are in `/types/index.ts` — do not invent new types, extend existing ones
4. All AI calls go through `/services/ai.service.ts` — never call AI directly from components
5. Analysis logic lives in `/analysis-engine/` — keep it pure (no side effects)
6. Add tests in `/tests/` for any new analysis logic

---

*Last updated: 2026-05-26*
