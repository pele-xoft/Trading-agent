import { createHash } from "crypto";

// 60-minute TTL: same chart re-uploaded within an hour = free
const TTL_MS = 60 * 60 * 1000;
const MAX_ENTRIES = 500;

interface CacheEntry {
  result: unknown;
  expiresAt: number;
  hits: number;
}

const store = new Map<string, CacheEntry>();
let totalCacheHits = 0;

export function hashImage(base64: string): string {
  // Hash the first 8KB of the image data — enough to uniquely identify the image
  // while avoiding hashing the entire (potentially large) base64 string
  return createHash("sha256").update(base64.slice(0, 8192)).digest("hex").slice(0, 20);
}

export function getCachedResult(hash: string): unknown | null {
  const entry = store.get(hash);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(hash);
    return null;
  }
  entry.hits++;
  totalCacheHits++;
  return entry.result;
}

export function cacheResult(hash: string, result: unknown): void {
  // Evict expired entries if we're approaching the limit
  if (store.size >= MAX_ENTRIES) {
    const now = Date.now();
    for (const [k, v] of store) {
      if (v.expiresAt < now) store.delete(k);
      if (store.size < MAX_ENTRIES * 0.8) break;
    }
    // If still over limit, evict oldest (first inserted = lowest TTL remaining)
    if (store.size >= MAX_ENTRIES) {
      const oldest = [...store.entries()].sort((a, b) => a[1].expiresAt - b[1].expiresAt);
      for (const [k] of oldest.slice(0, 50)) store.delete(k);
    }
  }
  store.set(hash, { result, expiresAt: Date.now() + TTL_MS, hits: 0 });
}

export function getCacheHits(): number {
  return totalCacheHits;
}

export function getCacheStats(): { entries: number; hits: number; ttlMinutes: number } {
  return { entries: store.size, hits: totalCacheHits, ttlMinutes: TTL_MS / 60000 };
}
