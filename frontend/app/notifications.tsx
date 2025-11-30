import React, { useState, useEffect, useRef } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useAuth } from "../contexts/AuthContext";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Configurar handler de notificações
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

interface Notification {
  id: string;
  type: string; // Aceita qualquer tipo de notificação
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  bloodType?: string;
  urgencyLevel?: "critical" | "alert" | "normal";
  actionable?: boolean;
  actionText?: string;
  actionRoute?: string;
}

const NOTIFICATION_TYPES: Record<string, { icon: string; color: string; bgColor: string }> = {
  blood_critical_general: {
    icon: "water",
    color: "#E73645",
    bgColor: "#FEF2F2",
  },
  blood_critical_user: {
    icon: "water",
    color: "#DC2626",
    bgColor: "#FEE2E2",
  },
  blood_alert: {
    icon: "water",
    color: "#E73645",
    bgColor: "#FEF2F2",
  },
  appointment_scheduled: {
    icon: "calendar-outline",
    color: "#059669",
    bgColor: "#F0FDF4",
  },
  appointment_reminder_2days: {
    icon: "calendar",
    color: "#0891B2",
    bgColor: "#ECFEFF",
  },
  appointment_reminder_1day: {
    icon: "calendar",
    color: "#0891B2",
    bgColor: "#ECFEFF",
  },
  appointment_reminder_today: {
    icon: "alarm",
    color: "#DC2626",
    bgColor: "#FEE2E2",
  },
  appointment_reminder: {
    icon: "calendar",
    color: "#059669",
    bgColor: "#F0FDF4",
  },
  appointment_approaching: {
    icon: "time",
    color: "#F59E0B",
    bgColor: "#FEF3C7",
  },
  campaign_new: {
    icon: "megaphone",
    color: "#7C3AED",
    bgColor: "#F5F3FF",
  },
  campaign: {
    icon: "megaphone",
    color: "#7C3AED",
    bgColor: "#F5F3FF",
  },
  general: {
    icon: "information-circle",
    color: "#2563EB",
    bgColor: "#EFF6FF",
  },
};

export default function NotificationsScreen() {
  const { user } = useAuth() as any;
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<
    "all" | "unread" | "blood_alert" | "appointment_reminder"
  >("all");
  const [unreadCount, setUnreadCount] = useState(0);

  // Refs para listeners de notificações
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  useEffect(() => {
    loadNotifications();
    setupNotificationListeners();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      loadNotifications(true); // Silent refresh
    }, 30000);

    return () => {
      clearInterval(interval);
      // Cleanup listeners
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  // Configurar listeners para notificações do Expo
  const setupNotificationListeners = () => {
    // Listener para quando uma notificação é recebida enquanto o app está aberto
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('📬 Notificação recebida:', notification);
      // Adicionar a notificação à lista
      const newNotification: Notification = {
        id: notification.request.identifier,
        type: 'general',
        title: notification.request.content.title || 'Nova Notificação',
        message: notification.request.content.body || '',
        timestamp: new Date(),
        read: false,
        actionable: notification.request.content.data?.actionable as boolean,
        actionText: notification.request.content.data?.actionText as string,
        actionRoute: notification.request.content.data?.actionRoute as string,
      };
      setNotifications(prev => [newNotification, ...prev]);
      setUnreadCount(prev => prev + 1);
    });

    // Listener para quando o usuário interage com a notificação
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('👆 Usuário clicou na notificação:', response);
      const notificationData = response.notification.request.content.data;

      // Navegar para a tela apropriada
      if (notificationData?.actionRoute) {
        router.push(notificationData.actionRoute as any);
      }
    });
  };

  const loadNotifications = async (silent = false) => {
    if (!silent) setLoading(true);

    try {
      // Buscar notificações agendadas do Expo Notifications
      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();

      // Buscar notificações entregues (histórico)
      const presentedNotifications = await Notifications.getPresentedNotificationsAsync();

      // Carregar IDs de notificações lidas do AsyncStorage
      const readNotificationsJson = await AsyncStorage.getItem('readNotifications');
      const readNotificationIds = readNotificationsJson ? JSON.parse(readNotificationsJson) : [];

      // Converter notificações do Expo para o formato do app
      const realNotifications: Notification[] = presentedNotifications.map((notification) => {
        const data = notification.request.content.data as any;
        const notifId = notification.request.identifier;

        return {
          id: notifId,
          type: data?.type || "general",
          title: notification.request.content.title || "Nova Notificação",
          message: notification.request.content.body || "",
          timestamp: new Date(notification.date),
          read: readNotificationIds.includes(notifId),
          bloodType: data?.bloodType,
          urgencyLevel: data?.urgencyLevel,
          actionable: !!data?.actionRoute,
          actionText: data?.actionText,
          actionRoute: data?.actionRoute,
        };
      });

      // Ordenar por timestamp (mais recentes primeiro)
      realNotifications.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      setNotifications(realNotifications);
      const unread = realNotifications.filter((n) => !n.read).length;
      setUnreadCount(unread);

      console.log(`✅ ${realNotifications.length} notificações carregadas (${unread} não lidas)`);
    } catch (error) {
      console.error("Error loading notifications:", error);
      Alert.alert("Erro", "Não foi possível carregar as notificações");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }; const onRefresh = () => {
    setRefreshing(true);
    loadNotifications();
  };

  const markAsRead = async (notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    // Salvar no AsyncStorage
    try {
      const readNotificationsJson = await AsyncStorage.getItem('readNotifications');
      const readNotificationIds = readNotificationsJson ? JSON.parse(readNotificationsJson) : [];
      if (!readNotificationIds.includes(notificationId)) {
        readNotificationIds.push(notificationId);
        await AsyncStorage.setItem('readNotifications', JSON.stringify(readNotificationIds));
      }
    } catch (error) {
      console.error('Erro ao salvar notificação lida:', error);
    }
  };

  const markAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);

    // Salvar no AsyncStorage
    try {
      const allIds = notifications.map(n => n.id);
      await AsyncStorage.setItem('readNotifications', JSON.stringify(allIds));
    } catch (error) {
      console.error('Erro ao salvar notificações lidas:', error);
    }
  };

  const handleNotificationAction = (notification: Notification) => {
    markAsRead(notification.id);

    if (notification.actionRoute) {
      switch (notification.actionRoute) {
        case "/doar":
          router.push("/(tabs)/doar");
          break;
        default:
          Alert.alert(
            "Em breve",
            "Esta funcionalidade será implementada em breve."
          );
      }
    }
  };

  const getFilteredNotifications = () => {
    switch (selectedFilter) {
      case "unread":
        return notifications.filter((n) => !n.read);
      case "blood_alert":
        return notifications.filter((n) => n.type === "blood_alert");
      case "appointment_reminder":
        return notifications.filter((n) => n.type === "appointment_reminder");
      default:
        return notifications;
    }
  };

  const filteredNotifications = getFilteredNotifications();

  const renderNotification = (notification: Notification) => {
    const typeConfig = NOTIFICATION_TYPES[notification.type] || NOTIFICATION_TYPES.general;
    const isUrgent =
      notification.urgencyLevel === "critical" ||
      notification.urgencyLevel === "alert";

    return (
      <TouchableOpacity
        key={notification.id}
        style={[
          styles.notificationCard,
          !notification.read && styles.unreadCard,
          isUrgent && styles.urgentCard,
        ]}
        onPress={() => markAsRead(notification.id)}
      >
        <View style={styles.notificationHeader}>
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: typeConfig.bgColor },
            ]}
          >
            <Ionicons
              name={typeConfig.icon as any}
              size={20}
              color={typeConfig.color}
            />
          </View>

          <View style={styles.notificationContent}>
            <Text
              style={[
                styles.notificationTitle,
                !notification.read && styles.unreadTitle,
              ]}
            >
              {notification.title}
            </Text>
            <Text style={styles.notificationMessage}>
              {notification.message}
            </Text>
            <Text style={styles.notificationTime}>
              {formatTime(notification.timestamp)}
            </Text>
          </View>

          {!notification.read && <View style={styles.unreadDot} />}
        </View>

        {notification.actionable && (
          <TouchableOpacity
            style={[styles.actionButton, { borderColor: typeConfig.color }]}
            onPress={() => handleNotificationAction(notification)}
          >
            <Text
              style={[styles.actionButtonText, { color: typeConfig.color }]}
            >
              {notification.actionText}
            </Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  const formatTime = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Agora";
    if (minutes < 60) return `${minutes}min`;
    if (hours < 24) return `${hours}h`;
    return `${days}d`;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.push("/(tabs)")}
          >
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notificações</Text>
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setFilterModalVisible(true)}
          >
            <Ionicons name="filter" size={20} color="#666" />
          </TouchableOpacity>

          {unreadCount > 0 && (
            <TouchableOpacity
              style={styles.headerButton}
              onPress={markAllAsRead}
            >
              <Ionicons name="checkmark-done" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Notifications List */}
      <ScrollView
        style={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Carregando notificações...</Text>
          </View>
        ) : filteredNotifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off" size={64} color="#ccc" />
            <Text style={styles.emptyTitle}>Nenhuma notificação</Text>
            <Text style={styles.emptyMessage}>
              {selectedFilter === "all"
                ? "Você não tem notificações no momento."
                : `Nenhuma notificação do tipo "${selectedFilter}" encontrada.`}
            </Text>
          </View>
        ) : (
          <View style={styles.notificationsList}>
            {filteredNotifications.map(renderNotification)}
          </View>
        )}
      </ScrollView>

      {/* Filter Modal */}
      <Modal
        visible={filterModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.filterModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filtrar Notificações</Text>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {[
              { key: "all", label: "Todas", icon: "list" },
              { key: "unread", label: "Não lidas", icon: "radio-button-off" },
              { key: "blood_alert", label: "Alertas de Sangue", icon: "water" },
              {
                key: "appointment_reminder",
                label: "Lembretes",
                icon: "calendar",
              },
            ].map((filter) => (
              <Pressable
                key={filter.key}
                style={[
                  styles.filterOption,
                  selectedFilter === filter.key && styles.selectedFilter,
                ]}
                onPress={() => {
                  setSelectedFilter(filter.key as any);
                  setFilterModalVisible(false);
                }}
              >
                <Ionicons
                  name={filter.icon as any}
                  size={20}
                  color={selectedFilter === filter.key ? "#E73645" : "#666"}
                />
                <Text
                  style={[
                    styles.filterOptionText,
                    selectedFilter === filter.key && styles.selectedFilterText,
                  ]}
                >
                  {filter.label}
                </Text>
                {selectedFilter === filter.key && (
                  <Ionicons name="checkmark" size={20} color="#E73645" />
                )}
              </Pressable>
            ))}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
    marginRight: 8,
  },
  unreadBadge: {
    backgroundColor: "#E73645",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
  },
  unreadBadgeText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerButton: {
    padding: 8,
    marginLeft: 8,
  },
  scrollContainer: {
    flex: 1,
  },
  loadingContainer: {
    padding: 40,
    alignItems: "center",
  },
  loadingText: {
    color: "#666",
    fontSize: 16,
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#666",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    lineHeight: 20,
  },
  notificationsList: {
    padding: 16,
  },
  notificationCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: "#E73645",
  },
  urgentCard: {
    borderWidth: 1,
    borderColor: "#FEE2E2",
    backgroundColor: "#FFFBFB",
  },
  notificationHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginBottom: 4,
  },
  unreadTitle: {
    fontWeight: "600",
  },
  notificationMessage: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginBottom: 8,
  },
  notificationTime: {
    fontSize: 12,
    color: "#999",
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#E73645",
    marginLeft: 8,
  },
  actionButton: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  filterModal: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  filterOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    marginHorizontal: 20,
    borderRadius: 8,
  },
  selectedFilter: {
    backgroundColor: "#FEF2F2",
  },
  filterOptionText: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    marginLeft: 12,
  },
  selectedFilterText: {
    color: "#E73645",
    fontWeight: "500",
  },
});
