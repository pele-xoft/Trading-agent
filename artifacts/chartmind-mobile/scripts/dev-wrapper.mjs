/**
 * Dev wrapper: opens the proxy port immediately so the platform health check passes,
 * then starts Metro (Expo dev server) on PORT+1. Proxies web requests to Metro.
 * Metro uses Replit's proxy layer and doesn't bind a local TCP socket directly,
 * so this shim is required.
 */
import { createServer, request as httpRequest } from "http";
import { spawn } from "child_process";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const packageRoot = resolve(__dirname, "..");

const PORT = parseInt(process.env.PORT || "22776", 10);
const METRO_PORT = PORT + 1;

const metroEnv = { ...process.env, PORT: String(METRO_PORT) };

// ── 1. Start proxy server FIRST so port opens immediately ─────────────────────
const server = createServer((req, res) => {
  if (req.url === "/status" || req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok", metro: METRO_PORT }));
    return;
  }

  const proxyReq = httpRequest(
    { hostname: "localhost", port: METRO_PORT, path: req.url, method: req.method, headers: req.headers },
    (proxyRes) => {
      res.writeHead(proxyRes.statusCode ?? 200, proxyRes.headers);
      proxyRes.pipe(res, { end: true });
    },
  );

  proxyReq.on("error", () => {
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta http-equiv="refresh" content="3">
<title>ChartMind Mobile</title><style>
body{font-family:system-ui;display:flex;align-items:center;justify-content:center;
min-height:100vh;margin:0;background:#0a0a0f;color:#f1f5f9}
.box{text-align:center;gap:16px;display:flex;flex-direction:column;align-items:center}
.dot{width:48px;height:48px;border:3px solid #f5a623;border-top-color:transparent;
border-radius:50%;animation:spin 1s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
p{margin:0;font-size:14px;color:#94a3b8}
</style></head><body><div class="box"><div class="dot"></div>
<p>ChartMind Mobile is starting up…</p><p style="font-size:12px">This page will refresh automatically</p>
</div></body></html>`;
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(html);
  });

  req.pipe(proxyReq, { end: true });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`[dev-wrapper] Proxy listening on port ${PORT}`);
});

server.on("error", (err) => {
  console.error("[dev-wrapper] Proxy error:", err);
  process.exit(1);
});

// ── 2. Then start Metro ───────────────────────────────────────────────────────
console.log(`[dev-wrapper] Starting Metro on port ${METRO_PORT}…`);

const metro = spawn(
  "pnpm",
  ["exec", "expo", "start", "--localhost", "--port", String(METRO_PORT)],
  { cwd: packageRoot, env: metroEnv, stdio: "inherit" },
);

metro.on("error", (err) => {
  console.error("[dev-wrapper] Metro failed to start:", err);
  process.exit(1);
});

metro.on("exit", (code) => {
  if (code !== 0 && code !== null) {
    console.error(`[dev-wrapper] Metro exited with code ${code}`);
    process.exit(code ?? 1);
  }
});

// ── 3. Cleanup ────────────────────────────────────────────────────────────────
function shutdown() {
  metro.kill("SIGTERM");
  server.close();
  process.exit(0);
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
