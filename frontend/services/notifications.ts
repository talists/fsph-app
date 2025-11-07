import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiService from './api';

// Configure notification handling
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
  type: 'blood_alert' | 'appointment_reminder' | 'campaign' | 'general';
  bloodType?: string;
  urgencyLevel?: 'critical' | 'alert' | 'normal';
  appointmentId?: string;
  campaignId?: string;
}

class NotificationService {
  private expoPushToken: string | null = null;

  /**
   * Initialize notification service and request permissions
   */
  async initialize(): Promise<void> {
    await this.registerForPushNotifications();
    await this.scheduleBloodStockChecks();
    await this.scheduleAppointmentReminders();
  }

  /**
   * Register for push notifications and get Expo push token
   */
  async registerForPushNotifications(): Promise<string | null> {
    if (Platform.OS === 'web') {
      console.log('Push notifications not supported on web');
      return null;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return null;
    }

    try {
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: process.env.EXPO_PUBLIC_PROJECT_ID || 'your-project-id',
      });
      
      this.expoPushToken = token.data;
      await this.saveTokenToBackend(token.data);
      
      console.log('✅ Push token registered:', token.data);
      return token.data;
      
    } catch (error) {
      console.error('Error getting push token:', error);
      return null;
    }
  }

  /**
   * Save push token to backend
   */
  private async saveTokenToBackend(token: string): Promise<void> {
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (userId) {
        // TODO: Send to your backend
        console.log('Saving push token to backend for user:', userId);
      }
    } catch (error) {
      console.error('Error saving token to backend:', error);
    }
  }

  /**
   * Schedule local notification for blood stock alerts
   */
  async scheduleBloodStockNotification(bloodType: string, urgencyLevel: 'critical' | 'alert'): Promise<void> {
    const title = urgencyLevel === 'critical' 
      ? `🚨 Sangue ${bloodType} - CRÍTICO` 
      : `⚠️ Sangue ${bloodType} - ALERTA`;
      
    const body = urgencyLevel === 'critical'
      ? `O estoque de sangue ${bloodType} está em estado crítico! Sua doação é urgente e pode salvar vidas.`
      : `O estoque de sangue ${bloodType} está baixo. Considere agendar uma doação.`;

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: urgencyLevel === 'critical' ? 'default' : undefined,
        priority: urgencyLevel === 'critical' ? Notifications.AndroidNotificationPriority.HIGH : Notifications.AndroidNotificationPriority.DEFAULT,
        data: {
          type: 'blood_alert',
          bloodType,
          urgencyLevel,
        } as NotificationData,
      },
      trigger: null, // Show immediately
    });
  }

  /**
   * Schedule appointment reminder notifications
   */
  async scheduleAppointmentReminder(appointmentId: string, appointmentDate: Date, location: string): Promise<void> {
    const now = new Date();
    const twoDaysBefore = new Date(appointmentDate.getTime() - 2 * 24 * 60 * 60 * 1000);
    const appointmentDay = new Date(appointmentDate.getTime() - 2 * 60 * 60 * 1000); // 2 hours before

    // Schedule 2 days before reminder
    if (twoDaysBefore > now) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '📅 Lembrete de Doação',
          body: `Sua doação está agendada para ${appointmentDate.toLocaleDateString('pt-BR')} no ${location}. Não se esqueça!`,
          data: {
            type: 'appointment_reminder',
            appointmentId,
          } as NotificationData,
        },
        trigger: twoDaysBefore as any,
      });
    }

    // Schedule day of appointment reminder
    if (appointmentDay > now) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '⏰ Doação Hoje!',
          body: `Sua doação é hoje às ${appointmentDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} no ${location}. Boa sorte!`,
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.HIGH,
          data: {
            type: 'appointment_reminder',
            appointmentId,
          } as NotificationData,
        },
        trigger: appointmentDay as any,
      });
    }
  }

  /**
   * Schedule periodic blood stock checks
   */
  private async scheduleBloodStockChecks(): Promise<void> {
    // Check every 6 hours for blood stock levels
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Blood Stock Check',
        body: 'Hidden notification for background blood stock check',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 6 * 60 * 60, // 6 hours
        repeats: true,
      } as any,
    });
  }

  /**
   * Schedule periodic appointment reminder checks
   */
  private async scheduleAppointmentReminders(): Promise<void> {
    // Check daily for upcoming appointments
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Appointment Check',
        body: 'Hidden notification for background appointment check',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
        hour: 9, // 9 AM daily
        minute: 0,
        repeats: true,
      } as any,
    });
  }

  /**
   * Check blood stock and send alerts if necessary
   */
  async checkBloodStockAndAlert(userBloodType: string): Promise<void> {
    try {
      const bloodStock = await apiService.getBloodStock();
      const userBloodStock = bloodStock.find(stock => stock.tipo === userBloodType);
      
      if (userBloodStock) {
        if (userBloodStock.status === 'Crítico') {
          await this.scheduleBloodStockNotification(userBloodType, 'critical');
        } else if (userBloodStock.status === 'Alerta') {
          await this.scheduleBloodStockNotification(userBloodType, 'alert');
        }
      }
    } catch (error) {
      console.error('Error checking blood stock:', error);
    }
  }

  /**
   * Send campaign notification
   */
  async sendCampaignNotification(title: string, message: string, campaignId?: string): Promise<void> {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `🎯 ${title}`,
        body: message,
        data: {
          type: 'campaign',
          campaignId,
        } as NotificationData,
      },
      trigger: null,
    });
  }

  /**
   * Cancel all scheduled notifications
   */
  async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  /**
   * Cancel specific notification
   */
  async cancelNotification(notificationId: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  }

  /**
   * Get notification permission status
   */
  async getPermissionStatus(): Promise<string> {
    const { status } = await Notifications.getPermissionsAsync();
    return status;
  }

  /**
   * Handle notification received while app is in foreground
   */
  onNotificationReceived(callback: (notification: Notifications.Notification) => void): void {
    Notifications.addNotificationReceivedListener(callback);
  }

  /**
   * Handle notification response (when user taps notification)
   */
  onNotificationResponse(callback: (response: Notifications.NotificationResponse) => void): void {
    Notifications.addNotificationResponseReceivedListener(callback);
  }

  /**
   * Set notification badge count
   */
  async setBadgeCount(count: number): Promise<void> {
    await Notifications.setBadgeCountAsync(count);
  }

  /**
   * Get current badge count
   */
  async getBadgeCount(): Promise<number> {
    return await Notifications.getBadgeCountAsync();
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
export default notificationService;