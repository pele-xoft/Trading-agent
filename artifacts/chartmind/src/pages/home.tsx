import { useState, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { UploadComponent } from "../components/UploadComponent";
import { AnalysisCard } from "../components/AnalysisCard";
import { HistoryList } from "../components/HistoryList";
import { StatsPanel } from "../components/StatsPanel";
import type { AnalysisRecord, Timeframe } from "../types";

const API_BASE = `${import.meta.env.BASE_URL}api`;

async function fetchAnalyses(): Promise<AnalysisRecord[]> {
  const res = await fetch(`${API_BASE}/analyses?limit=30`);
  if (!res.ok) throw new Error("Failed to load history");
  const data = await res.json();
  return data.analyses ?? [];
}

async function fetchStats() {
  const res = await fetch(`${API_BASE}/analyses/stats`);
  if (!res.ok) throw new Error("Failed to load stats");
  return res.json();
}

async function runAnalysis(payload: { imageUrl: string; timeframe: Timeframe }): Promise<AnalysisRecord> {
  const res = await fetch(`${API_BASE}/analyses`, {
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

type Tab = "analyze" | "history" | "stats";

const TABS: { id: Tab; label: string }[] = [
  { id: "analyze", label: "Analyze" },
  { id: "history", label: "History" },
  { id: "stats", label: "Stats" },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("analyze");
  const [currentAnalysis, setCurrentAnalysis] = useState<AnalysisRecord | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const queryClient = useQueryClient();

  const historyQuery = useQuery({
    queryKey: ["analyses"],
    queryFn: fetchAnalyses,
  });

  const statsQuery = useQuery({
    queryKey: ["analyses-stats"],
    queryFn: fetchStats,
  });

  const analyzeMutation = useMutation({
    mutationFn: runAnalysis,
    onSuccess: (data) => {
      setCurrentAnalysis(data);
      setErrorMsg(null);
      queryClient.invalidateQueries({ queryKey: ["analyses"] });
      queryClient.invalidateQueries({ queryKey: ["analyses-stats"] });
    },
    onError: (err) => {
      setErrorMsg(err instanceof Error ? err.message : "Analysis failed");
    },
  });

  const handleAnalyze = useCallback((imageDataUrl: string, timeframe: Timeframe) => {
    setErrorMsg(null);
    analyzeMutation.mutate({ imageUrl: imageDataUrl, timeframe });
  }, [analyzeMutation]);

  const handleSelectHistory = useCallback((a: AnalysisRecord) => {
    setSelectedId(a.id);
    setCurrentAnalysis(a);
    setActiveTab("analyze");
  }, []);

  return (
    <div className="min-h-dvh flex flex-col" style={{ background: "hsl(var(--background))", maxWidth: "480px", margin: "0 auto" }}>
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-4 border-b"
        style={{ borderColor: "hsl(var(--border))" }}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black"
            style={{ background: "var(--cm-accent)", color: "#0a0a0f" }}>
            CM
          </div>
          <span className="font-bold text-base tracking-tight" style={{ color: "hsl(var(--foreground))" }}>
            ChartMind
          </span>
        </div>
        <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
          style={{ background: "var(--cm-accent-dim)", color: "var(--cm-accent)" }}>
          GPT-4o Vision
        </span>
      </header>

      {/* Tabs */}
      <div className="flex border-b px-4" style={{ borderColor: "hsl(var(--border))" }}>
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className="py-3 px-1 mr-5 text-sm font-semibold relative transition-colors"
            style={{
              color: activeTab === id ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))",
            }}
          >
            {label}
            {id === "history" && (historyQuery.data?.length ?? 0) > 0 && (
              <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full"
                style={{ background: "var(--cm-accent-dim)", color: "var(--cm-accent)" }}>
                {historyQuery.data!.length}
              </span>
            )}
            {id === "stats" && (statsQuery.data?.total ?? 0) > 0 && (
              <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full"
                style={{ background: "var(--cm-neutral-dim)", color: "var(--cm-neutral)" }}>
                {statsQuery.data!.total}
              </span>
            )}
            {activeTab === id && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full"
                style={{ background: "var(--cm-accent)" }} />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <main className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">

        {/* ANALYZE TAB */}
        {activeTab === "analyze" && (
          <>
            <UploadComponent
              onAnalyze={handleAnalyze}
              isAnalyzing={analyzeMutation.isPending}
            />

            {errorMsg && (
              <div className="rounded-xl px-4 py-3 text-sm cm-fade-in"
                style={{ background: "var(--cm-bearish-dim)", color: "var(--cm-bearish)", border: "1px solid var(--cm-bearish)" }}>
                {errorMsg}
              </div>
            )}

            {analyzeMutation.isPending && (
              <div className="flex flex-col items-center gap-3 py-8 cm-fade-in">
                <div className="cm-spin w-8 h-8 border-2 rounded-full"
                  style={{ borderColor: "hsl(var(--border))", borderTopColor: "var(--cm-accent)" }} />
                <p className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
                  AI is reading your chart...
                </p>
                <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))", opacity: 0.6 }}>
                  This takes 5–15 seconds
                </p>
              </div>
            )}

            {currentAnalysis && !analyzeMutation.isPending && (
              <AnalysisCard analysis={currentAnalysis} />
            )}

            {!currentAnalysis && !analyzeMutation.isPending && !errorMsg && (
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <div className="text-3xl">🧠</div>
                <p className="text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>
                  AI-powered chart analysis
                </p>
                <p className="text-xs leading-relaxed max-w-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                  Upload a chart screenshot and get instant technical analysis — RSI, Stochastic, MAs, structure, and trade setups.
                </p>
              </div>
            )}
          </>
        )}

        {/* HISTORY TAB */}
        {activeTab === "history" && (
          <>
            {historyQuery.isLoading && (
              <div className="flex justify-center py-8">
                <div className="cm-spin w-6 h-6 border-2 rounded-full"
                  style={{ borderColor: "hsl(var(--border))", borderTopColor: "var(--cm-accent)" }} />
              </div>
            )}
            {historyQuery.data && (
              <HistoryList
                analyses={historyQuery.data}
                onSelect={handleSelectHistory}
                selectedId={selectedId}
              />
            )}
          </>
        )}

        {/* STATS TAB */}
        {activeTab === "stats" && (
          <>
            {statsQuery.isLoading && (
              <div className="flex justify-center py-8">
                <div className="cm-spin w-6 h-6 border-2 rounded-full"
                  style={{ borderColor: "hsl(var(--border))", borderTopColor: "var(--cm-accent)" }} />
              </div>
            )}
            {statsQuery.isError && (
              <div className="rounded-xl px-4 py-3 text-sm"
                style={{ background: "var(--cm-bearish-dim)", color: "var(--cm-bearish)" }}>
                Failed to load stats
              </div>
            )}
            {statsQuery.data && <StatsPanel stats={statsQuery.data} />}
          </>
        )}
      </main>
    </div>
  );
}
