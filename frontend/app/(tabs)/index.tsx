import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState, useCallback, useContext } from "react";
import {
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator, // Importado para o ecrã de loading
  RefreshControl, // Importado para o "puxar para atualizar"
} from "react-native";
import { Link } from 'expo-router'; // Importado para o link do alerta
import { apiService } from "@/services/api"; 
import { bancoDeSangueService, TransformedBloodStock } from "@/services/bancoDeSangue.service";
import { useAuth } from "@/contexts/AuthContext";
// ---------------------------------

type BloodStock = TransformedBloodStock;

const REFRESH_CONFIG = {
  AUTO_REFRESH_INTERVAL: parseInt(process.env.EXPO_PUBLIC_BLOOD_STOCK_REFRESH_INTERVAL || "5") * 60 * 1000, // 5 minutes default
};

export default function HomeScreen() {
  const [bloodStock, setBloodStock] = useState<BloodStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);

  // Estados para o alerta personalizado
  const [showStockAlert, setShowStockAlert] = useState(false);
  const [criticalType, setCriticalType] = useState<string | null>(null);
  
  // Acede aos dados do utilizador autenticado
  const { user } = useAuth(); 

  const checkAPIConnection = async () => {
    try {
      // CORREÇÃO: Chama o healthCheck do apiService central
      const connected = await apiService.healthCheck(); 
      setIsConnected(connected);
      console.log(`🌐 API Connection: ${connected ? "✅ Connected" : "❌ Disconnected"}`);
    } catch (error) {
      setIsConnected(false);
      console.log("🌐 API Connection: ❌ Failed to check");
    }
  };

  const fetchBloodStock = async (isRefresh = false) => {
    if (!isRefresh && loading) return; // Evita chamadas duplicadas
    
    if (!isRefresh) setLoading(true);
    setRefreshing(true);
    setError(null);
    setShowStockAlert(false);

    try {
      console.log(`🩸 Fetching blood stock using API service`);
      
      // CORREÇÃO: Chama o serviço modular correto
      const transformedData = await bancoDeSangueService.getBloodStock();
      console.log("✅ Blood stock data received:", transformedData);

      setBloodStock(transformedData);
      setLastUpdate(new Date());
      setError(null);

      // --- LÓGICA DE VERIFICAÇÃO DE ALERTA (ADICIONADA) ---
      if (user && user.tipo_sanguineo) {
        const userBloodType = user.tipo_sanguineo;
        const userStockInfo = transformedData.find(item => item.tipo === userBloodType);

        // Verifica se o tipo do utilizador está em alerta ou crítico
        if (userStockInfo && (userStockInfo.status === 'Crítico' || userStockInfo.status === 'Alerta')) {
          setShowStockAlert(true);
          setCriticalType(userBloodType);
        }
      }
      // --- FIM DA LÓGICA DE ALERTA ---

    } catch (error: any) {
      console.error("❌ Error fetching blood stock:", error);
      setError(error.message);
    } finally {
      if (!isRefresh) setLoading(false);
      setRefreshing(false);
    }
  };

  // Carrega os dados na primeira vez e re-carrega se o utilizador mudar
  useEffect(() => {
    if(user) { // Só carrega os dados se o utilizador estiver autenticado
      checkAPIConnection();
      loadFeed();
      
      const interval = setInterval(() => {
        fetchBloodStock(true); // Silent refresh
      }, REFRESH_CONFIG.AUTO_REFRESH_INTERVAL);

      return () => clearInterval(interval);
    }
  }, [user]); // Depende do 'user' para re-executar

  // Função para o "puxar para atualizar"
  const onRefresh = useCallback(() => {
    fetchBloodStock(true);
  }, [user]); // Adiciona 'user' como dependência
  
  const loadFeed = useCallback(() => {
    fetchBloodStock(false);
  }, [user]); // Adiciona 'user' como dependência

  // Funções de formatação e estilo (o seu código original, está perfeito)
  const formatLastUpdate = (date: Date): string => {
     const now = new Date();
     const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
     if (diffMinutes < 1) return "Agora mesmo";
     if (diffMinutes < 60) return `${diffMinutes} min atrás`;
     const diffHours = Math.floor(diffMinutes / 60);
     if (diffHours < 24) return `${diffHours}h atrás`;
     return date.toLocaleDateString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  };

  const getStatusColor = (status: string) => {
     switch (status) {
       case "Crítico": return "#FF4444";
       case "Alerta": return "#FF8800";
       case "Ideal": return "#00CC44";
       default: return "#666";
     }
  };
  
  const getStatusBorderStyle = (status: "Crítico" | "Alerta" | "Ideal"): object => {
    switch (status) {
      case 'Crítico': return { borderLeftColor: '#DC5F5F' };
      case 'Alerta': return { borderLeftColor: '#FBBF24' };
      default: return { borderLeftColor: '#10B981' };
    }
  }

  const MenuItem = ({ icon, title, onPress }: { icon: string; title: string; onPress: () => void; }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuIconContainer}>
        <Ionicons name={icon as any} size={24} color="#666" />
      </View>
      <Text style={styles.menuText}>{title}</Text>
    </TouchableOpacity>
  );

  const BloodTypeCard = ({ item }: { item: BloodStock }) => (
    <View style={[styles.bloodCard, getStatusBorderStyle(item.status)]}>
      <View style={styles.bloodDropContainer}>
        <Ionicons
          name="water"
          size={20}
          color={getStatusColor(item.status)}
          style={styles.bloodDropIcon}
        />
        <Text style={styles.bloodType}>{item.tipo}</Text>
      </View>
      <View
        style={[
          styles.statusIndicator,
          { backgroundColor: getStatusColor(item.status) },
        ]}
      >
        <Text style={styles.statusText}>{item.status}</Text>
      </View>
    </View>
  );

  // Ecrã Principal
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            colors={["#FF4444"]}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Image
            source={require("@/assets/images/gota_a_gota.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <View style={styles.headerRightContainer}>
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
            <TouchableOpacity style={styles.notificationButton}>
              <Ionicons name="notifications-outline" size={24} color="#333" />
            </TouchableOpacity>
          </View>
        </View>

        {/* --- COMPONENTE DE ALERTA VISUAL (ADICIONADO) --- */}
        {showStockAlert && criticalType && (
          <View style={styles.alertBox}>
            <Text style={styles.alertTitle}>🚨 Atenção Doador {criticalType}!</Text>
            <Text style={styles.alertText}>
              Os estoques do seu tipo sanguíneo estão baixos. A sua doação é muito importante agora!
            </Text>
            {/* O Link do 'expo-router' permite a navegação */}
            <Link href="/(tabs)/doar" asChild>
              <TouchableOpacity>
                <Text style={styles.alertLink}>Agendar Doação</Text>
              </TouchableOpacity>
            </Link>
          </View>
        )}
        {/* ------------------------------------ */}

        {/* Menu Icons */}
        <View style={styles.menuContainer}>
          <MenuItem
            icon="card-outline"
            title="Cartão do Doador"
            onPress={() => Alert.alert("Em desenvolvimento")}
          />
          <MenuItem
            icon="heart-outline"
            title="Controle de Medula"
            onPress={() => Alert.alert("Em desenvolvimento")}
          />
          <MenuItem
            icon="bar-chart-outline"
            title="Histórico"
            onPress={() => Alert.alert("Em desenvolvimento")}
          />
          <MenuItem
            icon="person-outline"
            title="Perfil"
            onPress={() => Alert.alert("Em desenvolvimento")}
          />
          <MenuItem
            icon="help-circle-outline"
            title="FAQ"
            onPress={() => Alert.alert("Em desenvolvimento")}
          />
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
              style={[styles.refreshButton, refreshing && styles.refreshButtonDisabled]}
              onPress={onRefresh}
              disabled={refreshing}
            >
              <Ionicons 
                name="refresh" 
                size={20} 
                color={refreshing ? "#CCC" : "#FF4444"} 
              />
            </TouchableOpacity>
          </View>

          {error && (
            <View style={styles.errorContainer}>
              <Ionicons name="warning-outline" size={16} color="#FF6B35" />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => fetchBloodStock(false)} // Tenta novamente com loading
              >
                <Text style={styles.retryButtonText}>Tentar novamente</Text>
              </TouchableOpacity>
            </View>
          )}

          {!error && (
            <>
              <View style={styles.bloodGrid}>
                {bloodStock.map((item, index) => (
                  <BloodTypeCard key={index} item={item} />
                ))}
              </View>
              
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

        {/* Botão de ações */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: "#FF4444" }]}
            onPress={() => Alert.alert("Em desenvolvimento")}
          >
            <Ionicons name="heart" size={20} color="white" />
            <Text style={styles.actionButtonText}>
              Cadastro de Medula Óssea
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: "#FF4444" }]}
            onPress={() => Alert.alert("Em desenvolvimento")}
          >
            <Ionicons name="calendar" size={20} color="white" />
            <Text style={styles.actionButtonText}>
              Agendar campanha de adoção
            </Text>
          </TouchableOpacity>
        </View>

        {/* Horário do HEMOSE */}
        <View style={styles.hemoseSection}>
          <Text style={styles.sectionTitle}>Funcionamento do HEMOSE</Text>
          <View style={styles.hemoseSchedule}>
            <Text style={styles.hemoseDay}>De Segunda à Sexta</Text>
            <Text style={styles.hemoseHours}>7:30 - 17:00</Text>
            <Text style={styles.hemoseNote}>
              Podendo variar em finais de semana ou feriados
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// O seu StyleSheet original (com as correções de estilo)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
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
    padding: 20,
    borderRadius: 10,
    elevation: 2,
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
    // A animação de rotação pode ser adicionada aqui
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
    justifyContent: "space-between",
  },
  bloodCard: {
    width: "22%",
    aspectRatio: 1,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#DDD",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 8,
    marginBottom: 10,
    backgroundColor: "#FAFAFA",
    borderLeftWidth: 5, // Adicionado para consistência
  },
  bloodDropContainer: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  bloodDropIcon: {
    marginBottom: 2,
  },
  bloodType: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  statusIndicator: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 45,
    alignItems: "center",
  },
  statusText: {
    fontSize: 10,
    color: "white",
    fontWeight: "bold",
  },
  actionButtonsContainer: {
    paddingHorizontal: 15,
    gap: 10,
    marginTop: 5, // Adicionado espaçamento
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
    padding: 20,
    borderRadius: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  hemoseSchedule: {
    alignItems: "center",
  },
  hemoseDay: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  hemoseHours: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FF4444",
    marginVertical: 5,
  },
  hemoseNote: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    marginTop: 5,
  },
  // NOVOS ESTILOS PARA O ALERTA (movidos do ficheiro anterior)
  alertLink: {
    color: '#007AFF',
    fontWeight: 'bold',
    marginTop: 10,
  },
  alertBox: {
    backgroundColor: '#FFFBEB',
    padding: 16,
    borderRadius: 8,
    marginVertical: 16,
    marginHorizontal: 24,
    borderLeftWidth: 5,
    borderLeftColor: '#FBBF24',
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  alertTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#D97706',
    marginBottom: 5,
  },
  alertText: {
    fontSize: 14,
    color: '#B45309',
  },
});

