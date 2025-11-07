import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    Dimensions,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import donationsService, { DonationRecord as ServiceDonationRecord, DonationAnalytics } from '../services/donations';
import DonationCharts from './DonationCharts';
import { useAuth } from '../contexts/AuthContext';

interface DonationHistoryProps {
    userId?: string;
    onClose?: () => void;
    isModal?: boolean;
}

const { width: screenWidth } = Dimensions.get('window');

export default function DonationHistory({ userId, onClose, isModal = false }: DonationHistoryProps) {
    const [selectedPeriod, setSelectedPeriod] = useState<'12months' | '3years'>('12months');
    const [selectedTab, setSelectedTab] = useState<'list' | 'charts'>('list');
    const [donations, setDonations] = useState<ServiceDonationRecord[]>([]);
    const [analytics, setAnalytics] = useState<DonationAnalytics | null>(null);
    const [loading, setLoading] = useState(false);
    const { user } = useAuth() as any;

    useEffect(() => {
        loadDonations();
    }, [selectedPeriod, userId]);

    const loadDonations = async () => {
        if (!user?.cpf && !userId) {
            console.warn('No CPF or userId available for loading donations');
            return;
        }

        setLoading(true);
        try {
            // Use CPF from user context or a provided userId
            const cpf = user?.cpf || userId || '';

            // Fetch donations from HEMOSE API
            const allDonations = await donationsService.fetchDonationHistory(cpf);

            // Filter donations based on selected period
            const now = new Date();
            let cutoffDate: Date;

            if (selectedPeriod === '12months') {
                cutoffDate = new Date();
                cutoffDate.setFullYear(now.getFullYear() - 1);
            } else {
                cutoffDate = new Date();
                cutoffDate.setFullYear(now.getFullYear() - 3);
            }

            const filteredDonations = allDonations.filter(donation =>
                new Date(donation.date) >= cutoffDate
            );

            setDonations(filteredDonations);

            // Calculate analytics
            const analyticsData = donationsService.calculateAnalytics(allDonations);
            setAnalytics(analyticsData);

        } catch (error) {
            console.error('Error loading donations:', error);
            Alert.alert(
                'Erro ao Carregar Histórico',
                'Não foi possível carregar seu histórico de doações. Tente novamente.',
                [
                    { text: 'OK' },
                    { text: 'Tentar Novamente', onPress: loadDonations }
                ]
            );
        } finally {
            setLoading(false);
        }
    };

    const getLastDonationDate = () => {
        if (donations.length === 0) return null;
        return donations.reduce((latest, donation) => {
            const donationDate = new Date(donation.date);
            const latestDate = new Date(latest.date);
            return donationDate > latestDate ? donation : latest;
        });
    };

    const getTotalDonations = () => donations.length;

    const getTotalVolume = () => donations.reduce((total, donation) => total + donation.volume, 0);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed':
                return '#10B981';
            case 'pending':
                return '#F59E0B';
            case 'rejected':
                return '#EF4444';
            default:
                return '#6B7280';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'completed':
                return 'Concluída';
            case 'pending':
                return 'Pendente';
            case 'cancelled':
                return 'Cancelada';
            default:
                return 'Desconhecido';
        }
    };

    const getDonationTypeText = (type: string) => {
        switch (type) {
            case 'individual':
                return 'Individual';
            case 'campaign':
                return 'Campanha';
            case 'bone_marrow':
                return 'Medula Óssea';
            default:
                return 'Individual';
        }
    };

    const generateDonationCertificate = (donation: ServiceDonationRecord) => {
        Alert.alert(
            'Atestado de Doação',
            `Gerar atestado para a doação realizada em ${formatDate(donation.date)} no ${donation.location}?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Gerar',
                    onPress: () => {
                        // TODO: Implementar geração de PDF do atestado específico da doação
                        Alert.alert(
                            'Atestado Gerado',
                            'Funcionalidade de geração de atestado individual será implementada em breve.',
                            [{ text: 'OK' }]
                        );
                    }
                }
            ]
        );
    };

    const lastDonation = getLastDonationDate();

    return (
        <View style={[styles.container, isModal && styles.modalContainer]}>
            {isModal && (
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Histórico de Doações</Text>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <Ionicons name="close" size={24} color="#666" />
                    </TouchableOpacity>
                </View>
            )}

            {/* Tab Selector */}
            <View style={styles.tabSelector}>
                <TouchableOpacity
                    style={[
                        styles.tabButton,
                        selectedTab === 'list' && styles.tabButtonActive
                    ]}
                    onPress={() => setSelectedTab('list')}
                >
                    <Ionicons
                        name="list-outline"
                        size={18}
                        color={selectedTab === 'list' ? 'white' : '#6B7280'}
                    />
                    <Text style={[
                        styles.tabButtonText,
                        selectedTab === 'list' && styles.tabButtonTextActive
                    ]}>
                        Lista
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.tabButton,
                        selectedTab === 'charts' && styles.tabButtonActive
                    ]}
                    onPress={() => setSelectedTab('charts')}
                >
                    <Ionicons
                        name="stats-chart-outline"
                        size={18}
                        color={selectedTab === 'charts' ? 'white' : '#6B7280'}
                    />
                    <Text style={[
                        styles.tabButtonText,
                        selectedTab === 'charts' && styles.tabButtonTextActive
                    ]}>
                        Gráficos
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Period Selector - only show in list tab */}
            {selectedTab === 'list' && (
                <View style={styles.periodSelector}>
                    <TouchableOpacity
                        style={[
                            styles.periodButton,
                            selectedPeriod === '12months' && styles.periodButtonActive
                        ]}
                        onPress={() => setSelectedPeriod('12months')}
                    >
                        <Text style={[
                            styles.periodButtonText,
                            selectedPeriod === '12months' && styles.periodButtonTextActive
                        ]}>
                            Últimos 12 meses
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.periodButton,
                            selectedPeriod === '3years' && styles.periodButtonActive
                        ]}
                        onPress={() => setSelectedPeriod('3years')}
                    >
                        <Text style={[
                            styles.periodButtonText,
                            selectedPeriod === '3years' && styles.periodButtonTextActive
                        ]}>
                            Últimos 3 anos
                        </Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Statistics */}
            <View style={styles.statsContainer}>
                <View style={styles.statCard}>
                    <Text style={styles.statLabel}>Última Doação</Text>
                    <Text style={styles.statValue}>
                        {lastDonation ? formatDate(lastDonation.date) : 'Nenhuma'}
                    </Text>
                </View>

                <View style={styles.statCard}>
                    <Text style={styles.statLabel}>Total de Doações</Text>
                    <Text style={styles.statValue}>{getTotalDonations()}</Text>
                </View>

                <View style={styles.statCard}>
                    <Text style={styles.statLabel}>Volume Total</Text>
                    <Text style={styles.statValue}>{getTotalVolume()}ml</Text>
                </View>
            </View>

            {/* Content based on selected tab */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#E73645" />
                    <Text style={styles.loadingText}>Carregando histórico...</Text>
                </View>
            ) : selectedTab === 'charts' ? (
                analytics ? (
                    <DonationCharts analytics={analytics} />
                ) : (
                    <View style={styles.emptyState}>
                        <Ionicons name="stats-chart-outline" size={48} color="#CCC" />
                        <Text style={styles.emptyText}>Dados insuficientes</Text>
                        <Text style={styles.emptySubtext}>
                            Faça algumas doações para ver seus gráficos
                        </Text>
                    </View>
                )
            ) : (
                <ScrollView style={styles.donationsList} showsVerticalScrollIndicator={false}>
                    {donations.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Ionicons name="water-outline" size={48} color="#CCC" />
                            <Text style={styles.emptyText}>Nenhuma doação encontrada</Text>
                            <Text style={styles.emptySubtext}>
                                Suas doações aparecerão aqui após serem registradas
                            </Text>
                        </View>
                    ) : (
                        donations.map((donation, index) => (
                            <View key={donation.id} style={styles.donationCard}>
                                <View style={styles.donationHeader}>
                                    <View style={styles.donationInfo}>
                                        <Text style={styles.donationDate}>{formatDate(donation.date)}</Text>
                                        <Text style={styles.donationLocation}>{donation.location}</Text>
                                    </View>
                                    <View style={styles.donationDetails}>
                                        <Text style={styles.bloodType}>{donation.bloodType}</Text>
                                        <Text style={styles.volume}>{donation.volume}ml</Text>
                                        {donation.type && (
                                            <Text style={styles.donationType}>
                                                {getDonationTypeText(donation.type)}
                                            </Text>
                                        )}
                                    </View>
                                </View>

                                <View style={styles.donationFooter}>
                                    <View style={styles.donationFooterTop}>
                                        <View style={[
                                            styles.statusBadge,
                                            { backgroundColor: getStatusColor(donation.status) }
                                        ]}>
                                            <Text style={styles.statusText}>
                                                {getStatusText(donation.status)}
                                            </Text>
                                        </View>
                                        {donation.status === 'completed' && (
                                            <TouchableOpacity
                                                style={styles.certificateButton}
                                                onPress={() => generateDonationCertificate(donation)}
                                            >
                                                <Ionicons name="document-text-outline" size={14} color="#E73645" />
                                                <Text style={styles.certificateButtonText}>Atestado</Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                    {donation.notes && (
                                        <Text style={styles.notes} numberOfLines={2}>
                                            {donation.notes}
                                        </Text>
                                    )}
                                    {donation.protocol && (
                                        <Text style={styles.protocol}>
                                            Protocolo: {donation.protocol}
                                        </Text>
                                    )}
                                </View>
                            </View>
                        ))
                    )}
                </ScrollView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    modalContainer: {
        backgroundColor: 'white',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingTop: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1F2937',
    },
    closeButton: {
        padding: 4,
    },
    periodSelector: {
        flexDirection: 'row',
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        padding: 4,
        margin: 20,
        marginBottom: 16,
    },
    periodButton: {
        flex: 1,
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    periodButtonActive: {
        backgroundColor: '#E73645',
    },
    periodButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280',
    },
    periodButtonTextActive: {
        color: 'white',
    },
    statsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        marginBottom: 20,
        gap: 12,
    },
    statCard: {
        flex: 1,
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    statLabel: {
        fontSize: 12,
        color: '#6B7280',
        marginBottom: 4,
        textAlign: 'center',
    },
    statValue: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
        textAlign: 'center',
    },
    donationsList: {
        flex: 1,
        paddingHorizontal: 20,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#6B7280',
        marginTop: 16,
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#9CA3AF',
        textAlign: 'center',
        paddingHorizontal: 40,
    },
    donationCard: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    donationHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    donationInfo: {
        flex: 1,
    },
    donationDate: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 4,
    },
    donationLocation: {
        fontSize: 14,
        color: '#6B7280',
    },
    donationDetails: {
        alignItems: 'flex-end',
    },
    bloodType: {
        fontSize: 18,
        fontWeight: '700',
        color: '#E73645',
        marginBottom: 2,
    },
    volume: {
        fontSize: 14,
        color: '#6B7280',
    },
    donationFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 16,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
        color: 'white',
    },
    notes: {
        flex: 1,
        fontSize: 12,
        color: '#6B7280',
        marginLeft: 12,
        fontStyle: 'italic',
    },
    protocol: {
        fontSize: 11,
        color: '#9CA3AF',
        marginTop: 4,
    },
    tabSelector: {
        flexDirection: 'row',
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        padding: 4,
        margin: 20,
        marginBottom: 16,
    },
    tabButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        gap: 6,
    },
    tabButtonActive: {
        backgroundColor: '#E73645',
    },
    tabButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280',
    },
    tabButtonTextActive: {
        color: 'white',
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    loadingText: {
        fontSize: 16,
        color: '#6B7280',
        marginTop: 12,
    },
    donationType: {
        fontSize: 12,
        color: '#9CA3AF',
        marginTop: 2,
    },
    donationFooterTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    certificateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEF2F2',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#FECACA',
        gap: 4,
    },
    certificateButtonText: {
        fontSize: 11,
        color: '#E73645',
        fontWeight: '600',
    },
});