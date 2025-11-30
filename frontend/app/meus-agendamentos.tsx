import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as HEMOSE from "@/services/agendamento.service";
import { useAuth } from "@/contexts/AuthContext";

interface Agendamento {
    protocolo: string;
    data: string;
    hora: string;
    tipo: "SANGUE_INDIVIDUAL" | "CAMPANHA" | "CADASTRO_MEDULA_OSSEA";
    local: string;
    status: string;
}

export default function MeusAgendamentos() {
    const { user } = useAuth();
    const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Função para formatar data da API (2025-12-19T00:00:00.000Z -> 19/12/2025)
    const formatarData = (dtBloco: string) => {
        if (!dtBloco) return "Data não disponível";
        const data = new Date(dtBloco);
        return data.toLocaleDateString("pt-BR");
    };

    // Função para formatar horário (07:30:00 - 07:45:00)
    const formatarHorario = (minHora: string, maxHora: string) => {
        if (!minHora || !maxHora) return "Horário não disponível";
        const inicio = minHora.substring(0, 5); // Pega HH:MM
        const fim = maxHora.substring(0, 5);
        return `${inicio} - ${fim}`;
    };

    const carregarAgendamentos = async () => {
        try {
            if (!user?.cpf) {
                Alert.alert("Erro", "CPF n\u00e3o encontrado");
                return;
            }

            const cpfLimpo = user.cpf.replace(/\D/g, "");
            console.log("\ud83d\udd0d [AGENDAMENTOS] CPF do usu\u00e1rio:", user.cpf);
            console.log("\ud83d\udd0d [AGENDAMENTOS] CPF limpo:", cpfLimpo);

            const response = await HEMOSE.getAgendamentosDoador(cpfLimpo);
            console.log("📦 [AGENDAMENTOS] Resposta da API:", JSON.stringify(response, null, 2));

            // A API retorna um objeto com { status, data: [...], msg, err }
            const agendamentosArray = Array.isArray(response) ? response : (response?.data || []);

            // Mapear os campos da API para o formato esperado
            const agendamentosMapeados = agendamentosArray.map((ag: any) => ({
                protocolo: ag.protocolo || "N/A",
                data: formatarData(ag.dt_bloco),
                hora: formatarHorario(ag.min_hora, ag.max_hora),
                tipo: ag.tipo || "D",
                local: ag.local || "HEMOSE",
                status: ag.situacao || "Marcado"
            }));

            setAgendamentos(agendamentosMapeados);
            console.log("✅ [AGENDAMENTOS] Total carregado:", agendamentosMapeados.length);
        } catch (error: any) {
            console.error("\u274c [AGENDAMENTOS] Erro ao carregar:", error);
            console.error("\u274c [AGENDAMENTOS] Mensagem:", error.message);
            console.error("\u274c [AGENDAMENTOS] Response:", error.response?.data);
            Alert.alert("Erro", "N\u00e3o foi poss\u00edvel carregar seus agendamentos");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        carregarAgendamentos();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        carregarAgendamentos();
    };

    const handleCancelar = async (protocolo: string) => {
        Alert.alert(
            "Cancelar Agendamento",
            "Tem certeza que deseja cancelar este agendamento?",
            [
                { text: "Não", style: "cancel" },
                {
                    text: "Sim, cancelar",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await HEMOSE.desmarcarAgendamento(protocolo);
                            Alert.alert("Sucesso", "Agendamento cancelado com sucesso!");
                            carregarAgendamentos(); // Recarrega a lista
                        } catch (error: any) {
                            Alert.alert(
                                "Erro",
                                error.message || "Não foi possível cancelar o agendamento"
                            );
                        }
                    },
                },
            ]
        );
    };

    const getTipoNome = (tipo: string) => {
        switch (tipo) {
            case "SANGUE_INDIVIDUAL":
            case "D":
                return "Doação de Sangue";
            case "CAMPANHA":
            case "C":
                return "Campanha";
            case "CADASTRO_MEDULA_OSSEA":
            case "M":
                return "Cadastro Medula Óssea";
            default:
                return tipo;
        }
    };

    const getTipoIcon = (tipo: string) => {
        switch (tipo) {
            case "SANGUE_INDIVIDUAL":
            case "D":
                return "water";
            case "CAMPANHA":
            case "C":
                return "people";
            case "CADASTRO_MEDULA_OSSEA":
            case "M":
                return "fitness";
            default:
                return "calendar";
        }
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={styles.backButton}
                    >
                        <Ionicons name="arrow-back" size={24} color="#374151" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Meus Agendamentos</Text>
                </View>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#DC2626" />
                    <Text style={styles.loadingText}>Carregando agendamentos...</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={styles.backButton}
                >
                    <Ionicons name="arrow-back" size={24} color="#374151" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Meus Agendamentos</Text>
            </View>

            <ScrollView
                style={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {agendamentos.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="calendar-outline" size={64} color="#9CA3AF" />
                        <Text style={styles.emptyTitle}>Nenhum agendamento</Text>
                        <Text style={styles.emptyText}>
                            Você ainda não possui agendamentos ativos.
                        </Text>
                        <TouchableOpacity
                            style={styles.agendarButton}
                            onPress={() => router.push("/(tabs)/doar")}
                        >
                            <Text style={styles.agendarButtonText}>Agendar Doação</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    agendamentos.map((agendamento, index) => (
                        <View key={index} style={styles.card}>
                            <View style={styles.cardHeader}>
                                <View style={styles.cardHeaderLeft}>
                                    <Ionicons
                                        name={getTipoIcon(agendamento.tipo) as any}
                                        size={24}
                                        color="#DC2626"
                                    />
                                    <View style={styles.cardHeaderText}>
                                        <Text style={styles.cardTipo}>
                                            {getTipoNome(agendamento.tipo)}
                                        </Text>
                                        <Text style={styles.cardProtocolo}>
                                            Protocolo: {agendamento.protocolo}
                                        </Text>
                                    </View>
                                </View>
                                <View
                                    style={[
                                        styles.statusBadge,
                                        agendamento.status === "CONFIRMADO" &&
                                        styles.statusConfirmado,
                                        agendamento.status === "PENDENTE" &&
                                        styles.statusPendente,
                                    ]}
                                >
                                    <Text style={styles.statusText}>{agendamento.status}</Text>
                                </View>
                            </View>

                            <View style={styles.cardDivider} />

                            <View style={styles.cardInfo}>
                                <View style={styles.infoRow}>
                                    <Ionicons name="calendar" size={20} color="#6B7280" />
                                    <Text style={styles.infoText}>{agendamento.data}</Text>
                                </View>
                                <View style={styles.infoRow}>
                                    <Ionicons name="time" size={20} color="#6B7280" />
                                    <Text style={styles.infoText}>{agendamento.hora}</Text>
                                </View>
                                <View style={styles.infoRow}>
                                    <Ionicons name="location" size={20} color="#6B7280" />
                                    <Text style={styles.infoText}>{agendamento.local}</Text>
                                </View>
                            </View>

                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={() => handleCancelar(agendamento.protocolo)}
                            >
                                <Ionicons name="close-circle" size={20} color="#DC2626" />
                                <Text style={styles.cancelButtonText}>Cancelar Agendamento</Text>
                            </TouchableOpacity>
                        </View>
                    ))
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F9FAFB",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingTop: 50,
        paddingBottom: 16,
        backgroundColor: "#FFFFFF",
        borderBottomWidth: 1,
        borderBottomColor: "#E5E7EB",
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: "#111827",
        marginLeft: 12,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: "#6B7280",
    },
    content: {
        flex: 1,
        padding: 16,
    },
    emptyContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 60,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: "600",
        color: "#374151",
        marginTop: 16,
    },
    emptyText: {
        fontSize: 14,
        color: "#6B7280",
        marginTop: 8,
        textAlign: "center",
    },
    agendarButton: {
        marginTop: 24,
        backgroundColor: "#DC2626",
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    agendarButtonText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "600",
    },
    card: {
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    cardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
    },
    cardHeaderLeft: {
        flexDirection: "row",
        flex: 1,
    },
    cardHeaderText: {
        marginLeft: 12,
        flex: 1,
    },
    cardTipo: {
        fontSize: 16,
        fontWeight: "700",
        color: "#111827",
    },
    cardProtocolo: {
        fontSize: 12,
        color: "#6B7280",
        marginTop: 2,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        backgroundColor: "#E5E7EB",
    },
    statusConfirmado: {
        backgroundColor: "#D1FAE5",
    },
    statusPendente: {
        backgroundColor: "#FEF3C7",
    },
    statusText: {
        fontSize: 12,
        fontWeight: "600",
        color: "#374151",
    },
    cardDivider: {
        height: 1,
        backgroundColor: "#E5E7EB",
        marginVertical: 12,
    },
    cardInfo: {
        gap: 8,
    },
    infoRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    infoText: {
        fontSize: 14,
        color: "#374151",
    },
    cancelButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        marginTop: 12,
        paddingVertical: 10,
        borderWidth: 1,
        borderColor: "#DC2626",
        borderRadius: 8,
        gap: 6,
    },
    cancelButtonText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#DC2626",
    },
});
