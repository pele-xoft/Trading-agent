import type { AnalysisRecord, Timeframe } from "@/types";

function getBaseUrl(): string {
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  if (domain) return `https://${domain}`;
  return "";
}

export async function fetchAnalyses(limit = 30): Promise<AnalysisRecord[]> {
  const base = getBaseUrl();
  const res = await fetch(`${base}/api/analyses?limit=${limit}`);
  if (!res.ok) throw new Error("Failed to load analyses");
  const data = await res.json();
  return data.analyses ?? [];
}

export async function createAnalysis(payload: {
  imageUrl: string;
  timeframe: Timeframe;
}): Promise<AnalysisRecord> {
  const base = getBaseUrl();
  const res = await fetch(`${base}/api/analyses`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Analysis failed" }));
    throw new Error(err.error ?? "Analysis failed");
  }
  return res.json();
}

export async function deleteAnalysis(id: number): Promise<void> {
  const base = getBaseUrl();
  await fetch(`${base}/api/analyses/${id}`, { method: "DELETE" });
}
