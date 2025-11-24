import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  ActivityIndicator,
  Dimensions,
  Modal,
  TextInput,
  Switch,
  Linking,
  SafeAreaView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { StyleSheet } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import DonorCardModal from '@/components/DonorCardModal';
import DonationHistory from '@/components/DonationHistory';

// Configurar comportamento das notificações
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export type Achievement = {
  type: 'first_blood_donation' | 'first_post' | 'first_campaign' | 'bone_marrow_donor' | 'milestone_donations' | 'emergency_donor';
  title: string;
  date: string;
};

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  cpf: string;
  rg?: string;
  birthDate?: string;
  bloodType: string;
  profileImage?: string;
  gender: 'M' | 'F';
  lastDonation?: string;
  donationCount: number;
  achievements: Achievement[];
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  rua?: string;
  numero?: string;
  bairro?: string;
  cidadeUf?: string;
}

export default function ProfileScreen() {
  const { logout } = useAuth() as any;
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [fullscreenCardVisible, setFullscreenCardVisible] = useState(false);
  const [myDataModalVisible, setMyDataModalVisible] = useState(false);
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [donationCertificateModalVisible, setDonationCertificateModalVisible] = useState(false);

  // Estados para edição de dados
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<UserProfile | null>(null);

  // Settings states
  const [notifications, setNotifications] = useState(true);
  const [locationServices, setLocationServices] = useState(true);
  const [biometricAuth, setBiometricAuth] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [emergencyMode, setEmergencyMode] = useState(true);
  const [donationReminders, setDonationReminders] = useState(true);
  const [criticalStockAlerts, setCriticalStockAlerts] = useState(true);
  const [campaignNotifications, setCampaignNotifications] = useState(true);

  // Blood type picker
  const [bloodTypePickerVisible, setBloodTypePickerVisible] = useState(false);

  const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  useEffect(() => {
    loadProfile();
  }, []);

  // Salvar configurações quando mudarem
  useEffect(() => {
    saveSettings();
  }, [notifications, locationServices, biometricAuth, darkMode, emergencyMode, donationReminders, criticalStockAlerts, campaignNotifications]);

  const loadProfile = async () => {
    try {
      // Mock data - replace with API call
      const mockProfile: UserProfile = {
        id: '1',
        name: 'João Silva Santos',
        email: 'joao.silva@email.com',
        phone: '(11) 99999-9999',
        cpf: '123.456.789-00',
        rg: '12.345.678-9',
        birthDate: '1990-05-15',
        bloodType: 'O+',
        gender: 'M',
        lastDonation: '2024-09-15',
        donationCount: 5,
        profileImage: 'https://via.placeholder.com/120',
        emergencyContactName: 'Maria Silva Santos',
        emergencyContactPhone: '(79) 98888-7777',
        rua: 'Rua das Flores',
        numero: '123',
        bairro: 'Centro',
        cidadeUf: 'São Paulo-SP',
        achievements: [
          {
            type: 'first_blood_donation',
            title: 'Primeira Doação',
            date: '2023-01-15'
          },
          {
            type: 'milestone_donations',
            title: '5 Doações Realizadas',
            date: '2024-09-15'
          },
          {
            type: 'emergency_donor',
            title: 'Doador de Emergência',
            date: '2024-07-20'
          }
        ]
      };

      setProfile(mockProfile);
      await loadSettings();

    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Erro', 'Não foi possível carregar o perfil');
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setUploadingImage(true);
        // TODO: Upload to backend
        setTimeout(() => {
          setProfile(prev => prev ? { ...prev, profileImage: result.assets[0].uri } : null);
          setUploadingImage(false);
        }, 2000);
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível selecionar a imagem');
      setUploadingImage(false);
    }
  };

  const calculateDonationStatus = () => {
    if (!profile?.lastDonation) return { canDonate: true, daysUntilNext: 0 };

    const lastDonationDate = new Date(profile.lastDonation);
    const today = new Date();
    const daysSinceLastDonation = Math.floor((today.getTime() - lastDonationDate.getTime()) / (1000 * 60 * 60 * 24));

    // Women: 90 days interval, Men: 60 days interval
    const requiredInterval = profile.gender === 'F' ? 90 : 60;
    const canDonate = daysSinceLastDonation >= requiredInterval;
    const daysUntilNext = canDonate ? 0 : requiredInterval - daysSinceLastDonation;

    return { canDonate, daysUntilNext };
  };

  const getAchievementIcon = (type: string) => {
    switch (type) {
      case 'first_blood_donation':
        return 'water';
      case 'first_post':
        return 'chatbubble-ellipses';
      case 'first_campaign':
        return 'megaphone';
      case 'bone_marrow_donor':
        return 'heart';
      case 'milestone_donations':
        return 'trophy';
      case 'emergency_donor':
        return 'flash';
      default:
        return 'star';
    }
  };

  // Funções de Configurações
  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem('userSettings');
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        setNotifications(settings.notifications ?? true);
        setLocationServices(settings.locationServices ?? true);
        setBiometricAuth(settings.biometricAuth ?? false);
        setDarkMode(settings.darkMode ?? false);
        setEmergencyMode(settings.emergencyMode ?? true);
        setDonationReminders(settings.donationReminders ?? true);
        setCriticalStockAlerts(settings.criticalStockAlerts ?? true);
        setCampaignNotifications(settings.campaignNotifications ?? true);
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    }
  };

  const saveSettings = async () => {
    try {
      const settings = {
        notifications,
        locationServices,
        biometricAuth,
        darkMode,
        emergencyMode,
        donationReminders,
        criticalStockAlerts,
        campaignNotifications,
      };
      await AsyncStorage.setItem('userSettings', JSON.stringify(settings));
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
    }
  };

  const handleAbout = () => {
    Alert.alert(
      'Sobre o App',
      'Gota a Gota - HEMOSE\nVersão 1.0.0\n\nApp oficial para doadores de sangue do Centro de Hemoterapia de Sergipe (HEMOSE).\n\nDesenvolvido para facilitar o processo de doação e conectar doadores com pessoas em necessidade.',
      [{ text: 'OK' }]
    );
  };

  const handleTermsOfUse = () => {
    Alert.alert(
      'Termos de Uso',
      'Os Termos de Uso completos estão disponíveis em nosso site. Deseja visualizá-los agora?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Visualizar', onPress: () => Linking.openURL('https://hemose.se.gov.br/termos') }
      ]
    );
  };

  const handlePrivacyPolicy = () => {
    Alert.alert(
      'Política de Privacidade',
      'Nossa Política de Privacidade está disponível em nosso site. Deseja visualizá-la agora?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Visualizar', onPress: () => Linking.openURL('https://hemose.se.gov.br/privacidade') }
      ]
    );
  };

  const handleHelpSupport = () => {
    Alert.alert(
      'Ajuda & Suporte',
      'Precisa de ajuda? Entre em contato conosco:',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'WhatsApp', onPress: () => Linking.openURL('https://wa.me/5579999999999') },
        { text: 'Email', onPress: () => Linking.openURL('mailto:suporte@hemose.se.gov.br') }
      ]
    );
  };

  // Funções de Notificação
  const registerForPushNotifications = async () => {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        Alert.alert('Permissão negada', 'Você precisa habilitar as notificações nas configurações do dispositivo.');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erro ao registrar para notificações:', error);
      return false;
    }
  };

  const sendCriticalStockNotification = async (bloodType: string) => {
    if (!criticalStockAlerts) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🚨 ESTOQUE CRÍTICO',
        body: `Estoque de sangue ${bloodType} está em nível crítico. Sua doação pode salvar vidas!`,
        data: { type: 'critical_stock', bloodType },
        priority: 'high',
        sound: 'default',
      },
      trigger: null, // Imediata
    });
  };

  const sendDonationReminderNotification = async () => {
    if (!donationReminders || !profile) return;

    const { canDonate, daysUntilNext } = calculateDonationStatus();

    if (canDonate) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '💉 Hora de doar!',
          body: 'Você já pode fazer uma nova doação de sangue. Que tal agendar hoje?',
          data: { type: 'donation_reminder' },
        },
        trigger: null,
      });
    }
  };

  const sendEmergencyNotification = async (bloodType: string, location: string) => {
    if (!emergencyMode) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🆘 EMERGÊNCIA MÉDICA',
        body: `Urgente! Paciente com tipo sanguíneo ${bloodType} precisa de doação em ${location}`,
        data: { type: 'emergency', bloodType, location },
        priority: 'max',
        sound: 'default',
      },
      trigger: null,
    });
  };

  const testCriticalStockNotification = async () => {
    const hasPermission = await registerForPushNotifications();
    if (!hasPermission) return;

    await sendCriticalStockNotification(profile?.bloodType || 'O+');
    Alert.alert('Teste enviado', 'Notificação de estoque crítico enviada!');
  };

  // Funções para edição de dados
  const handleEditToggle = () => {
    if (!isEditing) {
      setEditedProfile(profile);
    }
    setIsEditing(!isEditing);
  };

  const handleSaveChanges = () => {
    if (editedProfile) {
      setProfile(editedProfile);
      setIsEditing(false);
      Alert.alert('Sucesso', 'Dados atualizados com sucesso!');
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedProfile(null);
  };

  const updateField = (field: keyof UserProfile, value: string) => {
    if (editedProfile) {
      setEditedProfile({
        ...editedProfile,
        [field]: value
      });
    }
  };

  if (loading || !profile) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E73645" />
        <Text style={styles.loadingText}>Carregando perfil...</Text>
      </View>
    );
  }

  const donationStatus = calculateDonationStatus();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.contentWrapper}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Profile Header */}
          <View style={styles.profileHeader}>
            <TouchableOpacity style={styles.profileImageContainer} onPress={pickImage}>
              <Image
                source={{ uri: profile.profileImage || 'https://via.placeholder.com/120' }}
                style={styles.profileImage}
              />
              {uploadingImage && (
                <View style={styles.imageOverlay}>
                  <ActivityIndicator size="small" color="#FFF" />
                </View>
              )}
              <View style={styles.cameraIcon}>
                <Ionicons name="camera" size={16} color="#FFF" />
              </View>
            </TouchableOpacity>

            <Text style={styles.profileName}>{profile.name}</Text>
            <View style={styles.bloodTypeBadge}>
              <Text style={styles.bloodTypeBadgeText}>{profile.bloodType}</Text>
            </View>
          </View>

          {/* Donation Status */}
          <View style={styles.donationStatusCard}>
            <View style={styles.statusHeader}>
              <Ionicons
                name={donationStatus.canDonate ? "checkmark-circle" : "time"}
                size={24}
                color={donationStatus.canDonate ? "#10B981" : "#F59E0B"}
              />
              <Text style={[
                styles.statusTitle,
                { color: donationStatus.canDonate ? "#10B981" : "#F59E0B" }
              ]}>
                {donationStatus.canDonate ? "Apto para Doar" : "Não Apto para Doar"}
              </Text>
            </View>

            {/* Donation Statistics */}
            <View style={styles.donationStats}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{profile.donationCount}</Text>
                <Text style={styles.statLabel}>Total de Doações</Text>
              </View>

              {profile.lastDonation && (
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    {new Date(profile.lastDonation).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: '2-digit'
                    })}
                  </Text>
                  <Text style={styles.statLabel}>Última Doação</Text>
                </View>
              )}

              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {profile.gender === 'F' ? '90' : '60'} dias
                </Text>
                <Text style={styles.statLabel}>Intervalo {profile.gender === 'F' ? '♀' : '♂'}</Text>
              </View>
            </View>

            {/* Countdown for next donation */}
            {!donationStatus.canDonate && donationStatus.daysUntilNext > 0 && (
              <View style={styles.countdownContainer}>
                <View style={styles.countdownHeader}>
                  <Ionicons name="calendar-outline" size={16} color="#6B7280" />
                  <Text style={styles.countdownTitle}>Próxima doação em:</Text>
                </View>

                <View style={styles.countdownDisplay}>
                  <View style={styles.countdownItem}>
                    <Text style={styles.countdownNumber}>{donationStatus.daysUntilNext}</Text>
                    <Text style={styles.countdownLabel}>
                      {donationStatus.daysUntilNext === 1 ? 'dia' : 'dias'}
                    </Text>
                  </View>

                  {donationStatus.daysUntilNext <= 7 && (
                    <View style={styles.countdownItem}>
                      <Text style={styles.countdownNumber}>
                        {Math.ceil(donationStatus.daysUntilNext * 24) % 24}
                      </Text>
                      <Text style={styles.countdownLabel}>horas</Text>
                    </View>
                  )}
                </View>

                {donationStatus.daysUntilNext <= 30 && (
                  <View style={styles.reminderContainer}>
                    <Ionicons name="notifications-outline" size={14} color="#F59E0B" />
                    <Text style={styles.reminderText}>
                      {donationStatus.daysUntilNext <= 7
                        ? 'Você pode doar em breve! Prepare-se.'
                        : 'Ativar lembrete para próxima doação?'}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {donationStatus.canDonate && (
              <View style={styles.readyToDonateContainer}>
                <Ionicons name="heart" size={20} color="#10B981" />
                <Text style={styles.readyToDonateText}>
                  Você está apto a doar! Agende sua próxima doação.
                </Text>
              </View>
            )}
          </View>

          {/* Donor Card Preview Section */}
          <View style={styles.donorCardPreviewSection}>
            <View style={styles.cardPreviewHeader}>
              <Text style={styles.cardPreviewTitle}>Meu Cartão de Doador</Text>
              <TouchableOpacity
                style={styles.viewFullCardButton}
                onPress={() => setFullscreenCardVisible(true)}
              >
                <Text style={styles.viewFullCardText}>Ver Completo</Text>
                <Ionicons name="chevron-forward" size={16} color="#9EBFBB" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.cardPreviewContainer}
              onPress={() => setFullscreenCardVisible(true)}
              activeOpacity={0.8}
            >
              <View style={styles.cardPreviewContent}>
                <View style={styles.cardPreviewLeft}>
                  {profile?.profileImage ? (
                    <Image
                      source={{ uri: profile.profileImage }}
                      style={styles.cardPreviewAvatar}
                    />
                  ) : (
                    <View style={styles.cardPreviewAvatarPlaceholder}>
                      <Ionicons name="person" size={20} color="#9EBFBB" />
                    </View>
                  )}
                  <View style={styles.cardPreviewInfo}>
                    <Text style={styles.cardPreviewName} numberOfLines={1}>
                      {profile?.name || 'Usuário'}
                    </Text>
                    <Text style={styles.cardPreviewBloodType}>
                      Tipo Sanguíneo: {profile?.bloodType || 'O+'}
                    </Text>
                    <Text style={styles.cardPreviewDonations}>
                      {profile?.donationCount ?? 5} doações realizadas
                    </Text>
                  </View>
                </View>
                <View style={styles.cardPreviewRight}>
                  <View style={styles.cardPreviewIcon}>
                    <Ionicons name="card" size={24} color="#9EBFBB" />
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          </View>

          {/* Achievements Section */}
          <View style={styles.achievementsCard}>
            <Text style={styles.sectionTitle}>Últimas Conquistas</Text>

            {profile.achievements && profile.achievements.length > 0 ? (
              <View style={styles.achievementsList}>
                {profile.achievements.slice(0, 3).map((achievement, index) => (
                  <View key={index} style={styles.achievementItem}>
                    <View style={styles.achievementIcon}>
                      <Ionicons
                        name={getAchievementIcon(achievement.type)}
                        size={20}
                        color="#E73645"
                      />
                    </View>
                    <View style={styles.achievementInfo}>
                      <Text style={styles.achievementTitle}>{achievement.title}</Text>
                      <Text style={styles.achievementDate}>
                        {new Date(achievement.date).toLocaleDateString('pt-BR')}
                      </Text>
                    </View>
                  </View>
                ))}

                {profile.achievements.length > 3 && (
                  <TouchableOpacity style={styles.viewAllButton}>
                    <Text style={styles.viewAllText}>Ver todas as conquistas</Text>
                    <Ionicons name="chevron-forward" size={16} color="#E73645" />
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <View style={styles.noAchievements}>
                <Ionicons name="trophy-outline" size={48} color="#CCC" />
                <Text style={styles.noAchievementsText}>Nenhuma conquista ainda</Text>
                <Text style={styles.noAchievementsSubtext}>
                  Faça sua primeira doação para conquistar seu primeiro troféu!
                </Text>
              </View>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setMyDataModalVisible(true)}
            >
              <Ionicons name="person-outline" size={20} color="#E73645" />
              <Text style={styles.actionButtonText}>Meus Dados</Text>
              <Ionicons name="chevron-forward" size={16} color="#CCC" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setHistoryModalVisible(true)}
            >
              <Ionicons name="time-outline" size={20} color="#E73645" />
              <Text style={styles.actionButtonText}>Histórico</Text>
              <Ionicons name="chevron-forward" size={16} color="#CCC" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={() => setFullscreenCardVisible(true)}>
              <Ionicons name="card-outline" size={20} color="#E73645" />
              <Text style={styles.actionButtonText}>Meu Cartão</Text>
              <Ionicons name="chevron-forward" size={16} color="#CCC" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setDonationCertificateModalVisible(true)}
            >
              <Ionicons name="document-text-outline" size={20} color="#E73645" />
              <Text style={styles.actionButtonText}>Atestado de Doação</Text>
              <Ionicons name="chevron-forward" size={16} color="#CCC" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setSettingsModalVisible(true)}
            >
              <Ionicons name="settings-outline" size={20} color="#E73645" />
              <Text style={styles.actionButtonText}>Configurações</Text>
              <Ionicons name="chevron-forward" size={16} color="#CCC" />
            </TouchableOpacity>
          </View>

          {/* Logout Button */}
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={() => {
              Alert.alert(
                'Confirmar Saída',
                'Deseja realmente sair da sua conta?',
                [
                  { text: 'Cancelar', style: 'cancel' },
                  { text: 'Sair', style: 'destructive', onPress: logout },
                ]
              );
            }}
          >
            <Ionicons name="log-out-outline" size={20} color="#E73645" />
            <Text style={styles.logoutText}>Sair da Conta</Text>
          </TouchableOpacity>


        </ScrollView>
      </View>

      {/* Meus Dados Modal */}
      <Modal
        visible={myDataModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Meus Dados</Text>
            <View style={styles.headerButtons}>
              {isEditing ? (
                <>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={handleCancelEdit}
                  >
                    <Text style={styles.cancelButtonText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.saveButton}
                    onPress={handleSaveChanges}
                  >
                    <Text style={styles.saveButtonText}>Salvar</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity
                  style={styles.editModeButton}
                  onPress={handleEditToggle}
                >
                  <Ionicons name="create-outline" size={20} color="#E73645" />
                  <Text style={styles.editModeButtonText}>Editar</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => {
                  setMyDataModalVisible(false);
                  handleCancelEdit();
                }}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.dataSection}>
              <Text style={styles.dataSectionTitle}>Informações Pessoais</Text>

              <View style={styles.dataItem}>
                <Text style={styles.dataLabel}>Nome Completo</Text>
                {isEditing ? (
                  <TextInput
                    style={styles.editInput}
                    value={editedProfile?.name || ''}
                    onChangeText={(text) => updateField('name', text)}
                    placeholder="Nome completo"
                  />
                ) : (
                  <Text style={styles.dataValue}>{profile.name}</Text>
                )}
              </View>

              <View style={styles.dataItem}>
                <Text style={styles.dataLabel}>Email</Text>
                {isEditing ? (
                  <TextInput
                    style={styles.editInput}
                    value={editedProfile?.email || ''}
                    onChangeText={(text) => updateField('email', text)}
                    placeholder="email@exemplo.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                ) : (
                  <Text style={styles.dataValue}>{profile.email}</Text>
                )}
              </View>

              <View style={styles.dataItem}>
                <Text style={styles.dataLabel}>Telefone</Text>
                {isEditing ? (
                  <TextInput
                    style={styles.editInput}
                    value={editedProfile?.phone || ''}
                    onChangeText={(text) => updateField('phone', text)}
                    placeholder="(79) 99999-9999"
                    keyboardType="phone-pad"
                  />
                ) : (
                  <Text style={styles.dataValue}>{profile.phone}</Text>
                )}
              </View>

              <View style={styles.dataItem}>
                <Text style={styles.dataLabel}>CPF</Text>
                {isEditing ? (
                  <TextInput
                    style={styles.editInput}
                    value={editedProfile?.cpf || ''}
                    onChangeText={(text) => updateField('cpf', text)}
                    placeholder="123.456.789-00"
                    keyboardType="numeric"
                  />
                ) : (
                  <Text style={styles.dataValue}>{profile.cpf}</Text>
                )}
              </View>

              <View style={styles.dataItem}>
                <Text style={styles.dataLabel}>RG</Text>
                {isEditing ? (
                  <TextInput
                    style={styles.editInput}
                    value={editedProfile?.rg || ''}
                    onChangeText={(text) => updateField('rg', text)}
                    placeholder="12.345.678-9"
                  />
                ) : (
                  <Text style={styles.dataValue}>{profile.rg || 'Não informado'}</Text>
                )}
              </View>

              <View style={styles.dataItem}>
                <Text style={styles.dataLabel}>Data de Nascimento</Text>
                {isEditing ? (
                  <TextInput
                    style={styles.editInput}
                    value={editedProfile?.birthDate ? new Date(editedProfile.birthDate).toLocaleDateString('pt-BR') : ''}
                    onChangeText={(text) => {
                      // Converter formato DD/MM/YYYY para YYYY-MM-DD para armazenar
                      const parts = text.split('/');
                      if (parts.length === 3) {
                        const isoDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
                        updateField('birthDate', isoDate);
                      } else {
                        updateField('birthDate', text);
                      }
                    }}
                    placeholder="15/05/1990"
                    keyboardType="numeric"
                  />
                ) : (
                  <Text style={styles.dataValue}>
                    {profile.birthDate ? new Date(profile.birthDate).toLocaleDateString('pt-BR') : 'Não informado'}
                  </Text>
                )}
              </View>

              <View style={styles.dataItem}>
                <Text style={styles.dataLabel}>Tipo Sanguíneo</Text>
                {isEditing ? (
                  <TouchableOpacity
                    style={styles.bloodTypeSelector}
                    onPress={() => setBloodTypePickerVisible(true)}
                  >
                    <Text style={styles.bloodTypeSelectorText}>
                      {editedProfile?.bloodType || 'Selecionar'}
                    </Text>
                    <Ionicons name="chevron-down" size={16} color="#666" />
                  </TouchableOpacity>
                ) : (
                  <Text style={[styles.dataValue, { color: '#E73645', fontWeight: 'bold' }]}>
                    {profile.bloodType}
                  </Text>
                )}
              </View>
            </View>

            <View style={styles.dataSection}>
              <Text style={styles.dataSectionTitle}>Contato de Emergência</Text>

              <View style={styles.dataItem}>
                <Text style={styles.dataLabel}>Nome do Contato</Text>
                {isEditing ? (
                  <TextInput
                    style={styles.editInput}
                    value={editedProfile?.emergencyContactName || ''}
                    onChangeText={(text) => updateField('emergencyContactName', text)}
                    placeholder="Maria Silva Santos"
                  />
                ) : (
                  <Text style={styles.dataValue}>
                    {profile.emergencyContactName || 'Não informado'}
                  </Text>
                )}
              </View>

              <View style={styles.dataItem}>
                <Text style={styles.dataLabel}>Telefone do Contato</Text>
                {isEditing ? (
                  <TextInput
                    style={styles.editInput}
                    value={editedProfile?.emergencyContactPhone || ''}
                    onChangeText={(text) => updateField('emergencyContactPhone', text)}
                    placeholder="(79) 99999-9999"
                    keyboardType="phone-pad"
                  />
                ) : (
                  <Text style={styles.dataValue}>
                    {profile.emergencyContactPhone || 'Não informado'}
                  </Text>
                )}
              </View>
            </View>

            <View style={styles.dataSection}>
              <Text style={styles.dataSectionTitle}>Endereço</Text>

              <View style={styles.dataItem}>
                <Text style={styles.dataLabel}>Rua</Text>
                {isEditing ? (
                  <TextInput
                    style={styles.editInput}
                    value={editedProfile?.rua || ''}
                    onChangeText={(text) => updateField('rua', text)}
                    placeholder="Nome da rua"
                  />
                ) : (
                  <Text style={styles.dataValue}>
                    {profile.rua || 'Não informado'}
                  </Text>
                )}
              </View>

              <View style={styles.dataItem}>
                <Text style={styles.dataLabel}>Número</Text>
                {isEditing ? (
                  <TextInput
                    style={styles.editInput}
                    value={editedProfile?.numero || ''}
                    onChangeText={(text) => updateField('numero', text)}
                    placeholder="Número"
                    keyboardType="numeric"
                  />
                ) : (
                  <Text style={styles.dataValue}>
                    {profile.numero || 'Não informado'}
                  </Text>
                )}
              </View>

              <View style={styles.dataItem}>
                <Text style={styles.dataLabel}>Bairro</Text>
                {isEditing ? (
                  <TextInput
                    style={styles.editInput}
                    value={editedProfile?.bairro || ''}
                    onChangeText={(text) => updateField('bairro', text)}
                    placeholder="Bairro"
                  />
                ) : (
                  <Text style={styles.dataValue}>
                    {profile.bairro || 'Não informado'}
                  </Text>
                )}
              </View>

              <View style={styles.dataItem}>
                <Text style={styles.dataLabel}>Cidade-UF</Text>
                {isEditing ? (
                  <TextInput
                    style={styles.editInput}
                    value={editedProfile?.cidadeUf || ''}
                    onChangeText={(text) => updateField('cidadeUf', text)}
                    placeholder="Cidade-UF (ex: São Paulo-SP)"
                  />
                ) : (
                  <Text style={styles.dataValue}>
                    {profile.cidadeUf || 'Não informado'}
                  </Text>
                )}
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Configurações Modal */}
      <Modal
        visible={settingsModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Configurações</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setSettingsModalVisible(false)}
            >
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.settingsSection}>
              <Text style={styles.settingsSectionTitle}>Notificações</Text>

              <View style={styles.settingsItem}>
                <View style={styles.settingsItemLeft}>
                  <Ionicons name="notifications-outline" size={20} color="#E73645" />
                  <Text style={styles.settingsItemText}>Notificações Push</Text>
                </View>
                <Switch
                  value={notifications}
                  onValueChange={setNotifications}
                  trackColor={{ false: '#D1D5DB', true: '#FCA5A5' }}
                  thumbColor={notifications ? '#E73645' : '#F3F4F6'}
                />
              </View>

              <View style={styles.settingsItem}>
                <View style={styles.settingsItemLeft}>
                  <Ionicons name="alarm-outline" size={20} color="#E73645" />
                  <Text style={styles.settingsItemText}>Lembrete de Doação</Text>
                </View>
                <Switch
                  value={emergencyMode}
                  onValueChange={setEmergencyMode}
                  trackColor={{ false: '#D1D5DB', true: '#FCA5A5' }}
                  thumbColor={emergencyMode ? '#E73645' : '#F3F4F6'}
                />
              </View>

              <View style={styles.settingsItem}>
                <View style={styles.settingsItemLeft}>
                  <Ionicons name="medical-outline" size={20} color="#E73645" />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[styles.settingsItemText, { marginLeft: 0 }]}>Emergências Médicas</Text>
                    <Text style={styles.settingsItemSubtext}>Receber notificações sobre emergências que precisam do seu tipo sanguíneo</Text>
                  </View>
                </View>
                <Switch
                  value={emergencyMode}
                  onValueChange={setEmergencyMode}
                  trackColor={{ false: '#D1D5DB', true: '#FCA5A5' }}
                  thumbColor={emergencyMode ? '#E73645' : '#F3F4F6'}
                />
              </View>

              <View style={styles.settingsItem}>
                <View style={styles.settingsItemLeft}>
                  <Ionicons name="heart-outline" size={20} color="#E73645" />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[styles.settingsItemText, { marginLeft: 0 }]}>Lembretes de Doação</Text>
                    <Text style={styles.settingsItemSubtext}>Receber lembretes quando puder doar novamente</Text>
                  </View>
                </View>
                <Switch
                  value={donationReminders}
                  onValueChange={setDonationReminders}
                  trackColor={{ false: '#D1D5DB', true: '#FCA5A5' }}
                  thumbColor={donationReminders ? '#E73645' : '#F3F4F6'}
                />
              </View>

              <View style={[styles.settingsItem, criticalStockAlerts && styles.criticalStockItem]}>
                <View style={styles.settingsItemLeft}>
                  <Ionicons name="warning-outline" size={20} color={criticalStockAlerts ? "#FFFFFF" : "#E73645"} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[styles.settingsItemText, { marginLeft: 0, color: criticalStockAlerts ? "#FFFFFF" : "#1F2937" }]}>🚨 Estoque Crítico</Text>
                    <Text style={[styles.settingsItemSubtext, { color: criticalStockAlerts ? "#FFE4E1" : "#6B7280" }]}>Alertas prioritários quando estoques estão em nível crítico</Text>
                  </View>
                </View>
                <Switch
                  value={criticalStockAlerts}
                  onValueChange={setCriticalStockAlerts}
                  trackColor={{ false: '#D1D5DB', true: '#FF6B6B' }}
                  thumbColor={criticalStockAlerts ? '#FF4444' : '#F3F4F6'}
                />
              </View>

              <View style={styles.settingsItem}>
                <View style={styles.settingsItemLeft}>
                  <Ionicons name="megaphone-outline" size={20} color="#E73645" />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[styles.settingsItemText, { marginLeft: 0 }]}>Campanhas</Text>
                    <Text style={styles.settingsItemSubtext}>Receber informações sobre campanhas de doação</Text>
                  </View>
                </View>
                <Switch
                  value={campaignNotifications}
                  onValueChange={setCampaignNotifications}
                  trackColor={{ false: '#D1D5DB', true: '#FCA5A5' }}
                  thumbColor={campaignNotifications ? '#E73645' : '#F3F4F6'}
                />
              </View>

              {/* Botão de teste para estoque crítico */}
              <TouchableOpacity
                style={styles.testNotificationButton}
                onPress={testCriticalStockNotification}
              >
                <Ionicons name="flask-outline" size={16} color="#E73645" />
                <Text style={styles.testNotificationText}>Testar Notificação de Estoque Crítico</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.settingsSection}>
              <Text style={styles.settingsSectionTitle}>Privacidade & Segurança</Text>

              <View style={styles.settingsItem}>
                <View style={styles.settingsItemLeft}>
                  <Ionicons name="finger-print-outline" size={20} color="#E73645" />
                  <Text style={styles.settingsItemText}>Autenticação Biométrica</Text>
                </View>
                <Switch
                  value={biometricAuth}
                  onValueChange={setBiometricAuth}
                  trackColor={{ false: '#D1D5DB', true: '#FCA5A5' }}
                  thumbColor={biometricAuth ? '#E73645' : '#F3F4F6'}
                />
              </View>

              <View style={styles.settingsItem}>
                <View style={styles.settingsItemLeft}>
                  <Ionicons name="location-outline" size={20} color="#E73645" />
                  <Text style={styles.settingsItemText}>Serviços de Localização</Text>
                </View>
                <Switch
                  value={locationServices}
                  onValueChange={setLocationServices}
                  trackColor={{ false: '#D1D5DB', true: '#FCA5A5' }}
                  thumbColor={locationServices ? '#E73645' : '#F3F4F6'}
                />
              </View>
            </View>

            <View style={styles.settingsSection}>
              <Text style={styles.settingsSectionTitle}>Aparência</Text>

              <View style={styles.settingsItem}>
                <View style={styles.settingsItemLeft}>
                  <Ionicons name="moon-outline" size={20} color="#E73645" />
                  <Text style={styles.settingsItemText}>Modo Escuro</Text>
                </View>
                <Switch
                  value={darkMode}
                  onValueChange={setDarkMode}
                  trackColor={{ false: '#D1D5DB', true: '#FCA5A5' }}
                  thumbColor={darkMode ? '#E73645' : '#F3F4F6'}
                />
              </View>
            </View>

            <View style={styles.settingsSection}>
              <Text style={styles.settingsSectionTitle}>Sobre o App</Text>

              <TouchableOpacity style={styles.settingsActionItem} onPress={handleAbout}>
                <View style={styles.settingsItemLeft}>
                  <Ionicons name="information-circle-outline" size={20} color="#E73645" />
                  <Text style={styles.settingsItemText}>Sobre</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#CCC" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.settingsActionItem} onPress={handleTermsOfUse}>
                <View style={styles.settingsItemLeft}>
                  <Ionicons name="document-text-outline" size={20} color="#E73645" />
                  <Text style={styles.settingsItemText}>Termos de Uso</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#CCC" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.settingsActionItem} onPress={handlePrivacyPolicy}>
                <View style={styles.settingsItemLeft}>
                  <Ionicons name="shield-checkmark-outline" size={20} color="#E73645" />
                  <Text style={styles.settingsItemText}>Política de Privacidade</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#CCC" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.settingsActionItem} onPress={handleHelpSupport}>
                <View style={styles.settingsItemLeft}>
                  <Ionicons name="help-circle-outline" size={20} color="#E73645" />
                  <Text style={styles.settingsItemText}>Ajuda & Suporte</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#CCC" />
              </TouchableOpacity>
            </View>

            <View style={styles.appVersion}>
              <Text style={styles.appVersionText}>Versão 1.0.0</Text>
              <Text style={styles.appVersionSubtext}>Gota a Gota - HEMOSE</Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Blood Type Picker Modal */}
      <Modal
        visible={bloodTypePickerVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setBloodTypePickerVisible(false)}
      >
        <View style={styles.pickerModalOverlay}>
          <View style={styles.pickerModalContainer}>
            <View style={styles.pickerModalHeader}>
              <Text style={styles.pickerModalTitle}>Selecionar Tipo Sanguíneo</Text>
              <TouchableOpacity
                onPress={() => setBloodTypePickerVisible(false)}
                style={styles.pickerModalCloseButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.pickerModalContent}>
              {bloodTypes.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.bloodTypeOption,
                    editedProfile?.bloodType === type && styles.selectedBloodTypeOption
                  ]}
                  onPress={() => {
                    updateField('bloodType', type);
                    setBloodTypePickerVisible(false);
                  }}
                >
                  <View style={styles.bloodTypeOptionLeft}>
                    <View style={[styles.bloodTypeIcon, { backgroundColor: type.includes('+') ? '#E73645' : '#DC2626' }]}>
                      <Text style={styles.bloodTypeIconText}>{type}</Text>
                    </View>
                    <Text style={styles.bloodTypeOptionText}>{type}</Text>
                  </View>
                  {editedProfile?.bloodType === type && (
                    <Ionicons name="checkmark" size={20} color="#E73645" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Fullscreen Card Modal */}
      <DonorCardModal
        visible={fullscreenCardVisible}
        onClose={() => setFullscreenCardVisible(false)}
        id={profile?.id || '123456'}
        name={profile?.name || 'João da Silva Santos'}
        bloodType={profile?.bloodType || 'O+'}
        profileImage={profile?.profileImage}
        lastDonation={profile?.lastDonation || '2024-01-15'}
        donationCount={profile?.donationCount ?? 5}
        cpf={profile?.cpf || '123.456.789-00'}
        rg={profile?.rg || '12.345.678-9'}
        birthDate={profile?.birthDate || '1990-05-15'}
        gender={profile?.gender || 'M'}
      />

      {/* Donation History Modal */}
      <Modal
        visible={historyModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setHistoryModalVisible(false)}
      >
        <DonationHistory
          userId={profile?.id}
          onClose={() => setHistoryModalVisible(false)}
          isModal={true}
        />
      </Modal>

      {/* Modal do Atestado de Doação */}
      <Modal
        visible={donationCertificateModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setDonationCertificateModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Atestado de Doação HEMOSE</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setDonationCertificateModalVisible(false)}
            >
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.certificateContainer}>
              {/* Cabeçalho do Atestado */}
              <View style={styles.certificateHeader}>
                <View style={styles.hemoselLogo}>
                  <Ionicons name="water" size={40} color="#E73645" />
                </View>
                <Text style={styles.certificateTitle}>ATESTADO DE DOAÇÃO DE SANGUE</Text>
                <Text style={styles.hemoseSubtitle}>Centro de Hemoterapia de Sergipe - HEMOSE</Text>
              </View>

              {/* Conteúdo do Atestado */}
              <View style={styles.certificateContent}>
                <Text style={styles.certificateText}>
                  Atesto para os devidos fins que o(a) Sr(a). <Text style={styles.boldText}>{profile?.name}</Text>,
                  portador(a) do CPF nº <Text style={styles.boldText}>{profile?.cpf}</Text>,
                  compareceu ao HEMOSE - Centro de Hemoterapia de Sergipe, no dia{' '}
                  <Text style={styles.boldText}>
                    {profile?.lastDonation ?
                      new Date(profile.lastDonation).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric'
                      }) :
                      'Data não disponível'
                    }
                  </Text>,
                  para doação de sangue.
                </Text>

                <Text style={styles.certificateText}>
                  O doador foi submetido aos exames clínicos e laboratoriais de rotina,
                  tendo sido considerado apto para a doação, que foi realizada com sucesso.
                </Text>

                <Text style={styles.certificateText}>
                  Tipo sanguíneo: <Text style={styles.boldText}>{profile?.bloodType}</Text>
                </Text>

                <Text style={styles.certificateText}>
                  Total de doações realizadas: <Text style={styles.boldText}>{profile?.donationCount}</Text>
                </Text>

                <View style={styles.benefitsSection}>
                  <Text style={styles.benefitsTitle}>Benefícios Legais:</Text>
                  <Text style={styles.benefitItem}>• Folga no dia da doação (Lei 1.075/50)</Text>
                  <Text style={styles.benefitItem}>• Exames laboratoriais gratuitos</Text>
                  <Text style={styles.benefitItem}>• Atendimento prioritário no SUS</Text>
                  <Text style={styles.benefitItem}>• Meia-entrada em eventos culturais (Lei Estadual)</Text>
                </View>
              </View>

              {/* Rodapé do Atestado */}
              <View style={styles.certificateFooter}>
                <Text style={styles.footerText}>
                  Aracaju/SE, {new Date().toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric'
                  })}
                </Text>

                <View style={styles.signatureSection}>
                  <View style={styles.signatureLine} />
                  <Text style={styles.signatureText}>Dr(a). Responsável Técnico</Text>
                  <Text style={styles.signatureText}>HEMOSE - Centro de Hemoterapia de Sergipe</Text>
                  <Text style={styles.signatureText}>CRM/SE XXXXXX</Text>
                </View>

                <View style={styles.contactInfo}>
                  <Text style={styles.contactText}>HEMOSE - Centro de Hemoterapia de Sergipe</Text>
                  <Text style={styles.contactText}>Av. Presidente Tancredo Neves, 2756 - Jabotiana</Text>
                  <Text style={styles.contactText}>Aracaju/SE - CEP: 49095-000</Text>
                  <Text style={styles.contactText}>Tel: (79) 3259-3174</Text>
                  <Text style={styles.contactText}>www.hemose.se.gov.br</Text>
                </View>
              </View>

              {/* Botões de Ação */}
              <View style={styles.certificateActions}>
                <TouchableOpacity
                  style={styles.shareButton}
                  onPress={() => {
                    Alert.alert(
                      'Compartilhar Atestado',
                      'Funcionalidade de compartilhamento será implementada em breve.',
                      [{ text: 'OK' }]
                    );
                  }}
                >
                  <Ionicons name="share-outline" size={20} color="#FFF" />
                  <Text style={styles.shareButtonText}>Compartilhar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.downloadButton}
                  onPress={() => {
                    Alert.alert(
                      'Download do Atestado',
                      'Funcionalidade de download será implementada em breve.',
                      [{ text: 'OK' }]
                    );
                  }}
                >
                  <Ionicons name="download-outline" size={20} color="#E73645" />
                  <Text style={styles.downloadButtonText}>Download PDF</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E73645',
  },
  contentWrapper: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#FFF',
    marginBottom: 16,
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  profileImage: {
    width: Dimensions.get('window').width * 0.2,
    height: Dimensions.get('window').width * 0.2,
    borderRadius: (Dimensions.get('window').width * 0.2) / 2,
    minWidth: 80,
    minHeight: 80,
    maxWidth: 120,
    maxHeight: 120,
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#E73645',
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  bloodTypeBadge: {
    backgroundColor: '#E73645',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  bloodTypeBadgeText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  donationStatusCard: {
    backgroundColor: '#FFF',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  lastDonationInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  lastDonationLabel: {
    fontSize: 14,
    color: '#666',
  },
  lastDonationDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  nextDonationText: {
    fontSize: 14,
    color: '#F59E0B',
    fontWeight: '500',
  },
  achievementsCard: {
    backgroundColor: '#FFF',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  achievementsList: {
    gap: 12,
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  achievementIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  achievementDate: {
    fontSize: 12,
    color: '#666',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 8,
  },
  viewAllText: {
    fontSize: 14,
    color: '#E73645',
    fontWeight: '500',
    marginRight: 4,
  },
  noAchievements: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  noAchievementsText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    fontWeight: '500',
  },
  noAchievementsSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  actionButtons: {
    backgroundColor: '#FFF',
    margin: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  actionButtonText: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    marginLeft: 12,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    margin: 16,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E73645',
  },
  logoutText: {
    fontSize: 16,
    color: '#E73645',
    fontWeight: '600',
    marginLeft: 8,
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  closeButton: {
    padding: 8,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  // Meus Dados Styles
  dataSection: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    marginBottom: 16,
    padding: 20,
  },
  dataSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  dataItem: {
    marginBottom: 16,
  },
  dataLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  dataValue: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E73645',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 20,
  },
  editButtonText: {
    fontSize: 16,
    color: '#FFF',
    fontWeight: '600',
    marginLeft: 8,
  },
  // Settings Styles
  settingsSection: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  settingsSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    padding: 20,
    paddingBottom: 12,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingsItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingsItemText: {
    fontSize: 16,
    color: '#1F2937',
    marginLeft: 12,
  },
  settingsItemSubtext: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
    lineHeight: 16,
  },
  settingsActionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  appVersion: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  appVersionText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  appVersionSubtext: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  // Estilos de Edição
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editModeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 10,
  },
  editModeButtonText: {
    fontSize: 14,
    color: '#E73645',
    fontWeight: '600',
    marginLeft: 4,
  },
  cancelButton: {
    backgroundColor: '#6B7280',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  cancelButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#E73645',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  editInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#FFF',
    marginTop: 4,
  },
  multilineInput: {
    height: 80,
    textAlignVertical: 'top',
  },

  // Blood Type Selector Styles
  bloodTypeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    marginTop: 4,
  },
  bloodTypeSelectorText: {
    fontSize: 16,
    color: '#1F2937',
  },

  // Blood Type Picker Modal Styles
  pickerModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  pickerModalContainer: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  pickerModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  pickerModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  pickerModalCloseButton: {
    padding: 4,
  },
  pickerModalContent: {
    paddingHorizontal: 20,
  },
  bloodTypeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  selectedBloodTypeOption: {
    backgroundColor: '#FEF2F2',
  },
  bloodTypeOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bloodTypeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  bloodTypeIconText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  bloodTypeOptionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  criticalStockItem: {
    backgroundColor: '#DC2626',
    borderRadius: 8,
    marginHorizontal: 10,
    marginVertical: 4,
    paddingHorizontal: 16,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  testNotificationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    borderColor: '#E73645',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 20,
    marginTop: 10,
  },
  testNotificationText: {
    color: '#E73645',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  // Donor Card Preview Styles
  donorCardPreviewSection: {
    backgroundColor: "white",
    marginHorizontal: 20,
    marginVertical: 10,
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardPreviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
  },
  cardPreviewTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#283A37",
  },
  viewFullCardButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  viewFullCardText: {
    fontSize: 14,
    color: "#9EBFBB",
    fontWeight: "600",
  },
  cardPreviewContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  cardPreviewContent: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    borderRadius: 10,
    padding: 14,
    borderLeftWidth: 4,
    borderLeftColor: "#9EBFBB",
  },
  cardPreviewLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  cardPreviewAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  cardPreviewAvatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#E8F4F8",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  cardPreviewInfo: {
    flex: 1,
  },
  cardPreviewName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#283A37",
    marginBottom: 3,
  },
  cardPreviewBloodType: {
    fontSize: 14,
    color: "#495755",
    marginBottom: 3,
  },
  cardPreviewDonations: {
    fontSize: 12,
    color: "#9EBFBB",
    fontWeight: "500",
  },
  cardPreviewRight: {
    alignItems: "center",
  },
  cardPreviewIcon: {
    padding: 8,
  },

  // New donation status styles
  donationStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    color: '#6B7280',
    textAlign: 'center',
    fontWeight: '500',
  },
  countdownContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  countdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  countdownTitle: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  countdownDisplay: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 8,
  },
  countdownItem: {
    alignItems: 'center',
    backgroundColor: 'white',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    minWidth: 50,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  countdownNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F59E0B',
    marginBottom: 2,
  },
  countdownLabel: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '500',
  },
  reminderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  reminderText: {
    fontSize: 11,
    color: '#F59E0B',
    textAlign: 'center',
    fontWeight: '500',
  },
  readyToDonateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  readyToDonateText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
    textAlign: 'center',
  },

  // Estilos do Atestado de Doação
  certificateContainer: {
    backgroundColor: '#FFF',
    margin: 20,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  certificateHeader: {
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#E73645',
    paddingBottom: 20,
    marginBottom: 24,
  },
  hemoselLogo: {
    marginBottom: 12,
  },
  certificateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#E73645',
    textAlign: 'center',
    marginBottom: 8,
  },
  hemoseSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontWeight: '600',
  },
  certificateContent: {
    marginBottom: 32,
  },
  certificateText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#374151',
    marginBottom: 16,
    textAlign: 'justify',
  },
  boldText: {
    fontWeight: 'bold',
    color: '#1F2937',
  },
  benefitsSection: {
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#E73645',
  },
  benefitsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#E73645',
    marginBottom: 8,
  },
  benefitItem: {
    fontSize: 12,
    color: '#4B5563',
    marginBottom: 4,
    lineHeight: 18,
  },
  certificateFooter: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 20,
  },
  footerText: {
    fontSize: 14,
    color: '#374151',
    textAlign: 'center',
    marginBottom: 24,
  },
  signatureSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  signatureLine: {
    width: 200,
    height: 1,
    backgroundColor: '#D1D5DB',
    marginBottom: 8,
  },
  signatureText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 2,
  },
  contactInfo: {
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  contactText: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 2,
  },
  certificateActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  shareButton: {
    flex: 1,
    backgroundColor: '#E73645',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  shareButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14,
  },
  downloadButton: {
    flex: 1,
    backgroundColor: '#FFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E73645',
    gap: 8,
  },
  downloadButtonText: {
    color: '#E73645',
    fontWeight: '600',
    fontSize: 14,
  },
});