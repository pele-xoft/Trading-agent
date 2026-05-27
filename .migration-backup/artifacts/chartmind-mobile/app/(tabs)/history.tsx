import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { fetchAnalyses, deleteAnalysis } from "@/lib/api";
import { HistoryItem } from "@/components/HistoryItem";
import { AnalysisCard } from "@/components/AnalysisCard";
import type { AnalysisRecord } from "@/types";

export default function HistoryScreen() {
  const colors = useColors();
  const queryClient = useQueryClient();
  const [selectedAnalysis, setSelectedAnalysis] = useState<AnalysisRecord | null>(null);

  const { data: analyses, isLoading, isError, refetch } = useQuery({
    queryKey: ["analyses"],
    queryFn: () => fetchAnalyses(30),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAnalysis,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["analyses"] });
      if (selectedAnalysis) setSelectedAnalysis(null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
  });

  const handleSelect = (a: AnalysisRecord) => {
    setSelectedAnalysis(prev => prev?.id === a.id ? null : a);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleDelete = (id: number) => {
    Alert.alert("Delete analysis", "Remove this analysis from history?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deleteMutation.mutate(id),
      },
    ]);
  };

  const topPad = Platform.OS === "web" ? 67 : 0;
  const bottomPad = Platform.OS === "web" ? 34 : 0;

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background, paddingTop: topPad }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background, paddingTop: topPad }]}>
        <Feather name="wifi-off" size={32} color={colors.mutedForeground} />
        <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Connection error</Text>
        <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
          Could not reach the server
        </Text>
      </View>
    );
  }

  const list = analyses ?? [];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={list}
        keyExtractor={(item) => String(item.id)}
        scrollEnabled={!!list.length}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.listContent,
          { paddingTop: topPad + 16, paddingBottom: bottomPad + 100 },
        ]}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        ListEmptyComponent={
          <View style={[styles.centered, { paddingTop: 60 }]}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.secondary }]}>
              <Feather name="clock" size={32} color={colors.mutedForeground} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No analyses yet</Text>
            <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
              Upload a chart on the Analyze tab to get started
            </Text>
          </View>
        }
        ListHeaderComponent={
          list.length > 0 ? (
            <View style={[styles.listHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.headerCount, { color: colors.mutedForeground }]}>
                {list.length} {list.length === 1 ? "analysis" : "analyses"}
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <View>
            <HistoryItem
              analysis={item}
              isSelected={selectedAnalysis?.id === item.id}
              onPress={() => handleSelect(item)}
            />
            {selectedAnalysis?.id === item.id && (
              <View style={styles.detailContainer}>
                <View style={[styles.deleteRow]}>
                  <View style={{ flex: 1 }} />
                  <View
                    style={[styles.deleteBtn, { backgroundColor: colors.bearishDim, borderColor: colors.bearish }]}
                  >
                    <Feather
                      name="trash-2"
                      size={14}
                      color={colors.bearish}
                      onPress={() => handleDelete(item.id)}
                    />
                    <Text
                      style={[styles.deleteText, { color: colors.bearish }]}
                      onPress={() => handleDelete(item.id)}
                    >
                      Delete
                    </Text>
                  </View>
                </View>
                <AnalysisCard analysis={item} />
              </View>
            )}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 32,
  },
  listContent: {
    paddingHorizontal: 16,
  },
  listHeader: {
    paddingBottom: 10,
    marginBottom: 4,
    borderBottomWidth: 1,
  },
  headerCount: {
    fontSize: 12,
    fontWeight: "600",
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
  emptySub: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
  },
  detailContainer: {
    marginTop: 8,
    gap: 8,
  },
  deleteRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  deleteText: {
    fontSize: 12,
    fontWeight: "600",
  },
});
