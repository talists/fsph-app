import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ViewShot from 'react-native-view-shot';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import * as ScreenOrientation from 'expo-screen-orientation';
//import * as MediaLibrary from 'expo-media-library';
import DonorCard from './DonorCard';
import { DonorCardProps } from './DonorCard';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

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
  const [isLandscape, setIsLandscape] = useState(false);
  const [isManualMode, setIsManualMode] = useState(false);
  const [deviceOrientation, setDeviceOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [screenDimensions, setScreenDimensions] = useState(Dimensions.get('window'));

  // Detectar mudanças de orientação usando Dimensions (mais confiável)
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenDimensions(window);
      const isDeviceLandscape = window.width > window.height;
      const newOrientation = isDeviceLandscape ? 'landscape' : 'portrait';

      console.log('Dimensões mudaram:', { width: window.width, height: window.height, isLandscape: isDeviceLandscape });

      setDeviceOrientation(newOrientation);

      // Se não estiver em modo manual, seguir a orientação do dispositivo
      if (!isManualMode) {
        console.log('Atualizando orientação automaticamente:', newOrientation);
        setIsLandscape(isDeviceLandscape);
      }
    });

    // Verificar orientação inicial
    const initialDimensions = Dimensions.get('window');
    const isInitialLandscape = initialDimensions.width > initialDimensions.height;
    console.log('Orientação inicial:', { width: initialDimensions.width, height: initialDimensions.height, isLandscape: isInitialLandscape });

    setDeviceOrientation(isInitialLandscape ? 'landscape' : 'portrait');
    if (!isManualMode) {
      setIsLandscape(isInitialLandscape);
    }

    return () => {
      subscription?.remove();
    };
  }, [isManualMode]);

  // Backup usando ScreenOrientation (como fallback)
  useEffect(() => {
    const subscription = ScreenOrientation.addOrientationChangeListener(
      (orientationInfo: any) => {
        console.log('ScreenOrientation mudou:', orientationInfo);
        const isDeviceLandscape =
          orientationInfo.orientationInfo.orientation === ScreenOrientation.Orientation.LANDSCAPE_LEFT ||
          orientationInfo.orientationInfo.orientation === ScreenOrientation.Orientation.LANDSCAPE_RIGHT;

        console.log('ScreenOrientation isLandscape:', isDeviceLandscape);

        // Só atualizar se Dimensions não estiver funcionando
        if (!isManualMode) {
          setIsLandscape(isDeviceLandscape);
        }
      }
    );

    return () => {
      ScreenOrientation.removeOrientationChangeListener(subscription);
    };
  }, [isManualMode]);

  // Função para alternar modo manual
  const toggleManualMode = () => {
    if (isManualMode) {
      // Saindo do modo manual, voltar para orientação do dispositivo
      setIsManualMode(false);
      setIsLandscape(deviceOrientation === 'landscape');
    } else {
      // Entrando no modo manual, alternar orientação
      setIsManualMode(true);
      setIsLandscape(!isLandscape);
    }
  };

  const captureCard = async (): Promise<string | null> => {
    try {
      if (viewShotRef.current) {
        console.log('Capturando cartão...');
        // Usar o método correto de captura
        const uri = await (viewShotRef.current as any).capture();
        console.log('Cartão capturado:', uri);
        return uri;
      }
    } catch (error) {
      console.error('Erro ao capturar cartão:', error);
      Alert.alert('Erro', 'Não foi possível capturar o cartão');
    }
    return null;
  };

  const downloadCard = async () => {
    try {
      console.log('Iniciando download do cartão...');

      const uri = await captureCard();
      if (!uri) {
        Alert.alert('Erro', 'Não foi possível capturar o cartão');
        return;
      }

      // Tentar compartilhar/salvar o arquivo
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: 'Salvar Cartão do Doador',
        });
        Alert.alert('Sucesso! 🎉', 'Cartão disponível para download!');
      } else {
        // Salvar no diretório de documentos como fallback
        const fileName = `cartao_doador_${cardProps.id || 'hemose'}_${Date.now()}.png`;
        const fileUri = `${(FileSystem as any).documentDirectory}${fileName}`;

        await FileSystem.copyAsync({
          from: uri,
          to: fileUri,
        });

        Alert.alert('Sucesso!', `Cartão salvo em: Documentos/${fileName}`);
      }

    } catch (error) {
      console.error('Erro ao baixar cartão:', error);
      Alert.alert('Erro', 'Não foi possível salvar o cartão. Tente novamente.');
    }
  };

  const printCard = async () => {
    try {
      const uri = await captureCard();
      if (!uri) return;

      await Print.printAsync({
        uri,
        printerUrl: undefined, // Permite ao usuário escolher a impressora
      });
    } catch (error) {
      console.error('Erro ao imprimir cartão:', error);
      Alert.alert('Erro', 'Não foi possível imprimir o cartão');
    }
  };

  const shareCardAsPDF = async () => {
    try {
      console.log('Iniciando geração de PDF...');

      const uri = await captureCard();
      if (!uri) {
        Alert.alert('Erro', 'Não foi possível capturar o cartão');
        return;
      }

      // Ler a imagem e converter para base64
      const base64Image = await FileSystem.readAsStringAsync(uri, {
        encoding: 'base64' as any,
      });

      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Cartão do Doador - HEMOSE</title>
            <style>
              body {
                margin: 0;
                padding: 40px 20px;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
                background: #f8f9fa;
              }
              .card-container {
                text-align: center;
                background: white;
                padding: 40px;
                border-radius: 16px;
                box-shadow: 0 8px 32px rgba(0,0,0,0.1);
                max-width: 800px;
              }
              .card-image {
                width: 100%;
                max-width: 600px;
                height: auto;
                border-radius: 16px;
                box-shadow: 0 8px 24px rgba(0,0,0,0.15);
                margin: 20px 0;
              }
              .header {
                margin-bottom: 30px;
              }
              .title {
                color: #283A37;
                font-size: 28px;
                font-weight: 800;
                margin: 0;
                letter-spacing: 0.5px;
              }
              .subtitle {
                color: #495755;
                font-size: 16px;
                margin: 8px 0 0 0;
                font-weight: 500;
              }
              .footer {
                margin-top: 30px;
                padding-top: 20px;
                border-top: 2px solid #9EBFBB;
              }
              .footer-text {
                color: #666;
                font-size: 14px;
                font-weight: 500;
              }
              .date {
                color: #999;
                font-size: 12px;
                margin-top: 10px;
              }
            </style>
          </head>
          <body>
            <div class="card-container">
              <div class="header">
                <h1 class="title">HEMOSE - SERGIPE</h1>
                <p class="subtitle">Cartão do Doador de Sangue</p>
              </div>
              <img src="data:image/png;base64,${base64Image}" class="card-image" alt="Cartão do Doador" />
              <div class="footer">
                <p class="footer-text">Válido em todo território nacional</p>
                <p class="footer-text">Centro de Hemoterapia de Sergipe - HEMOSE</p>
                <p class="date">Gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>
              </div>
            </div>
          </body>
        </html>
      `;

      console.log('Gerando PDF...');
      const pdfResult = await Print.printToFileAsync({
        html: htmlContent,
        base64: false,
      });

      console.log('PDF gerado:', pdfResult.uri);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(pdfResult.uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Compartilhar Cartão do Doador',
        });
        console.log('PDF compartilhado com sucesso');
      } else {
        Alert.alert('Sucesso!', 'PDF gerado com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      Alert.alert('Erro', 'Não foi possível gerar o PDF. Tente novamente.');
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0F0F0F' }}>
        <View style={[styles.modalContainer, isLandscape && styles.landscapeModalContainer]}>
          {/* Header com botão fechar */}
          <View style={styles.modalHeader}>
            <TouchableOpacity style={styles.headerButton} onPress={onClose}>
              <Ionicons name="close" size={24} color="#FFFFFF" />
              <Text style={styles.headerButtonText}>Fechar</Text>
            </TouchableOpacity>
          </View>

          {/* Layout condicional baseado na orientação */}
          {isLandscape ? (
            /* LAYOUT PAISAGEM - Botões na lateral */
            <View style={styles.landscapeContent}>
              {/* Lado esquerdo - Cartão */}
              <View style={styles.landscapeCardSection}>
                {/* Cartão */}
                <View style={styles.landscapeCardWrapper}>
                  <ViewShot ref={viewShotRef} style={styles.viewShot}>
                    <View style={styles.landscapeCardInner}>
                      <DonorCard
                        {...cardProps}
                        isLandscape={isLandscape}
                        fixedSize={
                          { width: Math.min(screenDimensions.height * 0.75, 450), height: Math.min(screenDimensions.height * 0.75, 450) * 0.63 }
                        }
                      />
                    </View>
                  </ViewShot>
                </View>
              </View>

              {/* Lado direito - Botões verticais */}
              <View style={styles.landscapeSidebar}>
                <TouchableOpacity style={styles.sidebarButton} onPress={downloadCard}>
                  <Ionicons name="download-outline" size={20} color="#9EBFBB" />
                  <Text style={styles.sidebarButtonText}>Baixar</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.sidebarButton} onPress={printCard}>
                  <Ionicons name="print-outline" size={20} color="#9EBFBB" />
                  <Text style={styles.sidebarButtonText}>Imprimir</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.sidebarButton} onPress={shareCardAsPDF}>
                  <Ionicons name="share-outline" size={20} color="#9EBFBB" />
                  <Text style={styles.sidebarButtonText}>PDF</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.sidebarButton,
                    (isLandscape || isManualMode) && styles.activeSidebarButton
                  ]}
                  onPress={toggleManualMode}
                >
                  <Ionicons
                    name={isManualMode ? "lock-closed-outline" : "phone-landscape-outline"}
                    size={20}
                    color={(isLandscape || isManualMode) ? "#FFFFFF" : "#9EBFBB"}
                  />
                  <Text style={[
                    styles.sidebarButtonText,
                    (isLandscape || isManualMode) && styles.activeSidebarButtonText
                  ]}>
                    {isManualMode ? "Manual" : "Auto"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <>
              {/* Layout retrato original continua aqui... */}
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

                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    (isLandscape || isManualMode) && styles.activeButton
                  ]}
                  onPress={toggleManualMode}
                >
                  <Ionicons
                    name={
                      isManualMode
                        ? "lock-closed-outline"
                        : (isLandscape ? "phone-landscape-outline" : "phone-portrait-outline")
                    }
                    size={16}
                    color={(isLandscape || isManualMode) ? "#FFFFFF" : "#9EBFBB"}
                  />
                  <Text style={[
                    styles.actionButtonText,
                    (isLandscape || isManualMode) && styles.activeButtonText
                  ]}>
                    {isManualMode ? "Manual" : (isLandscape ? "Auto" : "Auto")}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Indicador de modo de orientação */}
              <View style={styles.orientationIndicator}>
                <Ionicons
                  name={isLandscape ? "phone-landscape-outline" : "phone-portrait-outline"}
                  size={14}
                  color="#9EBFBB"
                />
                <Text style={styles.orientationText}>
                  {isManualMode
                    ? `� Modo Manual - ${isLandscape ? 'Paisagem' : 'Retrato'}`
                    : `🔄 Auto: ${deviceOrientation} (${screenDimensions.width}x${screenDimensions.height}) - ${isLandscape ? 'Paisagem' : 'Retrato'}`
                  }
                </Text>
              </View>

              {/* Cartão com orientação dinâmica */}
              <ScrollView
                contentContainerStyle={styles.scrollContainer}
                showsVerticalScrollIndicator={false}
                bounces={false}
              >
                <View style={[styles.cardWrapper, isLandscape && styles.landscapeWrapper]}>
                  <ViewShot ref={viewShotRef} style={styles.viewShot}>
                    <View style={[styles.cardContainer, isLandscape && styles.landscapeContainer]}>
                      <DonorCard
                        {...cardProps}
                        isLandscape={isLandscape}
                        fixedSize={
                          isLandscape
                            ? { width: Math.min(screenWidth * 0.95, 450), height: Math.min(screenWidth * 0.95, 450) * 0.63 }
                            : (() => {
                              // Calcular espaço disponível considerando header, botões e instruções
                              const headerHeight = 60; // altura aproximada do header
                              const buttonsHeight = 80; // altura dos botões de ação
                              const indicatorHeight = 40; // altura do indicador
                              const instructionsHeight = 50; // altura das instruções
                              const margins = 40; // margens diversas

                              const availableHeight = screenHeight - headerHeight - buttonsHeight - indicatorHeight - instructionsHeight - margins;
                              const maxWidth = Math.min(screenWidth * 0.85, 350);
                              const maxHeightByWidth = maxWidth * 1.5; // proporção mais conservadora
                              const maxHeightByScreen = availableHeight * 0.9;

                              const finalHeight = Math.min(maxHeightByWidth, maxHeightByScreen);
                              const finalWidth = Math.min(maxWidth, finalHeight / 1.5);

                              return {
                                width: finalWidth,
                                height: finalHeight
                              };
                            })()
                        }
                      />
                    </View>
                  </ViewShot>
                </View>

                {/* Instruções */}
                <View style={styles.instructions}>
                  <Text style={styles.instructionText}>
                    🎴 Cartão do Doador - HEMOSE Sergipe
                  </Text>
                </View>
              </ScrollView>
            </>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#0F0F0F',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: 'rgba(26, 26, 26, 0.9)',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'rgba(26, 26, 26, 0.8)',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(158, 191, 187, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#9EBFBB',
    flex: 1,
    justifyContent: 'center',
    marginHorizontal: 2,
    minWidth: 70,
  },
  actionButtonText: {
    color: '#9EBFBB',
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
    textAlign: 'center',
  },
  activeButton: {
    backgroundColor: '#3D4F4C',
    borderColor: '#9EBFBB',
  },
  activeButtonText: {
    color: '#FFFFFF',
  },
  cardWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  landscapeWrapper: {
    transform: [{ rotate: '0deg' }],
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewShot: {
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  cardContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
  },
  landscapeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '0deg' }],
  },
  landscapeCardContainer: {
    // Modo paisagem - melhor dimensionamento e rotação
    width: Math.min(screenHeight * 0.9, 650),
    height: Math.min(screenHeight * 0.9, 650) * 0.6,
    transform: [{ rotate: '90deg' }],
    maxWidth: screenHeight * 0.85,
    maxHeight: screenWidth * 0.8,
  },
  portraitCardContainer: {
    // Modo retrato - proporção vertical otimizada
    width: Math.min(screenWidth * 0.92, 400),
    height: Math.min(screenWidth * 0.92, 400) * 1.35,
    minWidth: Math.min(screenWidth * 0.88, 350),
    minHeight: Math.min(screenWidth * 0.88, 350) * 1.35,
    maxWidth: Math.min(screenWidth * 0.95, 450),
    maxHeight: screenHeight * 0.82,
  },
  orientationIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: 'rgba(26, 26, 26, 0.5)',
    borderRadius: 20,
    marginHorizontal: 20,
    marginBottom: 10,
  },
  orientationText: {
    color: '#9EBFBB',
    fontSize: 11,
    fontWeight: '500',
    marginLeft: 6,
    textAlign: 'center',
    flex: 1,
  },
  instructions: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: 'rgba(26, 26, 26, 0.7)',
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  instructionText: {
    color: '#9EBFBB',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    opacity: 0.8,
  },

  /* ESTILOS PARA LAYOUT PAISAGEM */
  landscapeModalContainer: {
    flexDirection: 'column',
  },
  landscapeContent: {
    flex: 1,
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  landscapeCardSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingRight: 10,
  },
  landscapeCardWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  landscapeCardInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  landscapeSidebar: {
    width: 120,
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: 'rgba(26, 26, 26, 0.3)',
    borderRadius: 12,
    marginLeft: 10,
  },
  sidebarButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(158, 191, 187, 0.3)',
    backgroundColor: 'rgba(26, 26, 26, 0.5)',
    marginVertical: 6,
    minHeight: 60,
    width: '90%',
  },
  activeSidebarButton: {
    backgroundColor: '#3D4F4C',
    borderColor: '#9EBFBB',
  },
  sidebarButtonText: {
    color: '#9EBFBB',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
  },
  activeSidebarButtonText: {
    color: '#FFFFFF',
  },
});