import React, { memo } from "react";
import { View, Text, Image, StyleSheet, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export interface DonorCardProps {
  id?: string;
  credential?: string; // NOVO: se não vier, usa id
  name?: string;
  bloodType?: string;
  profileImage?: string;
  lastDonation?: string;
  donationCount?: number;
  cpf?: string;
  rg?: string;
  birthDate?: string;
  gender?: 'M' | 'F'; // ADICIONADO: campo de gênero
  fullscreen?: boolean; // mantido (não será usado p/ medir quando houver fixedSize)
  onPressShare?: () => void;
  fixedSize?: { width: number; height: number }; // NOVO
  isLandscape?: boolean; // NOVO: para modo paisagem
}

const A_RATIO = 1000 / 600; // ~1.6667

const fmtDate = (v?: string) =>
  v ? new Date(v).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—";

const maskCPF = (v?: string) => {
  if (!v) return "000.000.000-00";
  const d = v.replace(/\D/g, "").padEnd(11, "0").slice(0, 11);
  return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
};

function DonorCardBase({
  id,
  credential,
  name,
  bloodType,
  profileImage,
  lastDonation,
  donationCount,
  cpf,
  rg,
  birthDate,
  gender,
  fixedSize,
  isLandscape = false,
}: DonorCardProps) {
  // medidas controladas EXTERNAMENTE quando fixedSize vier
  let cardStyleSize: any = { aspectRatio: A_RATIO, width: "100%" };
  if (fixedSize) {
    cardStyleSize = { width: fixedSize.width, height: fixedSize.height };
  } else {
    // fallback proporcional à tela (sem depender do modal)
    const { width } = Dimensions.get("window");
    const w = Math.min(width * 0.92, 380);
    cardStyleSize = { width: w, aspectRatio: A_RATIO };
  }

  const credText = (credential || id || "0000000").replace(/(.{4})/g, "$1 ").trim();

  // Layout de cartão paisagem (horizontal como cartão de crédito)
  if (isLandscape) {
    return (
      <View style={[styles.card, cardStyleSize, styles.landscapeCard]}>
        {/* LADO ESQUERDO - Avatar e Info Principal */}
        <View style={styles.landscapeLeft}>
          <View style={styles.landscapeHeader}>
            <Text style={styles.landscapeTitle}>CARTÃO DO DOADOR</Text>
            <Text style={styles.landscapeSubtitle}>HEMOSE - Sergipe</Text>
          </View>

          <View style={styles.landscapeAvatarSection}>
            <Image
              source={{ uri: profileImage || "https://via.placeholder.com/120" }}
              style={styles.landscapeAvatar}
            />
            <View style={styles.landscapeNameSection}>
              <Text style={styles.landscapeName} numberOfLines={2}>
                {name || "NOME DO DOADOR"}
              </Text>
              <Text style={styles.landscapeBloodType}>{bloodType || "AB+"}</Text>
            </View>
          </View>
        </View>

        {/* LADO DIREITO - Informações Detalhadas */}
        <View style={styles.landscapeRight}>
          <View style={styles.landscapeInfoGrid}>
            <View style={styles.landscapeInfoItem}>
              <Text style={styles.landscapeLabel}>Data de Nascimento</Text>
              <Text style={styles.landscapeValue}>{fmtDate(birthDate)}</Text>
            </View>
            <View style={styles.landscapeInfoItem}>
              <Text style={styles.landscapeLabel}>Sexo</Text>
              <Text style={styles.landscapeValue}>
                {gender === 'M' ? 'Masculino' : gender === 'F' ? 'Feminino' : '—'}
              </Text>
            </View>
            <View style={styles.landscapeInfoItem}>
              <Text style={styles.landscapeLabel}>Credencial</Text>
              <Text style={styles.landscapeValue}>{credText}</Text>
            </View>
            <View style={styles.landscapeInfoItem}>
              <Text style={styles.landscapeLabel}>CPF</Text>
              <Text style={styles.landscapeValue}>{maskCPF(cpf)}</Text>
            </View>
          </View>

          {/* Decoração */}
          <View style={styles.landscapeDecoration}>
            <Ionicons name="water" size={16} color="rgba(255,255,255,0.1)" />
          </View>
        </View>
      </View>
    );
  }

  // Layout retrato padrão

  return (
    <View style={[styles.card, cardStyleSize]}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.cardTitle}>CARTÃO DO DOADOR DE SANGUE</Text>
        <Text style={styles.institution}>HEMOSE - Sergipe</Text>
      </View>

      {/* MAIN CONTENT */}
      <View style={styles.mainContent}>
        {/* AVATAR */}
        <View style={styles.avatarSection}>
          <Image
            source={{ uri: profileImage || "https://via.placeholder.com/120" }}
            style={styles.avatar}
          />
        </View>

        {/* INFORMAÇÕES */}
        <View style={styles.infoSection}>
          {/* Nome Completo */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Nome Completo</Text>
            <Text style={styles.fieldValue} numberOfLines={2}>
              {name || "NOME DO DOADOR"}
            </Text>
          </View>

          {/* Data de Nascimento */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Data de Nascimento</Text>
            <Text style={styles.fieldValue}>{fmtDate(birthDate)}</Text>
          </View>

          {/* Grid inferior: Sexo, Tipo Sanguíneo */}
          <View style={styles.bottomGrid}>
            <View style={styles.gridItem}>
              <Text style={styles.fieldLabel}>Sexo</Text>
              <Text style={styles.fieldValue}>
                {gender === 'M' ? 'Masculino' : gender === 'F' ? 'Feminino' : '—'}
              </Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.fieldLabel}>Tipo Sanguíneo</Text>
              <Text style={styles.bloodType}>{bloodType || "AB+"}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* FOOTER */}
      <View style={styles.footer}>
        <View style={styles.footerItem}>
          <Text style={styles.footerLabel}>Credencial</Text>
          <Text style={styles.footerValue}>{credText}</Text>
        </View>
        <View style={styles.footerItem}>
          <Text style={styles.footerLabel}>CPF</Text>
          <Text style={styles.footerValue}>{maskCPF(cpf)}</Text>
        </View>
      </View>

      {/* DECORAÇÃO */}
      <View style={styles.decoration}>
        <Ionicons name="water" size={18} color="rgba(255,255,255,0.1)" />
      </View>
    </View>
  );
}

export default memo(DonorCardBase);

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#283A37",
    borderRadius: 22,
    overflow: "hidden",
    flexDirection: "column",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },

  /* HEADER */
  header: {
    backgroundColor: "#3D4F4C",
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  cardTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 1,
    textAlign: "center",
  },
  institution: {
    color: "#C9D8D5",
    fontSize: 10,
    fontWeight: "600",
    marginTop: 2,
    textAlign: "center",
  },

  /* MAIN CONTENT */
  mainContent: {
    flex: 1,
    backgroundColor: "#2A3C39",
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
  },

  /* AVATAR */
  avatarSection: {
    marginRight: 20,
    alignItems: "center",
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
  },

  /* INFORMAÇÕES */
  infoSection: {
    flex: 1,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    color: "#C9D8D5",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  fieldValue: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 18,
  },

  /* GRID INFERIOR */
  bottomGrid: {
    flexDirection: "row",
    marginTop: 4,
  },
  gridItem: {
    flex: 1,
    marginRight: 16,
  },
  bloodType: {
    color: "#E73645",
    fontSize: 16,
    fontWeight: "800",
  },

  /* FOOTER */
  footer: {
    backgroundColor: "#3D4F4C",
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerItem: {
    alignItems: "center",
  },
  footerLabel: {
    color: "#C9D8D5",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  footerValue: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
  },

  /* DECORAÇÃO */
  decoration: {
    position: "absolute",
    bottom: 20,
    right: 20,
    opacity: 0.3,
  },

  /* ESTILOS PARA MODO PAISAGEM (cartão horizontal) */
  landscapeCard: {
    flexDirection: "row",
    aspectRatio: 1.586, // Proporção de cartão de crédito
  },
  landscapeLeft: {
    flex: 1,
    backgroundColor: "#2A3C39",
    padding: 20,
    justifyContent: "space-between",
  },
  landscapeRight: {
    flex: 1,
    backgroundColor: "#3D4F4C",
    padding: 16,
    justifyContent: "space-between",
    position: "relative",
  },
  landscapeHeader: {
    marginBottom: 12,
  },
  landscapeTitle: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
  },
  landscapeSubtitle: {
    color: "#C9D8D5",
    fontSize: 9,
    fontWeight: "600",
    marginTop: 2,
  },
  landscapeAvatarSection: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  landscapeAvatar: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    marginRight: 16,
  },
  landscapeNameSection: {
    flex: 1,
  },
  landscapeName: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 16,
    marginBottom: 4,
  },
  landscapeBloodType: {
    color: "#E73645",
    fontSize: 14,
    fontWeight: "800",
  },
  landscapeInfoGrid: {
    flex: 1,
    justifyContent: "space-around",
  },
  landscapeInfoItem: {
    marginBottom: 8,
  },
  landscapeLabel: {
    color: "#C9D8D5",
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  landscapeValue: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },
  landscapeDecoration: {
    position: "absolute",
    bottom: 12,
    right: 12,
    opacity: 0.2,
  },
});