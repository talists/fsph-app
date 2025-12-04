import React, { useRef, useState } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ViewShot from "react-native-view-shot";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system";
import DonorCard, { DonorCardProps } from "./DonorCard";

interface DonorCardModalProps extends DonorCardProps {
  visible: boolean;
  onClose: () => void;
}

export default function DonorCardModal({
  visible,
  onClose,
  ...cardProps
}: DonorCardModalProps) {
  const viewShotRef = useRef<ViewShot>(null);
  const [isRotated, setIsRotated] = useState(false); // “Virar” no modo retrato
  const { width, height } = useWindowDimensions();
  const isDeviceLandscape = width > height;

  const toggleRotate = () => setIsRotated((prev) => !prev);

  const captureCard = async (): Promise<string | null> => {
    try {
      if (viewShotRef.current) {
        const uri = await (viewShotRef.current as any).capture();
        return uri;
      }
    } catch (error) {
      console.error("Erro ao capturar cartão:", error);
      Alert.alert("Erro", "Não foi possível capturar o cartão");
    }
    return null;
  };

  const downloadCard = async () => {
    try {
      const uri = await captureCard();
      if (!uri) {
        Alert.alert("Erro", "Não foi possível capturar o cartão");
        return;
      }

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: "image/png",
          dialogTitle: "Salvar Cartão do Doador",
        });
        Alert.alert("Sucesso! 🎉", "Cartão disponível para download!");
      } else {
        const fileName = `cartao_doador_${cardProps.id || "hemose"}_${Date.now()}.png`;
        const fileUri = `${(FileSystem as any).documentDirectory}${fileName}`;

        await FileSystem.copyAsync({
          from: uri,
          to: fileUri,
        });

        Alert.alert("Sucesso!", `Cartão salvo em: Documentos/${fileName}`);
      }
    } catch (error) {
      console.error("Erro ao baixar cartão:", error);
      Alert.alert("Erro", "Não foi possível salvar o cartão. Tente novamente.");
    }
  };

  const printCard = async () => {
    try {
      const uri = await captureCard();
      if (!uri) return;

      await Print.printAsync({
        uri,
        printerUrl: undefined,
      });
    } catch (error) {
      console.error("Erro ao imprimir cartão:", error);
      Alert.alert("Erro", "Não foi possível imprimir o cartão");
    }
  };

  const shareCardAsPDF = async () => {
    try {
      const uri = await captureCard();
      if (!uri) {
        Alert.alert("Erro", "Não foi possível capturar o cartão");
        return;
      }

      const base64Image = await FileSystem.readAsStringAsync(uri, {
        encoding: "base64" as any,
      });

      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <body style="display:flex;justify-content:center;align-items:center;height:100vh;padding:40px;background:#f8f9fa;">
            <img src="data:image/png;base64,${base64Image}" style="max-width:600px;width:100%;border-radius:16px;" />
          </body>
        </html>
      `;

      const pdfResult = await Print.printToFileAsync({
        html: htmlContent,
        base64: false,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(pdfResult.uri, {
          mimeType: "application/pdf",
          dialogTitle: "Compartilhar Cartão do Doador",
        });
      } else {
        Alert.alert("Sucesso!", "PDF gerado com sucesso!");
      }
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      Alert.alert("Erro", "Não foi possível gerar o PDF. Tente novamente.");
    }
  };

  // ================================================================
  // ====================== ÁREA DO CARTÃO ==========================
  // ================================================================
  const renderCardArea = (deviceIsLandscape: boolean) => {
    // “layout paisagem”: usado tanto quando o aparelho está deitado
    // quanto quando a pessoa clica em Virar no modo retrato
    const landscapeLayout = deviceIsLandscape || isRotated;

    let fixedSize: { width: number; height: number } | undefined;
    let applyRotation = false;

    const ratio = 1.6;

    if (deviceIsLandscape) {
      // aparelho deitado – cartão grande, sem girar
      const maxWidth = width * 0.8;
      const maxHeight = height * 0.8;
      const widthByHeight = maxHeight * ratio;
      const cardWidth = Math.min(maxWidth, widthByHeight);
      const cardHeight = cardWidth / ratio;
      fixedSize = { width: cardWidth, height: cardHeight };
      applyRotation = false;
    } else {
      // aparelho em pé
      if (isRotated) {
        // queremos MESMO tamanho do modo paisagem,
        // mas girado 90° dentro da tela em pé
        const longSide = height; // em pé, o lado mais longo é a altura
        const shortSide = width;

        const maxWidth = longSide * 0.8;   // lado comprido do cartão
        const maxHeight = shortSide * 0.8; // lado curto do cartão

        const widthByHeight = maxHeight * ratio;
        const cardWidth = Math.min(maxWidth, widthByHeight);
        const cardHeight = cardWidth / ratio;

        fixedSize = { width: cardWidth, height: cardHeight };
        applyRotation = true; // gira 90°
      } else {
        // retrato normal – usa o layout padrão do DonorCard
        fixedSize = undefined;
        applyRotation = false;
      }
    }

    return (
      <View style={styles.cardWrapper}>
        <ViewShot ref={viewShotRef} style={styles.viewShot}>
          <View
            style={[
              styles.cardContainer,
              applyRotation && styles.cardContainerRotated,
            ]}
          >
            <DonorCard
              {...cardProps}
              fixedSize={fixedSize}
              isLandscape={landscapeLayout} // fontes maiores e conteúdo centralizado
            />
          </View>
        </ViewShot>

        {/* Botão Virar só faz sentido no modo retrato */}
        {!deviceIsLandscape && (
          <TouchableOpacity style={styles.rotateButton} onPress={toggleRotate}>
            <Ionicons
              name={
                isRotated ? "phone-portrait-outline" : "phone-landscape-outline"
              }
              size={20}
              color="#FFFFFF"
            />
            <Text style={styles.rotateButtonText}>
              {isRotated ? "Voltar" : "Virar"}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderTopButtons = () => (
    <View style={styles.actionButtonsRow}>
      <TouchableOpacity style={styles.actionButton} onPress={downloadCard}>
        <Ionicons name="download-outline" size={16} color="#9EBFBB" />
        <Text style={styles.actionButtonText}>Baixar</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.actionButton} onPress={printCard}>
        <Ionicons name="print-outline" size={16} color="#9EBFBB" />
        <Text style={styles.actionButtonText}>Imprimir</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.actionButton} onPress={shareCardAsPDF}>
        <Ionicons name="share-outline" size={16} color="#9EBFBB" />
        <Text style={styles.actionButtonText}>PDF</Text>
      </TouchableOpacity>
    </View>
  );

  const renderSideButtons = () => (
    <View className="landscapeSidebar" style={styles.landscapeSidebar}>
      <TouchableOpacity style={styles.sidebarIconButton} onPress={downloadCard}>
        <Ionicons name="download-outline" size={22} color="#9EBFBB" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.sidebarIconButton} onPress={printCard}>
        <Ionicons name="print-outline" size={22} color="#9EBFBB" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.sidebarIconButton} onPress={shareCardAsPDF}>
        <Ionicons name="share-outline" size={22} color="#9EBFBB" />
      </TouchableOpacity>
    </View>
  );

  // ============================ LAYOUT =============================
  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: "#0F0F0F" }}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity style={styles.headerButton} onPress={onClose}>
              <Ionicons name="close" size={24} color="#FFFFFF" />
              <Text style={styles.headerButtonText}>Fechar</Text>
            </TouchableOpacity>
          </View>

          {/* Se horizontal → botões na lateral */}
          {isDeviceLandscape ? renderSideButtons() : renderTopButtons()}

          {/* Conteúdo principal */}
          {isDeviceLandscape ? (
            <View style={styles.landscapeContent}>
              <ScrollView
                contentContainerStyle={styles.scrollContainer}
                showsVerticalScrollIndicator={false}
              >
                {renderCardArea(true)}
              </ScrollView>
            </View>
          ) : (
            <ScrollView
              contentContainerStyle={styles.scrollContainer}
              showsVerticalScrollIndicator={false}
            >
              {renderCardArea(false)}
            </ScrollView>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: "#0F0F0F",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: "rgba(26, 26, 26, 0.9)",
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  headerButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },

  /* BOTÕES EM CIMA */
  actionButtonsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 12,
    backgroundColor: "rgba(26, 26, 26, 0.8)",
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(158, 191, 187, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#9EBFBB",
  },
  actionButtonText: {
    color: "#9EBFBB",
    fontSize: 11,
    fontWeight: "600",
    marginLeft: 4,
  },

  /* ÁREA DO CARTÃO */
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 10,
  },
  cardWrapper: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 10,
  },
  viewShot: {
    borderRadius: 12,
    elevation: 8,
  },
  cardContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  cardContainerRotated: {
    transform: [{ rotate: "90deg" }],
  },

  /* Botão de virar */
  rotateButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#3D4F4C",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 10,
  },
  rotateButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    marginLeft: 6,
    fontWeight: "600",
  },

  /* MODO PAISAGEM */
  landscapeContent: {
    flex: 1,
    flexDirection: "row",
  },
  landscapeSidebar: {
    position: "absolute",
    right: 0,
    top: 50,
    bottom: 0,
    width: 70,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(26,26,26,0.4)",
    paddingVertical: 20,
  },
  sidebarIconButton: {
    padding: 10,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: "rgba(158,191,187,0.5)",
    backgroundColor: "rgba(10,10,10,0.6)",
    marginVertical: 10,
  },
});
