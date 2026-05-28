import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes/index.js";
import { logger } from "./lib/logger.js";
import { securityHeaders, sanitizeErrors, validateContentType } from "./middleware/security.js";
import { globalRateLimiter } from "./middleware/rate-limit.js";

const app: Express = express();

// ── Security first ────────────────────────────────────────────────────────────
app.use(securityHeaders);
app.use(cors({ origin: true, credentials: false }));

// ── Global rate limiting ──────────────────────────────────────────────────────
app.use(globalRateLimiter);

// ── Request logging ───────────────────────────────────────────────────────────
app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) { return { id: req.id, method: req.method, url: req.url?.split("?")[0] }; },
      res(res) { return { statusCode: res.statusCode }; },
    },
  }),
);

// ── Body parsing (8MB — client compresses charts before upload) ───────────────
app.use(express.json({ limit: "8mb" }));
app.use(express.urlencoded({ extended: true, limit: "8mb" }));

// ── Content-type validation on writes ────────────────────────────────────────
app.use(validateContentType);

// ── Routes ───────────────────────────────────────────────────────────────────
app.use("/api", router);

// ── Error handler (must be last, 4 args for Express) ─────────────────────────
app.use(sanitizeErrors);

export default app;
