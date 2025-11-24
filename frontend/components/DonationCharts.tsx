// components/DonationCharts.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { DonationAnalytics } from "../services/doacao.service";

interface DonationChartsProps {
  analytics: DonationAnalytics;
}

const { width: screenWidth } = Dimensions.get("window");
const chartWidth = screenWidth - 40;
const chartHeight = 200;

export default function DonationCharts({ analytics }: DonationChartsProps) {
  const [selectedChart, setSelectedChart] = useState<"monthly" | "yearly">(
    "monthly"
  );

  const maxMonthlyCount = Math.max(
    ...analytics.monthlyStats.map((s) => s.count),
    1
  );
  const maxYearlyCount = Math.max(
    ...analytics.yearlyStats.map((s) => s.count),
    1
  );

  const renderMonthlyChart = () => {
    const barWidth = (chartWidth - 60) / analytics.monthlyStats.length;
    const maxBarHeight = chartHeight - 60;

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>
          Doações por Mês (Últimos 12 meses)
        </Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.chart}>
            {/* Y-axis labels */}
            <View style={styles.yAxis}>
              {[
                maxMonthlyCount,
                Math.floor(maxMonthlyCount * 0.75),
                Math.floor(maxMonthlyCount * 0.5),
                Math.floor(maxMonthlyCount * 0.25),
                0,
              ].map((value, index) => (
                <View
                  key={index}
                  style={[
                    styles.yAxisLabel,
                    { top: (index * maxBarHeight) / 4 - 8 },
                  ]}
                >
                  <Text style={styles.axisText}>{value}</Text>
                </View>
              ))}
            </View>

            {/* Bars */}
            <View style={styles.barsContainer}>
              {analytics.monthlyStats.map((stat, index) => {
                const barHeight = (stat.count / maxMonthlyCount) * maxBarHeight;

                return (
                  <View
                    key={index}
                    style={[styles.barContainer, { width: barWidth }]}
                  >
                    <View style={styles.barWrapper}>
                      <View
                        style={[
                          styles.bar,
                          {
                            height: barHeight || 2,
                            backgroundColor:
                              stat.count > 0 ? "#E73645" : "#E5E7EB",
                          },
                        ]}
                      />
                      {stat.count > 0 && (
                        <Text style={styles.barLabel}>{stat.count}</Text>
                      )}
                    </View>
                    <Text style={styles.monthLabel}>{stat.month}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        </ScrollView>

        {/* Statistics */}
        <View style={styles.monthlyStats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {analytics.monthlyStats.reduce((sum, s) => sum + s.count, 0)}
            </Text>
            <Text style={styles.statLabel}>Total 12 meses</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {Math.round(
                (analytics.monthlyStats.reduce((sum, s) => sum + s.count, 0) /
                  12) *
                  10
              ) / 10}
            </Text>
            <Text style={styles.statLabel}>Média/mês</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {analytics.monthlyStats.reduce((sum, s) => sum + s.volume, 0)}ml
            </Text>
            <Text style={styles.statLabel}>Volume total</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderYearlyChart = () => {
    const barWidth = Math.min(
      80,
      (chartWidth - 60) / analytics.yearlyStats.length
    );
    const maxBarHeight = chartHeight - 60;

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Doações por Ano</Text>

        <View style={styles.chart}>
          {/* Y-axis labels */}
          <View style={styles.yAxis}>
            {[
              maxYearlyCount,
              Math.floor(maxYearlyCount * 0.75),
              Math.floor(maxYearlyCount * 0.5),
              Math.floor(maxYearlyCount * 0.25),
              0,
            ].map((value, index) => (
              <View
                key={index}
                style={[
                  styles.yAxisLabel,
                  { top: (index * maxBarHeight) / 4 - 8 },
                ]}
              >
                <Text style={styles.axisText}>{value}</Text>
              </View>
            ))}
          </View>

          {/* Bars */}
          <View style={[styles.barsContainer, { justifyContent: "center" }]}>
            {analytics.yearlyStats.map((stat, index) => {
              const barHeight = (stat.count / maxYearlyCount) * maxBarHeight;

              return (
                <View
                  key={index}
                  style={[styles.barContainer, { width: barWidth }]}
                >
                  <View style={styles.barWrapper}>
                    <View
                      style={[
                        styles.bar,
                        {
                          height: barHeight || 2,
                          backgroundColor:
                            stat.count > 0 ? "#E73645" : "#E5E7EB",
                        },
                      ]}
                    />
                    {stat.count > 0 && (
                      <Text style={styles.barLabel}>{stat.count}</Text>
                    )}
                  </View>
                  <Text style={styles.monthLabel}>{stat.year}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Yearly comparison */}
        {analytics.yearlyStats.length > 1 && (
          <View style={styles.yearlyComparison}>
            <View style={styles.comparisonItem}>
              <Ionicons
                name={
                  analytics.donationsThisYear >= analytics.donationsLastYear
                    ? "trending-up"
                    : "trending-down"
                }
                size={16}
                color={
                  analytics.donationsThisYear >= analytics.donationsLastYear
                    ? "#10B981"
                    : "#F59E0B"
                }
              />
              <Text style={styles.comparisonText}>
                {analytics.donationsThisYear >= analytics.donationsLastYear
                  ? `+${
                      analytics.donationsThisYear - analytics.donationsLastYear
                    }`
                  : `${
                      analytics.donationsThisYear - analytics.donationsLastYear
                    }`}{" "}
                doações vs. ano anterior
              </Text>
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderProgressRing = () => {
    const currentYear = new Date().getFullYear();
    const monthsPassed = new Date().getMonth() + 1;
    const targetPerYear = 4; // Recommended donations per year
    const progress = analytics.donationsThisYear / targetPerYear;
    const progressAngle = Math.min(progress * 360, 360);

    return (
      <View style={styles.progressContainer}>
        <Text style={styles.chartTitle}>Meta Anual de Doações</Text>

        <View style={styles.progressRing}>
          <View
            style={[
              styles.progressBackground,
              {
                transform: [{ rotate: `${progressAngle}deg` }],
                borderColor: progressAngle >= 360 ? "#10B981" : "#E73645",
              },
            ]}
          />

          <View style={styles.progressContent}>
            <Text style={styles.progressNumber}>
              {analytics.donationsThisYear}
            </Text>
            <Text style={styles.progressLabel}>de {targetPerYear}</Text>
            <Text style={styles.progressSubLabel}>doações</Text>
          </View>
        </View>

        <View style={styles.progressStats}>
          <View style={styles.progressStat}>
            <Text style={styles.progressStatValue}>
              {Math.round((analytics.donationsThisYear / targetPerYear) * 100)}%
            </Text>
            <Text style={styles.progressStatLabel}>da meta</Text>
          </View>
          <View style={styles.progressStat}>
            <Text style={styles.progressStatValue}>
              {Math.max(0, targetPerYear - analytics.donationsThisYear)}
            </Text>
            <Text style={styles.progressStatLabel}>restantes</Text>
          </View>
        </View>

        {analytics.averageInterval > 0 && (
          <View style={styles.intervalInfo}>
            <Ionicons name="time-outline" size={16} color="#6B7280" />
            <Text style={styles.intervalText}>
              Intervalo médio: {analytics.averageInterval} dias
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Chart Type Selector */}
      <View style={styles.chartSelector}>
        <TouchableOpacity
          style={[
            styles.selectorButton,
            selectedChart === "monthly" && styles.selectorButtonActive,
          ]}
          onPress={() => setSelectedChart("monthly")}
        >
          <Text
            style={[
              styles.selectorButtonText,
              selectedChart === "monthly" && styles.selectorButtonTextActive,
            ]}
          >
            Mensal
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.selectorButton,
            selectedChart === "yearly" && styles.selectorButtonActive,
          ]}
          onPress={() => setSelectedChart("yearly")}
        >
          <Text
            style={[
              styles.selectorButtonText,
              selectedChart === "yearly" && styles.selectorButtonTextActive,
            ]}
          >
            Anual
          </Text>
        </TouchableOpacity>
      </View>

      {/* Selected Chart */}
      {selectedChart === "monthly" ? renderMonthlyChart() : renderYearlyChart()}

      {/* Progress Ring */}
      {renderProgressRing()}

      {/* Overall Statistics */}
      <View style={styles.overallStats}>
        <Text style={styles.chartTitle}>Resumo Geral</Text>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Ionicons name="water" size={24} color="#E73645" />
            <Text style={styles.statCardValue}>{analytics.totalDonations}</Text>
            <Text style={styles.statCardLabel}>Total de Doações</Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons name="flask" size={24} color="#3B82F6" />
            <Text style={styles.statCardValue}>{analytics.totalVolume}ml</Text>
            <Text style={styles.statCardLabel}>Volume Total</Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons name="calendar" size={24} color="#10B981" />
            <Text style={styles.statCardValue}>
              {analytics.lastDonationDate
                ? new Date(analytics.lastDonationDate).toLocaleDateString(
                    "pt-BR",
                    {
                      day: "2-digit",
                      month: "2-digit",
                      year: "2-digit",
                    }
                  )
                : "Nunca"}
            </Text>
            <Text style={styles.statCardLabel}>Última Doação</Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons name="heart" size={24} color="#F59E0B" />
            <Text style={styles.statCardValue}>
              {Math.round(analytics.totalVolume / 450)}{" "}
              {/* Approximate lives saved */}
            </Text>
            <Text style={styles.statCardLabel}>Vidas Impactadas</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  chartSelector: {
    flexDirection: "row",
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    padding: 4,
    margin: 20,
    marginBottom: 16,
  },
  selectorButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  selectorButtonActive: {
    backgroundColor: "#E73645",
  },
  selectorButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
  },
  selectorButtonTextActive: {
    color: "white",
  },
  chartContainer: {
    backgroundColor: "white",
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 16,
    textAlign: "center",
  },
  chart: {
    flexDirection: "row",
    height: chartHeight,
    marginBottom: 16,
  },
  yAxis: {
    width: 40,
    height: chartHeight - 40,
    position: "relative",
    borderRightWidth: 1,
    borderRightColor: "#E5E7EB",
  },
  yAxisLabel: {
    position: "absolute",
    right: 8,
    alignItems: "flex-end",
  },
  axisText: {
    fontSize: 10,
    color: "#6B7280",
  },
  barsContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-end",
    paddingLeft: 8,
    paddingBottom: 20,
  },
  barContainer: {
    alignItems: "center",
    paddingHorizontal: 2,
  },
  barWrapper: {
    alignItems: "center",
    justifyContent: "flex-end",
    height: chartHeight - 60,
  },
  bar: {
    width: "70%",
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  barLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: "#1F2937",
    marginTop: 4,
  },
  monthLabel: {
    fontSize: 9,
    color: "#6B7280",
    marginTop: 8,
    transform: [{ rotate: "-45deg" }],
    width: 40,
    textAlign: "center",
  },
  monthlyStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    color: "#6B7280",
    textAlign: "center",
  },
  yearlyComparison: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  comparisonItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  comparisonText: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
  progressContainer: {
    backgroundColor: "white",
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  progressRing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 16,
    position: "relative",
  },
  progressBackground: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 8,
    borderColor: "#E73645",
    borderRightColor: "transparent",
    borderBottomColor: "transparent",
  },
  progressContent: {
    alignItems: "center",
  },
  progressNumber: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1F2937",
  },
  progressLabel: {
    fontSize: 12,
    color: "#6B7280",
  },
  progressSubLabel: {
    fontSize: 10,
    color: "#9CA3AF",
  },
  progressStats: {
    flexDirection: "row",
    gap: 40,
    marginTop: 16,
  },
  progressStat: {
    alignItems: "center",
  },
  progressStatValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#E73645",
  },
  progressStatLabel: {
    fontSize: 11,
    color: "#6B7280",
    marginTop: 2,
  },
  intervalInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  intervalText: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
  overallStats: {
    backgroundColor: "white",
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: "#F9FAFB",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    gap: 8,
  },
  statCardValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
  },
  statCardLabel: {
    fontSize: 10,
    color: "#6B7280",
    textAlign: "center",
  },
});
