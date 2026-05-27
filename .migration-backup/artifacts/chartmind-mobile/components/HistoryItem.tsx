import React from "react";
import { View, Text, Image, Pressable, StyleSheet } from "react-native";
import type { AnalysisRecord, MarketBias, TradeType } from "@/types";
import { useColors } from "@/hooks/useColors";

function timeAgo(dateStr: string): string {
  const d = new Date(dateStr);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

interface HistoryItemProps {
  analysis: AnalysisRecord;
  onPress: () => void;
  isSelected: boolean;
}

export function HistoryItem({ analysis, onPress, isSelected }: HistoryItemProps) {
  const colors = useColors();
  const r = analysis.result;

  const biasConfig = r ? {
    bullish: { color: colors.bullish, bg: colors.bullishDim },
    bearish: { color: colors.bearish, bg: colors.bearishDim },
    neutral: { color: colors.neutral, bg: colors.neutralDim },
  }[r.marketBias] : null;

  const setupColor = r ? {
    buy: colors.bullish,
    sell: colors.bearish,
    wait: colors.neutral,
  }[r.tradeSetup.type] : null;

  const setupLabel = r ? {
    buy: "BUY",
    sell: "SELL",
    wait: "WAIT",
  }[r.tradeSetup.type] : null;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: isSelected ? colors.secondary : colors.card,
          borderColor: isSelected ? `${colors.primary}66` : colors.border,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      {/* Thumbnail */}
      <View style={[styles.thumb, { backgroundColor: colors.secondary }]}>
        {analysis.imageUrl ? (
          <Image source={{ uri: analysis.imageUrl }} style={styles.thumbImage} resizeMode="cover" />
        ) : (
          <View style={[styles.thumbPlaceholder, { backgroundColor: colors.secondary }]}>
            <Text style={{ color: colors.mutedForeground, fontSize: 20 }}>📈</Text>
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.topRow}>
          {r && biasConfig && (
            <View style={[styles.biasBadge, { backgroundColor: biasConfig.bg }]}>
              <Text style={[styles.monoText, { color: biasConfig.color, fontSize: 10, fontWeight: "700" }]}>
                {r.marketBias.toUpperCase()}
              </Text>
            </View>
          )}
          <Text style={[styles.monoText, { color: colors.mutedForeground, fontSize: 11 }]}>
            {analysis.timeframe}
          </Text>
          <Text style={[styles.monoText, { color: colors.mutedForeground, fontSize: 10, marginLeft: "auto" as any }]}>
            {timeAgo(analysis.createdAt)}
          </Text>
        </View>

        {r && (
          <Text style={[styles.preview, { color: colors.foreground }]} numberOfLines={2}>
            {r.reasoning?.slice(0, 90)}...
          </Text>
        )}

        <View style={styles.bottomRow}>
          {r && setupColor && (
            <Text style={[styles.monoText, { color: setupColor, fontSize: 12, fontWeight: "700" }]}>
              {setupLabel}
            </Text>
          )}
          {r && (
            <Text style={[styles.monoText, { color: colors.accent, fontSize: 12, fontWeight: "700", marginLeft: "auto" as any }]}>
              {r.confidence}%
            </Text>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
    gap: 10,
    alignItems: "center",
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: 10,
    overflow: "hidden",
    flexShrink: 0,
  },
  thumbImage: {
    width: "100%",
    height: "100%",
  },
  thumbPlaceholder: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  biasBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  preview: {
    fontSize: 12,
    lineHeight: 17,
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  monoText: {
    fontFamily: "Inter_500Medium",
  },
});
