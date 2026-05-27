import { createHash } from "crypto";

const TTL_MS = 5 * 60 * 1000;

interface CacheEntry {
  result: unknown;
  expiresAt: number;
}

const store = new Map<string, CacheEntry>();
let cacheHits = 0;

export function hashImage(base64: string): string {
  return createHash("sha256").update(base64.slice(0, 4096)).digest("hex").slice(0, 16);
}

export function getCachedResult(hash: string): unknown | null {
  const entry = store.get(hash);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(hash);
    return null;
  }
  cacheHits++;
  return entry.result;
}

export function cacheResult(hash: string, result: unknown): void {
  store.set(hash, { result, expiresAt: Date.now() + TTL_MS });
  if (store.size > 200) {
    const now = Date.now();
    for (const [k, v] of store) {
      if (v.expiresAt < now) store.delete(k);
    }
  }
}

export function getCacheHits(): number {
  return cacheHits;
}
