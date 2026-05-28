# ChartMind — Standalone Setup Guide

Run ChartMind entirely on your own machine with no Replit dependency.

---

## What you need

| Tool | Install |
|------|---------|
| Node.js 20+ | https://nodejs.org |
| pnpm | `npm install -g pnpm` |
| PostgreSQL 15+ | https://postgresql.org/download |
| OpenAI API key | https://platform.openai.com/api-keys |
| Expo Go (phone) | App Store / Google Play |
| EAS CLI (for APK) | `npm install -g eas-cli` |
| Expo account (for APK) | https://expo.dev |

---

## 1. Download the code

In Replit: click the three-dot menu → **Download as zip** → unzip on your machine.

Or if you have git access:
```bash
git clone <your-repo-url>
cd chartmind
pnpm install
```

---

## 2. Set up the database

```bash
# Create the database (PostgreSQL must be running)
createdb chartmind

# Push the schema
pnpm --filter @workspace/db run push
```

---

## 3. Configure the API server

```bash
cd artifacts/api-server
cp .env.example .env
```

Edit `.env`:
```
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/chartmind
OPENAI_API_KEY=sk-...   # or set to "mock" for demo mode
PORT=3000
```

Start the API:
```bash
# From the project root
pnpm --filter @workspace/api-server run dev
```

The API is now live at `http://localhost:3000`. Test it:
```bash
curl http://localhost:3000/api/analyses/stats
```

---

## 4. Run the mobile app in Expo Go (fastest)

```bash
cd artifacts/chartmind-mobile
cp .env.example .env.local
# Edit .env.local: set EXPO_PUBLIC_API_URL=http://YOUR_LOCAL_IP:3000
# (use your machine's local network IP, not localhost — your phone needs to reach it)
# Find your IP: ifconfig | grep "inet " (Mac/Linux) or ipconfig (Windows)
```

Start the Expo dev server:
```bash
npx expo start
```

Scan the QR code with Expo Go on your phone. The app will load and talk to your local API.

> **Tip:** If your phone can't reach the API, make sure both devices are on the same Wi-Fi network.

---

## 5. Build a standalone Android APK (no Play Store needed)

This gives you a real `.apk` file you can install directly on any Android phone.

**Step 1 — Log in to Expo:**
```bash
npx eas login
# or: npx eas register  (if you don't have an account yet)
```

**Step 2 — Configure your API URL in `eas.json`:**

Edit `artifacts/chartmind-mobile/eas.json` and replace `YOUR_API_URL_HERE` in the `preview` profile with your hosted API URL (see Step 6 below for hosting options):
```json
"preview": {
  "env": {
    "EXPO_PUBLIC_API_URL": "https://your-api-url.com"
  }
}
```

**Step 3 — Build the APK:**
```bash
cd artifacts/chartmind-mobile
npx eas build --platform android --profile preview
```

EAS builds in the cloud (~5–10 minutes on free tier). When done, it gives you a download link for the `.apk` file.

**Step 4 — Install on your phone:**
- Download the `.apk` to your Android phone
- Open it — Android will ask to allow "Install unknown apps" — tap Allow
- App installs like any normal app

---

## 6. Host the API server (so the app works anywhere, not just local)

### Option A — Railway (free tier, easiest)
1. Push your code to GitHub
2. Go to https://railway.app → New Project → Deploy from GitHub
3. Select the repo, set root to `artifacts/api-server`
4. Add env vars: `DATABASE_URL`, `OPENAI_API_KEY`, `PORT=3000`
5. Railway gives you a URL like `https://chartmind-api.up.railway.app`

### Option B — Render (free tier)
1. https://render.com → New Web Service → connect GitHub repo
2. Build command: `pnpm install && pnpm --filter @workspace/api-server run build`
3. Start command: `pnpm --filter @workspace/api-server run start`
4. Add env vars as above

### Option C — Your own VPS (cheapest long-term)
```bash
# On your VPS (Ubuntu example)
git clone <repo> && cd chartmind
pnpm install
pnpm --filter @workspace/api-server run build

# Run with PM2 for auto-restart
npm install -g pm2
pm2 start "pnpm --filter @workspace/api-server run start" --name chartmind-api
pm2 save && pm2 startup
```

---

## 7. Build for iOS (App Store)

Requires an Apple Developer account ($99/yr).

```bash
cd artifacts/chartmind-mobile
npx eas build --platform ios --profile production
npx eas submit --platform ios   # submits to App Store
```

---

## Summary — no Replit needed

| Component | Runs on |
|-----------|---------|
| API server | Any Node.js host (Railway, Render, VPS, your laptop) |
| PostgreSQL | Any PostgreSQL host (Railway, Supabase, Neon, local) |
| Mobile app | Your phone — installed via APK (Android) or App Store (iOS) |
| Web app | Any static host — `pnpm --filter @workspace/chartmind run build` → deploy `dist/` |
