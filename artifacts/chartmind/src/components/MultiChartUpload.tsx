import { useCallback, useRef, useState } from "react";

export type ConfluenceTimeframe = "15m" | "1h" | "4h" | "1D";
export const CONFLUENCE_TIMEFRAMES: ConfluenceTimeframe[] = ["15m", "1h", "4h", "1D"];

const MAX_PX = 1024;
const JPEG_QUALITY = 0.82;

function resizeImage(dataUrl: string): Promise<{ dataUrl: string; kb: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, MAX_PX / Math.max(img.naturalWidth, img.naturalHeight));
      const w = Math.round(img.naturalWidth * scale);
      const h = Math.round(img.naturalHeight * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w; canvas.height = h;
      canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
      const result = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
      resolve({ dataUrl: result, kb: Math.round(result.length * 0.75 / 1024) });
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
}

export interface ChartSlot {
  timeframe: ConfluenceTimeframe;
  imageDataUrl: string | null;
  kb: number | null;
}

interface SlotUploadProps {
  slot: ChartSlot;
  onUpload: (tf: ConfluenceTimeframe, dataUrl: string, kb: number) => void;
  onClear: (tf: ConfluenceTimeframe) => void;
  isProcessing: boolean;
}

// TF label config
const TF_CFG: Record<string, { weight: string; htf: boolean }> = {
  "1D":  { weight: "35%", htf: true },
  "4h":  { weight: "25%", htf: true },
  "1h":  { weight: "25%", htf: false },
  "15m": { weight: "15%", htf: false },
};

function SlotUpload({ slot, onUpload, onClear, isProcessing }: SlotUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [bounced, setBounced] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setIsResizing(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const { dataUrl, kb } = await resizeImage(e.target?.result as string);
        onUpload(slot.timeframe, dataUrl, kb);
        setBounced(true);
        setTimeout(() => setBounced(false), 500);
      } catch {
        onUpload(slot.timeframe, e.target?.result as string, 0);
      } finally {
        setIsResizing(false);
      }
    };
    reader.readAsDataURL(file);
  }, [slot.timeframe, onUpload]);

  const isFilled = !!slot.imageDataUrl;
  const busy = isResizing || isProcessing;
  const cfg = TF_CFG[slot.timeframe] ?? { weight: "20%", htf: false };

  return (
    <div className="flex flex-col gap-1.5">
      {/* TF header */}
      <div className="flex items-center justify-between px-0.5">
        <span className="text-sm font-black"
          style={{ fontFamily: "var(--cm-font-display)", color: isFilled ? "var(--cm-purple)" : "var(--cm-text-secondary)" }}>
          {slot.timeframe}
        </span>
        <div className="flex items-center gap-1">
          <span className="text-xs px-1.5 py-0.5 rounded"
            style={{ background: cfg.htf ? "rgba(108,99,255,0.10)" : "rgba(0,212,255,0.08)", color: cfg.htf ? "var(--cm-purple)" : "var(--cm-cyan)", fontFamily: "var(--cm-font-mono)", fontSize: "0.55rem" }}>
            {cfg.htf ? "HTF" : "LTF"}
          </span>
          <span className="text-xs" style={{ color: "var(--cm-text-muted)", fontFamily: "var(--cm-font-mono)", fontSize: "0.55rem" }}>
            {cfg.weight}
          </span>
        </div>
      </div>

      <div
        onDrop={(e) => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onClick={() => !isFilled && !busy && inputRef.current?.click()}
        className={`relative rounded-xl border-2 overflow-hidden transition-all duration-200 ${bounced ? "cm-slot-bounce" : ""}`}
        style={{
          height: "108px",
          cursor: isFilled || busy ? "default" : "pointer",
          borderStyle: isFilled ? "solid" : "dashed",
          borderColor: isDragging ? "var(--cm-cyan)" : isFilled ? "var(--cm-bullish)" : "var(--cm-border-strong)",
          background: isDragging
            ? "rgba(0,212,255,0.05)"
            : isFilled
            ? "var(--cm-bg-elevated)"
            : "rgba(108,99,255,0.03)",
          boxShadow: isDragging
            ? "0 0 24px rgba(0,212,255,0.2), inset 0 0 24px rgba(0,212,255,0.05)"
            : isFilled
            ? "0 0 12px rgba(0,230,118,0.10)"
            : "none",
        }}
      >
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} className="hidden" />

        {isResizing ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <div className="cm-spin w-5 h-5 border-2 rounded-full"
              style={{ borderColor: "var(--cm-border-default)", borderTopColor: "var(--cm-purple)" }} />
            <span className="text-xs" style={{ color: "var(--cm-text-secondary)", fontSize: "0.6rem" }}>compressing...</span>
          </div>
        ) : isFilled ? (
          <>
            <img src={slot.imageDataUrl!} alt={slot.timeframe} className="w-full h-full object-cover" />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
              style={{ background: "rgba(8,8,16,0.75)" }}>
              <button onClick={(e) => { e.stopPropagation(); onClear(slot.timeframe); }}
                className="text-xs font-bold px-3 py-1.5 rounded-lg"
                style={{ background: "var(--cm-bearish-dim)", color: "var(--cm-bearish)", border: "1px solid rgba(255,61,87,0.3)", fontFamily: "var(--cm-font-display)" }}>
                Remove
              </button>
            </div>
            {slot.kb != null && slot.kb > 0 && (
              <div className="absolute bottom-1.5 left-1.5 text-xs px-1.5 py-0.5 rounded"
                style={{ background: "rgba(0,0,0,0.8)", color: "var(--cm-bullish)", fontFamily: "var(--cm-font-mono)", fontSize: "0.55rem" }}>
                {slot.kb}KB
              </div>
            )}
            {/* Green check badge */}
            <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center"
              style={{ background: "var(--cm-bullish)", boxShadow: "0 0 8px rgba(0,230,118,0.4)" }}>
              <span style={{ color: "#080810", fontSize: "0.6rem", fontWeight: "bold" }}>✓</span>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 select-none">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "var(--cm-purple-dim)", border: "1px solid var(--cm-border-default)" }}>
              <span style={{ color: "var(--cm-purple)", fontSize: "1rem" }}>+</span>
            </div>
            <span style={{ color: "var(--cm-text-muted)", fontSize: "0.6rem", fontFamily: "var(--cm-font-body)" }}>tap to upload</span>
          </div>
        )}
      </div>
    </div>
  );
}

interface MultiChartUploadProps {
  slots: ChartSlot[];
  onUpload: (tf: ConfluenceTimeframe, dataUrl: string, kb: number) => void;
  onClear: (tf: ConfluenceTimeframe) => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
  isMockMode: boolean;
}

export function MultiChartUpload({ slots, onUpload, onClear, onAnalyze, isAnalyzing, isMockMode }: MultiChartUploadProps) {
  const filledCount = slots.filter(s => s.imageDataUrl !== null).length;
  const canAnalyze = filledCount >= 2 && !isAnalyzing;

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col gap-0.5">
        <h2 className="text-base font-black" style={{ fontFamily: "var(--cm-font-display)", color: "var(--cm-text-primary)", letterSpacing: "0.02em" }}>
          MULTI-TIMEFRAME ANALYSIS
        </h2>
        <p className="text-xs" style={{ color: "var(--cm-text-secondary)", fontFamily: "var(--cm-font-body)" }}>
          Upload 2–4 charts · HTF 60% · LTF 40% weighted scoring
        </p>
      </div>

      {/* 2×2 grid — order: 1D, 4h (row 1), 1h, 15m (row 2) */}
      <div className="grid grid-cols-2 gap-3">
        {[...slots].sort((a, b) => ["1D","4h","1h","15m"].indexOf(a.timeframe) - ["1D","4h","1h","15m"].indexOf(b.timeframe)).map(slot => (
          <SlotUpload key={slot.timeframe} slot={slot} onUpload={onUpload} onClear={onClear} isProcessing={isAnalyzing} />
        ))}
      </div>

      {/* Progress track */}
      <div className="flex items-center gap-2">
        {["1D","4h","1h","15m"].map(tf => {
          const slot = slots.find(s => s.timeframe === tf);
          return (
            <div key={tf} className="flex-1 flex flex-col gap-1">
              <div className="h-1 rounded-full overflow-hidden" style={{ background: "var(--cm-bg-elevated)" }}>
                <div className="h-full rounded-full transition-all duration-500"
                  style={{ width: slot?.imageDataUrl ? "100%" : "0%", background: "linear-gradient(90deg, var(--cm-purple), var(--cm-cyan))" }} />
              </div>
            </div>
          );
        })}
        <span className="text-xs font-bold ml-1 flex-shrink-0"
          style={{ fontFamily: "var(--cm-font-mono)", color: filledCount >= 2 ? "var(--cm-purple)" : "var(--cm-text-muted)" }}>
          {filledCount}/4
        </span>
      </div>

      {/* Analyze button */}
      <div className="flex flex-col gap-2">
        <button
          onClick={onAnalyze}
          disabled={!canAnalyze}
          className="cm-btn-gradient w-full rounded-xl font-bold transition-all duration-200"
          style={{
            height: "56px",
            fontSize: "0.8rem",
            letterSpacing: "0.1em",
            opacity: filledCount < 2 ? 0.4 : 1,
            cursor: canAnalyze ? "pointer" : "not-allowed",
          }}
        >
          {filledCount < 2
            ? `ADD ${2 - filledCount} MORE CHART${2 - filledCount === 1 ? "" : "S"}`
            : `ANALYZE ${filledCount} CHARTS →`}
        </button>

        {filledCount >= 2 && !isAnalyzing && (
          <p className="text-center text-xs" style={{ color: "var(--cm-text-muted)", fontFamily: "var(--cm-font-body)" }}>
            {isMockMode
              ? "Demo mode — no API cost"
              : <span>Est. cost: <span style={{ color: "var(--cm-purple)", fontFamily: "var(--cm-font-mono)" }}>~${(filledCount * 0.001).toFixed(3)}</span></span>}
          </p>
        )}
      </div>
    </div>
  );
}
