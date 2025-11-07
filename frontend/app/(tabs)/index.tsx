import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { router } from "expo-router";
import apiService, { TransformedBloodStock } from "@/services/api";
import DonorCard from '@/components/DonorCard';
import DonorCardModal from '@/components/DonorCardModal';
import DonationHistory from '@/components/DonationHistory';
import { useAuth } from '@/contexts/AuthContext';
import { Modal } from 'react-native';

interface BloodStock {
  tipo: string;
  nivel: string;
  status: "Crítico" | "Alerta" | "Ideal";
}

// Configuration for refresh intervals
const REFRESH_CONFIG = {
  AUTO_REFRESH_INTERVAL: parseInt(process.env.EXPO_PUBLIC_BLOOD_STOCK_REFRESH_INTERVAL || "5") * 60 * 1000, // 5 minutes default
  CACHE_DURATION: 3 * 60 * 1000, // 3 minutes
};

export default function HomeScreen() {
  const [bloodStock, setBloodStock] = useState<BloodStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [unreadNotifications, setUnreadNotifications] = useState(3); // Mock count
  const [fullscreenCardVisible, setFullscreenCardVisible] = useState(false);
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const { user } = useAuth() as any;

  // Responsive calculations
  const { width: screenWidth } = Dimensions.get('window');
  const horizontalPadding = 32; // Total horizontal padding (16px each side from bloodStockSection)
  const sectionMargin = 30; // Total margin (15px each side from bloodStockSection)
  const cardSpacing = 8; // Space between cards

  // Determine cards per row based on screen size
  let cardsPerRow = 4;
  if (screenWidth < 320) cardsPerRow = 3;      // Very small phones
  else if (screenWidth < 400) cardsPerRow = 4;  // Regular phones
  else cardsPerRow = 4;                         // Larger screens

  const availableWidth = screenWidth - horizontalPadding - sectionMargin - (cardSpacing * (cardsPerRow - 1));
  const calculatedCardWidth = availableWidth / cardsPerRow;

  // Ensure minimum card size for readability
  const minCardWidth = 70;
  const cardWidth = Math.max(minCardWidth, calculatedCardWidth);

  useEffect(() => {
    checkAPIConnection();
    fetchBloodStock();

    // Auto refresh based on configuration
    const interval = setInterval(() => {
      fetchBloodStock(true); // Silent refresh
    }, REFRESH_CONFIG.AUTO_REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  const checkAPIConnection = async () => {
    try {
      const connected = await apiService.healthCheck();
      setIsConnected(connected);
      console.log(`🌐 API Connection: ${connected ? "✅ Connected" : "❌ Disconnected"}`);
    } catch (error) {
      setIsConnected(false);
      console.log("🌐 API Connection: ❌ Failed to check");
    }
  };

  const fetchBloodStock = async (silent: boolean = false) => {
    if (!silent) {
      setLoading(true);
      setError(null);
    }

    try {
      console.log(`🩸 Fetching blood stock using API service`);

      const transformedData = await apiService.getBloodStock();
      console.log("✅ Blood stock data received:", transformedData);

      setBloodStock(transformedData);
      setLastUpdate(new Date());
      setError(null);

    } catch (error: any) {
      console.error("❌ Error fetching blood stock:", error);
      setError(error.message);

      // Use fallback data only if no data exists
      if (bloodStock.length === 0) {
        console.log("🔄 Using fallback data due to error");
        setBloodStock([
          { tipo: "O-", nivel: "5", status: "Crítico" },
          { tipo: "A+", nivel: "15", status: "Alerta" },
          { tipo: "O+", nivel: "25", status: "Ideal" },
          { tipo: "B+", nivel: "30", status: "Ideal" },
          { tipo: "A-", nivel: "8", status: "Crítico" },
          { tipo: "B-", nivel: "12", status: "Alerta" },
          { tipo: "AB+", nivel: "18", status: "Ideal" },
          { tipo: "AB-", nivel: "6", status: "Crítico" },
        ]);
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  const getStatusFromLevel = (
    nivel: string
  ): "Crítico" | "Alerta" | "Ideal" => {
    const levelNum = parseInt(nivel);
    if (levelNum < 10) return "Crítico";
    if (levelNum < 20) return "Alerta";
    return "Ideal";
  };

  const formatLastUpdate = (date: Date): string => {
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffMinutes < 1) return "Agora mesmo";
    if (diffMinutes < 60) return `${diffMinutes} min atrás`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h atrás`;

    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Crítico":
        return "#FF4444";
      case "Alerta":
        return "#FF8800";
      case "Ideal":
        return "#00CC44";
      default:
        return "#666";
    }
  };

  const MenuItem = ({
    icon,
    title,
    onPress,
  }: {
    icon: string;
    title: string;
    onPress: () => void;
  }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuIconContainer}>
        <Ionicons name={icon as any} size={24} color="#666" />
      </View>
      <Text style={styles.menuText}>{title}</Text>
    </TouchableOpacity>
  );

  const BloodTypeCard = ({ item }: { item: BloodStock }) => {
    // Responsive sizing calculations
    const iconSize = Math.min(Math.max(14, cardWidth * 0.20), 22);
    const typeFontSize = Math.min(Math.max(11, cardWidth * 0.16), 16);
    const statusFontSize = Math.min(Math.max(8, cardWidth * 0.10), 11);

    return (
      <View style={[styles.bloodCard, { width: cardWidth }]}>
        <View style={styles.bloodDropContainer}>
          <Ionicons
            name="water"
            size={iconSize}
            color={getStatusColor(item.status)}
            style={styles.bloodDropIcon}
          />
          <Text
            style={[styles.bloodType, { fontSize: typeFontSize }]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {item.tipo}
          </Text>
        </View>
        <View
          style={[
            styles.statusIndicator,
            { backgroundColor: getStatusColor(item.status) },
          ]}
        >
          <Text
            style={[styles.statusText, { fontSize: statusFontSize }]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {item.status}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Image
            source={require("@/assets/images/gota_a_gota.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <View style={styles.headerRightContainer}>
            {/* API Connection Status */}
            {isConnected !== null && (
              <View style={styles.connectionStatus}>
                <View
                  style={[
                    styles.connectionDot,
                    { backgroundColor: isConnected ? "#00CC44" : "#FF4444" },
                  ]}
                />
                <Text style={styles.connectionText}>
                  {isConnected ? "Online" : "Offline"}
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.profileButton}
              onPress={() => router.push('/profile')}
            >
              <Ionicons name="person-outline" size={24} color="#333" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.notificationButton}
              onPress={() => router.push('/notifications')}
            >
              <Ionicons name="notifications-outline" size={24} color="#333" />
              {unreadNotifications > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>
                    {unreadNotifications > 9 ? '9+' : unreadNotifications}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Menu Icons */}
        <View style={styles.menuContainer}>
          <MenuItem
            icon="card-outline"
            title="Cartão do Doador"
            onPress={() => setFullscreenCardVisible(true)}
          />
          <MenuItem
            icon="heart-outline"
            title="Controle de Medula"
            onPress={() =>
              Alert.alert("Em desenvolvimento", "Funcionalidade em breve!")
            }
          />
          <MenuItem
            icon="bar-chart-outline"
            title="Histórico"
            onPress={() => setHistoryModalVisible(true)}
          />
          <MenuItem
            icon="help-circle-outline"
            title="FAQ"
            onPress={() => router.push('/faq')}
          />
        </View>

        {/* Seção Estoque De Sangue */}
        <View style={styles.bloodStockSection}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Text style={styles.sectionTitle}>Estoque de Sangue</Text>
              {lastUpdate && (
                <Text style={styles.lastUpdateText}>
                  Atualizado: {formatLastUpdate(lastUpdate)}
                </Text>
              )}
            </View>
            <TouchableOpacity
              style={[styles.refreshButton, loading && styles.refreshButtonDisabled]}
              onPress={() => fetchBloodStock()}
              disabled={loading}
            >
              <Ionicons
                name="refresh"
                size={20}
                color={loading ? "#CCC" : "#FF4444"}
                style={loading ? styles.rotatingIcon : undefined}
              />
            </TouchableOpacity>
          </View>

          {error && (
            <View style={styles.errorContainer}>
              <Ionicons name="warning-outline" size={16} color="#FF6B35" />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => fetchBloodStock()}
              >
                <Text style={styles.retryButtonText}>Tentar novamente</Text>
              </TouchableOpacity>
            </View>
          )}

          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Carregando estoque...</Text>
              <View style={styles.loadingDots}>
                <View style={[styles.dot, styles.dot1]} />
                <View style={[styles.dot, styles.dot2]} />
                <View style={[styles.dot, styles.dot3]} />
              </View>
            </View>
          ) : (
            <>
              <View style={styles.bloodGrid}>
                {bloodStock.map((item, index) => (
                  <BloodTypeCard key={index} item={item} />
                ))}
              </View>

              {/* Blood Stock Summary */}
              <View style={styles.stockSummary}>
                <Text style={styles.stockSummaryTitle}>Resumo do Estoque</Text>
                <View style={styles.stockSummaryRow}>
                  <View style={styles.statusCount}>
                    <View style={[styles.statusDot, { backgroundColor: "#FF4444" }]} />
                    <Text style={styles.statusCountText}>
                      Crítico: {bloodStock.filter(item => item.status === "Crítico").length}
                    </Text>
                  </View>
                  <View style={styles.statusCount}>
                    <View style={[styles.statusDot, { backgroundColor: "#FF8800" }]} />
                    <Text style={styles.statusCountText}>
                      Alerta: {bloodStock.filter(item => item.status === "Alerta").length}
                    </Text>
                  </View>
                  <View style={styles.statusCount}>
                    <View style={[styles.statusDot, { backgroundColor: "#00CC44" }]} />
                    <Text style={styles.statusCountText}>
                      Ideal: {bloodStock.filter(item => item.status === "Ideal").length}
                    </Text>
                  </View>
                </View>
              </View>
            </>
          )}
        </View>

        {/* Campaign Message */}
        <View style={styles.campaignContainer}>
          <Image
            source={require("@/assets/images/medico_24hrs.jpg")}
            style={styles.doctorImage}
            resizeMode="cover"
          />
          <View style={styles.campaignContentContainer}>
            <View style={styles.campaignIcon}>
              <Ionicons name="heart" size={40} color="#FF4444" />
            </View>
            <View style={styles.campaignTextContainer}>
              <Text style={styles.campaignTitle}>
                Gota por gota, a gente salva vidas.
              </Text>
              <Text style={styles.campaignSubtitle}>Junte-se à campanha!</Text>
            </View>
          </View>
        </View>

        {/* Botão de ações */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: "#FF4444" }]}
            onPress={() =>
              Alert.alert("Em desenvolvimento", "Funcionalidade em breve!")
            }
          >
            <Ionicons name="heart" size={20} color="white" />
            <Text style={styles.actionButtonText}>
              Cadastro de Medula Óssea
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: "#FF4444" }]}
            onPress={() =>
              Alert.alert("Em desenvolvimento", "Funcionalidade em breve!")
            }
          >
            <Ionicons name="calendar" size={20} color="white" />
            <Text style={styles.actionButtonText}>
              Agendar campanha de adoção
            </Text>
          </TouchableOpacity>
        </View>

        {/* Horário do HEMOSE - Versão Completa */}
        <View style={styles.hemoseSection}>
          <Text style={styles.sectionTitle}>Funcionamento do HEMOSE</Text>

          {/* Cabeçalho com informações gerais */}
          <View style={styles.horarioHeader}>
            <View style={styles.horarioHeaderIcon}>
              <Ionicons name="time-outline" size={28} color="#fff" />
            </View>
            <View style={styles.horarioHeaderText}>
              <Text style={styles.horarioTitle}>Horários de Atendimento</Text>
              <Text style={styles.horarioSubtitle}>Podendo variar em finais de semana ou feriados</Text>
            </View>
          </View>

          {/* Lista de horários */}
          <View style={styles.horarioList}>
            {(() => {
              const hoje = new Date().getDay(); // 0 = Domingo, 1 = Segunda, etc.
              const diasSemana = [
                { nome: 'Domingo', horario: 'Fechado', funcionando: false },
                { nome: 'Segunda-Feira', horario: '07:30 - 17:00', funcionando: true },
                { nome: 'Terça-Feira', horario: '07:30 - 17:00', funcionando: true },
                { nome: 'Quarta-Feira', horario: '07:30 - 17:00', funcionando: true },
                { nome: 'Quinta-Feira', horario: '07:30 - 17:00', funcionando: true },
                { nome: 'Sexta-Feira', horario: '07:30 - 17:00', funcionando: true },
                { nome: 'Sábado', horario: 'Fechado', funcionando: false }
              ];

              return diasSemana.map((dia, index) => {
                const isToday = index === hoje;
                const isOpen = dia.funcionando && isToday;
                const currentTime = new Date();
                const isCurrentlyOpen = isOpen && currentTime.getHours() >= 7 && currentTime.getHours() < 17;

                return (
                  <View key={dia.nome} style={[
                    styles.horarioItem,
                    isToday ? styles.horarioItemToday : null
                  ]}>
                    <Text style={[
                      styles.horarioDia,
                      isToday ? styles.horarioDiaToday : null,
                      !dia.funcionando ? styles.horarioDiaFechado : null
                    ]}>{dia.nome}</Text>

                    <View style={styles.horarioRight}>
                      {isCurrentlyOpen && (
                        <View style={styles.hemoseStatusDot} />
                      )}
                      <Text style={[
                        styles.horarioHoras,
                        isToday ? styles.horarioHorasToday : null,
                        !dia.funcionando ? styles.horarioHorasFechado : null
                      ]}>{dia.horario}</Text>
                      {isCurrentlyOpen && (
                        <View style={styles.hemoseStatusBadge}>
                          <Text style={styles.hemoseStatusText}>ABERTO</Text>
                        </View>
                      )}
                    </View>
                  </View>
                );
              });
            })()}
          </View>

          {/* Informações de contato */}
          <View style={styles.hemoseContact}>
            <View style={styles.contactRow}>
              <Ionicons name="call" size={16} color="#E73645" />
              <Text style={styles.contactText}>+55 79 3234-6010</Text>
            </View>
            <View style={styles.contactRow}>
              <Ionicons name="location" size={16} color="#E73645" />
              <Text style={styles.contactText}>Av. Prof. José Bonifácio Fortes Neto, 400 - Capucho</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Fullscreen Card Modal */}
      <DonorCardModal
        visible={fullscreenCardVisible}
        onClose={() => setFullscreenCardVisible(false)}
        id={user?.id?.toString() || '123456'}
        name={user?.name || user?.fullName || 'João da Silva Santos'}
        bloodType={user?.bloodType || user?.blood_type || 'O+'}
        profileImage={user?.photoURL || user?.profileImage}
        lastDonation={user?.lastDonation || '2024-01-15'}
        donationCount={user?.donationCount ?? 5}
        cpf={user?.cpf || '123.456.789-00'}
        rg={user?.rg || '12.345.678-9'}
        birthDate={user?.birthDate || '1990-05-15'}
        gender={user?.gender || 'M'}
      />

      {/* Donation History Modal */}
      <Modal
        visible={historyModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setHistoryModalVisible(false)}
      >
        <DonationHistory
          userId={user?.id?.toString()}
          onClose={() => setHistoryModalVisible(false)}
          isModal={true}
        />
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    backgroundColor: "#f8dddd",
  },
  logo: {
    height: 40,
    width: 120,
  },
  headerRightContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  connectionStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  connectionText: {
    fontSize: 10,
    color: "#666",
    fontWeight: "500",
  },
  notificationButton: {
    padding: 8,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#E73645',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  notificationBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  profileButton: {
    padding: 8,
    marginRight: 4,
  },
  menuContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 20,
    backgroundColor: "white",
    marginHorizontal: 15,
    marginTop: 15,
    borderRadius: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  menuItem: {
    alignItems: "center",
    flex: 1,
  },
  menuIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#F0F0F0",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 5,
  },
  menuText: {
    fontSize: 10,
    textAlign: "center",
    color: "#666",
  },
  campaignContainer: {
    backgroundColor: "white",
    margin: 15,
    borderRadius: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: "hidden",
  },
  doctorImage: {
    width: "100%",
    height: 120,
  },
  campaignContentContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
  },
  campaignIcon: {
    marginRight: 15,
  },
  campaignTextContainer: {
    flex: 1,
  },
  campaignTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  campaignSubtitle: {
    fontSize: 14,
    color: "#666",
  },
  bloodStockSection: {
    backgroundColor: "white",
    margin: 15,
    padding: 16,
    borderRadius: 12,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  sectionTitleContainer: {
    flex: 1,
  },
  lastUpdateText: {
    fontSize: 12,
    color: "#888",
    marginTop: 2,
  },
  refreshButton: {
    padding: 5,
  },
  refreshButtonDisabled: {
    opacity: 0.5,
  },
  rotatingIcon: {
    transform: [{ rotate: "360deg" }],
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF5F5",
    padding: 10,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#FF6B35",
    marginBottom: 15,
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: "#FF6B35",
  },
  retryButton: {
    backgroundColor: "#FF6B35",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
  },
  retryButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  loadingContainer: {
    alignItems: "center",
    padding: 20,
  },
  loadingDots: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 10,
    gap: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FF4444",
  },
  dot1: {
    opacity: 1,
  },
  dot2: {
    opacity: 0.7,
  },
  dot3: {
    opacity: 0.4,
  },
  stockSummary: {
    marginTop: 15,
    padding: 12,
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  stockSummaryTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  stockSummaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statusCount: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusCountText: {
    fontSize: 12,
    color: "#666",
  },
  loadingText: {
    textAlign: "center",
    color: "#666",
    fontSize: 16,
  },
  bloodGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around", // Better distribution for responsive cards
    gap: 6, // Smaller gap to prevent overflow on small screens
    paddingHorizontal: 2,
  },
  bloodCard: {
    // Width is now set dynamically in the component
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    paddingHorizontal: 4,
    marginBottom: 8,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  bloodDropContainer: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    paddingTop: 4,
  },
  bloodDropIcon: {
    marginBottom: 4,
  },
  bloodType: {
    // fontSize is now set dynamically in the component
    fontWeight: "700",
    color: "#1F2937",
    textAlign: "center",
    marginTop: 2,
  },
  statusIndicator: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    width: "95%",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
  statusText: {
    // fontSize is now set dynamically in the component
    color: "white",
    fontWeight: "600",
    textAlign: "center",
  },
  actionButtonsContainer: {
    paddingHorizontal: 15,
    gap: 10,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    gap: 10,
  },
  actionButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  hemoseSection: {
    backgroundColor: "white",
    margin: 15,
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  // Estilos dos horários detalhados
  horarioHeader: {
    backgroundColor: '#E73645',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  horarioHeaderIcon: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  horarioHeaderText: {
    flex: 1,
  },
  horarioTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 2,
  },
  horarioSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
  },
  horarioList: {
    padding: 16,
  },
  horarioItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 6,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
  },
  horarioItemToday: {
    backgroundColor: '#E73645',
  },
  horarioDia: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  horarioDiaToday: {
    color: '#fff',
  },
  horarioDiaFechado: {
    color: '#999',
  },
  horarioRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  horarioHoras: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E73645',
  },
  horarioHorasToday: {
    color: '#fff',
  },
  horarioHorasFechado: {
    color: '#999',
  },
  hemoseStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#34D399',
  },
  hemoseStatusBadge: {
    backgroundColor: '#34D399',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  hemoseStatusText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#fff',
  },
  hemoseContact: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  contactText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
});
