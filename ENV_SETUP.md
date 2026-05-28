# Environment Variables Setup

## Required Variables

### Database
```
DATABASE_URL=postgresql://user:password@host:5432/dbname
```
Required for all environments. Use a hosted PostgreSQL service (Neon, Supabase, Railway, etc.).

### OpenAI
```
OPENAI_API_KEY=sk-proj-...
```
Required for real analysis. Without this, the app runs in mock mode (demo data only).

To get a key: https://platform.openai.com/api-keys

**Cost estimate with gpt-4o-mini:**
- ~$0.0017 per analysis (after image compression)
- 300 analyses/month ≈ $0.50

---

## Optional Variables

### Mock Mode
```
MOCK_MODE=true
```
Set to `true` to disable OpenAI calls and return demo analysis. Useful for development/testing without API credits.

The app also falls back to mock if `OPENAI_API_KEY` is missing or set to `"mock"`.

### Replit-Specific (auto-set in Replit environment)
```
REPLIT_DEV_DOMAIN=        # your-repl.replit.dev
REPLIT_EXPO_DEV_DOMAIN=   # for Expo mobile dev
REPL_ID=                  # auto-set
PORT=                     # auto-set per service
BASE_PATH=                # auto-set per service
```

---

## Service-Specific Variables

### API Server (`artifacts/api-server`)
| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | ✅ | — | PostgreSQL connection string |
| `OPENAI_API_KEY` | ✅ | — | OpenAI API key (or `"mock"`) |
| `MOCK_MODE` | ❌ | `false` | Force mock mode |
| `PORT` | ❌ | `3001` | API server port |
| `NODE_ENV` | ❌ | `development` | `development` or `production` |

### Web App (`artifacts/chartmind`)
| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_API_URL` | ❌ | auto | Override API base URL |
| `BASE_URL` | ❌ | auto | Set by Vite/Replit |

### Mobile App (`artifacts/chartmind-mobile`)
| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `EXPO_PUBLIC_DOMAIN` | ✅ (Replit) | — | API domain for mobile to call |
| `EXPO_PUBLIC_REPL_ID` | ❌ | — | Replit REPL_ID |
| `EXPO_PACKAGER_PROXY_URL` | ❌ | — | Metro proxy URL |

---

## Setting Variables in Replit

In the Replit workspace:
1. Click the **Secrets** panel (lock icon in sidebar)
2. Add `DATABASE_URL` and `OPENAI_API_KEY`

These are automatically available to all services.

---

## Database Setup

After setting `DATABASE_URL`, run:
```bash
pnpm --filter @workspace/db run push
```

This applies the schema to your database. Safe to run multiple times.

---

## Local Development (.env files)

Create `.env` files in each service directory:

**`artifacts/api-server/.env`:**
```
DATABASE_URL=postgresql://localhost:5432/chartmind
OPENAI_API_KEY=sk-...
PORT=3001
```

**`artifacts/chartmind/.env`:**
```
VITE_API_URL=http://localhost:3001
```

**`artifacts/chartmind-mobile/.env`:**
```
EXPO_PUBLIC_DOMAIN=localhost:3001
```
