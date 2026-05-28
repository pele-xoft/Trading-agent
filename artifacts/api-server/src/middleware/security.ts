import { type Request, type Response, type NextFunction } from "express";

export function securityHeaders(_req: Request, res: Response, next: NextFunction): void {
  res.removeHeader("X-Powered-By");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "0");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "geolocation=(), microphone=(), camera=()");
  res.setHeader("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'");
  res.setHeader("Cache-Control", "no-store, no-cache");
  next();
}

export function sanitizeErrors(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (res.headersSent) return;
  const isDev = process.env.NODE_ENV === "development";
  const message = err instanceof Error ? err.message : "An internal error occurred";
  res.status(500).json({
    error: isDev ? message : "An internal error occurred",
    ...(isDev && err instanceof Error && err.stack ? { stack: err.stack } : {}),
  });
}

export function validateContentType(req: Request, res: Response, next: NextFunction): void {
  if (["POST", "PUT", "PATCH"].includes(req.method)) {
    const ct = req.headers["content-type"] ?? "";
    if (!ct.includes("application/json")) {
      res.status(415).json({ error: "Content-Type must be application/json" });
      return;
    }
  }
  next();
}
