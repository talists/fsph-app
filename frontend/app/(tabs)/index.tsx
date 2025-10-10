import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface BloodStock {
  tipo: string;
  nivel: string;
  status: "Crítico" | "Alerta" | "Ideal";
}

export default function HomeScreen() {
  const [bloodStock, setBloodStock] = useState<BloodStock[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBloodStock();
  }, []);

  const fetchBloodStock = async () => {
    try {
      const response = await fetch(
        "https://api.fsph.se.gov.br/apiinterface/estoque"
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Dados da API:", data);

      let stockData: BloodStock[] = [];

      // Tratar diferentes formatos possíveis da API
      if (Array.isArray(data)) {
        // Se for um array
        stockData = data.map((item: any) => ({
          tipo: item.tipo || item.bloodType || item.type || "N/A",
          nivel: String(
            item.nivel || item.level || item.quantidade || item.qty || "0"
          ),
          status: getStatusFromLevel(
            String(
              item.nivel || item.level || item.quantidade || item.qty || "0"
            )
          ),
        }));
      } else if (typeof data === "object" && data !== null) {
        // Se for um objeto com propriedades
        stockData = Object.entries(data).map(
          ([bloodType, info]: [string, any]) => {
            let nivel = "0";

            if (typeof info === "object" && info !== null) {
              nivel = String(
                info.nivel || info.level || info.quantidade || info.qty || "0"
              );
            } else if (typeof info === "string" || typeof info === "number") {
              nivel = String(info);
            }

            return {
              tipo: bloodType,
              nivel: nivel,
              status: getStatusFromLevel(nivel),
            };
          }
        );
      }

      // Se não conseguiu processar ou está vazio, usar dados de exemplo
      if (stockData.length === 0) {
        stockData = [
          { tipo: "O-", nivel: "5", status: "Crítico" },
          { tipo: "A+", nivel: "15", status: "Alerta" },
          { tipo: "O+", nivel: "25", status: "Ideal" },
          { tipo: "B+", nivel: "30", status: "Ideal" },
          { tipo: "A-", nivel: "8", status: "Crítico" },
          { tipo: "B-", nivel: "12", status: "Alerta" },
          { tipo: "AB+", nivel: "18", status: "Ideal" },
          { tipo: "AB-", nivel: "6", status: "Crítico" },
        ];
      }

      setBloodStock(stockData);
    } catch (error) {
      console.error("Erro ao buscar estoque de sangue:", error);
      // Dados de exemplo em caso de erro
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
    } finally {
      setLoading(false);
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

  const BloodTypeCard = ({ item }: { item: BloodStock }) => (
    <View style={styles.bloodCard}>
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
          <TouchableOpacity style={styles.notificationIcon}>
            <Ionicons name="notifications-outline" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Menu Icons */}
        <View style={styles.menuContainer}>
          <MenuItem
            icon="card-outline"
            title="Cartão do Doador"
            onPress={() =>
              Alert.alert("Em desenvolvimento", "Funcionalidade em breve!")
            }
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
            onPress={() =>
              Alert.alert("Em desenvolvimento", "Funcionalidade em breve!")
            }
          />
          <MenuItem
            icon="person-outline"
            title="Perfil"
            onPress={() =>
              Alert.alert("Em desenvolvimento", "Funcionalidade em breve!")
            }
          />
          <MenuItem
            icon="help-circle-outline"
            title="FAQ"
            onPress={() =>
              Alert.alert("Em desenvolvimento", "Funcionalidade em breve!")
            }
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
            <Text style={styles.sectionTitle}>Estoque de Sangue</Text>
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={() => {
                setLoading(true);
                fetchBloodStock();
              }}
            >
              <Ionicons name="refresh" size={20} color="#FF4444" />
            </TouchableOpacity>
          </View>

          {loading ? (
            <Text style={styles.loadingText}>Carregando estoque...</Text>
          ) : (
            <View style={styles.bloodGrid}>
              {bloodStock.map((item, index) => (
                <BloodTypeCard key={index} item={item} />
              ))}
            </View>
          )}
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

        {/* Horário do HEMOSE */}
        <View style={styles.hemoseSection}>
          <Text style={styles.sectionTitle}>Funcionamento do HEMOSE</Text>
          <View style={styles.hemoseSchedule}>
            <Text style={styles.hemoseDay}>De Segunda</Text>
            <Text style={styles.hemoseDay}>à Sexta</Text>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: "#E8E8E8",
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  logo: {
    height: 40,
    flex: 1,
    marginRight: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  headerSubtitle: {
    fontSize: 18,
    color: "#666",
    marginLeft: -50,
  },
  notificationIcon: {
    padding: 5,
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
  refreshButton: {
    padding: 5,
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
});
