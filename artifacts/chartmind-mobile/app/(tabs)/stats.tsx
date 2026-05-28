import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { fetchStats } from "@/lib/api";

function StatCard({ label, value, color }: { label: string; value: string | number; color?: string }) {
  const colors = useColors();
  return (
    <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.statValue, { color: color ?? colors.foreground }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

function BiasBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const colors = useColors();
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <View style={styles.biasRow}>
      <Text style={[styles.biasLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <View style={[styles.biasTrack, { backgroundColor: colors.border }]}>
        <View style={[styles.biasFill, { width: `${pct}%` as any, backgroundColor: color }]} />
      </View>
      <Text style={[styles.biasCount, { color: colors.foreground }]}>{count}</Text>
    </View>
  );
}

export default function StatsScreen() {
  const colors = useColors();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["analyses-stats"],
    queryFn: fetchStats,
  });

  const topPad = Platform.OS === "web" ? 67 : 0;
  const bottomPad = Platform.OS === "web" ? 34 : 0;

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background, paddingTop: topPad }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (isError || !data) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background, paddingTop: topPad }]}>
        <Feather name="wifi-off" size={32} color={colors.mutedForeground} />
        <Text style={[styles.errorTitle, { color: colors.foreground }]}>Failed to load stats</Text>
        <Text style={[styles.errorSub, { color: colors.mutedForeground }]} onPress={() => refetch()}>
          Tap to retry
        </Text>
      </View>
    );
  }

  if (data.total === 0) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background, paddingTop: topPad }]}>
        <View style={[styles.emptyIcon, { backgroundColor: colors.secondary }]}>
          <Feather name="bar-chart-2" size={32} color={colors.mutedForeground} />
        </View>
        <Text style={[styles.errorTitle, { color: colors.foreground }]}>No data yet</Text>
        <Text style={[styles.errorSub, { color: colors.mutedForeground }]}>
          Analyze charts to see statistics
        </Text>
      </View>
    );
  }

  const avgConfidence = Math.round(data.avgConfidence);
  const confColor = avgConfidence >= 70 ? colors.bullish : avgConfidence >= 50 ? colors.accent : colors.bearish;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingTop: topPad + 16, paddingBottom: bottomPad + 100 },
        ]}
      >
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>OVERVIEW</Text>

        <View style={styles.statGrid}>
          <StatCard label="Total" value={data.total} />
          <StatCard label="Avg Confidence" value={`${avgConfidence}%`} color={confColor} />
        </View>

        <Text style={[styles.sectionTitle, { color: colors.mutedForeground, marginTop: 20 }]}>MARKET BIAS</Text>

        <View style={[styles.biasCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <BiasBar label="Bullish" count={data.bullish} total={data.total} color={colors.bullish} />
          <BiasBar label="Bearish" count={data.bearish} total={data.total} color={colors.bearish} />
          <BiasBar label="Neutral" count={data.neutral} total={data.total} color={colors.neutral} />
        </View>

        {data.byTimeframe.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.mutedForeground, marginTop: 20 }]}>BY TIMEFRAME</Text>
            <View style={[styles.tfCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {data.byTimeframe.map((tf, i) => (
                <View
                  key={tf.timeframe}
                  style={[
                    styles.tfRow,
                    i < data.byTimeframe.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
                  ]}
                >
                  <View style={[styles.tfBadge, { backgroundColor: colors.accentDim }]}>
                    <Text style={[styles.tfBadgeText, { color: colors.accent }]}>{tf.timeframe}</Text>
                  </View>
                  <Text style={[styles.tfCount, { color: colors.foreground }]}>
                    {tf.count} {tf.count === 1 ? "analysis" : "analyses"}
                  </Text>
                  <View style={[styles.tfBar, { backgroundColor: colors.border }]}>
                    <View
                      style={[
                        styles.tfBarFill,
                        {
                          width: `${(tf.count / data.total) * 100}%` as any,
                          backgroundColor: colors.accent,
                          opacity: 0.6,
                        },
                      ]}
                    />
                  </View>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 32,
  },
  content: {
    paddingHorizontal: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 6,
  },
  statGrid: {
    flexDirection: "row",
    gap: 8,
  },
  statCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    alignItems: "center",
    gap: 4,
  },
  statValue: {
    fontSize: 28,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  statLabel: {
    fontSize: 11,
    fontWeight: "600",
  },
  biasCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 14,
  },
  biasRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  biasLabel: {
    fontSize: 12,
    fontWeight: "600",
    width: 56,
  },
  biasTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  biasFill: {
    height: 6,
    borderRadius: 3,
  },
  biasCount: {
    fontSize: 12,
    fontWeight: "700",
    minWidth: 24,
    textAlign: "right",
  },
  tfCard: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
  tfRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  tfBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    minWidth: 36,
    alignItems: "center",
  },
  tfBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  tfCount: {
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
  },
  tfBar: {
    width: 60,
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
  tfBarFill: {
    height: 4,
    borderRadius: 2,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
  errorSub: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
  },
});
