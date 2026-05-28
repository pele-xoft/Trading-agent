# ChartMind — AI Chart Analysis Platform

ChartMind is an AI-powered technical analysis assistant for trading chart screenshots. Upload a chart, get instant structured analysis — RSI, Moving Averages, Stochastic, market structure, entry/stop/target zones, and a trade quality grade.

> **Not financial advice.** Analysis only. Always do your own research.

---

## What It Does

- **Upload chart screenshots** from any trading platform (TradingView, Exness, MT4/5, etc.)
- **AI reads the chart** using GPT-4o Vision — indicators, structure, S/R levels
- **Structured output** every time: bias, indicators, trade setup, entry zone, stop loss, take profits, trade grade (A+/A/B/C/avoid)
- **History** — every analysis saved, searchable
- **Stats** — confidence trends, bias distribution, timeframe breakdown
- **Mobile companion** (Expo/React Native) for on-the-go analysis

---

## Architecture

```
/
├── artifacts/
│   ├── chartmind/         Web app (React + Vite + Tailwind)
│   ├── chartmind-mobile/  Mobile app (Expo + React Native)
│   └── api-server/        REST API (Express + Node.js)
└── lib/
    ├── db/                PostgreSQL schema (Drizzle ORM)
    ├── api-spec/          OpenAPI specification
    ├── api-zod/           Zod validation schemas (generated)
    └── api-client-react/  React Query hooks (generated)
```

---

## Quick Start

### Prerequisites
- Node.js 20+
- pnpm 9+
- PostgreSQL database

### 1. Clone & Install
```bash
git clone <repo>
cd <repo>
pnpm install
```

### 2. Environment Variables
```bash
cp ENV_SETUP.md .env.example   # read ENV_SETUP.md for all vars
```

Required:
```
DATABASE_URL=postgresql://user:password@host:5432/dbname
OPENAI_API_KEY=sk-...
```

### 3. Database Setup
```bash
pnpm --filter @workspace/db run push
```

### 4. Run (Development)
```bash
# All services
pnpm run dev

# Or individually:
pnpm --filter @workspace/api-server run dev    # API on :3001
pnpm --filter @workspace/chartmind run dev     # Web on :5173
pnpm --filter @workspace/chartmind-mobile run dev  # Expo
```

---

## API Reference

### POST /api/analyses
Run AI analysis on a chart image.

**Request:**
```json
{
  "imageUrl": "data:image/jpeg;base64,...",
  "timeframe": "1h",
  "instrument": "XAUUSD"
}
```

**Response:**
```json
{
  "id": 42,
  "timeframe": "1h",
  "result": {
    "marketBias": "bullish",
    "tradeGrade": "A",
    "confidence": 71,
    "tradeSetup": {
      "type": "buy",
      "entryZone": { "low": 2332.00, "high": 2336.50 },
      "stopLoss": 2314.50,
      "takeProfits": [...],
      "riskRewardRatio": 2.3
    },
    ...
  }
}
```

### GET /api/analyses
List analyses with pagination. `?page=1&limit=20`

### GET /api/analyses/stats
Aggregated stats (bias counts, avg confidence, by-timeframe).

### GET /api/analyses/:id
Single analysis with full image data.

### DELETE /api/analyses/:id
Delete an analysis record.

---

## Trade Grade System

| Grade | Meaning |
|-------|---------|
| A+    | Elite textbook setup — strong alignment, confidence ≥ 75, R:R ≥ 2.5 |
| A     | Strong setup — confidence ≥ 65, R:R ≥ 2.0 |
| B     | Acceptable setup — confidence ≥ 52, R:R ≥ 1.5 |
| C     | Marginal — proceed with caution |
| avoid | Skip — low confidence, poor R:R, or contradictory signals |

---

## Cost Estimate

With GPT-4o-mini + client-side image compression (max 1024px):

| Volume | Estimated Monthly Cost |
|--------|----------------------|
| 50 analyses | ~$0.08 |
| 150 analyses | ~$0.25 |
| 300 analyses | ~$0.50 |

Images are compressed to ≤1024px before upload, reducing token count by ~60–75%.

---

## Security

- Rate limiting: 20 AI analyses per 10 minutes per IP
- Read endpoints: 100 requests per minute per IP
- Image size limit: 8MB
- Only JPEG, PNG, WebP accepted

---

## Environment Variables

See [`ENV_SETUP.md`](./ENV_SETUP.md) for the full list.

---

## Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make changes and test
4. Open a pull request

The codebase is modular — AI logic lives in `artifacts/api-server/src/lib/`, UI components are in each artifact's `src/components/`.
