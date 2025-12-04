import React, { useState } from 'react';
import {
    SafeAreaView,
    StyleSheet,
    Text,
    View,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface FAQItem {
    id: string;
    question: string;
    answer: string | string[];
    isExpanded?: boolean;
}

interface FAQCategory {
    id: string;
    title: string;
    icon: string;
    items: FAQItem[];
}

const FAQ_CATEGORIES: FAQCategory[] = [
    {
        id: 'sangue',
        title: 'Doação de Sangue',
        icon: 'water',
        items: [
            {
                id: 'requisitos',
                question: 'O que preciso para poder doar sangue?',
                answer: [
                    'Ter entre 16 e 69 anos de idade',
                    'Pesar acima de 50kg',
                    'Apresentar documento com foto válido em todo território nacional'
                ]
            },
            {
                id: 'recomendacoes',
                question: 'Quais são as recomendações para o dia da doação?',
                answer: [
                    'Nunca vá doar sangue em jejum',
                    'Faça um repouso mínimo de 6 horas na noite anterior à doação',
                    'Não ingira bebida alcoólica nas 12 horas anteriores',
                    'Evite fumar por pelo menos 2 horas antes da doação',
                    'Evite alimentos gordurosos nas 3 horas antecedentes à doação'
                ]
            },
            {
                id: 'impedimentos',
                question: 'Quem não pode doar sangue?',
                answer: [
                    'Quem teve diagnóstico de hepatite após os 11 anos de idade',
                    'Mulheres grávidas ou que estejam amamentando',
                    'Pessoas que estão expostas a doenças transmissíveis pelo sangue, como AIDS, Hepatite, Sífilis e doença de Chagas',
                    'Usuários de drogas',
                    'Pessoas que fizeram tatuagens ou colocaram piercing em locais não controlados pela Vigilância Sanitária nos últimos 12 meses',
                    'Aqueles que tiveram relacionamento sexual com parceiro desconhecido ou eventual, sem uso de preservativo, nos últimos 12 meses'
                ]
            },
            {
                id: 'processamento',
                question: 'O que acontece com o sangue após a doação?',
                answer: 'Todo sangue doado é separado em diferentes componentes como Hemácias, Plaquetas, Plasma e Crio. E assim poderá beneficiar mais de um paciente com apenas uma unidade coletada. Os componentes são distribuídos aos hospitais para atender casos de emergência e pacientes internados.'
            },
            {
                id: 'frequencia',
                question: 'Com que frequência posso doar sangue?',
                answer: [
                    'Homens podem doar a cada 2 meses, até 4 vezes por ano',
                    'Mulheres podem doar a cada 3 meses, até 3 vezes por ano'
                ]
            },
            {
                id: 'processo',
                question: 'Como funciona o processo de doação?',
                answer: [
                    'Cadastro e triagem clínica (avaliação de saúde)',
                    'Teste de anemia e verificação de sinais vitais',
                    'Coleta do sangue (cerca de 10-15 minutos)',
                    'Lanche após a doação',
                    'Repouso de 15 minutos antes de sair'
                ]
            },
            {
                id: 'tempo',
                question: 'Quanto tempo demora para doar sangue?',
                answer: 'Todo o processo, desde o cadastro até a liberação, leva em média de 40 a 60 minutos. A coleta em si dura apenas 10 a 15 minutos.'
            },
            {
                id: 'beneficios',
                question: 'Quais os benefícios de doar sangue?',
                answer: [
                    'Salva vidas - uma doação pode ajudar até 4 pessoas',
                    'Check-up gratuito - exames de sangue são realizados',
                    'Sensação de bem-estar por ajudar o próximo',
                    'Renovação das células sanguíneas',
                    'Queima calorias (cerca de 650 calorias por doação)'
                ]
            },
            {
                id: 'locais',
                question: 'Onde posso doar sangue?',
                answer: [
                    'Posto Sede: Av. Professor José Bonifácio Fortes Neto, 400 - Capucho, Aracaju/SE',
                    'Horário: Segunda a sexta-feira, das 7h30 às 17h',
                    'Agendamento:',
                    '• Hemose (Unidade Aracaju): (79) 3225-8000',
                    '• Telefone para doação/agendamento: (79) 3225-8039',
                    '• Sede administrativa: (79) 3259-3191',
                    'Email: ssocial.hemose@fsph.se.gov.br',
                    'Posto Shopping Jardins: Em frente ao CAC (temporário até 28/11/2025)',
                    'Horário Shopping: Segunda a sexta-feira, das 13h às 18h'
                ]
            },
            {
                id: 'primeiraveez',
                question: 'É minha primeira vez doando. O que devo saber?',
                answer: [
                    'Chegue com antecedência para o cadastro',
                    'Traga um documento oficial com foto',
                    'Responda honestamente ao questionário de triagem',
                    'Não tenha medo - o procedimento é seguro e rápido',
                    'Após a doação, descanse 15 minutos e tome o lanche oferecido',
                    'Beba bastante água nas próximas horas'
                ]
            },
            {
                id: 'agendamento',
                question: 'Como posso agendar minha doação?',
                answer: [
                    'Pelo telefone:',
                    '• Hemose (Unidade Aracaju): (79) 3225-8000',
                    '• Telefone para doação/agendamento: (79) 3225-8039',
                    '• Sede administrativa: (79) 3259-3191',
                    'Pelo email: ssocial.hemose@fsph.se.gov.br',
                    'Através do aplicativo FSPH (seção Doar)',
                    'Presencialmente no Posto Sede'
                ]
            }
        ]
    },
    {
        id: 'medula',
        title: 'Medula Óssea',
        icon: 'heart',
        items: [
            {
                id: 'dados_redome',
                question: 'Seus dados vão para o REDOME',
                answer: 'Suas informações genéticas (tipagem HLA) são incluídas no Registro Nacional de Doadores Voluntários de Medula Óssea (REDOME). O registro é acessado por equipes médicas que buscam doadores compatíveis para pacientes em todo o Brasil e no exterior.'
            },
            {
                id: 'compatibilidade',
                question: 'Busca por compatibilidade de doação',
                answer: 'Sempre que um paciente precisar de um transplante, sua tipagem genética será comparada com os dados do REDOME. A compatibilidade é rara, podendo ocorrer apenas com um ou outro doador em um universo de milhares.'
            },
            {
                id: 'exames_complementares',
                question: 'Exames Complementares',
                answer: 'Caso concorde, você realizará novos exames para confirmar a compatibilidade e avaliar sua saúde anterior.'
            },
            {
                id: 'processo_doacao',
                question: 'Doação',
                answer: 'A doação será realizada em um hospital especializado, com acompanhamento de uma equipe médica. O processo é geral, dura, em média, algumas horas.'
            },
            {
                id: 'compromisso_vida',
                question: 'Ser doador de medula óssea é mais do que um gesto: É um compromisso com a vida.',
                answer: 'Este é um compromisso sério com a vida de outras pessoas que precisam de sua ajuda.'
            },
            {
                id: 'processo_rapido',
                question: 'Rápido e sem complicações!',
                answer: [
                    'Basta preencher um formulário com seus dados pessoais e agendar um dia para coletar uma pequena amostra de sangue (10ml) para testes genéticos',
                    'Não precisa estar em jejum',
                    'Você pode se alimentar normalmente antes de ir ao HEMOSE ou local de coleta selecionado',
                    'Tudo isso leva apenas alguns minutos!'
                ]
            },
            {
                id: 'quem_pode_cadastrar',
                question: 'Quem pode se cadastrar?',
                answer: 'Pessoas entre 18 e 35 anos, em bom estado de saúde, podem se cadastrar como doadoras de medula óssea.'
            },
            {
                id: 'importante_saber',
                question: 'Importante saber',
                answer: 'Se cadastrar não significa doar imediatamente. Você só será chamado para doar caso seja compatível com um paciente — o que pode acontecer em semanas, anos... ou nunca. Mas, se acontecer, é porque você pode ser a única esperança de alguém.'
            }
        ]
    }
];

export default function FAQScreen() {
    const router = useRouter();
    const [selectedCategory, setSelectedCategory] = useState('sangue');
    const [expandedItems, setExpandedItems] = useState<{ [key: string]: boolean }>({});
    const [userQuestion, setUserQuestion] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [submittedQuestion, setSubmittedQuestion] = useState(''); const toggleExpand = (id: string) => {
        setExpandedItems(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const handleSubmitQuestion = async () => {
        if (!userQuestion.trim()) {
            Alert.alert('Atenção', 'Por favor, digite sua pergunta antes de enviar.');
            return;
        }

        setIsSubmitting(true);

        try {
            // TODO: Integrar com API para enviar pergunta
            // const response = await apiService.submitUserQuestion(userQuestion);

            // Simular envio da pergunta
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Salvar pergunta enviada e mostrar tela de confirmação
            setSubmittedQuestion(userQuestion);
            setUserQuestion('');
            setShowConfirmation(true);
        } catch (error) {
            Alert.alert('Erro', 'Não foi possível enviar sua pergunta. Tente novamente mais tarde.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderAnswer = (answer: string | string[]) => {
        if (Array.isArray(answer)) {
            return (
                <View style={styles.answerContainer}>
                    {answer.map((item, index) => (
                        <View key={index} style={styles.listItem}>
                            <Text style={styles.bullet}>•</Text>
                            <Text style={styles.answerText}>{item}</Text>
                        </View>
                    ))}
                </View>
            );
        }
        return (
            <View style={styles.answerContainer}>
                <Text style={styles.answerText}>{answer}</Text>
            </View>
        );
    };

    const currentCategory = FAQ_CATEGORIES.find(cat => cat.id === selectedCategory);
    const currentFAQData = currentCategory?.items || [];

    const filteredFAQData = currentFAQData.filter((item) => {
        if (!searchQuery.trim()) return true;

        const searchLower = searchQuery.toLowerCase();
        const questionMatch = item.question.toLowerCase().includes(searchLower);

        let answerMatch = false;
        if (Array.isArray(item.answer)) {
            answerMatch = item.answer.some((ans: string) => ans.toLowerCase().includes(searchLower));
        } else {
            answerMatch = item.answer.toLowerCase().includes(searchLower);
        }

        return questionMatch || answerMatch;
    });

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                style={styles.content}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                    {/* Category Selector */}
                    <View style={styles.categorySelector}>
                        {FAQ_CATEGORIES.map((category) => (
                            <TouchableOpacity
                                key={category.id}
                                style={[
                                    styles.categoryButton,
                                    selectedCategory === category.id && styles.categoryButtonActive
                                ]}
                                onPress={() => {
                                    setSelectedCategory(category.id);
                                    setSearchQuery(''); // Limpar busca ao trocar categoria
                                }}
                                activeOpacity={0.7}
                            >
                                <Ionicons
                                    name={category.icon as any}
                                    size={20}
                                    color={selectedCategory === category.id ? 'white' : '#E73645'}
                                />
                                <Text style={[
                                    styles.categoryButtonText,
                                    selectedCategory === category.id && styles.categoryButtonTextActive
                                ]}>
                                    {category.title}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Search Bar */}
                    <View style={styles.searchContainer}>
                        <View style={styles.searchInputContainer}>
                            <Ionicons name="search-outline" size={20} color="#9CA3AF" />
                            <TextInput
                                style={styles.searchInput}
                                placeholder={`Buscar em ${currentCategory?.title || 'perguntas frequentes'}...`}
                                placeholderTextColor="#9CA3AF"
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                            />
                            {searchQuery.length > 0 && (
                                <TouchableOpacity onPress={() => setSearchQuery('')}>
                                    <Ionicons name="close-circle" size={20} color="#9CA3AF" />
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    {/* Results Counter */}
                    {searchQuery.trim() && filteredFAQData.length > 0 && (
                        <View style={styles.resultsCounter}>
                            <Text style={styles.resultsCounterText}>
                                {filteredFAQData.length} {filteredFAQData.length === 1 ? 'resultado encontrado' : 'resultados encontrados'}
                            </Text>
                        </View>
                    )}

                    {/* FAQ Items */}
                    <View style={styles.faqContainer}>
                        {filteredFAQData.length === 0 && searchQuery.trim() ? (
                            <View style={styles.noResultsContainer}>
                                <Ionicons name="search-outline" size={48} color="#9CA3AF" />
                                <Text style={styles.noResultsTitle}>Nenhum resultado encontrado</Text>
                                <Text style={styles.noResultsText}>
                                    {`Não encontramos perguntas sobre "${searchQuery}" na categoria ${currentCategory?.title}.\n\nTente usar termos diferentes, verificar a outra categoria ou faça sua pergunta na seção abaixo.`}
                                </Text>
                            </View>
                        ) : (
                            filteredFAQData.map((item, index) => (
                                <View key={item.id} style={styles.faqItem}>
                                    <TouchableOpacity
                                        style={styles.questionContainer}
                                        onPress={() => toggleExpand(item.id)}
                                        activeOpacity={0.7}
                                    >
                                        <View style={styles.questionContent}>
                                            <View style={styles.questionNumberContainer}>
                                                <Text style={styles.questionNumber}>{index + 1}</Text>
                                            </View>
                                            <Text style={styles.questionText}>{item.question}</Text>
                                            <Ionicons
                                                name={expandedItems[item.id] ? "chevron-up" : "chevron-down"}
                                                size={20}
                                                color="#E73645"
                                            />
                                        </View>
                                    </TouchableOpacity>

                                    {expandedItems[item.id] && renderAnswer(item.answer)}
                                </View>
                            ))
                        )}
                    </View>

                    {/* User Question Section */}
                    <View style={styles.userQuestionSection}>
                        <View style={styles.userQuestionHeader}>
                            <Ionicons name="help-circle-outline" size={24} color="#E73645" />
                            <Text style={styles.userQuestionTitle}>Sua pergunta não está aqui?</Text>
                        </View>

                        <Text style={styles.userQuestionSubtitle}>
                            Pergunte-nos! Nossa equipe responderá sua dúvida em breve.
                        </Text>

                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.textInput}
                                placeholder="Digite sua pergunta aqui..."
                                placeholderTextColor="#9CA3AF"
                                value={userQuestion}
                                onChangeText={setUserQuestion}
                                multiline
                                numberOfLines={4}
                                textAlignVertical="top"
                                maxLength={500}
                            />
                            <Text style={styles.characterCount}>
                                {userQuestion.length}/500 caracteres
                            </Text>
                        </View>

                        <TouchableOpacity
                            style={[
                                styles.submitButton,
                                (!userQuestion.trim() || isSubmitting) && styles.submitButtonDisabled
                            ]}
                            onPress={handleSubmitQuestion}
                            disabled={!userQuestion.trim() || isSubmitting}
                            activeOpacity={0.8}
                        >
                            {isSubmitting ? (
                                <View style={styles.submitButtonContent}>
                                    <Ionicons name="sync" size={18} color="white" />
                                    <Text style={styles.submitButtonText}>Enviando...</Text>
                                </View>
                            ) : (
                                <View style={styles.submitButtonContent}>
                                    <Ionicons name="paper-plane-outline" size={18} color="white" />
                                    <Text style={styles.submitButtonText}>Enviar Pergunta</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Confirmation Modal */}
            {showConfirmation && (
                <View style={styles.confirmationOverlay}>
                    <View style={styles.confirmationModal}>
                        <View style={styles.confirmationHeader}>
                            <Ionicons name="checkmark-circle" size={48} color="#10B981" />
                            <Text style={styles.confirmationTitle}>Pergunta Enviada!</Text>
                        </View>

                        <View style={styles.questionDisplay}>
                            <Text style={styles.questionDisplayLabel}>Sua pergunta:</Text>
                            <Text style={styles.questionDisplayText}>"{submittedQuestion}"</Text>
                        </View>

                        <Text style={styles.confirmationMessage}>
                            Sua pergunta foi enviada com sucesso. Nossa equipe responderá em breve por email ou através do aplicativo.
                        </Text>

                        <View style={styles.contactInfo}>
                            <Text style={styles.contactInfoTitle}>Você também pode entrar em contato:</Text>
                            <Text style={styles.contactInfoItem}>📧 ouvidoria.fsph@fsph.se.gov.br</Text>
                            <Text style={styles.contactInfoItem}>📞 Hemose (Unidade Aracaju): (79) 3225-8000</Text>
                            <Text style={styles.contactInfoItem}>📞 Telefone para doação/agendamento: (79) 3225-8039</Text>
                            <Text style={styles.contactInfoItem}>📞 Sede administrativa: (79) 3259-3191</Text>
                        </View>

                        <TouchableOpacity
                            style={styles.confirmationButton}
                            onPress={() => setShowConfirmation(false)}
                        >
                            <Text style={styles.confirmationButtonText}>Entendi</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </SafeAreaView >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    content: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    faqContainer: {
        padding: 20,
    },
    faqItem: {
        backgroundColor: 'white',
        borderRadius: 12,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    questionContainer: {
        padding: 16,
    },
    questionContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    questionNumberContainer: {
        backgroundColor: '#E73645',
        borderRadius: 12,
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    questionNumber: {
        color: 'white',
        fontSize: 12,
        fontWeight: '700',
    },
    questionText: {
        flex: 1,
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        marginRight: 12,
    },
    answerContainer: {
        paddingHorizontal: 16,
        paddingBottom: 16,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    listItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    bullet: {
        fontSize: 16,
        color: '#E73645',
        marginRight: 8,
        marginTop: 2,
        fontWeight: '600',
    },
    answerText: {
        flex: 1,
        fontSize: 14,
        color: '#6B7280',
        lineHeight: 20,
    },
    userQuestionSection: {
        backgroundColor: 'white',
        margin: 20,
        marginTop: 0,
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    userQuestionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    userQuestionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
        marginLeft: 8,
    },
    userQuestionSubtitle: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 20,
        lineHeight: 20,
    },
    inputContainer: {
        marginBottom: 20,
    },
    textInput: {
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: '#1F2937',
        backgroundColor: '#FAFAFA',
        minHeight: 100,
    },
    characterCount: {
        fontSize: 12,
        color: '#9CA3AF',
        textAlign: 'right',
        marginTop: 8,
    },
    submitButton: {
        backgroundColor: '#E73645',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
    },
    submitButtonDisabled: {
        backgroundColor: '#D1D5DB',
    },
    submitButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    submitButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    searchContainer: {
        padding: 20,
        paddingBottom: 0,
    },
    searchInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#1F2937',
        marginLeft: 12,
    },
    noResultsContainer: {
        alignItems: 'center',
        padding: 40,
        backgroundColor: 'white',
        borderRadius: 12,
        margin: 20,
        marginTop: 0,
    },
    noResultsTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#6B7280',
        marginTop: 16,
        marginBottom: 8,
    },
    noResultsText: {
        fontSize: 14,
        color: '#9CA3AF',
        textAlign: 'center',
        lineHeight: 20,
    },
    resultsCounter: {
        paddingHorizontal: 20,
        paddingVertical: 10,
    },
    resultsCounterText: {
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '500',
    },
    // Category Selector Styles
    categorySelector: {
        flexDirection: 'row',
        padding: 20,
        paddingBottom: 0,
        gap: 12,
    },
    categoryButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        backgroundColor: 'white',
        borderWidth: 2,
        borderColor: '#E73645',
        gap: 8,
    },
    categoryButtonActive: {
        backgroundColor: '#E73645',
        borderColor: '#E73645',
    },
    categoryButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#E73645',
    },
    categoryButtonTextActive: {
        color: 'white',
    },
    // Confirmation Modal Styles
    confirmationOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    confirmationModal: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 24,
        width: '100%',
        maxWidth: 400,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 8,
    },
    confirmationHeader: {
        alignItems: 'center',
        marginBottom: 20,
    },
    confirmationTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1F2937',
        marginTop: 12,
        textAlign: 'center',
    },
    questionDisplay: {
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
    },
    questionDisplayLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280',
        marginBottom: 8,
    },
    questionDisplayText: {
        fontSize: 16,
        color: '#1F2937',
        fontStyle: 'italic',
        lineHeight: 22,
    },
    confirmationMessage: {
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 20,
    },
    contactInfo: {
        backgroundColor: '#FEF3F2',
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
    },
    contactInfoTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#B91C1C',
        marginBottom: 8,
    },
    contactInfoItem: {
        fontSize: 14,
        color: '#DC2626',
        marginBottom: 4,
    },
    confirmationButton: {
        backgroundColor: '#E73645',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
    },
    confirmationButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
});