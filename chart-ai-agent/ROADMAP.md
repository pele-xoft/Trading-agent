# ROADMAP

## STATUS: Phase 1 — MVP (In Progress)

---

## PHASE 1 — MVP ✅ Building Now

### Core Infrastructure
- [x] Project structure
- [x] TypeScript types
- [x] Supabase schema
- [x] Environment config
- [ ] Supabase client setup
- [ ] Vercel deployment config

### AI Layer
- [x] System prompt
- [x] Prompt architecture
- [ ] Claude Vision integration
- [ ] Response parser
- [ ] Error handling + fallback

### Frontend
- [ ] Mobile-first layout shell
- [ ] Image upload component (drag + tap)
- [ ] Analysis loading state
- [ ] Analysis result card
- [ ] History list page
- [ ] Empty states

### API
- [ ] POST /api/analyze
- [ ] GET /api/history
- [ ] POST /api/upload

---

## PHASE 2 — Multi-Timeframe Intelligence

- [ ] Multi-image upload (one per timeframe)
- [ ] Timeframe labeling UI
- [ ] MTF confluence scoring algorithm
- [ ] Alignment strength indicator
- [ ] Combined analysis output

**Target: After Phase 1 is stable**

---

## PHASE 3 — Learning & Feedback

- [ ] User feedback on analysis (👍 / 👎 + notes)
- [ ] Outcome tracking (was TP hit? was SL hit?)
- [ ] Confidence score calibration
- [ ] Analysis accuracy dashboard
- [ ] Prompt improvement from feedback data

**Target: After 100+ analyses collected**

---

## PHASE 4 — Pro & Team Features

- [ ] Supabase Auth (email + OAuth)
- [ ] User accounts + personal history
- [ ] Team workspaces
- [ ] Shareable analysis links
- [ ] PDF export
- [ ] Analysis cards (image generation)
- [ ] Webhook alerts

**Target: When monetization is planned**

---

## PHASE 5 — Advanced AI Orchestration

- [ ] Multi-agent pipeline (Vision Agent → Structure Agent → Risk Agent)
- [ ] Real-time chart data integration (optional)
- [ ] Custom indicator support
- [ ] Fine-tuned model on trading patterns
- [ ] MCP server for chart tools

**Target: Future**

---

## KNOWN TECHNICAL DEBT

| Item | Priority | Notes |
|------|----------|-------|
| Rate limiting on /api/analyze | High | Add before public launch |
| Image size validation | High | Max 10MB, JPEG/PNG only |
| Analysis timeout handling | Medium | LLM calls can be slow |
| Prompt versioning | Medium | Track which prompt version produced which analysis |
| Supabase RLS policies | High | Lock down before auth is added |

---

## DECISION LOG

| Date | Decision | Reason |
|------|----------|--------|
| 2026-05-26 | Use Claude as primary AI | Best multimodal chart reading |
| 2026-05-26 | Next.js App Router | Server components reduce client bundle |
| 2026-05-26 | Supabase | Auth + DB + Storage in one |
| 2026-05-26 | No real-time data | Keep scope tight for MVP |
| 2026-05-26 | No trade execution | Legal/ethical boundary |
