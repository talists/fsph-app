import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiService } from "./api";
import { bancoDeSangueService } from "./bancoDeSangue.service";

// Configuração do handler de notificações (comportamento quando o app está aberto)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface NotificationData extends Record<string, unknown> {
  type: "blood_alert" | "appointment_reminder" | "campaign" | "general";
  bloodType?: string;
  urgencyLevel?: "critical" | "alert" | "normal";
  appointmentId?: string;
  campaignId?: string;
}

class NotificationService {
  private expoPushToken: string | null = null;

  /**
   * Inicializa o serviço, pede permissões e agenda verificações
   */
  async initialize(): Promise<void> {
    await this.registerForPushNotifications();
    await this.scheduleBloodStockChecks();
    await this.scheduleAppointmentReminders();
  }

  /**
   * Registra para notificações push e obtém o token (Expo ou FCM)
   */
  async registerForPushNotifications(): Promise<string | null> {
    if (Platform.OS === "web") {
      console.log("Push notifications não suportadas na web");
      return null;
    }

    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log("Falha ao obter permissão para notificações push!");
      return null;
    }

    try {
      // Obtém o token do Expo (que gerencia o FCM por baixo dos panos no Android)
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: process.env.EXPO_PUBLIC_PROJECT_ID || "your-project-id",
      });

      this.expoPushToken = token.data;

      // Salva o token no backend para receber notificações remotas
      await this.saveTokenToBackend(token.data);

      console.log("✅ Push token registrado:", token.data);
      return token.data;
    } catch (error) {
      console.error("Erro ao obter push token:", error);
      return null;
    }
  }

  /**
   * Envia o token para o backend salvar no perfil do usuário
   */
  private async saveTokenToBackend(token: string): Promise<void> {
    try {
      // Chama a rota PATCH /usuarios/fcm-token (rota definida no seu backend)
      // O apiService já injeta o Bearer Token de autenticação automaticamente
      await apiService.patch("/usuarios/fcm-token", {
        fcm_token: token,
      });

      console.log(
        "✅ [NotificationService] Token salvo no backend com sucesso!"
      );
    } catch (error) {
      // Logamos o erro mas não travamos o app, pois pode ser um erro de rede temporário
      console.error(
        "❌ [NotificationService] Erro ao salvar token no backend:",
        error
      );
    }
  }

  /**
   * Agenda notificação local para alertas de estoque
   */
  async scheduleBloodStockNotification(
    bloodType: string,
    urgencyLevel: "critical" | "alert"
  ): Promise<void> {
    const title =
      urgencyLevel === "critical"
        ? `🚨 Sangue ${bloodType} - CRÍTICO`
        : `⚠️ Sangue ${bloodType} - ALERTA`;

    const body =
      urgencyLevel === "critical"
        ? `O estoque de sangue ${bloodType} está em estado crítico! Sua doação é urgente e pode salvar vidas.`
        : `O estoque de sangue ${bloodType} está baixo. Considere agendar uma doação.`;

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: urgencyLevel === "critical" ? "default" : undefined,
        priority:
          urgencyLevel === "critical"
            ? Notifications.AndroidNotificationPriority.HIGH
            : Notifications.AndroidNotificationPriority.DEFAULT,
        data: {
          type: "blood_alert",
          bloodType,
          urgencyLevel,
        } as NotificationData,
      },
      trigger: null, // Show immediately
    });
  }

  /**
   * Agenda lembretes de agendamento
   */
  async scheduleAppointmentReminder(
    appointmentId: string,
    appointmentDate: Date,
    location: string
  ): Promise<void> {
    const now = new Date();
    const twoDaysBefore = new Date(
      appointmentDate.getTime() - 2 * 24 * 60 * 60 * 1000
    );
    const appointmentDay = new Date(
      appointmentDate.getTime() - 2 * 60 * 60 * 1000
    ); // 2 hours before

    // Agenda lembrete 2 dias antes
    if (twoDaysBefore > now) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "📅 Lembrete de Doação",
          body: `Sua doação está agendada para ${appointmentDate.toLocaleDateString(
            "pt-BR"
          )} no ${location}. Não se esqueça!`,
          data: {
            type: "appointment_reminder",
            appointmentId,
          } as NotificationData,
        },
        trigger: twoDaysBefore as any,
      });
    }

    // Agenda lembrete no dia (2h antes)
    if (appointmentDay > now) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "⏰ Doação Hoje!",
          body: `Sua doação é hoje às ${appointmentDate.toLocaleTimeString(
            "pt-BR",
            { hour: "2-digit", minute: "2-digit" }
          )} no ${location}. Boa sorte!`,
          sound: "default",
          priority: Notifications.AndroidNotificationPriority.HIGH,
          data: {
            type: "appointment_reminder",
            appointmentId,
          } as NotificationData,
        },
        trigger: appointmentDay as any,
      });
    }
  }

  /**
   * Configura checagem periódica de estoque (Polling local)
   */
  private async scheduleBloodStockChecks(): Promise<void> {
    // Apenas se necessário rodar em background (requer configuração extra no app.json para background fetch)
    // Por enquanto, mantemos simples
  }

  /**
   * Configura checagem periódica de agendamentos
   */
  private async scheduleAppointmentReminders(): Promise<void> {
    // Lógica futura para background tasks
  }

  /**
   * Verifica o estoque e emite alerta se necessário (Chamado pela UI ou Background)
   */
  async checkBloodStockAndAlert(userBloodType: string): Promise<void> {
    try {
      // CORREÇÃO: Usa o bancoDeSangueService em vez de chamar apiService direto
      // Isso garante o parse correto dos dados e evita erro de tipagem
      const bloodStock = await bancoDeSangueService.getBloodStock();

      const userBloodStock = bloodStock.find(
        (stock) => stock.tipo === userBloodType
      );

      if (userBloodStock) {
        // Verifica as strings retornadas pelo serviço (que normalizou para "Crítico" com acento)
        if (userBloodStock.status === "Crítico") {
          await this.scheduleBloodStockNotification(userBloodType, "critical");
        } else if (userBloodStock.status === "Alerta") {
          await this.scheduleBloodStockNotification(userBloodType, "alert");
        }
      }
    } catch (error) {
      console.error("Erro ao verificar estoque de sangue:", error);
    }
  }

  /**
   * Envia notificação de campanha (Local)
   */
  async sendCampaignNotification(
    title: string,
    message: string,
    campaignId?: string
  ): Promise<void> {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `🎯 ${title}`,
        body: message,
        data: {
          type: "campaign",
          campaignId,
        } as NotificationData,
      },
      trigger: null,
    });
  }

  /**
   * Cancela todas as notificações agendadas
   */
  async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  /**
   * Cancela uma notificação específica
   */
  async cancelNotification(notificationId: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  }

  /**
   * Verifica status da permissão
   */
  async getPermissionStatus(): Promise<string> {
    const { status } = await Notifications.getPermissionsAsync();
    return status;
  }

  /**
   * Listener para notificações recebidas com app aberto
   */
  onNotificationReceived(
    callback: (notification: Notifications.Notification) => void
  ): void {
    Notifications.addNotificationReceivedListener(callback);
  }

  /**
   * Listener para interação do usuário (clique na notificação)
   */
  onNotificationResponse(
    callback: (response: Notifications.NotificationResponse) => void
  ): void {
    Notifications.addNotificationResponseReceivedListener(callback);
  }

  /**
   * Define o número no ícone do app (Badge)
   */
  async setBadgeCount(count: number): Promise<void> {
    await Notifications.setBadgeCountAsync(count);
  }

  /**
   * Pega o número atual do Badge
   */
  async getBadgeCount(): Promise<number> {
    return await Notifications.getBadgeCountAsync();
  }
}

// Exporta uma instância única (Singleton)
export const notificationService = new NotificationService();
export default notificationService;
