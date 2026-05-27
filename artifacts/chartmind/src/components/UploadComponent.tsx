import { useCallback, useRef, useState } from "react";
import type { Timeframe } from "../types";

const TIMEFRAMES: { value: Timeframe; label: string }[] = [
  { value: "5m", label: "5m" },
  { value: "15m", label: "15m" },
  { value: "1h", label: "1h" },
  { value: "4h", label: "4h" },
  { value: "1D", label: "1D" },
];

interface UploadComponentProps {
  onAnalyze: (imageDataUrl: string, timeframe: Timeframe) => void;
  isAnalyzing: boolean;
}

export function UploadComponent({ onAnalyze, isAnalyzing }: UploadComponentProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe>("1h");
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setPreview(dataUrl);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleAnalyze = () => {
    if (!preview) return;
    onAnalyze(preview, selectedTimeframe);
  };

  const handleClear = () => {
    setPreview(null);
    setFileName(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Upload area */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onClick={() => !preview && fileInputRef.current?.click()}
        className="relative rounded-xl border-2 border-dashed transition-all duration-200 overflow-hidden cursor-pointer"
        style={{
          borderColor: isDragging ? "var(--cm-accent)" : "hsl(var(--border))",
          backgroundColor: isDragging ? "var(--cm-accent-dim)" : "hsl(var(--card))",
          minHeight: preview ? "auto" : "180px",
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileInput}
          className="hidden"
        />

        {preview ? (
          <div className="relative">
            <img
              src={preview}
              alt="Chart preview"
              className="w-full object-contain rounded-xl"
              style={{ maxHeight: "260px" }}
            />
            <button
              onClick={(e) => { e.stopPropagation(); handleClear(); }}
              className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-opacity"
              style={{ background: "rgba(0,0,0,0.7)", color: "hsl(var(--foreground))" }}
            >
              ✕
            </button>
            {fileName && (
              <div className="absolute bottom-2 left-2 right-8 text-xs truncate px-2 py-1 rounded-md"
                style={{ background: "rgba(0,0,0,0.7)", color: "hsl(var(--muted-foreground))" }}>
                {fileName}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 gap-3 select-none">
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
              style={{ background: "var(--cm-accent-dim)" }}>
              📈
            </div>
            <div className="text-center">
              <p className="font-semibold text-sm" style={{ color: "hsl(var(--foreground))" }}>
                Drop your chart here
              </p>
              <p className="text-xs mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>
                or tap to select • PNG, JPG, WebP
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Timeframe selector */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: "hsl(var(--muted-foreground))" }}>
          Timeframe
        </label>
        <div className="grid grid-cols-5 gap-1.5">
          {TIMEFRAMES.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setSelectedTimeframe(value)}
              className="py-2 rounded-lg text-sm font-bold transition-all duration-150"
              style={{
                background: selectedTimeframe === value ? "var(--cm-accent)" : "hsl(var(--card))",
                color: selectedTimeframe === value ? "hsl(var(--background))" : "hsl(var(--muted-foreground))",
                border: `1px solid ${selectedTimeframe === value ? "var(--cm-accent)" : "hsl(var(--border))"}`,
                fontFamily: "var(--font-mono, monospace)",
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Analyze button */}
      <button
        onClick={handleAnalyze}
        disabled={!preview || isAnalyzing}
        className="relative w-full py-3.5 rounded-xl font-bold text-sm transition-all duration-200 overflow-hidden"
        style={{
          background: !preview || isAnalyzing
            ? "hsl(var(--muted))"
            : "var(--cm-accent)",
          color: !preview || isAnalyzing
            ? "hsl(var(--muted-foreground))"
            : "#0a0a0f",
          cursor: !preview || isAnalyzing ? "not-allowed" : "pointer",
          opacity: !preview ? 0.5 : 1,
        }}
      >
        {isAnalyzing ? (
          <span className="flex items-center justify-center gap-2">
            <span className="cm-spin inline-block w-4 h-4 border-2 rounded-full"
              style={{ borderColor: "hsl(var(--muted-foreground))", borderTopColor: "transparent" }} />
            Analyzing chart...
          </span>
        ) : (
          "Analyze Chart"
        )}
      </button>
    </div>
  );
}
