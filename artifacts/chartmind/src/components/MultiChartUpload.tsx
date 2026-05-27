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

function SlotUpload({ slot, onUpload, onClear, isProcessing }: SlotUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setIsResizing(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const { dataUrl, kb } = await resizeImage(e.target?.result as string);
        onUpload(slot.timeframe, dataUrl, kb);
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

  return (
    <div className="flex flex-col gap-1">
      {/* Timeframe label */}
      <span className="text-xs font-bold text-center" style={{ fontFamily: "var(--font-mono, monospace)", color: "hsl(var(--muted-foreground))" }}>
        {slot.timeframe}
      </span>

      <div
        onDrop={(e) => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onClick={() => !isFilled && !busy && inputRef.current?.click()}
        className="relative rounded-xl border-2 border-dashed overflow-hidden transition-all duration-200"
        style={{
          height: "100px",
          cursor: isFilled || busy ? "default" : "pointer",
          borderColor: isDragging ? "var(--cm-accent)" : isFilled ? "var(--cm-accent)" : "hsl(var(--border))",
          background: isFilled ? "transparent" : isDragging ? "var(--cm-accent-dim)" : "hsl(var(--card))",
        }}
      >
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} className="hidden" />

        {isResizing ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="cm-spin w-5 h-5 border-2 rounded-full"
              style={{ borderColor: "hsl(var(--border))", borderTopColor: "var(--cm-accent)" }} />
          </div>
        ) : isFilled ? (
          <>
            <img src={slot.imageDataUrl!} alt={slot.timeframe}
              className="w-full h-full object-cover rounded-xl" />
            {/* Overlay on hover */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity rounded-xl"
              style={{ background: "rgba(0,0,0,0.6)" }}>
              <button onClick={(e) => { e.stopPropagation(); onClear(slot.timeframe); }}
                className="text-xs font-bold px-2 py-1 rounded-md"
                style={{ background: "var(--cm-bearish-dim)", color: "var(--cm-bearish)" }}>
                Clear
              </button>
            </div>
            {/* Size badge */}
            {slot.kb != null && slot.kb > 0 && (
              <div className="absolute bottom-1 right-1 text-xs px-1 py-0.5 rounded"
                style={{ background: "rgba(0,0,0,0.75)", color: "var(--cm-bullish)", fontSize: "0.6rem", fontFamily: "var(--font-mono, monospace)" }}>
                {slot.kb}KB
              </div>
            )}
            {/* Filled checkmark */}
            <div className="absolute top-1 left-1 w-4 h-4 rounded-full flex items-center justify-center"
              style={{ background: "var(--cm-accent)", fontSize: "0.55rem", color: "#0a0a0f", fontWeight: "bold" }}>
              ✓
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 select-none">
            <span className="text-lg">📈</span>
            <span className="text-xs" style={{ color: "hsl(var(--muted-foreground))", fontSize: "0.6rem" }}>tap to add</span>
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
      {/* Instruction */}
      <div className="rounded-xl px-3 py-2.5 flex items-start gap-2"
        style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
        <span className="text-base mt-0.5">🔍</span>
        <div className="flex flex-col gap-0.5">
          <p className="text-xs font-semibold" style={{ color: "hsl(var(--foreground))" }}>
            Multi-Timeframe Confluence
          </p>
          <p className="text-xs leading-relaxed" style={{ color: "hsl(var(--muted-foreground))" }}>
            Upload charts for 2–4 timeframes. The AI checks whether 15m, 1h, 4h and 1D all agree on direction before you trade.
          </p>
        </div>
      </div>

      {/* 2×2 Upload grid */}
      <div className="grid grid-cols-2 gap-3">
        {slots.map(slot => (
          <SlotUpload key={slot.timeframe} slot={slot} onUpload={onUpload} onClear={onClear} isProcessing={isAnalyzing} />
        ))}
      </div>

      {/* Filled count indicator */}
      <div className="flex items-center gap-2">
        {slots.map(s => (
          <div key={s.timeframe} className="flex-1 h-1 rounded-full transition-all duration-300"
            style={{ background: s.imageDataUrl ? "var(--cm-accent)" : "hsl(var(--border))" }} />
        ))}
        <span className="text-xs ml-1" style={{ color: "hsl(var(--muted-foreground))", fontFamily: "var(--font-mono, monospace)", whiteSpace: "nowrap" }}>
          {filledCount}/4
        </span>
      </div>

      {/* Analyze button */}
      <div className="flex flex-col gap-1.5">
        <button
          onClick={onAnalyze}
          disabled={!canAnalyze}
          className="w-full py-3.5 rounded-xl font-bold text-sm transition-all duration-200"
          style={{
            background: canAnalyze ? "var(--cm-accent)" : "hsl(var(--muted))",
            color: canAnalyze ? "#0a0a0f" : "hsl(var(--muted-foreground))",
            cursor: canAnalyze ? "pointer" : "not-allowed",
            opacity: filledCount < 2 ? 0.5 : 1,
          }}
        >
          {isAnalyzing ? (
            <span className="flex items-center justify-center gap-2">
              <span className="cm-spin inline-block w-4 h-4 border-2 rounded-full"
                style={{ borderColor: "hsl(var(--muted-foreground))", borderTopColor: "transparent" }} />
              Analysing {filledCount} timeframes...
            </span>
          ) : filledCount < 2 ? `Add ${2 - filledCount} more chart${2 - filledCount === 1 ? "" : "s"}` : `Analyse ${filledCount}-TF Confluence`}
        </button>

        {filledCount >= 2 && !isAnalyzing && (
          <p className="text-center text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
            {isMockMode
              ? <span>Demo mode — no API cost</span>
              : <span>Est. cost: <span style={{ color: "var(--cm-accent)", fontFamily: "var(--font-mono, monospace)" }}>~${(filledCount * 0.001).toFixed(3)}</span></span>
            }
          </p>
        )}
      </div>
    </div>
  );
}
