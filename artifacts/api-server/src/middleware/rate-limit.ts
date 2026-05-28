import { type Request, type Response, type NextFunction } from "express";

interface RateWindow { timestamps: number[] }

const store = new Map<string, RateWindow>();

setInterval(() => {
  const cutoff = Date.now() - 600_000;
  for (const [key, w] of store.entries()) {
    if (!w.timestamps.length || w.timestamps[w.timestamps.length - 1] < cutoff) {
      store.delete(key);
    }
  }
}, 300_000).unref();

function getClientIp(req: Request): string {
  const fwd = req.headers["x-forwarded-for"];
  if (typeof fwd === "string") return fwd.split(",")[0].trim();
  return req.socket?.remoteAddress ?? "unknown";
}

export interface RateLimitOptions {
  maxRequests: number;
  windowMs: number;
  message?: string;
  keyPrefix?: string;
}

export function createRateLimiter(opts: RateLimitOptions) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const ip = getClientIp(req);
    const key = `${opts.keyPrefix ?? "rl"}:${ip}`;
    const now = Date.now();
    const cutoff = now - opts.windowMs;

    const window = store.get(key) ?? { timestamps: [] };
    window.timestamps = window.timestamps.filter(t => t > cutoff);

    res.setHeader("X-RateLimit-Limit", String(opts.maxRequests));
    res.setHeader("X-RateLimit-Remaining", String(Math.max(0, opts.maxRequests - window.timestamps.length)));

    if (window.timestamps.length >= opts.maxRequests) {
      const oldest = window.timestamps[0];
      const retryAfter = Math.ceil(((oldest + opts.windowMs) - now) / 1000);
      res.setHeader("Retry-After", String(Math.max(1, retryAfter)));
      res.status(429).json({
        error: opts.message ?? "Too many requests — please slow down.",
        retryAfter: Math.max(1, retryAfter),
        code: "RATE_LIMIT_EXCEEDED",
      });
      return;
    }

    window.timestamps.push(now);
    store.set(key, window);
    next();
  };
}

export const globalRateLimiter = createRateLimiter({
  maxRequests: 200,
  windowMs: 60_000,
  message: "Global rate limit exceeded. Please wait before retrying.",
  keyPrefix: "global",
});

export const analysisRateLimiter = createRateLimiter({
  maxRequests: 20,
  windowMs: 60_000,
  message: "Analysis rate limit: max 20 analyses per minute per IP.",
  keyPrefix: "analysis",
});

export const confluenceRateLimiter = createRateLimiter({
  maxRequests: 10,
  windowMs: 60_000,
  message: "Confluence rate limit: max 10 confluence analyses per minute per IP.",
  keyPrefix: "confluence",
});
