import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Image,
  StyleSheet,
  Platform,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { createAnalysis } from "@/lib/api";
import { AnalysisCard } from "@/components/AnalysisCard";
import type { AnalysisRecord, Timeframe } from "@/types";

const TIMEFRAMES: { value: Timeframe; label: string }[] = [
  { value: "5m", label: "5m" },
  { value: "15m", label: "15m" },
  { value: "1h", label: "1h" },
  { value: "4h", label: "4h" },
  { value: "1D", label: "1D" },
];

export default function AnalyzeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe>("1h");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [currentAnalysis, setCurrentAnalysis] = useState<AnalysisRecord | null>(null);

  const analyzeMutation = useMutation({
    mutationFn: createAnalysis,
    onSuccess: (data) => {
      setCurrentAnalysis(data);
      setErrorMsg(null);
      queryClient.invalidateQueries({ queryKey: ["analyses"] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: (err) => {
      setErrorMsg(err instanceof Error ? err.message : "Analysis failed");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    },
  });

  const pickImage = useCallback(async () => {
    if (Platform.OS !== "web") {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission needed", "Please allow photo library access to upload charts.");
        return;
      }
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: false,
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setImageUri(asset.uri);
      setImageBase64(asset.base64 ?? null);
      setCurrentAnalysis(null);
      setErrorMsg(null);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  const handleAnalyze = useCallback(() => {
    if (!imageBase64 && !imageUri) return;
    setErrorMsg(null);
    const dataUrl = imageBase64
      ? `data:image/jpeg;base64,${imageBase64}`
      : imageUri!;
    analyzeMutation.mutate({ imageUrl: dataUrl, timeframe: selectedTimeframe });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, [imageBase64, imageUri, selectedTimeframe, analyzeMutation]);

  const handleClear = useCallback(() => {
    setImageUri(null);
    setImageBase64(null);
    setCurrentAnalysis(null);
    setErrorMsg(null);
  }, []);

  const isAnalyzing = analyzeMutation.isPending;
  const hasImage = !!imageUri;
  const canAnalyze = hasImage && !isAnalyzing;

  const topPad = Platform.OS === "web" ? 67 : 0;
  const bottomPad = Platform.OS === "web" ? 34 : 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: topPad + 16, paddingBottom: bottomPad + 100 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Upload area */}
        <Pressable
          onPress={hasImage ? undefined : pickImage}
          style={({ pressed }) => [
            styles.uploadArea,
            {
              backgroundColor: hasImage ? colors.card : colors.secondary,
              borderColor: hasImage ? colors.border : colors.border,
              opacity: pressed && !hasImage ? 0.8 : 1,
            },
          ]}
        >
          {hasImage && imageUri ? (
            <View style={styles.imagePreviewContainer}>
              <Image
                source={{ uri: imageUri }}
                style={styles.imagePreview}
                resizeMode="contain"
              />
              <Pressable
                onPress={handleClear}
                style={[styles.clearBtn, { backgroundColor: "rgba(0,0,0,0.7)" }]}
                hitSlop={8}
              >
                <Feather name="x" size={14} color="#fff" />
              </Pressable>
            </View>
          ) : (
            <View style={styles.uploadEmpty}>
              <View style={[styles.uploadIcon, { backgroundColor: colors.accentDim }]}>
                <Feather name="trending-up" size={28} color={colors.accent} />
              </View>
              <Text style={[styles.uploadTitle, { color: colors.foreground }]}>
                Select chart image
              </Text>
              <Text style={[styles.uploadSub, { color: colors.mutedForeground }]}>
                PNG, JPG, WebP
              </Text>
            </View>
          )}
        </Pressable>

        {/* Timeframe selector */}
        <View style={styles.tfSection}>
          <Text style={[styles.tfLabel, { color: colors.mutedForeground }]}>TIMEFRAME</Text>
          <View style={styles.tfRow}>
            {TIMEFRAMES.map(({ value, label }) => {
              const active = selectedTimeframe === value;
              return (
                <Pressable
                  key={value}
                  onPress={() => {
                    setSelectedTimeframe(value);
                    Haptics.selectionAsync();
                  }}
                  style={[
                    styles.tfBtn,
                    {
                      backgroundColor: active ? colors.accent : colors.card,
                      borderColor: active ? colors.accent : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.tfBtnText,
                      { color: active ? colors.primaryForeground : colors.mutedForeground },
                    ]}
                  >
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Analyze button */}
        <Pressable
          onPress={handleAnalyze}
          disabled={!canAnalyze}
          style={({ pressed }) => [
            styles.analyzeBtn,
            {
              backgroundColor: canAnalyze ? colors.accent : colors.secondary,
              opacity: canAnalyze ? (pressed ? 0.85 : 1) : 0.5,
            },
          ]}
        >
          {isAnalyzing ? (
            <View style={styles.analyzeBtnContent}>
              <ActivityIndicator size="small" color={colors.mutedForeground} />
              <Text style={[styles.analyzeBtnText, { color: colors.mutedForeground }]}>
                Analyzing chart...
              </Text>
            </View>
          ) : (
            <View style={styles.analyzeBtnContent}>
              <Feather
                name="cpu"
                size={16}
                color={canAnalyze ? colors.primaryForeground : colors.mutedForeground}
              />
              <Text
                style={[
                  styles.analyzeBtnText,
                  { color: canAnalyze ? colors.primaryForeground : colors.mutedForeground },
                ]}
              >
                Analyze Chart
              </Text>
            </View>
          )}
        </Pressable>

        {/* Error */}
        {errorMsg && (
          <View style={[styles.errorBox, { backgroundColor: colors.bearishDim, borderColor: colors.bearish }]}>
            <Feather name="alert-circle" size={14} color={colors.bearish} />
            <Text style={[styles.errorText, { color: colors.bearish }]}>{errorMsg}</Text>
          </View>
        )}

        {/* Loading state */}
        {isAnalyzing && (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color={colors.accent} />
            <Text style={[styles.loadingText, { color: colors.foreground }]}>
              AI is reading your chart...
            </Text>
            <Text style={[styles.loadingSub, { color: colors.mutedForeground }]}>
              This takes 5–15 seconds
            </Text>
          </View>
        )}

        {/* Analysis result */}
        {currentAnalysis && !isAnalyzing && (
          <AnalysisCard analysis={currentAnalysis} />
        )}

        {/* Empty state */}
        {!currentAnalysis && !isAnalyzing && !errorMsg && (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.secondary }]}>
              <Feather name="bar-chart-2" size={32} color={colors.mutedForeground} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              AI-powered chart analysis
            </Text>
            <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
              Upload a chart screenshot and get instant technical analysis — RSI, Stochastic, MAs, structure, and trade setups.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  uploadArea: {
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: "dashed",
    minHeight: 180,
    overflow: "hidden",
  },
  imagePreviewContainer: {
    position: "relative",
  },
  imagePreview: {
    width: "100%",
    height: 260,
    borderRadius: 14,
  },
  clearBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  uploadEmpty: {
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 10,
  },
  uploadIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  uploadTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  uploadSub: {
    fontSize: 12,
  },
  tfSection: {
    gap: 8,
  },
  tfLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
  },
  tfRow: {
    flexDirection: "row",
    gap: 6,
  },
  tfBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  tfBtnText: {
    fontSize: 13,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  analyzeBtn: {
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  analyzeBtnContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  analyzeBtnText: {
    fontSize: 15,
    fontWeight: "700",
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  errorText: {
    fontSize: 13,
    flex: 1,
  },
  loadingState: {
    alignItems: "center",
    gap: 10,
    paddingVertical: 32,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: "600",
  },
  loadingSub: {
    fontSize: 12,
  },
  emptyState: {
    alignItems: "center",
    gap: 10,
    paddingVertical: 32,
    paddingHorizontal: 16,
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
    maxWidth: 300,
  },
});
