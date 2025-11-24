// services/donations.ts
/**
 * Donations Service for Gota a Gota App
 * Handles donation history, notifications, and analytics
 */

import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  getDoadorInfoByCPF,
  getAgendamentosByCPF,
} from "./agendamento.service";

export interface DonationRecord {
  id: string;
  date: string;
  location: string;
  bloodType: string;
  volume: number; // in ml
  status: "completed" | "pending" | "cancelled";
  notes?: string;
  protocol?: string;
  type: "individual" | "campaign" | "bone_marrow";
}

export interface DonationAnalytics {
  totalDonations: number;
  totalVolume: number;
  lastDonationDate: string | null;
  averageInterval: number; // days between donations
  donationsThisYear: number;
  donationsLastYear: number;
  monthlyStats: { month: string; count: number; volume: number }[];
  yearlyStats: { year: number; count: number; volume: number }[];
}

export interface NotificationSchedule {
  id: string;
  userId: string;
  type: "donation_reminder" | "eligibility_reminder" | "blood_stock_critical";
  scheduledDate: Date;
  title: string;
  body: string;
  data?: any;
}

class DonationsService {
  private storageKeys = {
    donations: "donations_history",
    notifications: "scheduled_notifications",
    settings: "notification_settings",
  };

  constructor() {
    this.initializeNotifications();
  }

  private async initializeNotifications() {
    // Configure notification behavior
    await Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });

    // Request permissions
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== "granted") {
      console.warn("Notification permissions not granted");
    }
  }

  /**
   * Fetch donation history from HEMOSE API
   */
  async fetchDonationHistory(cpf: string): Promise<DonationRecord[]> {
    try {
      console.log("🩸 Fetching donation history for CPF:", cpf);

      // Get donor info and appointments from HEMOSE API
      const [doadorInfo, agendamentos] = await Promise.all([
        getDoadorInfoByCPF(cpf),
        getAgendamentosByCPF(cpf),
      ]);

      console.log("📊 Donor info:", doadorInfo);
      console.log("📅 Appointments:", agendamentos);

      // Transform HEMOSE data to our format
      const donations: DonationRecord[] = [];

      // Process appointments
      if (agendamentos && Array.isArray(agendamentos)) {
        agendamentos.forEach((agendamento: any, index: number) => {
          const donation: DonationRecord = {
            id: agendamento.id?.toString() || `hemose_${index}`,
            date: this.formatDate(
              agendamento.data_agendamento || agendamento.date
            ),
            location: agendamento.local_nome || "HEMOSE - Aracaju",
            bloodType: doadorInfo?.tipo_sanguineo || "O+",
            volume: 450, // Standard donation volume
            status: this.mapStatus(agendamento.status || agendamento.situacao),
            notes: agendamento.observacoes || agendamento.notes,
            protocol: agendamento.protocolo || agendamento.protocol,
            type: this.mapDonationType(agendamento.tipo || "D"),
          };
          donations.push(donation);
        });
      }

      // Sort by date (most recent first)
      donations.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      // Cache the data locally
      await this.cacheDonations(cpf, donations);

      return donations;
    } catch (error) {
      console.warn(
        "⚠️ Failed to fetch from HEMOSE API, using cached data:",
        error
      );
      return this.getCachedDonations(cpf);
    }
  }

  /**
   * Get cached donations for offline support
   */
  private async getCachedDonations(cpf: string): Promise<DonationRecord[]> {
    try {
      const cached = await AsyncStorage.getItem(
        `${this.storageKeys.donations}_${cpf}`
      );
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (error) {
      console.error("Error reading cached donations:", error);
    }

    // Return mock data if no cache available
    return this.getMockDonations();
  }

  /**
   * Cache donations locally
   */
  private async cacheDonations(
    cpf: string,
    donations: DonationRecord[]
  ): Promise<void> {
    try {
      await AsyncStorage.setItem(
        `${this.storageKeys.donations}_${cpf}`,
        JSON.stringify(donations)
      );
    } catch (error) {
      console.error("Error caching donations:", error);
    }
  }

  /**
   * Calculate donation analytics
   */
  calculateAnalytics(donations: DonationRecord[]): DonationAnalytics {
    const completedDonations = donations.filter(
      (d) => d.status === "completed"
    );
    const currentYear = new Date().getFullYear();

    // Monthly stats for last 12 months
    const monthlyStats = this.calculateMonthlyStats(completedDonations);

    // Yearly stats
    const yearlyStats = this.calculateYearlyStats(completedDonations);

    // Calculate average interval between donations
    let averageInterval = 0;
    if (completedDonations.length > 1) {
      const intervals: number[] = [];
      for (let i = 0; i < completedDonations.length - 1; i++) {
        const date1 = new Date(completedDonations[i].date);
        const date2 = new Date(completedDonations[i + 1].date);
        const diffTime = Math.abs(date1.getTime() - date2.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        intervals.push(diffDays);
      }
      averageInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    }

    return {
      totalDonations: completedDonations.length,
      totalVolume: completedDonations.reduce((sum, d) => sum + d.volume, 0),
      lastDonationDate: completedDonations[0]?.date || null,
      averageInterval: Math.round(averageInterval),
      donationsThisYear: completedDonations.filter(
        (d) => new Date(d.date).getFullYear() === currentYear
      ).length,
      donationsLastYear: completedDonations.filter(
        (d) => new Date(d.date).getFullYear() === currentYear - 1
      ).length,
      monthlyStats,
      yearlyStats,
    };
  }

  /**
   * Schedule donation reminder notification
   */
  async scheduleNextDonationReminder(
    userId: string,
    nextEligibleDate: Date,
    gender: "M" | "F"
  ): Promise<void> {
    try {
      // Cancel existing reminders for this user
      await this.cancelNotificationsByType(userId, "donation_reminder");

      const intervalDays = gender === "F" ? 90 : 60;

      // Schedule notification 3 days before eligible date
      const reminderDate = new Date(nextEligibleDate);
      reminderDate.setDate(reminderDate.getDate() - 3);

      if (reminderDate > new Date()) {
        const notificationId = await Notifications.scheduleNotificationAsync({
          content: {
            title: "🩸 Lembrete de Doação",
            body: `Você poderá doar sangue em ${this.formatDateBR(
              nextEligibleDate
            )}! Que tal agendar?`,
            data: {
              type: "donation_reminder",
              userId,
              eligibleDate: nextEligibleDate.toISOString(),
            },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds: Math.max(
              1,
              Math.floor((reminderDate.getTime() - Date.now()) / 1000)
            ),
          },
        }); // Store notification info
        await this.storeNotificationSchedule({
          id: notificationId,
          userId,
          type: "donation_reminder",
          scheduledDate: reminderDate,
          title: "🩸 Lembrete de Doação",
          body: `Você poderá doar sangue em ${this.formatDateBR(
            nextEligibleDate
          )}! Que tal agendar?`,
          data: { eligibleDate: nextEligibleDate.toISOString() },
        });
      }

      // Schedule notification on the exact eligible date
      if (nextEligibleDate > new Date()) {
        const eligibilityId = await Notifications.scheduleNotificationAsync({
          content: {
            title: "✅ Você está apto para doar!",
            body: "Sua próxima doação já está liberada. Faça a diferença e salve vidas!",
            data: {
              type: "eligibility_reminder",
              userId,
              eligibleDate: nextEligibleDate.toISOString(),
            },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds: Math.max(
              1,
              Math.floor((nextEligibleDate.getTime() - Date.now()) / 1000)
            ),
          },
        });

        await this.storeNotificationSchedule({
          id: eligibilityId,
          userId,
          type: "eligibility_reminder",
          scheduledDate: nextEligibleDate,
          title: "✅ Você está apto para doar!",
          body: "Sua próxima doação já está liberada. Faça a diferença e salve vidas!",
          data: { eligibleDate: nextEligibleDate.toISOString() },
        });
      }
    } catch (error) {
      console.error("Error scheduling donation reminders:", error);
    }
  }

  /**
   * Schedule blood stock critical notification
   */
  async scheduleBloodStockAlert(
    userId: string,
    bloodType: string
  ): Promise<void> {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: "🚨 Estoque Crítico!",
          body: `O estoque do tipo ${bloodType} está crítico. Sua doação pode salvar vidas!`,
          data: {
            type: "blood_stock_critical",
            userId,
            bloodType,
          },
        },
        trigger: null, // Immediate notification
      });
      await this.storeNotificationSchedule({
        id: notificationId,
        userId,
        type: "blood_stock_critical",
        scheduledDate: new Date(),
        title: "🚨 Estoque Crítico!",
        body: `O estoque do tipo ${bloodType} está crítico. Sua doação pode salvar vidas!`,
        data: { bloodType },
      });
    } catch (error) {
      console.error("Error scheduling blood stock alert:", error);
    }
  }

  // Helper methods
  private formatDate(dateString: string): string {
    if (!dateString) return new Date().toISOString().split("T")[0];

    // Handle different date formats
    if (dateString.includes("/")) {
      const [day, month, year] = dateString.split("/");
      return `${year.padStart(4, "20")}-${month.padStart(
        2,
        "0"
      )}-${day.padStart(2, "0")}`;
    }

    return dateString.split("T")[0];
  }

  private formatDateBR(date: Date): string {
    return date.toLocaleDateString("pt-BR");
  }

  private mapStatus(status: string): "completed" | "pending" | "cancelled" {
    if (!status) return "completed";

    const statusLower = status.toLowerCase();
    if (statusLower.includes("concluí") || statusLower.includes("realiz"))
      return "completed";
    if (statusLower.includes("cancel") || statusLower.includes("rejeit"))
      return "cancelled";
    return "pending";
  }

  private mapDonationType(
    tipo: string
  ): "individual" | "campaign" | "bone_marrow" {
    switch (tipo) {
      case "M":
        return "bone_marrow";
      case "C":
        return "campaign";
      default:
        return "individual";
    }
  }

  private calculateMonthlyStats(donations: DonationRecord[]) {
    const monthlyMap = new Map();
    const now = new Date();

    // Initialize last 12 months
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${date.getFullYear()}-${(date.getMonth() + 1)
        .toString()
        .padStart(2, "0")}`;
      const monthName = date.toLocaleDateString("pt-BR", {
        month: "short",
        year: "2-digit",
      });
      monthlyMap.set(key, { month: monthName, count: 0, volume: 0 });
    }

    // Add donation data
    donations.forEach((donation) => {
      const date = new Date(donation.date);
      const key = `${date.getFullYear()}-${(date.getMonth() + 1)
        .toString()
        .padStart(2, "0")}`;
      const stats = monthlyMap.get(key);
      if (stats) {
        stats.count++;
        stats.volume += donation.volume;
      }
    });

    return Array.from(monthlyMap.values());
  }

  private calculateYearlyStats(donations: DonationRecord[]) {
    const yearlyMap = new Map();

    donations.forEach((donation) => {
      const year = new Date(donation.date).getFullYear();
      if (!yearlyMap.has(year)) {
        yearlyMap.set(year, { year, count: 0, volume: 0 });
      }
      const stats = yearlyMap.get(year);
      stats.count++;
      stats.volume += donation.volume;
    });

    return Array.from(yearlyMap.values()).sort((a, b) => b.year - a.year);
  }

  private async cancelNotificationsByType(
    userId: string,
    type: string
  ): Promise<void> {
    try {
      const scheduled = await this.getScheduledNotifications(userId);
      const toCancel = scheduled.filter((n) => n.type === type);

      for (const notification of toCancel) {
        await Notifications.cancelScheduledNotificationAsync(notification.id);
      }

      // Remove from storage
      const remaining = scheduled.filter((n) => n.type !== type);
      await this.saveScheduledNotifications(userId, remaining);
    } catch (error) {
      console.error("Error cancelling notifications:", error);
    }
  }

  private async storeNotificationSchedule(
    schedule: NotificationSchedule
  ): Promise<void> {
    try {
      const existing = await this.getScheduledNotifications(schedule.userId);
      existing.push(schedule);
      await this.saveScheduledNotifications(schedule.userId, existing);
    } catch (error) {
      console.error("Error storing notification schedule:", error);
    }
  }

  private async getScheduledNotifications(
    userId: string
  ): Promise<NotificationSchedule[]> {
    try {
      const stored = await AsyncStorage.getItem(
        `${this.storageKeys.notifications}_${userId}`
      );
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error("Error getting scheduled notifications:", error);
      return [];
    }
  }

  private async saveScheduledNotifications(
    userId: string,
    notifications: NotificationSchedule[]
  ): Promise<void> {
    try {
      await AsyncStorage.setItem(
        `${this.storageKeys.notifications}_${userId}`,
        JSON.stringify(notifications)
      );
    } catch (error) {
      console.error("Error saving scheduled notifications:", error);
    }
  }

  private getMockDonations(): DonationRecord[] {
    return [
      {
        id: "1",
        date: "2024-10-15",
        location: "HEMOSE - Aracaju",
        bloodType: "O+",
        volume: 450,
        status: "completed",
        notes: "Doação realizada com sucesso",
        type: "individual",
      },
      {
        id: "2",
        date: "2024-07-20",
        location: "HEMOSE - Aracaju",
        bloodType: "O+",
        volume: 450,
        status: "completed",
        type: "individual",
      },
      {
        id: "3",
        date: "2024-04-12",
        location: "HEMOSE - Aracaju",
        bloodType: "O+",
        volume: 450,
        status: "completed",
        type: "campaign",
      },
      {
        id: "4",
        date: "2023-12-08",
        location: "HEMOSE - Aracaju",
        bloodType: "O+",
        volume: 450,
        status: "completed",
        type: "individual",
      },
      {
        id: "5",
        date: "2023-09-15",
        location: "HEMOSE - Aracaju",
        bloodType: "O+",
        volume: 450,
        status: "completed",
        type: "individual",
      },
    ];
  }
}

export const donationsService = new DonationsService();
export default donationsService;
