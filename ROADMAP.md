# ChartMind — Product Roadmap

> AI-powered multi-timeframe trading chart analysis platform  
> Status: Production-ready in Demo mode · Prompt v2.0.0 · Trade grading A+/A/B/Avoid

---

## ✅ Completed (current state)

| Feature | Status |
|---|---|
| Premium dark UI (purple/cyan brand, glass morphism) | ✅ Done |
| Multi-timeframe confluence (1D/4H/1H/15M — HTF 60%/LTF 40%) | ✅ Done |
| Single-chart quick analysis | ✅ Done |
| GPT-4o mini vision integration | ✅ Done |
| Trade quality grading (A+/A/B/Avoid/WAIT) | ✅ Done |
| Server-side safety grade validator (prevents inflated A+ on bad setups) | ✅ Done |
| RSI/MA/Stochastic indicator pills | ✅ Done |
| Confidence ring with count-up animation | ✅ Done |
| Sequential TF bar animations | ✅ Done |
| Cost guardrails ($2/day, $10/month hard limits) | ✅ Done |
| 60-min in-memory cache (identical chart = $0) | ✅ Done |
| Analysis history + stats panel | ✅ Done |
| Full mock/demo mode (no API key needed) | ✅ Done |
| PostgreSQL persistence via Drizzle ORM | ✅ Done |
| Mobile-first responsive layout | ✅ Done |

---

## 🔜 Phase 1 — Go Live (1-2 days)

### 1.1 Connect OpenAI key
Add `OPENAI_API_KEY` to Replit Secrets. App auto-detects it and switches from demo to live mode.  
- Files: `artifacts/api-server/src/lib/ai.service.ts`
- Cost estimate: ~$0.001–$0.003/analysis → **under $3/month at 300 analyses**

### 1.2 Image compression client-side (before upload)
Currently images are sent at whatever size the user uploads. Add a client-side resize + compress step:
- Resize to max 1024×1024 before base64 encoding (saves ~60-80% on image bytes)
- Convert HEIC/HEIF to JPEG (common iPhone format — currently fails silently)
- Show actual compressed file size in the upload slot
- Files: `artifacts/chartmind/src/components/UploadComponent.tsx`, `MultiChartUpload.tsx`
- Impact: Faster uploads on mobile, lower OpenAI image token cost

### 1.3 Health endpoint in app header
Surface live/demo mode + API latency in the app header bar (currently just shows "DEMO" badge).
- Show avg response time from last 5 analyses
- Files: `artifacts/chartmind/src/pages/home.tsx`, `artifacts/api-server/src/routes/health.ts`

---

## 🚀 Phase 2 — Quality & Features (1-2 weeks)

### 2.1 XAUUSD auto-detection from chart text
OCR or simple heuristic to detect the instrument symbol from the uploaded chart image and pre-fill the instrument field. GPT-4o mini can also be prompted to return the detected instrument as part of the JSON.
- Add `detectedInstrument` to the AI response schema
- Files: `artifacts/api-server/src/lib/prompt-builder.ts`, `types.ts`

### 2.2 Analysis favourites / star system
Let users star an analysis from History. Starred analyses persist and show with a gold border.
- Add `starred: boolean` column to `analysesTable`
- Star toggle button in HistoryList cards and AnalysisCard footer
- Files: `lib/db/src/schema.ts`, `artifacts/api-server/src/routes/analyses.ts`

### 2.3 Share analysis as image
Generate a shareable card from the analysis result (trade grade, bias, entry/SL/TP, confidence).
- Canvas API or html-to-image library to render a branded card
- Share via native share API on mobile
- Files: new `artifacts/chartmind/src/components/ShareCard.tsx`

### 2.4 Multi-instrument presets
Quick-select buttons for XAUUSD, EURUSD, GBPUSD, US30, NAS100 above the upload area.
- Stores instrument context per analysis
- Prompt builder already accepts `instrument` parameter
- Files: `artifacts/chartmind/src/components/UploadComponent.tsx`

### 2.5 Expandable trade plan
Tap the Trade Setup card to expand a full trade plan view:
- Position sizing calculator (% risk → lot size)
- Trade journal entry form
- Files: `artifacts/chartmind/src/components/AnalysisCard.tsx`

---

## 📱 Phase 3 — Mobile App (2-3 weeks)

### 3.1 Expo React Native companion app
Native mobile app alongside the web app, sharing the same API server:
- Native camera / photo library access (no browser upload flow)
- Push notifications when analysis completes
- Homescreen icon, offline-friendly layout
- Same brand (purple/cyan dark theme)
- Biometric app lock option

### 3.2 Trading platform screenshot import
Deep-link integration with common mobile trading apps:
- Import from TradingView, MetaTrader, cTrader share sheets
- Auto-detect timeframe from screenshot metadata

---

## 🧠 Phase 4 — Intelligence Upgrades (1-2 months)

### 4.1 Session-based context memory
Store the last 3 analyses as context for the next prompt:  
"Your previous 4H analysis from 2 hours ago showed bullish — now the 1H shows bearish RSI divergence..."
- Adds continuity to the analysis narrative
- Files: `artifacts/api-server/src/lib/ai.service.ts`, `prompt-builder.ts`

### 4.2 Pattern recognition layer
Pre-GPT local detection of common chart patterns from the image:
- Detect colour ranges (green/red candles) for basic sentiment
- Flag indicator panel regions before sending to AI (reduces hallucination)
- Implemented as a Node.js preprocessing step before the OpenAI call

### 4.3 Trade journal with outcome tracking
Let users log whether a trade was taken and what the result was:
- Won / Lost / Missed toggle on each historical analysis
- Stats panel shows actual win rate vs. A+/A/B grade prediction accuracy
- Files: new `outcomes` table in DB, new `artifacts/chartmind/src/pages/journal.tsx`

### 4.4 Backtesting integration
Upload a batch of screenshots from historical charts and get grade distributions:
- Test how many A+ setups from the past month were actually winners
- Batch API endpoint: `POST /api/analyses/batch`

### 4.5 Alert system
Set a minimum grade threshold (e.g. "notify me if I upload a chart that scores A+"):
- In-app banner notification
- Optional push notification (requires mobile app)

---

## 🔒 Phase 5 — Multi-User & Auth (1-2 months)

### 5.1 User accounts (Replit Auth or Clerk)
Each user has their own analysis history, starred analyses, and journal.
- Add `userId` to all DB tables
- Auth middleware on all API routes

### 5.2 Usage quotas per user
- Free tier: 10 analyses/month
- Pro tier: 300 analyses/month
- Usage tracking per `userId`

### 5.3 Team/group mode
Share analyses with a trading group. Annotations and comments on each analysis.

---

## 🏗 Architecture Notes

```
artifacts/
├── api-server/          Express + TypeScript + PostgreSQL (current)
│   ├── src/lib/
│   │   ├── ai.service.ts        GPT-4o mini vision calls
│   │   ├── prompt-builder.ts    Prompt v2.0.0 (compressed, gold-focused)
│   │   ├── cache.ts             60-min in-memory cache
│   │   ├── indicator-engine.ts  Rule-based confidence blending
│   │   └── mock-analysis.ts     Realistic per-TF demo data
│   └── src/routes/
│       ├── analyses.ts          Single chart analysis
│       └── confluence.ts        Multi-timeframe weighted scoring
├── chartmind/           React + Vite frontend (current)
│   └── src/
│       ├── pages/home.tsx       Main app shell, tab routing
│       ├── components/          All UI components
│       └── types.ts             Shared types (AnalysisResult, TradeGrade etc.)
└── mockup-sandbox/      Canvas component previews
lib/
└── db/                  Drizzle ORM + PostgreSQL schema
```

**Cost at scale (live mode):**
| Scenario | Monthly cost |
|---|---|
| 100 analyses/month (personal) | ~$0.30–0.50 |
| 300 analyses/month (active trader) | ~$0.90–1.50 |
| 1,000 analyses/month (team) | ~$3–5 |
| Hard cap (guardrails) | **$10/month max** |

---

*Last updated: May 2026 · Prompt v2.0.0*
