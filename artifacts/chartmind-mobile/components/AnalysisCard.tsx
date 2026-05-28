import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
} from "react-native";
import type { AnalysisRecord, MarketBias, TradeGrade, TradeType } from "@/types";
import { useColors } from "@/hooks/useColors";

function formatPrice(n: number | null | undefined): string {
  if (n == null) return "—";
  return n.toLocaleString(undefined, { maximumFractionDigits: 5 });
}

function BiasChip({ bias }: { bias: MarketBias }) {
  const colors = useColors();
  const config = {
    bullish: { label: "BULLISH", color: colors.bullish, bg: colors.bullishDim, border: colors.bullish },
    bearish: { label: "BEARISH", color: colors.bearish, bg: colors.bearishDim, border: colors.bearish },
    neutral: { label: "NEUTRAL", color: colors.neutral, bg: colors.neutralDim, border: colors.neutral },
  }[bias];
  return (
    <View style={[styles.chip, { backgroundColor: config.bg, borderColor: config.border, borderWidth: 1 }]}>
      <Text style={[styles.chipText, { color: config.color }]}>{config.label}</Text>
    </View>
  );
}

function GradeChip({ grade }: { grade: TradeGrade }) {
  const gradeConfig: Record<TradeGrade, { color: string; bg: string; border: string }> = {
    "A+": { color: "#22c55e", bg: "rgba(34,197,94,0.15)", border: "#22c55e" },
    "A":  { color: "#22c55e", bg: "rgba(34,197,94,0.10)", border: "#22c55e" },
    "B":  { color: "#f5a623", bg: "rgba(245,166,35,0.12)", border: "#f5a623" },
    "C":  { color: "#94a3b8", bg: "rgba(148,163,184,0.12)", border: "#94a3b8" },
    "avoid": { color: "#ef4444", bg: "rgba(239,68,68,0.12)", border: "#ef4444" },
  };
  const c = gradeConfig[grade];
  return (
    <View style={[styles.chip, { backgroundColor: c.bg, borderColor: c.border, borderWidth: 1 }]}>
      <Text style={[styles.chipText, { color: c.color }]}>
        {grade === "avoid" ? "AVOID" : grade}
      </Text>
    </View>
  );
}

function SetupChip({ type }: { type: TradeType }) {
  const colors = useColors();
  const config = {
    buy: { label: "BUY", color: colors.bullish, bg: colors.bullishDim },
    sell: { label: "SELL", color: colors.bearish, bg: colors.bearishDim },
    wait: { label: "WAIT", color: colors.neutral, bg: colors.neutralDim },
  }[type];
  return (
    <View style={[styles.chip, { backgroundColor: config.bg }]}>
      <Text style={[styles.chipText, { color: config.color }]}>{config.label}</Text>
    </View>
  );
}

function ConfidenceBar({ value }: { value: number }) {
  const colors = useColors();
  const color = value >= 70 ? colors.bullish : value >= 50 ? colors.accent : colors.bearish;
  return (
    <View style={styles.confidenceRow}>
      <View style={[styles.confidenceTrack, { backgroundColor: colors.border }]}>
        <View style={[styles.confidenceFill, { width: `${value}%` as any, backgroundColor: color }]} />
      </View>
      <Text style={[styles.monoText, { color, minWidth: 36, textAlign: "right", fontSize: 12, fontWeight: "700" }]}>
        {value}%
      </Text>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const colors = useColors();
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>{title.toUpperCase()}</Text>
      {children}
    </View>
  );
}

function Row({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  const colors = useColors();
  return (
    <View style={[styles.row, { borderBottomColor: colors.border }]}>
      <Text style={[styles.rowLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[styles.monoText, { color: valueColor ?? colors.foreground, fontSize: 12, fontWeight: "600" }]}>
        {value}
      </Text>
    </View>
  );
}

interface AnalysisCardProps {
  analysis: AnalysisRecord;
}

export function AnalysisCard({ analysis }: AnalysisCardProps) {
  const colors = useColors();
  const r = analysis.result;
  if (!r) return null;

  const setup = r.tradeSetup;
  const rsi = r.indicators.rsi;
  const stoch = r.indicators.stochastic;
  const ma = r.indicators.movingAverages;

  const rsiColor =
    rsi.zone === "overbought" ? colors.bearish
    : rsi.zone === "oversold" ? colors.bullish
    : rsi.zone === "bullish" ? colors.bullish
    : rsi.zone === "bearish" ? colors.bearish
    : colors.mutedForeground;

  const stochColor =
    stoch.zone === "overbought" ? colors.bearish
    : stoch.zone === "oversold" ? colors.bullish
    : colors.mutedForeground;

  const maColor =
    ma.crossoverType === "golden" ? colors.bullish
    : ma.crossoverType === "death" ? colors.bearish
    : colors.mutedForeground;

  const trendColor =
    r.structure.trend === "uptrend" ? colors.bullish
    : r.structure.trend === "downtrend" ? colors.bearish
    : colors.mutedForeground;

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={styles.headerLeft}>
          <BiasChip bias={r.marketBias} />
          <View style={[styles.tfBadge, { backgroundColor: colors.secondary }]}>
            <Text style={[styles.monoText, { color: colors.mutedForeground, fontSize: 11 }]}>
              {analysis.timeframe}
            </Text>
          </View>
          {r.tradeGrade && <GradeChip grade={r.tradeGrade} />}
        </View>
        <View style={styles.headerRight}>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>Confidence</Text>
          <View style={{ width: 120 }}>
            <ConfidenceBar value={r.confidence} />
          </View>
        </View>
      </View>

      {/* Reasoning */}
      <Text style={[styles.reasoning, { color: colors.foreground }]}>{r.reasoning}</Text>

      {/* Indicators */}
      <Section title="Indicators">
        <Row label="RSI" value={`${rsi.value.toFixed(1)} — ${rsi.zone}`} valueColor={rsiColor} />
        <Row label="Stoch K/D" value={`${stoch.kValue.toFixed(0)}/${stoch.dValue.toFixed(0)} — ${stoch.zone}`} valueColor={stochColor} />
        <Row
          label="MA Crossover"
          value={ma.crossoverType === "none" ? "None" : ma.crossoverType === "golden" ? "Golden Cross" : "Death Cross"}
          valueColor={maColor}
        />
        <Row
          label="Price vs MAs"
          value={`${ma.priceAboveFast ? "↑" : "↓"} Fast  ${ma.priceAboveSlow ? "↑" : "↓"} Slow`}
        />
      </Section>

      {/* Market Structure */}
      <Section title="Market Structure">
        <Row label="Trend" value={r.structure.trend} valueColor={trendColor} />
        <Row label="Momentum" value={`${r.momentum.strength} ${r.momentum.type}`} />
        <Row label="Support" value={formatPrice(r.supportResistance.nearestSupport)} />
        <Row label="Resistance" value={formatPrice(r.supportResistance.nearestResistance)} />
      </Section>

      {/* Trade Setup */}
      <Section title="Trade Setup">
        <View style={[styles.tradeSetupBox, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
          <View style={styles.tradeSetupHeader}>
            <SetupChip type={setup.type} />
            {setup.riskRewardRatio > 0 && (
              <Text style={[styles.monoText, { color: colors.accent, fontSize: 13, fontWeight: "700" }]}>
                R:R {setup.riskRewardRatio.toFixed(1)}
              </Text>
            )}
          </View>

          {setup.type !== "wait" && (
            <>
              <View style={styles.tradeGrid}>
                <View style={styles.tradeGridItem}>
                  <Text style={[styles.label, { color: colors.mutedForeground }]}>Entry Zone</Text>
                  <Text style={[styles.monoText, { color: colors.foreground, fontSize: 12, fontWeight: "700" }]}>
                    {formatPrice(setup.entryZone.low)} – {formatPrice(setup.entryZone.high)}
                  </Text>
                </View>
                <View style={styles.tradeGridItem}>
                  <Text style={[styles.label, { color: colors.mutedForeground }]}>Stop Loss</Text>
                  <Text style={[styles.monoText, { color: colors.bearish, fontSize: 12, fontWeight: "700" }]}>
                    {formatPrice(setup.stopLoss)}
                  </Text>
                </View>
              </View>

              {setup.takeProfits.length > 0 && (
                <View style={styles.tpList}>
                  {setup.takeProfits.map((tp, i) => (
                    <View key={i} style={styles.tpRow}>
                      <Text style={[styles.label, { color: colors.mutedForeground }]}>{tp.label}</Text>
                      <Text style={[styles.monoText, { color: colors.bullish, fontSize: 12, fontWeight: "700" }]}>
                        {formatPrice(tp.level)}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </>
          )}

          <Text style={[styles.rationale, { color: colors.mutedForeground }]}>{setup.rationale}</Text>
        </View>
      </Section>

      {/* Confidence Factors */}
      {r.confidenceFactors.length > 0 && (
        <Section title="Confidence Factors">
          {r.confidenceFactors.map((f, i) => (
            <View key={i} style={styles.factorRow}>
              <Text style={{ color: colors.accent, fontSize: 8, marginTop: 3 }}>◆</Text>
              <Text style={[styles.bodyText, { color: colors.foreground, flex: 1 }]}>{f}</Text>
            </View>
          ))}
        </Section>
      )}

      {/* Warnings */}
      {r.warnings.length > 0 && (
        <View style={[styles.warningBox, { backgroundColor: colors.accentDim, borderColor: "rgba(245, 166, 35, 0.2)" }]}>
          <Text style={[styles.sectionTitle, { color: colors.accent, marginBottom: 6 }]}>WARNINGS</Text>
          {r.warnings.map((w, i) => (
            <Text key={i} style={[styles.bodyText, { color: colors.mutedForeground }]}>• {w}</Text>
          ))}
        </View>
      )}

      {/* Invalidation */}
      {r.invalidationConditions.length > 0 && (
        <Section title="Invalidation">
          {r.invalidationConditions.map((c, i) => (
            <Text key={i} style={[styles.bodyText, { color: colors.mutedForeground }]}>• {c}</Text>
          ))}
        </Section>
      )}

      <Text style={[styles.disclaimer, { color: colors.mutedForeground }]}>
        AI-generated analysis. Not financial advice.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 16,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerRight: {
    alignItems: "flex-end",
    gap: 4,
  },
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 100,
  },
  chipText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  tfBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  label: {
    fontSize: 11,
  },
  reasoning: {
    fontSize: 13,
    lineHeight: 20,
  },
  section: {
    gap: 6,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
    borderBottomWidth: 1,
  },
  rowLabel: {
    fontSize: 12,
  },
  monoText: {
    fontFamily: "Inter_500Medium",
  },
  bodyText: {
    fontSize: 12,
    lineHeight: 18,
  },
  confidenceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  confidenceTrack: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
  confidenceFill: {
    height: "100%",
    borderRadius: 2,
  },
  tradeSetupBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 10,
  },
  tradeSetupHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tradeGrid: {
    flexDirection: "row",
    gap: 12,
  },
  tradeGridItem: {
    flex: 1,
    gap: 2,
  },
  tpList: {
    gap: 4,
  },
  tpRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rationale: {
    fontSize: 12,
    lineHeight: 18,
  },
  factorRow: {
    flexDirection: "row",
    gap: 6,
    alignItems: "flex-start",
  },
  warningBox: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    gap: 4,
  },
  disclaimer: {
    fontSize: 10,
    opacity: 0.5,
    textAlign: "center",
  },
});
