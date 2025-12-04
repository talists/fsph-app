import React, { memo } from "react";
import { View, Text, Image, StyleSheet, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export interface DonorCardProps {
  id?: string;
  credential?: string; // se não vier, usa id
  name?: string;
  bloodType?: string;
  profileImage?: string;
  lastDonation?: string;
  donationCount?: number;
  cpf?: string;
  rg?: string;
  birthDate?: string;
  gender?: "M" | "F";
  fullscreen?: boolean;
  onPressShare?: () => void;
  fixedSize?: { width: number; height: number };
  // AGORA vamos usar esse isLandscape para deixar tudo maior/centralizado
  isLandscape?: boolean;
}

// Proporção de cartão (largura / altura)
const CARD_RATIO = 1.6;

const fmtDate = (v?: string) =>
  v
    ? new Date(v).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
    : "—";

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
  cpf,
  birthDate,
  gender,
  fixedSize,
  isLandscape,
}: DonorCardProps) {
  // ===== TAMANHO DO CARTÃO (RESPONSIVO) =====
  let cardStyleSize: { width: number; height: number };

  if (fixedSize) {
    cardStyleSize = {
      width: fixedSize.width,
      height: fixedSize.height,
    };
  } else {
    const { width } = Dimensions.get("window");
    const cardWidth = Math.min(width * 0.9, 380);
    const cardHeight = cardWidth / CARD_RATIO;

    cardStyleSize = {
      width: cardWidth,
      height: cardHeight,
    };
  }

  const credText = (credential || id || "0000000-00000")
    .replace(/(\d{7})(\d{5})/, "$1 - $2")
    .trim();

  const isBig = !!isLandscape; // quando estiver no “modo paisagem” lógico

  // ============ ÚNICO LAYOUT (cartão físico horizontal) ============
  return (
    <View style={[styles.card, cardStyleSize]}>
      {/* HEADER */}
      <View style={[styles.header, isBig && styles.headerLandscape]}>
        <Text style={[styles.cardTitle, isBig && styles.cardTitleLg]}>
          CARTÃO DO DOADOR DE SANGUE
        </Text>
        <Text style={[styles.institution, isBig && styles.institutionLg]}>
          HEMOSE - Sergipe
        </Text>
      </View>

      {/* MAIN CONTENT */}
      <View
        style={[
          styles.mainContent,
          isBig && styles.mainContentLandscape, // centraliza mais
        ]}
      >
        {/* AVATAR */}
        <View style={styles.avatarSection}>
          <Image
            source={{ uri: profileImage || "https://via.placeholder.com/120" }}
            style={[styles.avatar, isBig && styles.avatarLg]}
          />
        </View>

        {/* INFORMAÇÕES */}
        <View style={styles.infoSection}>
          {/* Nome Completo */}
          <View style={styles.fieldContainer}>
            <Text style={[styles.fieldLabel, isBig && styles.fieldLabelLg]}>
              Nome Completo
            </Text>
            <Text
              style={[styles.fieldValue, isBig && styles.fieldValueLg]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {name || "NOME DO DOADOR"}
            </Text>
          </View>

          {/* Data de Nascimento */}
          <View style={styles.fieldContainer}>
            <Text style={[styles.fieldLabel, isBig && styles.fieldLabelLg]}>
              Data de Nascimento
            </Text>
            <Text style={[styles.fieldValue, isBig && styles.fieldValueLg]}>
              {fmtDate(birthDate)}
            </Text>
          </View>

          {/* Grid inferior: Sexo, Tipo Sanguíneo */}
          <View style={styles.bottomGrid}>
            <View style={styles.gridItem}>
              <Text style={[styles.fieldLabel, isBig && styles.fieldLabelLg]}>
                Sexo
              </Text>
              <Text style={[styles.fieldValue, isBig && styles.fieldValueLg]}>
                {gender === "M"
                  ? "Masculino"
                  : gender === "F"
                    ? "Feminino"
                    : "—"}
              </Text>
            </View>
            <View style={[styles.gridItem, { marginRight: 0 }]}>
              <Text style={[styles.fieldLabel, isBig && styles.fieldLabelLg]}>
                Tipo Sanguíneo
              </Text>
              <Text style={[styles.bloodType, isBig && styles.bloodTypeLg]}>
                {bloodType || "AB+"}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* FOOTER */}
      <View style={styles.footer}>
        {/* Credencial – centralizada */}
        <View style={styles.footerItemLeft}>
          <Text
            style={[
              styles.footerLabelCentered,
              isBig && styles.footerLabelLg,
            ]}
          >
            Credencial
          </Text>
          <Text
            style={[
              styles.footerValueCentered,
              isBig && styles.footerValueLg,
            ]}
          >
            {credText}
          </Text>
        </View>

        {/* CPF – alinhado à direita */}
        <View style={styles.footerItemRight}>
          <Text
            style={[styles.footerLabelRight, isBig && styles.footerLabelLg]}
          >
            CPF
          </Text>
          <Text
            style={[styles.footerValueRight, isBig && styles.footerValueLg]}
            numberOfLines={1}
            ellipsizeMode="head"
          >
            {maskCPF(cpf)}
          </Text>
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
    paddingVertical: 8,
    paddingHorizontal: 14,
    alignItems: "center",
  },
  headerLandscape: {
    paddingVertical: 10,
  },
  cardTitle: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.8,
    textAlign: "center",
  },
  cardTitleLg: {
    fontSize: 14,
    letterSpacing: 1,
  },
  institution: {
    color: "#C9D8D5",
    fontSize: 9,
    fontWeight: "600",
    marginTop: 2,
    textAlign: "center",
  },
  institutionLg: {
    fontSize: 10,
  },

  /* MAIN CONTENT */
  mainContent: {
    flex: 1,
    backgroundColor: "#2A3C39",
    paddingHorizontal: 14,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  mainContentLandscape: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    alignItems: "center",
  },

  /* AVATAR */
  avatarSection: {
    marginRight: 14,
    alignItems: "center",
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
  },
  avatarLg: {
    width: 90,
    height: 90,
  },

  /* INFORMAÇÕES */
  infoSection: {
    flex: 1,
  },
  fieldContainer: {
    marginBottom: 8,
  },
  fieldLabel: {
    color: "#C9D8D5",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.4,
    marginBottom: 3,
  },
  fieldLabelLg: {
    fontSize: 10,
  },
  fieldValue: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 16,
  },
  fieldValueLg: {
    fontSize: 14.5,
    lineHeight: 18,
  },

  /* GRID INFERIOR */
  bottomGrid: {
    flexDirection: "row",
    marginTop: 2,
  },
  gridItem: {
    flex: 1,
    marginRight: 10,
  },
  bloodType: {
    color: "#E73645",
    fontSize: 15,
    fontWeight: "800",
  },
  bloodTypeLg: {
    fontSize: 18,
  },

  /* FOOTER */
  footer: {
    backgroundColor: "#3D4F4C",
    paddingVertical: 8,
    paddingHorizontal: 14,
    flexDirection: "row",
  },
  footerItemLeft: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  footerLabelCentered: {
    color: "#C9D8D5",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.4,
    marginBottom: 2,
    textAlign: "center",
  },
  footerValueCentered: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8,
    textAlign: "center",
  },
  footerItemRight: {
    flex: 1,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  footerLabelRight: {
    color: "#C9D8D5",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.4,
    marginBottom: 2,
    textAlign: "right",
  },
  footerValueRight: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8,
    textAlign: "right",
  },
  footerLabelLg: {
    fontSize: 10,
  },
  footerValueLg: {
    fontSize: 12,
  },

  /* DECORAÇÃO */
  decoration: {
    position: "absolute",
    bottom: 10,
    right: 10,
    opacity: 0.3,
  },
});
