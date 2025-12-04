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
  type:
  | "blood_critical_general"      // Sangue crítico (qualquer tipo)
  | "blood_critical_user"          // Sangue do tipo do usuário está crítico
  | "appointment_scheduled"        // Agendamento confirmado
  | "appointment_reminder_2days"   // Lembrete 2 dias antes
  | "appointment_reminder_1day"    // Lembrete 1 dia antes
  | "appointment_reminder_today"   // Lembrete no dia
  | "appointment_approaching"      // Agendamento próximo (2h antes)
  | "campaign_new"                 // Nova campanha
  | "general";
  bloodType?: string;
  urgencyLevel?: "critical" | "alert" | "normal";
  appointmentId?: string;
  appointmentProtocol?: string;
  appointmentDate?: string;
  appointmentTime?: string;
  appointmentLocation?: string;
  campaignId?: string;
  campaignTitle?: string;
  priority: number; // 1=highest, 5=lowest
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
      // Apenas notificações locais por enquanto - não precisa de token push remoto
      // O Expo Go não suporta push notifications nativamente sem configuração do Firebase
      console.log("✅ Permissões de notificação concedidas (usando notificações locais)");
      return null;

      // TODO: Descomentar quando Firebase estiver configurado
      // const token = await Notifications.getExpoPushTokenAsync({
      //   projectId: process.env.EXPO_PUBLIC_PROJECT_ID || "your-project-id",
      // });
      // this.expoPushToken = token.data;
      // await this.saveTokenToBackend(token.data);
      // console.log("✅ Push token registrado:", token.data);
      // return token.data;
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
   * Agenda notificação local para alertas de estoque GERAL (qualquer tipo sanguíneo)
   */
  async scheduleBloodStockNotificationGeneral(
    bloodType: string,
    urgencyLevel: "critical" | "alert"
  ): Promise<void> {
    const title =
      urgencyLevel === "critical"
        ? `🚨 Estoque Crítico - Sangue ${bloodType}`
        : `⚠️ Estoque Baixo - Sangue ${bloodType}`;

    const body =
      urgencyLevel === "critical"
        ? `O estoque de sangue ${bloodType} está em estado crítico! Convide amigos e familiares para doar.`
        : `O estoque de sangue ${bloodType} está baixo. Ajude a divulgar!`;

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: urgencyLevel === "critical" ? "default" : undefined,
        priority:
          urgencyLevel === "critical"
            ? Notifications.AndroidNotificationPriority.MAX
            : Notifications.AndroidNotificationPriority.DEFAULT,
        data: {
          type: "blood_critical_general",
          bloodType,
          urgencyLevel,
          priority: urgencyLevel === "critical" ? 1 : 3,
        } as NotificationData,
      },
      trigger: null, // Show immediately
    });
  }

  /**
   * Agenda notificação local para alertas de estoque do TIPO DO USUÁRIO
   */
  async scheduleBloodStockNotificationUser(
    bloodType: string,
    urgencyLevel: "critical" | "alert"
  ): Promise<void> {
    const title =
      urgencyLevel === "critical"
        ? `🚨 SEU SANGUE ${bloodType} ESTÁ CRÍTICO!`
        : `⚠️ Seu Sangue ${bloodType} em Alerta`;

    const body =
      urgencyLevel === "critical"
        ? `O estoque do SEU tipo sanguíneo (${bloodType}) está CRÍTICO! Sua doação pode salvar vidas AGORA!`
        : `O estoque do seu tipo sanguíneo (${bloodType}) está baixo. Considere agendar uma doação em breve.`;

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: "default",
        priority: Notifications.AndroidNotificationPriority.MAX,
        vibrate: [0, 250, 250, 250],
        data: {
          type: "blood_critical_user",
          bloodType,
          urgencyLevel,
          priority: 1, // Highest priority - user's own blood type
        } as NotificationData,
      },
      trigger: null, // Show immediately
    });
  }

  /**
   * Notificação de agendamento confirmado
   */
  async sendAppointmentConfirmation(
    protocol: string,
    appointmentDate: Date,
    location: string
  ): Promise<void> {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "✅ Agendamento Confirmado!",
        body: `Sua doação foi agendada para ${appointmentDate.toLocaleDateString(
          "pt-BR"
        )} às ${appointmentDate.toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        })} no ${location}.\n\nProtocolo: ${protocol}`,
        sound: "default",
        priority: Notifications.AndroidNotificationPriority.HIGH,
        data: {
          type: "appointment_scheduled",
          appointmentProtocol: protocol,
          appointmentDate: appointmentDate.toISOString(),
          appointmentLocation: location,
          priority: 2,
        } as NotificationData,
      },
      trigger: null,
    });
  }

  /**
   * Agenda lembretes de agendamento (2 dias antes, 1 dia antes, no dia)
   */
  async scheduleAppointmentReminder(
    protocol: string,
    appointmentDate: Date,
    location: string
  ): Promise<string[]> {
    const now = new Date();
    const notificationIds: string[] = [];

    // Lembrete 2 dias antes
    const twoDaysBefore = new Date(
      appointmentDate.getTime() - 2 * 24 * 60 * 60 * 1000
    );
    if (twoDaysBefore > now) {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: "📅 Lembrete: Doação em 2 dias",
          body: `Sua doação está agendada para ${appointmentDate.toLocaleDateString(
            "pt-BR"
          )} no ${location}. Prepare-se: durma bem, hidrate-se e faça refeições leves!`,
          sound: "default",
          data: {
            type: "appointment_reminder_2days",
            appointmentProtocol: protocol,
            appointmentDate: appointmentDate.toISOString(),
            appointmentLocation: location,
            priority: 2,
          } as NotificationData,
        },
        trigger: twoDaysBefore,
      });
      notificationIds.push(id);
    }

    // Lembrete 1 dia antes
    const oneDayBefore = new Date(
      appointmentDate.getTime() - 24 * 60 * 60 * 1000
    );
    if (oneDayBefore > now) {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: "⏰ Lembrete: Doação amanhã!",
          body: `Sua doação é amanhã às ${appointmentDate.toLocaleTimeString(
            "pt-BR",
            { hour: "2-digit", minute: "2-digit" }
          )} no ${location}. Lembre-se de levar um documento com foto!`,
          sound: "default",
          priority: Notifications.AndroidNotificationPriority.HIGH,
          data: {
            type: "appointment_reminder_1day",
            appointmentProtocol: protocol,
            appointmentDate: appointmentDate.toISOString(),
            appointmentLocation: location,
            priority: 2,
          } as NotificationData,
        },
        trigger: oneDayBefore,
      });
      notificationIds.push(id);
    }

    // Lembrete no dia (2 horas antes)
    const twoHoursBefore = new Date(
      appointmentDate.getTime() - 2 * 60 * 60 * 1000
    );
    if (twoHoursBefore > now) {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: "🚨 Doação HOJE em 2 horas!",
          body: `Sua doação é hoje às ${appointmentDate.toLocaleTimeString(
            "pt-BR",
            { hour: "2-digit", minute: "2-digit" }
          )} no ${location}. Boa doação! 🩸❤️`,
          sound: "default",
          priority: Notifications.AndroidNotificationPriority.MAX,
          vibrate: [0, 250, 250, 250],
          data: {
            type: "appointment_reminder_today",
            appointmentProtocol: protocol,
            appointmentDate: appointmentDate.toISOString(),
            appointmentLocation: location,
            priority: 1,
          } as NotificationData,
        },
        trigger: twoHoursBefore,
      });
      notificationIds.push(id);
    }

    return notificationIds;
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
   * ⚠️ APENAS NOTIFICA PARA O TIPO SANGUÍNEO DO USUÁRIO (evita saturação)
   */
  async checkBloodStockAndAlert(userBloodType: string): Promise<void> {
    try {
      // CORREÇÃO: Usa o bancoDeSangueService em vez de chamar apiService direto
      // Isso garante o parse correto dos dados e evita erro de tipagem
      const bloodStock = await bancoDeSangueService.getBloodStock();

      // 🔴 APENAS VERIFICA E NOTIFICA O TIPO SANGUÍNEO DO USUÁRIO
      const userBloodStock = bloodStock.find(
        (stock) => stock.tipo === userBloodType
      );

      if (userBloodStock) {
        // Verifica as strings retornadas pelo serviço (que normalizou para "Crítico" com acento)
        if (userBloodStock.status === "Crítico") {
          await this.scheduleBloodStockNotificationUser(userBloodType, "critical");
          console.log(`🚨 [NOTIF] Alerta CRÍTICO para ${userBloodType}`);
        } else if (userBloodStock.status === "Alerta") {
          await this.scheduleBloodStockNotificationUser(userBloodType, "alert");
          console.log(`⚠️ [NOTIF] Alerta para ${userBloodType}`);
        } else {
          console.log(`✅ [NOTIF] Estoque de ${userBloodType} normal - nenhuma notificação enviada`);
        }
      }
    } catch (error) {
      console.error("Erro ao verificar estoque de sangue:", error);
    }
  }

  /**
   * Envia notificação de nova campanha (Mockada por enquanto)
   */
  async sendCampaignNotification(
    title: string,
    message: string,
    campaignId?: string
  ): Promise<void> {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `🎯 Nova Campanha: ${title}`,
        body: message,
        sound: "default",
        priority: Notifications.AndroidNotificationPriority.DEFAULT,
        data: {
          type: "campaign_new",
          campaignId,
          campaignTitle: title,
          priority: 3,
        } as NotificationData,
      },
      trigger: null,
    });
  }

  /**
   * Envia notificações mockadas de campanhas para demonstração
   */
  async sendMockCampaignNotifications(): Promise<void> {
    const campaigns = [
      {
        title: "Junho Vermelho",
        message: "Participe do movimento nacional de doação de sangue! Meta: 1000 doações neste mês.",
      },
      {
        title: "Campanha Empresa ABC",
        message: "A Empresa ABC está promovendo uma campanha de doação. Participe e ganhe brindes!",
      },
      {
        title: "Doação Solidária",
        message: "Junte-se à nossa campanha solidária e ajude pacientes em tratamento.",
      },
    ];

    // Escolhe uma campanha aleatória
    const campaign = campaigns[Math.floor(Math.random() * campaigns.length)];
    await this.sendCampaignNotification(campaign.title, campaign.message, `mock_${Date.now()}`);
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
