import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  Image,
  FlatList,
  TouchableOpacity,
  Linking,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Animated } from 'react-native';
import { Colors } from '../../constants/Colors';
import apiService from '../../services/api';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import * as HEMOSE from '../../services/hemose';
import { useAuth } from '../../contexts/AuthContext';

// Lista de DDDs do Brasil
const DDD_LIST = [
  { code: '11', state: 'SP', city: 'São Paulo' },
  { code: '12', state: 'SP', city: 'São José dos Campos' },
  { code: '13', state: 'SP', city: 'Santos' },
  { code: '14', state: 'SP', city: 'Bauru' },
  { code: '15', state: 'SP', city: 'Sorocaba' },
  { code: '16', state: 'SP', city: 'Ribeirão Preto' },
  { code: '17', state: 'SP', city: 'São José do Rio Preto' },
  { code: '18', state: 'SP', city: 'Presidente Prudente' },
  { code: '19', state: 'SP', city: 'Campinas' },
  { code: '21', state: 'RJ', city: 'Rio de Janeiro' },
  { code: '22', state: 'RJ', city: 'Campos dos Goytacazes' },
  { code: '24', state: 'RJ', city: 'Volta Redonda' },
  { code: '27', state: 'ES', city: 'Vitória' },
  { code: '28', state: 'ES', city: 'Cachoeiro do Itapemirim' },
  { code: '31', state: 'MG', city: 'Belo Horizonte' },
  { code: '32', state: 'MG', city: 'Juiz de Fora' },
  { code: '33', state: 'MG', city: 'Governador Valadares' },
  { code: '34', state: 'MG', city: 'Uberlândia' },
  { code: '35', state: 'MG', city: 'Poços de Caldas' },
  { code: '37', state: 'MG', city: 'Divinópolis' },
  { code: '38', state: 'MG', city: 'Montes Claros' },
  { code: '41', state: 'PR', city: 'Curitiba' },
  { code: '42', state: 'PR', city: 'Ponta Grossa' },
  { code: '43', state: 'PR', city: 'Londrina' },
  { code: '44', state: 'PR', city: 'Maringá' },
  { code: '45', state: 'PR', city: 'Foz do Iguaçu' },
  { code: '46', state: 'PR', city: 'Francisco Beltrão' },
  { code: '47', state: 'SC', city: 'Joinville' },
  { code: '48', state: 'SC', city: 'Florianópolis' },
  { code: '49', state: 'SC', city: 'Chapecó' },
  { code: '51', state: 'RS', city: 'Porto Alegre' },
  { code: '53', state: 'RS', city: 'Pelotas' },
  { code: '54', state: 'RS', city: 'Caxias do Sul' },
  { code: '55', state: 'RS', city: 'Santa Maria' },
  { code: '61', state: 'DF', city: 'Brasília' },
  { code: '62', state: 'GO', city: 'Goiânia' },
  { code: '63', state: 'TO', city: 'Palmas' },
  { code: '64', state: 'GO', city: 'Rio Verde' },
  { code: '65', state: 'MT', city: 'Cuiabá' },
  { code: '66', state: 'MT', city: 'Rondonópolis' },
  { code: '67', state: 'MS', city: 'Campo Grande' },
  { code: '68', state: 'AC', city: 'Rio Branco' },
  { code: '69', state: 'RO', city: 'Porto Velho' },
  { code: '71', state: 'BA', city: 'Salvador' },
  { code: '73', state: 'BA', city: 'Ilhéus' },
  { code: '74', state: 'BA', city: 'Juazeiro' },
  { code: '75', state: 'BA', city: 'Feira de Santana' },
  { code: '77', state: 'BA', city: 'Vitória da Conquista' },
  { code: '79', state: 'SE', city: 'Aracaju' },
  { code: '81', state: 'PE', city: 'Recife' },
  { code: '82', state: 'AL', city: 'Maceió' },
  { code: '83', state: 'PB', city: 'João Pessoa' },
  { code: '84', state: 'RN', city: 'Natal' },
  { code: '85', state: 'CE', city: 'Fortaleza' },
  { code: '86', state: 'PI', city: 'Teresina' },
  { code: '87', state: 'PE', city: 'Petrolina' },
  { code: '88', state: 'CE', city: 'Juazeiro do Norte' },
  { code: '89', state: 'PI', city: 'Picos' },
  { code: '91', state: 'PA', city: 'Belém' },
  { code: '92', state: 'AM', city: 'Manaus' },
  { code: '93', state: 'PA', city: 'Santarém' },
  { code: '94', state: 'PA', city: 'Marabá' },
  { code: '95', state: 'RR', city: 'Boa Vista' },
  { code: '96', state: 'AP', city: 'Macapá' },
  { code: '97', state: 'AM', city: 'Tefé' },
  { code: '98', state: 'MA', city: 'São Luís' },
  { code: '99', state: 'MA', city: 'Imperatriz' },
];

// Funções auxiliares para máscaras
const formatCPF = (value: string) => {
  // Remove tudo que não é número
  const numbers = value.replace(/\D/g, '');

  // Aplica a máscara 000.000.000-00
  if (numbers.length <= 3) {
    return numbers;
  } else if (numbers.length <= 6) {
    return numbers.replace(/(\d{3})(\d+)/, '$1.$2');
  } else if (numbers.length <= 9) {
    return numbers.replace(/(\d{3})(\d{3})(\d+)/, '$1.$2.$3');
  } else {
    return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d+)/, '$1.$2.$3-$4');
  }
};

const formatPhone = (value: string) => {
  // Remove tudo que não é número
  const numbers = value.replace(/\D/g, '');

  // Se não há números, retorna apenas o padrão base
  if (numbers.length === 0) {
    return '+55 (79) ';
  }

  // Limita a 9 dígitos (celular com 9º dígito)
  const phoneNumber = numbers.slice(0, 9);

  // Se tem até 5 dígitos, sem hífen
  if (phoneNumber.length <= 5) {
    return `+55 (79) ${phoneNumber}`;
  }

  // Se tem mais de 5 dígitos, adiciona hífen
  const firstPart = phoneNumber.slice(0, 5);
  const secondPart = phoneNumber.slice(5);
  return `+55 (79) ${firstPart}-${secondPart}`;
};

// Nova função para formatar apenas o número sem prefixo
const formatPhoneNumber = (value: string) => {
  // Remove tudo que não é número
  const numbers = value.replace(/\D/g, '');

  // Limita a 9 dígitos
  const phoneNumber = numbers.slice(0, 9);

  // Se tem até 5 dígitos, sem hífen
  if (phoneNumber.length <= 5) {
    return phoneNumber;
  }

  // Se tem mais de 5 dígitos, adiciona hífen
  const firstPart = phoneNumber.slice(0, 5);
  const secondPart = phoneNumber.slice(5);
  return `${firstPart}-${secondPart}`;
}; const getCleanCPF = (maskedCPF: string) => {
  return maskedCPF.replace(/\D/g, '');
};

const getCleanPhone = (maskedPhone: string) => {
  const numbers = maskedPhone.replace(/\D/g, '');
  // Remove o código do país (55) se presente
  if (numbers.length >= 13 && numbers.startsWith('55')) {
    return numbers.slice(2);
  }
  return numbers;
};

export default function DoarScreen() {
  const [cpf, setCpf] = useState('');
  const [loading, setLoading] = useState(false);
  const [doador, setDoador] = useState<any | null>(null);
  const [agendamentos, setAgendamentos] = useState<any[] | null>(null);
  const RED = '#E73645';
  const [modalVisible, setModalVisible] = useState(false);
  const [step, setStep] = useState(0);
  const [agendamentoType, setAgendamentoType] = useState<'D' | 'M' | 'C' | null>(null);
  const [phoneNumber, setPhoneNumber] = useState(''); // Número sem prefixo
  const [organizadorPhoneNumber, setOrganizadorPhoneNumber] = useState(''); // Número do organizador sem prefixo

  // Estados para seletores
  const [selectedDDD, setSelectedDDD] = useState('79'); // DDD padrão de Sergipe
  const [selectedOrgDDD, setSelectedOrgDDD] = useState('79'); // DDD do organizador
  const [showDDDPicker, setShowDDDPicker] = useState(false);
  const [showOrgDDDPicker, setShowOrgDDDPicker] = useState(false);
  const [showSexPicker, setShowSexPicker] = useState(false);
  const [selectedSex, setSelectedSex] = useState<'M' | 'F' | null>(null);

  const [formData, setFormData] = useState<any>({
    doador_nome: '',
    doador_dt_nascimento: '',
    doador_email: '',
    doador_cpf: '',
    doador_telefone: '+55 (79) ',
    doador_sexo: '',
    id_bloco_doacao: null,
  });
  const { user, token } = useAuth() as any;

  // modal de confirmação
  const [confirmationVisible, setConfirmationVisible] = useState(false);
  const confirmAnim = useRef(new Animated.Value(0)).current; // 0..1
  const [confirmationPayload, setConfirmationPayload] = useState<any>(null);
  const [sendingNotifications, setSendingNotifications] = useState(false);
  const [systemUsed, setSystemUsed] = useState<'hemose' | 'local' | null>(null);
  const [campaignForm, setCampaignForm] = useState<any>({
    organizador_cpf: '',
    organizador_nome: '',
    organizador_dt_nascimento: '',
    organizador_email: '',
    organizador_telefone: '+55 (79) ',
    quantidade_doadores: '',
  });
  const [preTriagem, setPreTriagem] = useState<any>({
    primeiraVez: null,
    pesaMais50: null,
    tatuagemRecente: null,
    sexo: null,
    gravidaOuAmamentando: null,
  });
  const [validationAttempted, setValidationAttempted] = useState(false);
  const [touchedForm, setTouchedForm] = useState<{ [k: string]: boolean }>({});
  const [touchedCampaign, setTouchedCampaign] = useState<{ [k: string]: boolean }>({});
  const [dobPickerVisible, setDobPickerVisible] = useState(false);
  const [dobPickerFor, setDobPickerFor] = useState<'donor' | 'campaign' | null>(null);
  const [dobTempSelected, setDobTempSelected] = useState<string | null>(null);
  const [dobCalendarCurrent, setDobCalendarCurrent] = useState<string | null>(null);
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [cidades, setCidades] = useState<any[]>([]);

  const [donorDobDisplay, setDonorDobDisplay] = useState<string>('');
  const [campaignDobDisplay, setCampaignDobDisplay] = useState<string>('');


  const HARDCODED_LOCAIS = [
    {
      id: 'posto_sede',
      nome: 'Posto Sede',
      endereco: 'Av. Professor José Bonifácio Fortes Neto, 400 - Bloco 01 - Capucho, Aracaju/SE.',
      latitude: -10.9449,
      longitude: -37.0663,
      horario: 'Segunda a sexta-feira, das 7h30 às 17h.',
      agendamento: 'Disponível pelo telefone (79) 3225-8019 e 3225-8039, pelo site do HEMOSE ou pelo e-mail ssocial.hemose@fsph.se.gov.br.',
    },
    {
      id: 'posto_shopping_jardins',
      nome: 'Posto Shopping Jardins',
      endereco: 'Em frente ao centro de atendimento ao cliente (CAC).',
      latitude: -10.9505,
      longitude: -37.0720,
      horario: 'Segunda a sexta-feira, das 13h às 18h.',
      observacao: 'Este posto é temporário e funcionará apenas até 28 de novembro de 2025.',
    }
  ];


  LocaleConfig.locales['pt-br'] = {
    monthNames: ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'],
    monthNamesShort: ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'],
    dayNames: ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'],
    dayNamesShort: ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'],
    today: 'Hoje'
  };

  const handleNextAnimated = () => {
    try {
      Animated.sequence([
        Animated.timing(nextAnim.current, { toValue: 1, duration: 120, useNativeDriver: true }),
        Animated.timing(nextAnim.current, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    } catch (e) {
    }
    handleNext();
  };
  LocaleConfig.defaultLocale = 'pt-br';

  LocaleConfig.firstDay = 1;
  const [locais, setLocais] = useState<any[]>([]);
  const [blocosDates, setBlocosDates] = useState<any[]>([]);
  const [blocosByDate, setBlocosByDate] = useState<any[]>([]);
  const [selectedCidade, setSelectedCidade] = useState<any>(null);
  const [selectedLocal, setSelectedLocal] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedHorario, setSelectedHorario] = useState<any>(null);
  const [loadingHorarios, setLoadingHorarios] = useState(false);
  const [postosModalVisible, setPostosModalVisible] = useState(false);
  const [infoModalVisible, setInfoModalVisible] = useState(false);
  const [expandedInfo, setExpandedInfo] = useState<{ [key: string]: boolean }>({});
  const [localDetailsVisible, setLocalDetailsVisible] = useState(false);
  const [localDetails, setLocalDetails] = useState<any | null>(null);


  const scalesRef = useRef<{ [k: string]: Animated.Value }>({
    D: new Animated.Value(1),
    C: new Animated.Value(1),
    M: new Animated.Value(1),
  }).current;


  const animRef = useRef<{ [k: string]: Animated.Value }>({}).current;


  const nextAnim = useRef(new Animated.Value(0));

  // Função para alternar seções do modal de informações
  const toggleInfoSection = (section: string) => {
    setExpandedInfo(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Função para calcular idade baseada na data de nascimento
  const calcularIdade = (dtNascimento: string) => {
    if (!dtNascimento) return 0;
    const hoje = new Date();
    const nascimento = new Date(dtNascimento);
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const mesAtual = hoje.getMonth();
    const diaAtual = hoje.getDate();

    if (mesAtual < nascimento.getMonth() || (mesAtual === nascimento.getMonth() && diaAtual < nascimento.getDate())) {
      idade--;
    }

    return idade;
  };

  // Função para validar pré-triagem e mostrar impedimentos específicos
  const validarPreTriagem = () => {
    const impedimentos = [];

    // Verificar idade (precisa da data de nascimento do step 2)
    if (formData.doador_dt_nascimento) {
      const idade = calcularIdade(formData.doador_dt_nascimento);
      if (idade < 16 || idade > 69) {
        impedimentos.push('Idade fora da faixa permitida (16 a 69 anos)');
      }
    }

    // Verificar peso
    if (preTriagem.pesaMais50 === false) {
      impedimentos.push('Peso abaixo de 50kg');
    }

    // Verificar tatuagem recente
    if (preTriagem.tatuagemRecente === true) {
      impedimentos.push('Tatuagem ou piercing recente (últimos 12 meses)');
    }

    // Verificar gravidez/amamentação para mulheres
    if (preTriagem.sexo === 'F' && preTriagem.gravidaOuAmamentando === true) {
      impedimentos.push('Gravidez ou amamentação');
    }

    return impedimentos;
  };


  const yearListRef = useRef<any>(null);
  const [yearItemHeight, setYearItemHeight] = useState<number>(0);
  const MIN_YEAR = 1900;


  useEffect(() => {
    if (!showYearPicker) return;
    const currentYear = new Date().getFullYear();
    const selectedYear = dobCalendarCurrent ? parseInt(dobCalendarCurrent.slice(0, 4), 10) : currentYear;
    let index = currentYear - selectedYear;
    const maxIndex = currentYear - MIN_YEAR;
    if (index < 0) index = 0;
    if (index > maxIndex) index = maxIndex;

    const t = setTimeout(() => {
      const itemH = yearItemHeight || 40;
      try {
        yearListRef.current?.scrollToIndex({ index, animated: true });
      } catch (e) {
        yearListRef.current?.scrollToOffset({ offset: index * itemH, animated: true });
      }
    }, 80);
    return () => clearTimeout(t);
  }, [showYearPicker, dobCalendarCurrent]);

  const groups: { [k: string]: string[] } = {
    primeiraVez: ['primeiraVez_true', 'primeiraVez_false'],
    pesaMais50: ['pesaMais50_true', 'pesaMais50_false'],
    tatuagemRecente: ['tatuagemRecente_true', 'tatuagemRecente_false'],
    sexo: ['sexo_M', 'sexo_F'],
    gravidaOuAmamentando: ['gravida_true', 'gravida_false'],
  };

  const ensureAnim = (key: string) => {
    if (!animRef[key]) animRef[key] = new Animated.Value(0);
    return animRef[key];
  };


  const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

  const animateGroup = (groupKey: string, selectedKey: string) => {
    const keys = groups[groupKey] || [];
    const toAnims = keys.map(k => {
      const v = ensureAnim(k);
      return Animated.timing(v, { toValue: k === selectedKey ? 1 : 0, duration: 240, useNativeDriver: false });
    });
    Animated.parallel(toAnims).start();
  };


  useEffect(() => {
    if (step !== 1) return;

    if (preTriagem.primeiraVez !== null) animateGroup('primeiraVez', `primeiraVez_${preTriagem.primeiraVez ? 'true' : 'false'}`);
    if (preTriagem.pesaMais50 !== null) animateGroup('pesaMais50', `pesaMais50_${preTriagem.pesaMais50 ? 'true' : 'false'}`);
    if (preTriagem.tatuagemRecente !== null) animateGroup('tatuagemRecente', `tatuagemRecente_${preTriagem.tatuagemRecente ? 'true' : 'false'}`);
    if (preTriagem.sexo) animateGroup('sexo', `sexo_${preTriagem.sexo}`);
    if (preTriagem.gravidaOuAmamentando !== null) animateGroup('gravidaOuAmamentando', `gravida_${preTriagem.gravidaOuAmamentando ? 'true' : 'false'}`);
  }, [step]);

  const animateSelect = (type: 'D' | 'C' | 'M') => {
    const v = scalesRef[type];
    if (!v) return;
    Animated.sequence([
      Animated.timing(v, { toValue: 1.06, duration: 140, useNativeDriver: true }),
      Animated.timing(v, { toValue: 1.0, duration: 120, useNativeDriver: true }),
    ]).start();
  };

  // Confirmation and notification functions
  const formatConfirmationMessage = (payload: any) => {
    const type = payload.tipo === 'D' ? 'Doação de Sangue' : payload.tipo === 'M' ? 'Cadastro de Medula Óssea' : 'Campanha';
    const name = payload.doador_nome || payload.organizador_nome;
    const local = selectedLocal?.nome || 'Local não especificado';
    const date = selectedDate ? new Date(selectedDate).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '';
    const time = selectedHorario?.hora || '';

    return `✅ Agendamento Confirmado!\n\nTipo: ${type}\nNome: ${name}\nLocal: ${local}\nData: ${date}\nHorário: ${time}\n\nObrigado por salvar vidas! ❤️`;
  };

  const sendNotifications = async (payload: any) => {
    setSendingNotifications(true);
    try {
      // 1. Push notification via backend local (sempre confiável)
      if (user && token) {
        try {
          await apiService.sendNotification({
            idUsuario: user.id,
            titulo: '🩸 Agendamento Confirmado',
            corpo: 'Seu agendamento foi confirmado com sucesso! Obrigado por salvar vidas.'
          });
          console.log('✅ Push notification enviada via backend local');
        } catch (err) {
          console.log('❌ Falha na push notification:', err);
        }
      }

      // 2. SMS and WhatsApp via Linking
      const message = formatConfirmationMessage(payload);
      const phone = getCleanPhone(payload.doador_telefone || payload.organizador_telefone || '');

      if (phone) {
        // WhatsApp
        const whatsappUrl = `whatsapp://send?phone=+55${phone}&text=${encodeURIComponent(message)}`;

        // SMS
        const smsUrl = Platform.select({
          ios: `sms:+55${phone}&body=${encodeURIComponent(message)}`,
          android: `sms:+55${phone}?body=${encodeURIComponent(message)}`
        });

        Alert.alert(
          '📱 Confirmar Envios',
          'Deseja receber confirmação por WhatsApp e SMS?',
          [
            { text: 'Não', style: 'cancel' },
            {
              text: 'WhatsApp',
              onPress: () => Linking.openURL(whatsappUrl).catch(() => Alert.alert('WhatsApp não encontrado'))
            },
            {
              text: 'SMS',
              onPress: () => Linking.openURL(smsUrl!).catch(() => Alert.alert('SMS não disponível'))
            },
            {
              text: 'Ambos',
              onPress: async () => {
                try {
                  await Linking.openURL(whatsappUrl);
                  setTimeout(() => Linking.openURL(smsUrl!), 1000);
                } catch {
                  Alert.alert('Erro ao abrir aplicativos de mensagem');
                }
              }
            }
          ]
        );
      }

      // 3. Email via mailto
      const email = payload.doador_email || payload.organizador_email;
      if (email) {
        const emailUrl = `mailto:${email}?subject=${encodeURIComponent('Confirmação de Agendamento - HEMOSE')}&body=${encodeURIComponent(message)}`;
        setTimeout(() => {
          Alert.alert(
            '📧 Enviar por Email?',
            'Deseja enviar confirmação por email?',
            [
              { text: 'Não', style: 'cancel' },
              { text: 'Sim', onPress: () => Linking.openURL(emailUrl).catch(() => Alert.alert('Email não configurado')) }
            ]
          );
        }, 2000);
      }

    } catch (err) {
      console.error('Error sending notifications:', err);
    } finally {
      setSendingNotifications(false);
    }
  };

  const startConfirmationFlow = (payload: any) => {
    setConfirmationPayload(payload);
    setConfirmationVisible(true);

    // Start droplet animation
    confirmAnim.setValue(0);
    Animated.timing(confirmAnim, {
      toValue: 1,
      duration: 2000,
      useNativeDriver: false
    }).start(() => {
      // After animation completes, send notifications
      sendNotifications(payload);
    });
  };

  const markedDates = useMemo(() => {
    const acc: any = {};
    (blocosDates || []).forEach((d: any) => {
      const dateStr = d.data || d.date || d.day || d;
      if (!dateStr) return;
      acc[dateStr] = { marked: true, dotColor: RED };
    });
    if (selectedDate) {
      acc[selectedDate] = { ...(acc[selectedDate] || {}), selected: true, selectedColor: RED };
    }
    return acc;
  }, [blocosDates, selectedDate]);

  const openGoogleMaps = async (item: any) => {
    try {
      let url = '';
      if (item.latitude && item.longitude) {
        url = `https://www.google.com/maps/search/?api=1&query=${item.latitude},${item.longitude}`;
      } else {
        const q = encodeURIComponent(item.nome || item.endereco || item.descricao || 'posto de coleta');
        url = `https://www.google.com/maps/search/?api=1&query=${q}`;
      }
      await Linking.openURL(url);
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível abrir o mapa');
    }
  };

  const openWaze = async (item: any) => {
    try {
      if (item.latitude && item.longitude) {
        const url = `waze://?ll=${item.latitude},${item.longitude}&navigate=yes`;
        const can = await Linking.canOpenURL(url);
        if (can) {
          await Linking.openURL(url);
          return;
        }
      }
      await openGoogleMaps(item);
    } catch (e) {
      await openGoogleMaps(item);
    }
  };

  const openAppleMaps = async (item: any) => {
    try {
      let url = '';
      if (item.latitude && item.longitude) {
        url = `http://maps.apple.com/?ll=${item.latitude},${item.longitude}`;
      } else {
        const q = encodeURIComponent(item.nome || item.endereco || item.descricao || 'posto de coleta');
        url = `http://maps.apple.com/?q=${q}`;
      }
      await Linking.openURL(url);
    } catch (e) {
      await openGoogleMaps(item);
    }
  };

  const openMapOptions = (item: any) => {
    const buttons: any[] = [];
    buttons.push({ text: 'Google Maps', onPress: () => openGoogleMaps(item) });
    buttons.push({ text: 'Waze', onPress: () => openWaze(item) });
    if (Platform.OS === 'ios') buttons.push({ text: 'Apple Maps', onPress: () => openAppleMaps(item) });
    buttons.push({ text: 'Cancelar', style: 'cancel' });
    Alert.alert('Abrir no mapa', 'Escolha o aplicativo', buttons as any);
  };

  const showLocalDetails = (item: any) => {
    setLocalDetails(item);
    setLocalDetailsVisible(true);
  };

  useEffect(() => {

    (async () => {
      try {
        const res = await apiService.getCidades(1, 1, 1);
        setCidades(res || []);
      } catch (e) {
      }
    })();
  }, []);

  const handleBuscar = async () => {
    if (!cpf || cpf.trim().length < 3) {
      Alert.alert('Digite um CPF válido');
      return;
    }
    setLoading(true);
    try {
      const info = await apiService.getDoadorInfo(cpf.replace(/\D/g, ''));
      const ags = await apiService.getDoadorAgendamentos(cpf.replace(/\D/g, ''));
      setDoador(info);
      setAgendamentos(ags);
    } catch (error: any) {
      console.warn('Erro ao buscar doador', error);
      Alert.alert('Erro', error.message || 'Não foi possível buscar dados');
    } finally {
      setLoading(false);
    }
  };

  const openAgendamentoModal = () => {
    setAgendamentoType(null);
    setPhoneNumber(''); // Limpar o número sem prefixo
    setOrganizadorPhoneNumber(''); // Limpar o número do organizador sem prefixo
    setSelectedDDD('79'); // Reset para DDD padrão de Sergipe
    setSelectedOrgDDD('79'); // Reset para DDD padrão de Sergipe
    setSelectedSex(null); // Reset seleção de sexo
    setShowDDDPicker(false);
    setShowOrgDDDPicker(false);
    setShowSexPicker(false);
    setFormData({
      doador_nome: '',
      doador_dt_nascimento: '',
      doador_email: '',
      doador_cpf: '',
      doador_telefone: '+55 (79) ',
      doador_sexo: '',
      id_bloco_doacao: null,
    });
    setCampaignForm({
      organizador_cpf: '',
      organizador_nome: '',
      organizador_dt_nascimento: '',
      organizador_email: '',
      organizador_telefone: '+55 (79) ',
      quantidade_doadores: '',
    });
    setPreTriagem({
      primeiraVez: null,
      pesaMais50: null,
      tatuagemRecente: null,
      sexo: null,
      gravidaOuAmamentando: null,
    });
    setValidationAttempted(false);
    setTouchedForm({});
    setTouchedCampaign({});
    setDobPickerVisible(false);
    setDobPickerFor(null);
    setDobTempSelected(null);
    setDobCalendarCurrent(null);
    setShowYearPicker(false);
    setDonorDobDisplay('');
    setCampaignDobDisplay('');
    setSelectedCidade(null);
    setLocais([]);
    setSelectedLocal(null);
    setSelectedDate(null);
    setSelectedHorario(null);
    setBlocosDates([]);
    setBlocosByDate([]);
    setStep(0);
    setModalVisible(true);
  };

  const closeAgendamentoModal = () => {
    setAgendamentoType(null);
    setPhoneNumber(''); // Limpar o número sem prefixo
    setOrganizadorPhoneNumber(''); // Limpar o número do organizador sem prefixo
    setSelectedDDD('79'); // Reset para DDD padrão de Sergipe
    setSelectedOrgDDD('79'); // Reset para DDD padrão de Sergipe
    setSelectedSex(null); // Reset seleção de sexo
    setShowDDDPicker(false);
    setShowOrgDDDPicker(false);
    setShowSexPicker(false);
    setFormData({
      doador_nome: '',
      doador_dt_nascimento: '',
      doador_email: '',
      doador_cpf: '',
      doador_telefone: '+55 (79) ',
      doador_sexo: '',
      id_bloco_doacao: null,
    });
    setCampaignForm({
      organizador_cpf: '',
      organizador_nome: '',
      organizador_dt_nascimento: '',
      organizador_email: '',
      organizador_telefone: '+55 (79) ',
      quantidade_doadores: '',
    });
    setPreTriagem({
      primeiraVez: null,
      pesaMais50: null,
      tatuagemRecente: null,
      sexo: null,
      gravidaOuAmamentando: null,
    });
    setValidationAttempted(false);
    setTouchedForm({});
    setTouchedCampaign({});
    setDobPickerVisible(false);
    setDobPickerFor(null);
    setDobTempSelected(null);
    setDobCalendarCurrent(null);
    setShowYearPicker(false);
    setDonorDobDisplay('');
    setCampaignDobDisplay('');
    setSelectedCidade(null);
    setLocais([]);
    setSelectedLocal(null);
    setSelectedDate(null);
    setSelectedHorario(null);
    setBlocosDates([]);
    setBlocosByDate([]);
    setStep(0);
    setModalVisible(false);
  };


  const handleNext = async () => {

    if (step === 0) {
      if (!agendamentoType) {
        setValidationAttempted(true);
        Alert.alert('Selecione o tipo de agendamento');
        return;
      }

      if (agendamentoType === 'D') setStep(1);
      else setStep(2);
      return;
    }

    if (step === 1) {

      if (preTriagem.primeiraVez === null || preTriagem.pesaMais50 === null || preTriagem.tatuagemRecente === null || preTriagem.sexo === null) {
        setValidationAttempted(true);
        Alert.alert('Responda todas as perguntas da pré-triagem');
        return;
      }
      if (preTriagem.sexo === 'F' && preTriagem.gravidaOuAmamentando === null) {
        setValidationAttempted(true);
        Alert.alert('Por favor, responda se está grávida ou amamentando!');
        return;
      }

      // Verificar impedimentos básicos da pré-triagem
      const impedimentosBasicos = [];

      if (preTriagem.pesaMais50 === false) {
        impedimentosBasicos.push('• Peso abaixo de 50kg');
      }
      if (preTriagem.tatuagemRecente === true) {
        impedimentosBasicos.push('• Tatuagem ou piercing recente (últimos 12 meses)');
      }
      if (preTriagem.sexo === 'F' && preTriagem.gravidaOuAmamentando === true) {
        impedimentosBasicos.push('• Gravidez ou amamentação');
      }

      if (impedimentosBasicos.length > 0) {
        Alert.alert(
          'Impedimento para doação',
          `Infelizmente, você não pode doar sangue no momento devido aos seguintes motivos:\n\n${impedimentosBasicos.join('\n')}\n\nConsulte as informações para doação no botão "Informações para doar" para mais detalhes sobre os critérios.`,
          [
            {
              text: 'Ver Informações',
              onPress: () => {
                setModalVisible(false);
                setTimeout(() => setInfoModalVisible(true), 500);
              }
            },
            {
              text: 'OK',
              style: 'cancel'
            }
          ]
        );
        return;
      }

      setStep(2);
      setValidationAttempted(false);
      return;
    }

    if (step === 2) {

      if (agendamentoType === 'C') {
        const missing = [
          'organizador_cpf', 'organizador_nome', 'organizador_dt_nascimento', 'organizador_email', 'organizador_telefone', 'quantidade_doadores'
        ].filter(k => !campaignForm[k]);
        if (missing.length) {
          setValidationAttempted(true);
          Alert.alert('Preencha todos os campos da campanha antes de continuar');
          return;
        }
      } else {
        const missing = [
          'doador_nome', 'doador_cpf', 'doador_dt_nascimento', 'doador_email', 'doador_telefone', 'doador_sexo'
        ].filter(k => !(formData as any)[k]);
        if (missing.length) {
          setValidationAttempted(true);
          Alert.alert('Preencha todos os dados do doador antes de continuar');
          return;
        }

        // Validar idade baseada na data de nascimento
        const idade = calcularIdade(formData.doador_dt_nascimento);
        if (idade < 16 || idade > 69) {
          Alert.alert(
            'Idade não permitida para doação',
            `Para doar sangue, é necessário ter entre 16 e 69 anos de idade. Sua idade atual é de ${idade} anos.\n\nConsulte as informações para doação para mais detalhes sobre os critérios.`,
            [
              {
                text: 'Ver Informações',
                onPress: () => {
                  setModalVisible(false);
                  setTimeout(() => setInfoModalVisible(true), 500);
                }
              },
              {
                text: 'OK',
                style: 'cancel'
              }
            ]
          );
          return;
        }
      }
      setStep(3);
      setValidationAttempted(false);
      return;
    }

    if (step === 3) {
      if (!selectedLocal) {
        setValidationAttempted(true);
        Alert.alert('Selecione um local');
        return;
      }
      setStep(4);
      setValidationAttempted(false);
      return;
    }

    if (step === 4) {
      if (!selectedDate) {
        setValidationAttempted(true);
        Alert.alert('Selecione uma data');
        return;
      }
      if (!selectedHorario || !formData.id_bloco_doacao) {
        setValidationAttempted(true);
        Alert.alert('Selecione um horário disponível');
        return;
      }
      setStep(5);
      setValidationAttempted(false);
      return;
    }
  };

  const handleConfirm = async () => {
    try {
      const payload: any = {
        doador_nome: formData.doador_nome,
        doador_dt_nascimento: formData.doador_dt_nascimento,
        doador_email: formData.doador_email,
        doador_cpf: getCleanCPF(formData.doador_cpf), // Remove máscara do CPF
        doador_telefone: getCleanPhone(formData.doador_telefone), // Remove máscara do telefone
        doador_sexo: formData.doador_sexo,
        tipo: agendamentoType,
        id_bloco_doacao: formData.id_bloco_doacao,
        pre_primeira_vez: preTriagem.primeiraVez,
        pre_pesa_mais_50: preTriagem.pesaMais50,
        pre_tatuagem_piercing: preTriagem.tatuagemRecente,
        pre_sexo: preTriagem.sexo,
        pre_gravida_amamentando: preTriagem.gravidaOuAmamentando,
      };
      if (agendamentoType === 'C') {

        payload.organizador_cpf = getCleanCPF(campaignForm.organizador_cpf); // Remove máscara do CPF
        payload.organizador_nome = campaignForm.organizador_nome;
        payload.organizador_dt_nascimento = campaignForm.organizador_dt_nascimento;
        payload.organizador_email = campaignForm.organizador_email;
        payload.organizador_telefone = getCleanPhone(campaignForm.organizador_telefone); // Remove máscara do telefone
        payload.quantidade_doadores = campaignForm.quantidade_doadores;
        const res = await apiService.postMarcarCampanha(payload);

        // Capture which system was used
        setSystemUsed(res._source || 'hemose');

        // Close modal and start confirmation flow
        closeAgendamentoModal();
        setStep(0);
        startConfirmationFlow(payload);
      } else {
        const res = await apiService.postMarcarAgendamento(payload);

        // Capture which system was used
        setSystemUsed(res._source || 'hemose');

        // Close modal and start confirmation flow
        closeAgendamentoModal();
        setStep(0);
        startConfirmationFlow(payload);
      }
    } catch (e: any) {
      Alert.alert('Erro', e.message || 'Falha ao marcar');
    }
  };

  const handleBack = () => {
    setValidationAttempted(false);
    if (agendamentoType === 'C' && step === 2) {
      setStep(0);
      return;
    }

    setStep(s => Math.max(0, s - 1));
  };

  const invalidPre = step === 1 && validationAttempted && (
    preTriagem.primeiraVez === null ||
    preTriagem.pesaMais50 === null ||
    preTriagem.tatuagemRecente === null ||
    preTriagem.sexo === null ||
    (preTriagem.sexo === 'F' && preTriagem.gravidaOuAmamentando === null)
  );

  const isInvalid = (field: string, type: 'donor' | 'campaign') => {
    const val = type === 'donor' ? (formData as any)[field] : (campaignForm as any)[field];
    const touched = type === 'donor' ? touchedForm[field] : touchedCampaign[field];
    return (validationAttempted && !val) || (!!touched && !val);
  };

  const openDobPicker = (forType: 'donor' | 'campaign') => {
    setDobPickerFor(forType);
    const existing = forType === 'donor' ? formData.doador_dt_nascimento : campaignForm.organizador_dt_nascimento;
    setDobTempSelected(existing || null);
    const cur = existing || new Date().toISOString().slice(0, 10);
    setDobCalendarCurrent(cur);
    setShowYearPicker(false);
    setDobPickerVisible(true);
  };

  const onDobSelect = (dateString: string) => {
    if (dobPickerFor === 'donor') {
      setFormData({ ...formData, doador_dt_nascimento: dateString });
      setTouchedForm({ ...touchedForm, doador_dt_nascimento: true });
      setDonorDobDisplay(isoToDisplay(dateString));
    } else if (dobPickerFor === 'campaign') {
      setCampaignForm({ ...campaignForm, organizador_dt_nascimento: dateString });
      setTouchedCampaign({ ...touchedCampaign, organizador_dt_nascimento: true });
      setCampaignDobDisplay(isoToDisplay(dateString));
    }
    setDobPickerVisible(false);
    setDobPickerFor(null);
  };

  // Helper: format ISO (YYYY-MM-DD) to display DD/MM/YYYY
  const isoToDisplay = (iso?: string | null) => {
    if (!iso) return '';
    const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (m) return `${m[3]}/${m[2]}/${m[1]}`;
    // already in DD/MM/YYYY?
    const m2 = String(iso).match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (m2) return String(iso);
    return String(iso);
  };


  const inputToIso = (text: string) => {
    if (!text) return '';
    const t = text.trim();
    const m = t.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (m) return `${m[3]}-${m[2]}-${m[1]}`;
    const m2 = t.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (m2) return t;
    return t;
  };


  const maskDateInput = (text: string) => {
    const digits = (text || '').replace(/\D/g, '').slice(0, 8);
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
  };


  const formatMonthYear = (iso?: string | null) => {
    const base = iso || new Date().toISOString().slice(0, 10);
    const m = String(base).match(/^(\d{4})-(\d{2})-(\d{2})$/);
    const months: string[] = (LocaleConfig.locales['pt-br'] && LocaleConfig.locales['pt-br'].monthNames) || [];
    if (m) {
      const year = m[1];
      const monthIdx = parseInt(m[2], 10) - 1;
      const monthName = months[monthIdx] || '';

      return `${monthName.charAt(0).toUpperCase()}${monthName.slice(1)} ${year}`;
    }
    return base;
  };

  // Keep display masks in sync when underlying ISO values change (e.g., calendar pick)
  useEffect(() => {
    setDonorDobDisplay(isoToDisplay(formData.doador_dt_nascimento));
  }, [formData.doador_dt_nascimento]);

  useEffect(() => {
    setCampaignDobDisplay(isoToDisplay(campaignForm.organizador_dt_nascimento));
  }, [campaignForm.organizador_dt_nascimento]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <View style={styles.headerIconWrap}>
            <Ionicons name="water" size={44} color={Colors.light.background} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.title}>Doe sangue. Salve vidas.</Text>
            <Text style={styles.subtitle}>Agende sua doação em poucos passos</Text>
          </View>
        </View>
        <View style={styles.searchColumn}>
          <View style={styles.searchRow}>
            <TextInput
              placeholder="CPF do doador"
              value={cpf}
              onChangeText={setCpf}
              style={[styles.input, { marginBottom: 0, flex: 1 }]}
              keyboardType="numeric"
            />
            <Pressable
              style={[styles.searchButton]}
              onPress={handleBuscar}
            >
              {loading ? (
                <ActivityIndicator color={RED} />
              ) : (
                <Ionicons name="search" size={20} color={RED} />
              )}
            </Pressable>
          </View>

          <Pressable style={[styles.fullButtonPrimary]} onPress={openAgendamentoModal}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={styles.fullButtonText}> Agendar Doação</Text>
            </View>
          </Pressable>

          <Pressable
            style={[styles.postoButton, { marginTop: 8 }]}
            onPress={() => setPostosModalVisible(true)}
          >
            <Ionicons name="location" size={18} color="#fff" />
            <Text style={styles.postoButtonText}>Postos de Coleta</Text>
          </Pressable>

          <Pressable
            style={[styles.infoButton, { marginTop: 8 }]}
            onPress={() => setInfoModalVisible(true)}
          >
            <Ionicons name="information-circle" size={18} color="#fff" />
            <Text style={styles.infoButtonText}>Informações para doar</Text>
          </Pressable>
        </View>

        <View style={styles.cards}>
          <View style={styles.card}>
            <Ionicons name="information-circle" size={28} color={RED} />
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle}>O que esperar</Text>
              <Text style={styles.cardText}>Tempo do procedimento, requisitos e recomendações.</Text>
            </View>
          </View>

          <View style={styles.card}>
            <Ionicons name="pulse" size={28} color={RED} />
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle}>Requisitos</Text>
              <Text style={styles.cardText}>Idade, peso e intervalo entre doações.</Text>
            </View>
          </View>

          <View style={styles.card}>
            <Ionicons name="people" size={28} color={RED} />
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle}>Doar com amigos</Text>
              <Text style={styles.cardText}>Venha em grupo e ajude ainda mais pessoas.</Text>
            </View>
          </View>
        </View>



        <View style={styles.footerNote}>
          <Text style={styles.noteTitle}>Próximos passos</Text>
          <Text style={styles.noteText}>Após agendar, você receberá confirmação por e-mail e lembrete por SMS.</Text>
        </View>

        {/* Modal: Agendamento multi-step */}
        <Modal visible={modalVisible} animationType="slide">
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Agendar Doação</Text>
              <Pressable onPress={() => { closeAgendamentoModal(); }}>
                <Ionicons name="close" size={24} color={RED} />
              </Pressable>
            </View>

            <View style={styles.modalBody}>
              <ScrollView keyboardShouldPersistTaps='handled' contentContainerStyle={{ paddingBottom: 30 }}>
                {step === 0 && (
                  <View>
                    <Text style={styles.stepTitle}>Selecione o tipo de doação</Text>
                    <View style={styles.typeColumn}>
                      <AnimatedPressable
                        onPress={() => { setAgendamentoType('D'); animateSelect('D'); setFormData({ ...formData, tipo: 'D' }); }}
                        style={[styles.typeCardPrimary, agendamentoType === 'D' ? styles.typeCardSelected : null, { transform: [{ scale: scalesRef['D'] }] }]}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                          <Ionicons name="person" size={18} color="#fff" />
                          <Text style={styles.typeTextPrimary}> Doação Individual</Text>
                          {agendamentoType === 'D' ? <Ionicons name="checkmark" size={16} color="#fff" style={{ marginLeft: 8 }} /> : null}
                        </View>
                      </AnimatedPressable>

                      <AnimatedPressable
                        onPress={() => { setAgendamentoType('C'); animateSelect('C'); setFormData({ ...formData, tipo: 'C' }); }}
                        style={[styles.typeCardPrimary, agendamentoType === 'C' ? styles.typeCardSelected : null, { transform: [{ scale: scalesRef['C'] }] }]}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                          <Ionicons name="megaphone" size={18} color="#fff" />
                          <Text style={styles.typeTextPrimary}> Campanha</Text>
                          {agendamentoType === 'C' ? <Ionicons name="checkmark" size={16} color="#fff" style={{ marginLeft: 8 }} /> : null}
                        </View>
                      </AnimatedPressable>

                      <AnimatedPressable
                        onPress={() => { setAgendamentoType('M'); animateSelect('M'); setFormData({ ...formData, tipo: 'M' }); }}
                        style={[styles.typeCardPrimary, agendamentoType === 'M' ? styles.typeCardSelected : null, { transform: [{ scale: scalesRef['M'] }] }]}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                          <Ionicons name="pulse" size={18} color="#fff" />
                          <Text style={styles.typeTextPrimary}> Cadastro Medula Óssea</Text>
                          {agendamentoType === 'M' ? <Ionicons name="checkmark" size={16} color="#fff" style={{ marginLeft: 8 }} /> : null}
                        </View>
                      </AnimatedPressable>
                    </View>
                  </View>
                )}

                {step === 1 && (
                  <View>
                    <View style={styles.preTriagemHeader}>
                      <Text style={styles.preTitle}>Pré‑triagem</Text>
                    </View>

                    <View style={[styles.questionBlock, invalidPre ? { borderColor: RED } : null]}>
                      <Text style={styles.questionText}>1) Primeira vez doando sangue?</Text>
                      <View style={styles.yesNoRow}>
                        {['Sim', 'Não'].map((opt, idx) => {
                          const key = `primeiraVez_${opt === 'Sim' ? 'true' : 'false'}`;
                          const selected = (opt === 'Sim' ? preTriagem.primeiraVez === true : preTriagem.primeiraVez === false);
                          const bgColor = selected ? (opt === 'Sim' ? '#34D399' : RED) : '#FFFFFF';
                          const borderColor = selected ? (opt === 'Sim' ? '#34D399' : RED) : '#000000';
                          const textColor = selected ? '#FFFFFF' : Colors.light.text;
                          return (
                            <AnimatedPressable
                              key={key}
                              onPress={() => { setPreTriagem({ ...preTriagem, primeiraVez: opt === 'Sim' }); animateGroup('primeiraVez', key); }}
                              style={[styles.smallTypeButton, styles.yesNoButton, selected ? styles.smallTypeButtonSelected : null, { transform: [{ scale: selected ? 1.08 : 1 }], backgroundColor: bgColor, borderRadius: 10, borderWidth: 2, borderColor }]}
                            >
                              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                                <Text style={[styles.smallTypeText, { color: textColor }]}>{opt}</Text>
                                {selected ? (opt === 'Não' ? <Ionicons name="close" size={18} color="#fff" style={{ marginLeft: 8 }} /> : <Ionicons name="checkmark" size={18} color="#fff" style={{ marginLeft: 8 }} />) : null}
                              </View>
                            </AnimatedPressable>
                          );
                        })}
                      </View>
                    </View>

                    <View style={[styles.questionBlock, invalidPre ? { borderColor: RED } : null]}>
                      <Text style={styles.questionText}>2) Você pesa mais de 50Kg?</Text>
                      <View style={styles.yesNoRow}>
                        {['Sim', 'Não'].map((opt) => {
                          const key = `pesaMais50_${opt === 'Sim' ? 'true' : 'false'}`;
                          const selected = (opt === 'Sim' ? preTriagem.pesaMais50 === true : preTriagem.pesaMais50 === false);
                          const bgColor = selected ? (opt === 'Sim' ? '#34D399' : RED) : '#FFFFFF';
                          const borderColor = selected ? (opt === 'Sim' ? '#34D399' : RED) : '#000000';
                          const textColor = selected ? '#FFFFFF' : Colors.light.text;
                          return (
                            <AnimatedPressable
                              key={key}
                              onPress={() => { setPreTriagem({ ...preTriagem, pesaMais50: opt === 'Sim' }); animateGroup('pesaMais50', key); }}
                              style={[styles.smallTypeButton, styles.yesNoButton, selected ? styles.smallTypeButtonSelected : null, { transform: [{ scale: selected ? 1.08 : 1 }], backgroundColor: bgColor, borderRadius: 10, borderWidth: 2, borderColor }]}
                            >
                              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                                <Text style={[styles.smallTypeText, { color: textColor }]}>{opt}</Text>
                                {selected ? (opt === 'Não' ? <Ionicons name="close" size={18} color="#fff" style={{ marginLeft: 8 }} /> : <Ionicons name="checkmark" size={18} color="#fff" style={{ marginLeft: 8 }} />) : null}
                              </View>
                            </AnimatedPressable>
                          );
                        })}
                      </View>
                    </View>

                    <View style={[styles.questionBlock, invalidPre ? { borderColor: RED } : null]}>
                      <Text style={styles.questionText}>3) Fez tatuagem/piercing em local não certificado pela ANVISA nos últimos 12 meses?</Text>
                      <View style={styles.yesNoRow}>
                        {['Sim', 'Não'].map((opt) => {
                          const key = `tatuagemRecente_${opt === 'Sim' ? 'true' : 'false'}`;
                          const selected = (opt === 'Sim' ? preTriagem.tatuagemRecente === true : preTriagem.tatuagemRecente === false);
                          const bgColor = selected ? (opt === 'Sim' ? '#34D399' : RED) : '#FFFFFF';
                          const borderColor = selected ? (opt === 'Sim' ? '#34D399' : RED) : '#000000';
                          const textColor = selected ? '#FFFFFF' : Colors.light.text;
                          return (
                            <AnimatedPressable
                              key={key}
                              onPress={() => { setPreTriagem({ ...preTriagem, tatuagemRecente: opt === 'Sim' }); animateGroup('tatuagemRecente', key); }}
                              style={[styles.smallTypeButton, styles.yesNoButton, selected ? styles.smallTypeButtonSelected : null, { transform: [{ scale: selected ? 1.08 : 1 }], backgroundColor: bgColor, borderRadius: 10, borderWidth: 2, borderColor }]}
                            >
                              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                                <Text style={[styles.smallTypeText, { color: textColor }]}>{opt}</Text>
                                {selected ? (opt === 'Não' ? <Ionicons name="close" size={18} color="#fff" style={{ marginLeft: 8 }} /> : <Ionicons name="checkmark" size={18} color="#fff" style={{ marginLeft: 8 }} />) : null}
                              </View>
                            </AnimatedPressable>
                          );
                        })}
                      </View>
                    </View>

                    <View style={[styles.questionBlock, invalidPre ? { borderColor: RED } : null]}>
                      <Text style={styles.questionText}>4) Sexo</Text>
                      <View style={styles.yesNoRow}>
                        {['Masculino', 'Feminino'].map((opt) => {
                          const key = `sexo_${opt === 'Masculino' ? 'M' : 'F'}`;
                          const selected = (opt === 'Masculino' ? preTriagem.sexo === 'M' : preTriagem.sexo === 'F');
                          const bgColor = selected ? '#34D399' : '#FFFFFF';
                          const borderColor = selected ? '#34D399' : '#000000';
                          const textColor = selected ? '#FFFFFF' : Colors.light.text;
                          return (
                            <AnimatedPressable
                              key={key}
                              onPress={() => { setPreTriagem({ ...preTriagem, sexo: opt === 'Masculino' ? 'M' : 'F', gravidaOuAmamentando: opt === 'Masculino' ? null : preTriagem.gravidaOuAmamentando }); animateGroup('sexo', key); }}
                              style={[styles.smallTypeButton, styles.yesNoButton, selected ? styles.smallTypeButtonSelected : null, { transform: [{ scale: selected ? 1.08 : 1 }], backgroundColor: bgColor, borderRadius: 10, borderWidth: 2, borderColor }]}
                            >
                              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                                <Text style={[styles.smallTypeText, { color: textColor }]}>{opt}</Text>
                                {selected ? <Ionicons name="checkmark" size={18} color="#fff" style={{ marginLeft: 8 }} /> : null}
                              </View>
                            </AnimatedPressable>
                          );
                        })}
                      </View>
                    </View>

                    {preTriagem.sexo === 'F' && (
                      <View style={{ marginTop: 12 }}>
                        <Text style={styles.questionText}>Você está grávida ou amamentando atualmente?</Text>
                        <View style={styles.yesNoRow}>
                          {['Sim', 'Não'].map((opt) => {
                            const key = `gravida_${opt === 'Sim' ? 'true' : 'false'}`;
                            const anim = ensureAnim(key);
                            const selected = (opt === 'Sim' ? preTriagem.gravidaOuAmamentando === true : preTriagem.gravidaOuAmamentando === false);
                            const bgColor = selected ? (opt === 'Sim' ? '#34D399' : RED) : '#FFFFFF';
                            const borderColor = selected ? (opt === 'Sim' ? '#34D399' : RED) : '#000000';
                            const textColor = selected ? '#FFFFFF' : Colors.light.text;
                            return (
                              <AnimatedPressable
                                key={key}
                                onPress={() => { setPreTriagem({ ...preTriagem, gravidaOuAmamentando: opt === 'Sim' }); animateGroup('gravidaOuAmamentando', key); }}
                                style={[styles.smallTypeButton, styles.yesNoButton, selected ? styles.smallTypeButtonSelected : null, { transform: [{ scale: selected ? 1.08 : 1 }], backgroundColor: bgColor, borderRadius: 10, borderWidth: 2, borderColor }]}
                              >
                                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                                  <Text style={[styles.smallTypeText, { color: textColor }]}>{opt}</Text>
                                  {selected ? (opt === 'Não' ? <Ionicons name="close" size={18} color="#fff" style={{ marginLeft: 8 }} /> : <Ionicons name="checkmark" size={18} color="#fff" style={{ marginLeft: 8 }} />) : null}
                                </View>
                              </AnimatedPressable>
                            );
                          })}
                        </View>
                      </View>
                    )}
                  </View>
                )}

                {step === 2 && (
                  <View>
                    {agendamentoType === 'C' ? (
                      <View>
                        <Text style={styles.inputLabel}>CPF do organizador</Text>
                        <TextInput
                          placeholder="000.000.000-00"
                          style={[styles.input, isInvalid('organizador_cpf', 'campaign') ? styles.inputInvalid : null]}
                          value={campaignForm.organizador_cpf}
                          onChangeText={(text) => {
                            const formatted = formatCPF(text);
                            setCampaignForm({ ...campaignForm, organizador_cpf: formatted });
                          }}
                          keyboardType="numeric"
                          maxLength={14}
                          onBlur={() => setTouchedCampaign({ ...touchedCampaign, organizador_cpf: true })}
                        />

                        <Text style={styles.inputLabel}>Nome completo do organizador</Text>
                        <TextInput
                          placeholder="Nome completo"
                          style={[styles.input, isInvalid('organizador_nome', 'campaign') ? styles.inputInvalid : null]}
                          value={campaignForm.organizador_nome}
                          onChangeText={(t) => setCampaignForm({ ...campaignForm, organizador_nome: t })}
                          onBlur={() => setTouchedCampaign({ ...touchedCampaign, organizador_nome: true })}
                        />

                        <Text style={styles.inputLabel}>Data de nascimento do organizador</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <TextInput
                            placeholder="DD/MM/YYYY"
                            style={[styles.input, { flex: 1 }, isInvalid('organizador_dt_nascimento', 'campaign') ? styles.inputInvalid : null]}
                            value={campaignDobDisplay}
                            keyboardType="numeric"
                            onChangeText={(t) => {
                              const m = maskDateInput(t);
                              setCampaignDobDisplay(m);
                              if (/^\d{2}\/\d{2}\/\d{4}$/.test(m)) {
                                setCampaignForm({ ...campaignForm, organizador_dt_nascimento: inputToIso(m) });
                              } else {
                                setCampaignForm({ ...campaignForm, organizador_dt_nascimento: '' });
                              }
                            }}
                            onBlur={() => setTouchedCampaign({ ...touchedCampaign, organizador_dt_nascimento: true })}
                          />
                          <Pressable onPress={() => openDobPicker('campaign')} style={{ marginLeft: 8, padding: 8 }}>
                            <Ionicons name="calendar" size={22} color={RED} />
                          </Pressable>
                        </View>

                        <Text style={styles.inputLabel}>E‑mail do organizador</Text>
                        <TextInput
                          placeholder="E-mail"
                          style={[styles.input, isInvalid('organizador_email', 'campaign') ? styles.inputInvalid : null]}
                          value={campaignForm.organizador_email}
                          onChangeText={(t) => setCampaignForm({ ...campaignForm, organizador_email: t })}
                          keyboardType="email-address"
                          onBlur={() => setTouchedCampaign({ ...touchedCampaign, organizador_email: true })}
                        />

                        <Text style={styles.inputLabel}>Telefone do organizador</Text>
                        <View style={styles.phoneContainer}>
                          <TouchableOpacity
                            style={styles.dddSelector}
                            onPress={() => setShowOrgDDDPicker(true)}
                          >
                            <Text style={styles.dddText}>+55 ({selectedOrgDDD})</Text>
                            <Ionicons name="chevron-down" size={16} color="#6B7280" />
                          </TouchableOpacity>
                          <TextInput
                            placeholder="99999-9999"
                            style={[styles.phoneInput, isInvalid('organizador_telefone', 'campaign') ? styles.inputInvalid : null]}
                            value={organizadorPhoneNumber}
                            onChangeText={(text) => {
                              const formatted = formatPhoneNumber(text);
                              setOrganizadorPhoneNumber(formatted);
                              setCampaignForm({ ...campaignForm, organizador_telefone: `+55 (${selectedOrgDDD}) ${formatted}` });
                            }}
                            keyboardType="numeric"
                            maxLength={10}
                            onBlur={() => setTouchedCampaign({ ...touchedCampaign, organizador_telefone: true })}
                          />
                        </View>

                        <Text style={styles.inputLabel}>Quantidade de doadores</Text>
                        <TextInput
                          placeholder="Quantidade de doadores"
                          style={[styles.input, isInvalid('quantidade_doadores', 'campaign') ? styles.inputInvalid : null]}
                          value={campaignForm.quantidade_doadores}
                          onChangeText={(t) => setCampaignForm({ ...campaignForm, quantidade_doadores: t })}
                          keyboardType="numeric"
                          onBlur={() => setTouchedCampaign({ ...touchedCampaign, quantidade_doadores: true })}
                        />
                      </View>
                    ) : (
                      <View>
                        <Text style={styles.inputLabel}>Nome completo</Text>
                        <TextInput
                          placeholder="Nome"
                          style={[styles.input, isInvalid('doador_nome', 'donor') ? styles.inputInvalid : null]}
                          value={formData.doador_nome}
                          onChangeText={(t) => setFormData({ ...formData, doador_nome: t })}
                          onBlur={() => setTouchedForm({ ...touchedForm, doador_nome: true })}
                        />

                        <Text style={styles.inputLabel}>CPF</Text>
                        <TextInput
                          placeholder="000.000.000-00"
                          style={[styles.input, isInvalid('doador_cpf', 'donor') ? styles.inputInvalid : null]}
                          value={formData.doador_cpf}
                          onChangeText={(text) => {
                            const formatted = formatCPF(text);
                            setFormData({ ...formData, doador_cpf: formatted });
                          }}
                          keyboardType="numeric"
                          maxLength={14} // 000.000.000-00 = 14 caracteres
                          onBlur={() => setTouchedForm({ ...touchedForm, doador_cpf: true })}
                        />

                        <Text style={styles.inputLabel}>Data de nascimento</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <TextInput
                            placeholder="DD/MM/YYYY"
                            style={[styles.input, { flex: 1 }, isInvalid('doador_dt_nascimento', 'donor') ? styles.inputInvalid : null]}
                            value={donorDobDisplay}
                            keyboardType="numeric"
                            onChangeText={(t) => {
                              const m = maskDateInput(t);
                              setDonorDobDisplay(m);
                              if (/^\d{2}\/\d{2}\/\d{4}$/.test(m)) {
                                setFormData({ ...formData, doador_dt_nascimento: inputToIso(m) });
                              } else {
                                setFormData({ ...formData, doador_dt_nascimento: '' });
                              }
                            }}
                            onBlur={() => setTouchedForm({ ...touchedForm, doador_dt_nascimento: true })}
                          />
                          <Pressable onPress={() => openDobPicker('donor')} style={{ marginLeft: 8, padding: 8 }}>
                            <Ionicons name="calendar" size={22} color={RED} />
                          </Pressable>
                        </View>

                        <Text style={styles.inputLabel}>E‑mail</Text>
                        <TextInput
                          placeholder="E-mail"
                          style={[styles.input, isInvalid('doador_email', 'donor') ? styles.inputInvalid : null]}
                          value={formData.doador_email}
                          onChangeText={(t) => setFormData({ ...formData, doador_email: t })}
                          keyboardType="email-address"
                          onBlur={() => setTouchedForm({ ...touchedForm, doador_email: true })}
                        />

                        <Text style={styles.inputLabel}>Telefone</Text>
                        <View style={styles.phoneContainer}>
                          <TouchableOpacity
                            style={styles.dddSelector}
                            onPress={() => setShowDDDPicker(true)}
                          >
                            <Text style={styles.dddText}>+55 ({selectedDDD})</Text>
                            <Ionicons name="chevron-down" size={16} color="#6B7280" />
                          </TouchableOpacity>
                          <TextInput
                            placeholder="99999-9999"
                            style={[styles.phoneInput, isInvalid('doador_telefone', 'donor') ? styles.inputInvalid : null]}
                            value={phoneNumber}
                            onChangeText={(text) => {
                              const formatted = formatPhoneNumber(text);
                              setPhoneNumber(formatted);
                              setFormData({ ...formData, doador_telefone: `+55 (${selectedDDD}) ${formatted}` });
                            }}
                            keyboardType="numeric"
                            maxLength={10} // 99999-9999 = 10 caracteres
                            onBlur={() => setTouchedForm({ ...touchedForm, doador_telefone: true })}
                          />
                        </View>

                        <Text style={styles.inputLabel}>Sexo</Text>
                        <TouchableOpacity
                          style={[styles.selectorButton, isInvalid('doador_sexo', 'donor') ? styles.inputInvalid : null]}
                          onPress={() => setShowSexPicker(true)}
                        >
                          <Text style={selectedSex ? styles.selectorText : styles.selectorPlaceholder}>
                            {selectedSex === 'M' ? 'Masculino' : selectedSex === 'F' ? 'Feminino' : 'Selecione o sexo'}
                          </Text>
                          <Ionicons name="chevron-down" size={20} color="#6B7280" />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                )}

                {step === 3 && (
                  <View>
                    <Text style={styles.stepTitle}>Escolha o local</Text>
                    <Text style={{ marginBottom: 8, color: '#6B7280' }}>Selecione onde deseja realizar a doação</Text>

                    {/* Local principal do HEMOSE */}
                    <View style={[styles.listItem, selectedLocal && selectedLocal.id === 'hemose_sede' ? styles.listItemSelected : null]}>
                      <View style={styles.localItemRow}>
                        <View style={styles.localInfo}>
                          <Text style={{ fontWeight: '700', fontSize: 16, color: Colors.light.text }}>HEMOSE - Centro de Hemoterapia</Text>
                          <Text style={{ color: '#6B7280', marginTop: 4, fontSize: 14 }}>Av. Prof. José Bonifácio Fortes Neto, 400</Text>
                          <Text style={{ color: '#6B7280', fontSize: 14 }}>Capucho, Aracaju - SE, 49020-380</Text>
                          <Text style={{ color: '#E73645', marginTop: 6, fontSize: 12, fontWeight: '600' }}>Segunda a Sexta: 07:30 - 17:00</Text>
                          <Text style={{ color: '#34D399', marginTop: 2, fontSize: 12, fontWeight: '600' }}>📞 +55 79 3234-6010</Text>
                        </View>
                        <View style={styles.localActions}>
                          <Pressable
                            onPress={() => {
                              const endereco = "Av. Prof. José Bonifácio Fortes Neto, 400 - Capucho, Aracaju - SE, 49020-380";
                              if (Platform.OS === 'ios') {
                                Linking.openURL(`http://maps.apple.com/?q=${encodeURIComponent(endereco)}`);
                              } else {
                                Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(endereco)}`);
                              }
                            }}
                            style={styles.mapIconButton}
                          >
                            <Ionicons name="map" size={20} color={RED} />
                          </Pressable>
                          <Pressable
                            style={[
                              styles.smallPill,
                              selectedLocal && selectedLocal.id === 'hemose_sede' ? { backgroundColor: '#34D399' } : null
                            ]}
                            onPress={async () => {
                              const hemoseLocal = {
                                id: 'hemose_sede',
                                nome: 'HEMOSE - Centro de Hemoterapia',
                                endereco: 'Av. Prof. José Bonifácio Fortes Neto, 400 - Capucho, Aracaju - SE',
                                telefone: '+55 79 3234-6010',
                                horario: 'Segunda a Sexta: 07:30 - 17:00',
                                latitude: -10.9449,
                                longitude: -37.0663
                              };
                              setSelectedLocal(hemoseLocal);
                              // Simular datas disponíveis (pode ser substituído por chamada real da API)
                              const proximasDatas = [];
                              const hoje = new Date();
                              for (let i = 1; i <= 30; i++) {
                                const data = new Date(hoje);
                                data.setDate(hoje.getDate() + i);
                                if (data.getDay() >= 1 && data.getDay() <= 5) { // Segunda a sexta
                                  proximasDatas.push({
                                    data: data.toISOString().split('T')[0],
                                    disponivel: true
                                  });
                                }
                              }
                              setBlocosDates(proximasDatas);
                            }}
                          >
                            <Text style={{
                              fontWeight: '700',
                              color: selectedLocal && selectedLocal.id === 'hemose_sede' ? '#fff' : Colors.light.text
                            }}>
                              {selectedLocal && selectedLocal.id === 'hemose_sede' ? '✓ Selecionado' : 'Selecionar'}
                            </Text>
                          </Pressable>
                        </View>
                      </View>
                    </View>

                    {/* Outros locais (se houver da API) */}
                    {locais && locais.length > 0 && (
                      <>
                        <Text style={{ marginTop: 16, marginBottom: 8, fontSize: 14, fontWeight: '600', color: '#6B7280' }}>Outros locais disponíveis</Text>
                        <FlatList
                          data={locais.filter(item => !String(item.id).startsWith('posto_'))}
                          keyExtractor={(item: any) => String(item.id || item.cd_local || JSON.stringify(item))}
                          renderItem={({ item }) => (
                            <TouchableOpacity
                              style={[styles.listItem, selectedLocal && selectedLocal.id === item.id ? styles.listItemSelected : null]}
                              onPress={async () => {
                                setSelectedLocal(item);
                                try {
                                  const res = await apiService.getBlocoAllDate(item.id || item.cd_local || item.codigo, 1, 1, 1);
                                  setBlocosDates(res || []);
                                } catch (e) { Alert.alert('Erro ao buscar datas') }
                              }}
                            >
                              <Text style={{ fontWeight: '600' }}>{item.nome || item.descricao || 'Local não identificado'}</Text>
                              {item.endereco && <Text style={{ color: '#6B7280', marginTop: 4 }}>{item.endereco}</Text>}
                            </TouchableOpacity>
                          )}
                          style={{ maxHeight: 150 }}
                        />
                      </>
                    )}
                  </View>
                )}

                {step === 4 && (
                  <View>
                    <Text style={styles.stepTitle}>Escolha data e horário</Text>
                    <Text style={{ marginBottom: 8 }}>Selecione um dia disponível</Text>

                    <Calendar
                      onDayPress={async (day: any) => {
                        const dateStr = day.dateString;
                        setSelectedDate(dateStr);
                        setSelectedHorario(null); // Reset horário selecionado
                        setLoadingHorarios(true);

                        try {
                          if (selectedLocal?.id === 'hemose_sede') {
                            // Para o HEMOSE sede, usar a API HEMOSE
                            const tipoAgendamento = agendamentoType as HEMOSE.TipoAgendamento;
                            const horarios = await HEMOSE.listarHorariosPorDia(dateStr, 1, tipoAgendamento); // ID 1 para HEMOSE sede
                            setBlocosByDate(horarios || []);
                          } else {
                            // Para outros locais, usar a API antiga
                            const res = await apiService.getBlocoByDate(dateStr, selectedLocal?.id || selectedLocal?.cd_local || selectedLocal?.codigo, 1, 1, 1);
                            setBlocosByDate(res || []);
                          }
                        } catch (e) {
                          console.error('Erro ao buscar horários:', e);
                          Alert.alert('Erro ao buscar horários', 'Tente novamente ou escolha outra data.');
                          setBlocosByDate([]);
                        } finally {
                          setLoadingHorarios(false);
                        }
                      }}
                      markedDates={markedDates}
                      theme={{
                        selectedDayBackgroundColor: RED,
                        selectedDayTextColor: '#ffffff',
                        todayTextColor: RED,
                        dotColor: RED,
                        selectedDotColor: '#ffffff',
                      }}
                    />

                    {selectedDate && (
                      <View style={{ marginTop: 16 }}>
                        <Text style={[styles.stepTitle, { fontSize: 16 }]}>
                          Horários disponíveis - {(() => {
                            const date = new Date(selectedDate);
                            return date.toLocaleDateString('pt-BR', {
                              weekday: 'long',
                              day: 'numeric',
                              month: 'long'
                            });
                          })()}
                        </Text>

                        {loadingHorarios ? (
                          <View style={{ padding: 20, alignItems: 'center' }}>
                            <ActivityIndicator color={RED} size="large" />
                            <Text style={{ marginTop: 8, color: '#6B7280' }}>Carregando horários...</Text>
                          </View>
                        ) : blocosByDate.length > 0 ? (
                          <FlatList
                            data={blocosByDate}
                            keyExtractor={(item: any, idx: number) => String(item.id_bloco_doacao || item.id || item.cd_bloco || idx)}
                            numColumns={2}
                            renderItem={({ item }) => {
                              const isSelected = selectedHorario?.id_bloco_doacao === item.id_bloco_doacao;
                              return (
                                <TouchableOpacity
                                  style={[
                                    styles.horarioButton,
                                    isSelected ? styles.horarioButtonSelected : null
                                  ]}
                                  onPress={() => {
                                    setSelectedHorario(item);
                                    setFormData({ ...formData, id_bloco_doacao: item.id_bloco_doacao || item.id || item.cd_bloco || item.id_bloco });
                                  }}
                                >
                                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                                    <Ionicons
                                      name="time-outline"
                                      size={16}
                                      color={isSelected ? '#fff' : RED}
                                    />
                                    <Text style={[
                                      styles.horarioButtonText,
                                      isSelected ? { color: '#fff' } : null
                                    ]}>
                                      {item.hora || `${item.hora_inicio} - ${item.hora_fim}` || 'Horário não informado'}
                                    </Text>
                                  </View>
                                  {isSelected && (
                                    <Ionicons
                                      name="checkmark-circle"
                                      size={16}
                                      color="#fff"
                                      style={{ position: 'absolute', top: 8, right: 8 }}
                                    />
                                  )}
                                </TouchableOpacity>
                              );
                            }}
                            style={{ marginTop: 8 }}
                          />
                        ) : (
                          <View style={styles.emptyState}>
                            <Ionicons name="calendar-outline" size={48} color="#6B7280" />
                            <Text style={styles.emptyStateText}>Nenhum horário disponível</Text>
                            <Text style={styles.emptyStateSubtext}>Escolha outra data ou entre em contato conosco</Text>
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                )}

                {step === 5 && (
                  <View>
                    <Text style={styles.stepTitle}>Confirme os dados do seu agendamento</Text>

                    <View style={styles.verificationCard}>
                      <View style={styles.verificationRow}>
                        <Ionicons name="medical" size={20} color={RED} />
                        <View style={{ marginLeft: 12 }}>
                          <Text style={styles.verificationLabel}>Tipo de doação</Text>
                          <Text style={styles.verificationValue}>
                            {agendamentoType === 'D' ? 'Doação de Sangue' :
                              agendamentoType === 'M' ? 'Cadastro de Medula Óssea' :
                                agendamentoType === 'C' ? 'Campanha' : 'Não especificado'}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.verificationRow}>
                        <Ionicons name="person" size={20} color={RED} />
                        <View style={{ marginLeft: 12 }}>
                          <Text style={styles.verificationLabel}>Dados pessoais</Text>
                          <Text style={styles.verificationValue}>{formData.doador_nome}</Text>
                          <Text style={styles.verificationSubvalue}>CPF: {formData.doador_cpf}</Text>
                        </View>
                      </View>

                      <View style={styles.verificationRow}>
                        <Ionicons name="location" size={20} color={RED} />
                        <View style={{ marginLeft: 12 }}>
                          <Text style={styles.verificationLabel}>Local</Text>
                          <Text style={styles.verificationValue}>{selectedLocal?.nome}</Text>
                          {selectedLocal?.endereco && (
                            <Text style={styles.verificationSubvalue}>{selectedLocal.endereco}</Text>
                          )}
                        </View>
                      </View>

                      <View style={styles.verificationRow}>
                        <Ionicons name="calendar" size={20} color={RED} />
                        <View style={{ marginLeft: 12 }}>
                          <Text style={styles.verificationLabel}>Data e horário</Text>
                          <Text style={styles.verificationValue}>
                            {selectedDate ? (() => {
                              const date = new Date(selectedDate);
                              return date.toLocaleDateString('pt-BR', {
                                weekday: 'long',
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                              });
                            })() : 'Data não selecionada'}
                          </Text>
                          {selectedHorario && (
                            <Text style={styles.verificationSubvalue}>
                              Horário: {selectedHorario.hora || `${selectedHorario.hora_inicio} - ${selectedHorario.hora_fim}`}
                            </Text>
                          )}
                        </View>
                      </View>
                    </View>

                    <View style={styles.warningBox}>
                      <Ionicons name="information-circle" size={20} color="#F59E0B" />
                      <View style={{ marginLeft: 12, flex: 1 }}>
                        <Text style={styles.warningText}>
                          Importante: Chegue com 15 minutos de antecedência.
                          Traga um documento com foto e mantenha-se hidratado.
                        </Text>
                      </View>
                    </View>
                  </View>
                )}
              </ScrollView>
            </View>

            <View style={styles.modalFooter}>
              {step > 0 ? (
                <Pressable style={styles.footerBtn} onPress={handleBack}><Text>Voltar</Text></Pressable>
              ) : (
                <View />
              )}

              {step < 5 ? (
                <AnimatedPressable
                  style={[styles.footerBtnPrimary, { transform: [{ translateX: nextAnim.current.interpolate({ inputRange: [0, 1], outputRange: [0, 8] }) }] }]}
                  onPress={handleNextAnimated}
                >
                  <Text style={{ color: '#fff' }}>Próximo</Text>
                </AnimatedPressable>
              ) : (
                <Pressable style={[styles.footerBtnPrimary]} onPress={handleConfirm}><Text style={{ color: '#fff' }}>Confirmar</Text></Pressable>
              )}
            </View>
          </SafeAreaView>
        </Modal>

        {/* Modal: Postos de Coleta */}
        <Modal visible={postosModalVisible} animationType="slide">
          <SafeAreaView style={styles.modalContainer}>
            <View style={[styles.modalHeader, { backgroundColor: '#E73645' }]}>
              <Text style={[styles.modalTitle, { color: '#fff' }]}>Postos de Coleta</Text>
              <Pressable onPress={() => { setPostosModalVisible(false); }}>
                <Ionicons name="close" size={24} color="#fff" />
              </Pressable>
            </View>
            <ScrollView style={styles.modalBody}>
              {/* Cabeçalho com informações gerais */}
              <View style={styles.horarioHeader}>
                <View style={styles.horarioHeaderIcon}>
                  <Ionicons name="time-outline" size={32} color="#fff" />
                </View>
                <View style={styles.horarioHeaderText}>
                  <Text style={styles.horarioTitle}>Horário de Funcionamento</Text>
                  <Text style={styles.horarioSubtitle}>Podendo variar em finais de semana ou feriados</Text>
                </View>
              </View>

              {/* Lista de horários */}
              <View style={styles.horarioList}>
                {(() => {
                  const hoje = new Date().getDay(); // 0 = Domingo, 1 = Segunda, etc.
                  const diasSemana = [
                    { nome: 'Domingo', horario: 'Fechado', funcionando: false },
                    { nome: 'Segunda-Feira', horario: '07:30 - 17:00', funcionando: true },
                    { nome: 'Terça-Feira', horario: '07:30 - 17:00', funcionando: true },
                    { nome: 'Quarta-Feira', horario: '07:30 - 17:00', funcionando: true },
                    { nome: 'Quinta-Feira', horario: '07:30 - 17:00', funcionando: true },
                    { nome: 'Sexta-Feira', horario: '07:30 - 17:00', funcionando: true },
                    { nome: 'Sábado', horario: 'Fechado', funcionando: false }
                  ];

                  return diasSemana.map((dia, index) => {
                    const isToday = index === hoje;
                    const isOpen = dia.funcionando && isToday;

                    return (
                      <View key={dia.nome} style={[
                        styles.horarioItem,
                        isToday ? styles.horarioItemAberto : null
                      ]}>
                        {isToday ? (
                          <View style={styles.horarioRow}>
                            <Text style={[styles.horarioDia, { color: '#fff' }]}>{dia.nome}</Text>
                            <View style={styles.horarioIndicator}>
                              {isOpen && <View style={styles.statusDot} />}
                              <Text style={[styles.horarioHoras, { color: '#fff' }]}>{dia.horario}</Text>
                            </View>
                          </View>
                        ) : (
                          <>
                            <Text style={[
                              styles.horarioDia,
                              !dia.funcionando ? { color: '#999' } : null
                            ]}>{dia.nome}</Text>
                            <Text style={[
                              styles.horarioHoras,
                              !dia.funcionando ? { color: '#999' } : null
                            ]}>{dia.horario}</Text>
                          </>
                        )}
                        {isToday && isOpen && (
                          <View style={styles.statusBadge}>
                            <Text style={styles.statusText}>ABERTO</Text>
                          </View>
                        )}
                      </View>
                    );
                  });
                })()}
              </View>

              {/* Informações do local */}
              <View style={styles.localInfoCard}>
                <Text style={styles.localTitle}>HEMOSE - Centro de Hemoterapia de Sergipe</Text>
                <Text style={styles.localEndereco}>Av. Prof. José Bonifácio Fortes Neto, 400 - Capucho, Aracaju - SE, 49020-380</Text>

                <View style={styles.contactInfo}>
                  <Ionicons name="call" size={16} color="#E73645" />
                  <Text style={styles.telefoneText}>+55 79 3234-6010</Text>
                </View>

                <View style={styles.buttonRow}>
                  <Pressable
                    style={[styles.actionButton, styles.phoneButton]}
                    onPress={() => {
                      Linking.openURL('tel:+5579323460101');
                    }}
                  >
                    <Ionicons name="call" size={18} color="#fff" />
                    <Text style={styles.actionButtonText}>Ligar</Text>
                  </Pressable>

                  <Pressable
                    style={[styles.actionButton, styles.mapButton]}
                    onPress={() => {
                      const endereco = "Av. Prof. José Bonifácio Fortes Neto, 400 - Capucho, Aracaju - SE, 49020-380";
                      if (Platform.OS === 'ios') {
                        Linking.openURL(`http://maps.apple.com/?q=${encodeURIComponent(endereco)}`);
                      } else {
                        Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(endereco)}`);
                      }
                    }}
                  >
                    <Ionicons name="map" size={18} color="#fff" />
                    <Text style={styles.actionButtonText}>Abrir Mapa</Text>
                  </Pressable>
                </View>
              </View>
            </ScrollView>
          </SafeAreaView>
        </Modal>

        {/* Modal: Informações para doar */}
        <Modal visible={infoModalVisible} animationType="slide">
          <SafeAreaView style={styles.modalContainer}>
            <View style={[styles.modalHeader, { backgroundColor: '#E73645' }]}>
              <Text style={[styles.modalTitle, { color: '#fff' }]}>Informações para doar</Text>
              <Pressable onPress={() => setInfoModalVisible(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </Pressable>
            </View>
            <ScrollView style={styles.modalBody}>

              {/* Seção: O que preciso para poder doar? */}
              <Pressable
                style={styles.infoSection}
                onPress={() => toggleInfoSection('requisitos')}
              >
                <View style={styles.infoSectionHeader}>
                  <Text style={styles.infoSectionTitle}>O que preciso para poder doar?</Text>
                  <Ionicons
                    name={expandedInfo.requisitos ? "chevron-up" : "chevron-down"}
                    size={20}
                    color="#E73645"
                  />
                </View>
                {expandedInfo.requisitos && (
                  <View style={styles.infoSectionContent}>
                    <Text style={styles.infoText}>• Ter entre 16 e 69 anos de idade;</Text>
                    <Text style={styles.infoText}>• Pesar acima de 50kg;</Text>
                    <Text style={styles.infoText}>• Apresentar documento com foto válido em todo território nacional</Text>
                  </View>
                )}
              </Pressable>

              {/* Seção: Quais são as recomendações para o dia da doação? */}
              <Pressable
                style={styles.infoSection}
                onPress={() => toggleInfoSection('recomendacoes')}
              >
                <View style={styles.infoSectionHeader}>
                  <Text style={styles.infoSectionTitle}>Quais são as recomendações para o dia da doação?</Text>
                  <Ionicons
                    name={expandedInfo.recomendacoes ? "chevron-up" : "chevron-down"}
                    size={20}
                    color="#E73645"
                  />
                </View>
                {expandedInfo.recomendacoes && (
                  <View style={styles.infoSectionContent}>
                    <Text style={styles.infoText}>• Nunca vá doar sangue em jejum;</Text>
                    <Text style={styles.infoText}>• Faça um repouso mínimo de 6 horas na noite anterior à doação;</Text>
                    <Text style={styles.infoText}>• Não ingira bebida alcoólica nas 12 horas anteriores;</Text>
                    <Text style={styles.infoText}>• Evite fumar por pelo menos 2 horas antes da doação;</Text>
                    <Text style={styles.infoText}>• Evite alimentos gordurosos nas 3 horas antecedentes à doação;</Text>
                  </View>
                )}
              </Pressable>

              {/* Seção: Quem não pode doar? */}
              <Pressable
                style={styles.infoSection}
                onPress={() => toggleInfoSection('impedimentos')}
              >
                <View style={styles.infoSectionHeader}>
                  <Text style={styles.infoSectionTitle}>Quem não pode doar?</Text>
                  <Ionicons
                    name={expandedInfo.impedimentos ? "chevron-up" : "chevron-down"}
                    size={20}
                    color="#E73645"
                  />
                </View>
                {expandedInfo.impedimentos && (
                  <View style={styles.infoSectionContent}>
                    <Text style={styles.infoText}>• Quem teve diagnóstico de hepatite após os 11 anos de idade;</Text>
                    <Text style={styles.infoText}>• Mulheres grávidas ou que estejam amamentando;</Text>
                    <Text style={styles.infoText}>• Pessoas que estão expostas a doenças transmissíveis pelo sangue, como AIDS, Hepatite, Sífilis e doença de Chagas;</Text>
                    <Text style={styles.infoText}>• Usuários de drogas;</Text>
                    <Text style={styles.infoText}>• Pessoas que fizeram tatuagens ou colocaram piercing em locais não controlados pela Vigilância Sanitária nos últimos 12 meses;</Text>
                    <Text style={styles.infoText}>• Aqueles que tiveram relacionamento sexual com parceiro desconhecido ou eventual, sem uso de preservativo, nos últimos 12 meses;</Text>
                  </View>
                )}
              </Pressable>

              {/* Seção: O que acontece com o sangue após a doação? */}
              <Pressable
                style={styles.infoSection}
                onPress={() => toggleInfoSection('processamento')}
              >
                <View style={styles.infoSectionHeader}>
                  <Text style={styles.infoSectionTitle}>O que acontece com o sangue após a doação?</Text>
                  <Ionicons
                    name={expandedInfo.processamento ? "chevron-up" : "chevron-down"}
                    size={20}
                    color="#E73645"
                  />
                </View>
                {expandedInfo.processamento && (
                  <View style={styles.infoSectionContent}>
                    <Text style={styles.infoText}>Todo sangue doado é separado em diferentes componentes como:</Text>
                    <View style={{ marginLeft: 16, marginTop: 8 }}>
                      <Text style={styles.infoText}>• Hemácias</Text>
                      <Text style={styles.infoText}>• Plaquetas</Text>
                      <Text style={styles.infoText}>• Plasma</Text>
                      <Text style={styles.infoText}>• Crio</Text>
                    </View>
                    <Text style={[styles.infoText, { marginTop: 12 }]}>E assim poderá beneficiar mais de um paciente com apenas uma unidade coletada. Os componentes são distribuídos aos hospitais para atender casos de emergência e pacientes internados.</Text>
                  </View>
                )}
              </Pressable>

              {/* Seção: Com que frequência posso doar sangue? */}
              <Pressable
                style={styles.infoSection}
                onPress={() => toggleInfoSection('frequencia')}
              >
                <View style={styles.infoSectionHeader}>
                  <Text style={styles.infoSectionTitle}>Com que frequência posso doar sangue?</Text>
                  <Ionicons
                    name={expandedInfo.frequencia ? "chevron-up" : "chevron-down"}
                    size={20}
                    color="#E73645"
                  />
                </View>
                {expandedInfo.frequencia && (
                  <View style={styles.infoSectionContent}>
                    <Text style={styles.infoText}>• Homens podem doar a cada 2 meses, até 4 vezes por ano;</Text>
                    <Text style={styles.infoText}>• Mulheres podem doar a cada 3 meses, até 3 vezes por ano;</Text>
                  </View>
                )}
              </Pressable>

            </ScrollView>
          </SafeAreaView>
        </Modal>

        {/* Modal: Local details */}
        <Modal visible={localDetailsVisible} animationType="slide">
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Detalhes do Posto</Text>
              <Pressable onPress={() => { setLocalDetailsVisible(false); setLocalDetails(null); }}>
                <Ionicons name="close" size={24} color={RED} />
              </Pressable>
            </View>
            <View style={styles.modalBody}>
              {localDetails ? (
                <View>
                  <Text style={{ fontWeight: '700', marginBottom: 8 }}>{localDetails.nome || localDetails.descricao}</Text>
                  <Text style={{ marginBottom: 6 }}>{localDetails.endereco || localDetails.rua || ''}</Text>
                  <Text style={{ marginBottom: 6 }}>{localDetails.bairro || ''} {localDetails.cidade ? `- ${localDetails.cidade}` : ''}</Text>
                  {localDetails.telefone ? <Text style={{ marginBottom: 6 }}>Tel: {localDetails.telefone}</Text> : null}
                  {localDetails.horario ? <Text style={{ marginBottom: 6 }}>Horário: {localDetails.horario}</Text> : null}
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                    <Pressable style={[styles.fullButtonOutline]} onPress={() => openMapOptions(localDetails)}>
                      <Text style={styles.fullButtonOutlineText}>Abrir no mapa</Text>
                    </Pressable>
                  </View>
                </View>
              ) : (
                <Text>Nenhum detalhe disponível</Text>
              )}
            </View>
          </SafeAreaView>
        </Modal>

        {/* Doador info */}
        {doador ? (
          <View style={styles.resultBox}>
            <Text style={styles.resultTitle}>Doador encontrado</Text>
            <Text style={styles.resultText}>{JSON.stringify(doador)}</Text>
          </View>
        ) : null}

        {agendamentos && agendamentos.length ? (
          <View style={styles.resultBox}>
            <Text style={styles.resultTitle}>Agendamentos</Text>
            {agendamentos.map((a: any, idx: number) => (
              <View key={idx} style={styles.smallRow}>
                <Text style={styles.resultText}>{a.protocolo ?? a.id ?? JSON.stringify(a)}</Text>
              </View>
            ))}
          </View>
        ) : null}
        {/* DOB picker modal (select date of birth for donor or campaign organizer) */}
        {dobPickerVisible ? (
          <Modal visible={dobPickerVisible} animationType="fade" transparent={true}>
            <View style={styles.dobOverlay}>
              <View style={styles.dobCard}>
                <View style={styles.dobHeader}>
                  <Pressable onPress={() => setShowYearPicker(s => !s)} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <Text style={styles.modalTitle}>{formatMonthYear(dobCalendarCurrent || new Date().toISOString().slice(0, 10))}</Text>
                    <Ionicons name={showYearPicker ? 'chevron-up' : 'chevron-down'} size={18} color={RED} />
                  </Pressable>
                  <Pressable onPress={() => { setDobPickerVisible(false); setDobPickerFor(null); }}>
                    <Ionicons name="close" size={22} color={RED} />
                  </Pressable>
                </View>
                <View style={{ paddingVertical: 8 }}>
                  {/**
                   * Build a marked map for today and the temporary selection.
                   * We'll render days with a custom dayComponent so we can color weekends red.
                   */}
                  {(() => {
                    // Build markings. If the user has a temporary selection (dobTempSelected),
                    // only show that as the active selection so the calendar highlights a single date.
                    const marked: any = {};
                    const cur = dobPickerFor === 'donor' ? formData.doador_dt_nascimento : campaignForm.organizador_dt_nascimento;
                    const today = new Date().toISOString().slice(0, 10);
                    if (dobTempSelected) {
                      // when user is previewing a selection, mark only the temp selection
                      marked[dobTempSelected] = { type: 'temp' };
                    } else {
                      // otherwise, show saved value and today's mark (if different)
                      if (cur) marked[cur] = { type: 'saved' };
                      if (!cur || cur !== today) marked[today] = { type: 'today' };
                    }

                    // custom weekday labels (hide default day names and render our own so we can color dom & sáb)
                    const weekdayShort = LocaleConfig.locales['pt-br'].dayNamesShort || ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
                    const fd = typeof LocaleConfig.firstDay === 'number' ? LocaleConfig.firstDay : 0;
                    // rotate labels so they align with calendar's firstDay
                    const labels = weekdayShort.slice(fd).concat(weekdayShort.slice(0, fd));
                    return (
                      <>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 8, marginBottom: 6 }}>
                          {labels.map((d: string, i: number) => {
                            // keep all weekday labels in the regular text color (no red)
                            return (
                              <Text key={`${d}-${i}`} style={{ width: 38, textAlign: 'center', color: Colors.light.text, fontWeight: '700' }}>{d}</Text>
                            );
                          })}
                        </View>
                        {showYearPicker ? (
                          (() => {
                            const currentYear = new Date().getFullYear();
                            const years: number[] = [];
                            for (let y = currentYear; y >= 1900; y--) years.push(y);
                            const selectedYear = dobCalendarCurrent ? parseInt(dobCalendarCurrent.slice(0, 4), 10) : currentYear;
                            return (
                              <View style={styles.dobYearList}>
                                <FlatList
                                  ref={yearListRef}
                                  data={years}
                                  keyExtractor={(y) => String(y)}
                                  getItemLayout={(_, index) => ({ length: yearItemHeight || 40, offset: (yearItemHeight || 40) * index, index })}
                                  initialNumToRender={12}
                                  renderItem={({ item }) => {
                                    const isSel = item === selectedYear;
                                    return (
                                      <Pressable onPress={() => {
                                        // keep month/day from current view or today
                                        const base = dobCalendarCurrent || new Date().toISOString().slice(0, 10);
                                        const m = String(base).match(/^(\d{4})-(\d{2})-(\d{2})$/);
                                        const mm = m ? m[2] : '01';
                                        const dd = m ? m[3] : '01';
                                        const iso = `${item}-${mm}-${dd}`;
                                        setDobCalendarCurrent(iso);
                                        setShowYearPicker(false);
                                      }} style={[styles.yearItem, isSel ? styles.yearItemSelected : null]}>
                                        <Text style={[styles.yearItemText, isSel ? styles.yearItemTextSelected : null]}>{item}</Text>
                                      </Pressable>
                                    );
                                  }}
                                  style={{ maxHeight: 220 }}
                                />
                              </View>
                            );
                          })()
                        ) : null}
                        <Calendar
                          markingType={'custom'}
                          current={dobCalendarCurrent || undefined}
                          hideDayNames={true}
                          // Day press handled inside dayComponent via Pressable
                          markedDates={marked}
                          dayComponent={({ date, state }) => {
                            if (!date || !date.dateString) return (<View style={{ width: 38, height: 38 }} />);
                            const ds = date.dateString;
                            const mark = marked[ds];
                            const isWeekend = [0, 6].includes(new Date(ds).getDay());
                            const DayWrap: any = Pressable;
                            // Render marked days (today / temp / saved)
                            if (mark && (mark.type === 'today' || mark.type === 'temp' || mark.type === 'saved')) {
                              const isTodayMark = mark.type === 'today';
                              const bg = isTodayMark ? '#10B981' : RED; // green for today, red for temp/saved
                              return (
                                <DayWrap onPress={() => setDobTempSelected(ds)} style={{ width: 38, height: 38, justifyContent: 'center', alignItems: 'center', borderRadius: 19, backgroundColor: bg }}>
                                  <Text style={{ color: '#fff', fontWeight: '700' }}>{date.day}</Text>
                                </DayWrap>
                              );
                            }
                            // weekends: render with regular text color (no red)
                            if (isWeekend) {
                              return (
                                <DayWrap onPress={() => setDobTempSelected(ds)} style={{ width: 38, height: 38, justifyContent: 'center', alignItems: 'center' }}>
                                  <Text style={{ color: Colors.light.text }}>{date.day}</Text>
                                </DayWrap>
                              );
                            }
                            // default
                            return (
                              <DayWrap onPress={() => setDobTempSelected(ds)} style={{ width: 38, height: 38, justifyContent: 'center', alignItems: 'center' }}>
                                <Text style={{ color: Colors.light.text }}>{date.day}</Text>
                              </DayWrap>
                            );
                          }}
                          theme={{
                            selectedDayBackgroundColor: RED,
                            selectedDayTextColor: '#ffffff',
                            todayTextColor: '#ffffff',
                            dotColor: RED,
                            selectedDotColor: '#ffffff',
                          }}
                        />
                      </>
                    );
                  })()}
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 }}>
                  <Pressable onPress={() => { setDobPickerVisible(false); setDobPickerFor(null); setDobTempSelected(null); }} style={[styles.footerBtn, { marginRight: 8 }]}>
                    <Text>Cancelar</Text>
                  </Pressable>
                  <Pressable disabled={!dobTempSelected} onPress={() => { if (dobTempSelected) onDobSelect(dobTempSelected); }} style={[styles.footerBtnPrimary, { opacity: dobTempSelected ? 1 : 0.5 }]}>
                    <Text style={{ color: '#fff' }}>Confirmar</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </Modal>
        ) : null}

        {/* Confirmation Modal with Droplet Animation */}
        <Modal visible={confirmationVisible} animationType="fade" transparent>
          <View style={styles.confirmationOverlay}>
            <View style={styles.confirmationModal}>
              <View style={styles.dropletContainer}>
                <Animated.View style={[
                  styles.dropletBase,
                  {
                    height: confirmAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%']
                    })
                  }
                ]}>
                  <View style={styles.dropletTop} />
                </Animated.View>
                <View style={styles.dropletOutline}>
                  <View style={styles.dropletTopOutline} />
                </View>
              </View>

              <Text style={styles.confirmationTitle}>🩸 Agendamento Confirmado!</Text>
              <Text style={styles.confirmationText}>
                Seu agendamento foi realizado com sucesso!
              </Text>

              {systemUsed && (
                <Text style={styles.systemUsedText}>
                  Sistema: {systemUsed === 'hemose' ? '🏥 HEMOSE (Principal)' : '🖥️ Backend Local (Fallback)'}
                </Text>
              )}

              {sendingNotifications && (
                <View style={styles.notificationStatus}>
                  <ActivityIndicator color={RED} size="small" />
                  <Text style={styles.notificationText}>Enviando confirmações...</Text>
                </View>
              )}

              <Pressable
                style={styles.confirmationButton}
                onPress={() => {
                  setConfirmationVisible(false);
                  setConfirmationPayload(null);
                  setSystemUsed(null);
                  setSendingNotifications(false);
                  confirmAnim.setValue(0);
                }}
              >
                <Text style={styles.confirmationButtonText}>Continuar</Text>
              </Pressable>
            </View>
          </View>
        </Modal>

        {/* Modal: Seleção de DDD */}
        <Modal visible={showDDDPicker} animationType="slide" transparent={true}>
          <View style={styles.modalOverlay}>
            <View style={styles.pickerModal}>
              <View style={styles.pickerHeader}>
                <Text style={styles.pickerTitle}>Selecione o DDD</Text>
                <TouchableOpacity onPress={() => setShowDDDPicker(false)}>
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>
              <FlatList
                data={DDD_LIST}
                keyExtractor={(item) => item.code}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.dddOption,
                      selectedDDD === item.code && styles.dddOptionSelected
                    ]}
                    onPress={() => {
                      setSelectedDDD(item.code);
                      setFormData({ ...formData, doador_telefone: `+55 (${item.code}) ${phoneNumber}` });
                      setShowDDDPicker(false);
                    }}
                  >
                    <Text style={styles.dddOptionCode}>({item.code})</Text>
                    <View style={styles.dddOptionInfo}>
                      <Text style={styles.dddOptionCity}>{item.city}</Text>
                      <Text style={styles.dddOptionState}>{item.state}</Text>
                    </View>
                    {selectedDDD === item.code && (
                      <Ionicons name="checkmark" size={20} color="#E73645" />
                    )}
                  </TouchableOpacity>
                )}
                style={styles.dddList}
              />
            </View>
          </View>
        </Modal>

        {/* Modal: Seleção de DDD do Organizador */}
        <Modal visible={showOrgDDDPicker} animationType="slide" transparent={true}>
          <View style={styles.modalOverlay}>
            <View style={styles.pickerModal}>
              <View style={styles.pickerHeader}>
                <Text style={styles.pickerTitle}>Selecione o DDD</Text>
                <TouchableOpacity onPress={() => setShowOrgDDDPicker(false)}>
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>
              <FlatList
                data={DDD_LIST}
                keyExtractor={(item) => item.code}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.dddOption,
                      selectedOrgDDD === item.code && styles.dddOptionSelected
                    ]}
                    onPress={() => {
                      setSelectedOrgDDD(item.code);
                      setCampaignForm({ ...campaignForm, organizador_telefone: `+55 (${item.code}) ${organizadorPhoneNumber}` });
                      setShowOrgDDDPicker(false);
                    }}
                  >
                    <Text style={styles.dddOptionCode}>({item.code})</Text>
                    <View style={styles.dddOptionInfo}>
                      <Text style={styles.dddOptionCity}>{item.city}</Text>
                      <Text style={styles.dddOptionState}>{item.state}</Text>
                    </View>
                    {selectedOrgDDD === item.code && (
                      <Ionicons name="checkmark" size={20} color="#E73645" />
                    )}
                  </TouchableOpacity>
                )}
                style={styles.dddList}
              />
            </View>
          </View>
        </Modal>

        {/* Modal: Seleção de Sexo */}
        <Modal visible={showSexPicker} animationType="slide" transparent={true}>
          <View style={styles.modalOverlay}>
            <View style={styles.sexPickerModal}>
              <View style={styles.pickerHeader}>
                <Text style={styles.pickerTitle}>Selecione o sexo</Text>
                <TouchableOpacity onPress={() => setShowSexPicker(false)}>
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={[
                  styles.sexOption,
                  selectedSex === 'M' && styles.sexOptionSelected
                ]}
                onPress={() => {
                  setSelectedSex('M');
                  setFormData({ ...formData, doador_sexo: 'M' });
                  setShowSexPicker(false);
                }}
              >
                <Ionicons name="male" size={24} color={selectedSex === 'M' ? '#fff' : '#6B7280'} />
                <Text style={[styles.sexOptionText, selectedSex === 'M' && styles.sexOptionTextSelected]}>
                  Masculino
                </Text>
                {selectedSex === 'M' && (
                  <Ionicons name="checkmark" size={20} color="#fff" />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.sexOption,
                  selectedSex === 'F' && styles.sexOptionSelected
                ]}
                onPress={() => {
                  setSelectedSex('F');
                  setFormData({ ...formData, doador_sexo: 'F' });
                  setShowSexPicker(false);
                }}
              >
                <Ionicons name="female" size={24} color={selectedSex === 'F' ? '#fff' : '#6B7280'} />
                <Text style={[styles.sexOptionText, selectedSex === 'F' && styles.sexOptionTextSelected]}>
                  Feminino
                </Text>
                {selectedSex === 'F' && (
                  <Ionicons name="checkmark" size={20} color="#fff" />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scroll: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  headerIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 14,
    backgroundColor: '#E73645',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  ctaRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  ctaButton: {
    flex: 1,
    backgroundColor: '#E73645',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  ctaText: {
    color: Colors.light.background,
    fontWeight: '600',
    marginLeft: 8,
  },
  secondaryButton: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E73645',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: {
    color: '#E73645',
    marginLeft: 8,
    fontWeight: '600',
  },
  cards: {
    marginBottom: 24,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 14,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 12,
  },
  cardBody: {
    marginLeft: 12,
    flex: 1,
  },
  dobYearList: {
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#fff'
  },
  yearItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  yearItemSelected: {
    backgroundColor: '#E73645',
  },
  yearItemText: {
    color: Colors.light.text,
  },
  yearItemTextSelected: {
    color: '#fff',
    fontWeight: '700'
  },
  cardTitle: {
    fontWeight: '700',
    color: Colors.light.text,
  },
  cardText: {
    color: '#6B7280',
    marginTop: 4,
  },
  footerNote: {
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  noteTitle: {
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 6,
  },
  noteText: {
    color: '#6B7280',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  input: {
    flex: 1,
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 14,
  },
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 14,
    overflow: 'hidden',
  },
  phonePrefix: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
  },
  phonePrefixText: {
    color: '#6B7280',
    fontWeight: '600',
    fontSize: 16,
  },
  phoneInput: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 16,
    color: Colors.light.text,
  },
  dddSelector: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minWidth: 100,
  },
  dddText: {
    color: '#6B7280',
    fontWeight: '600',
    fontSize: 16,
    marginRight: 8,
  },
  selectorButton: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectorText: {
    color: Colors.light.text,
    fontSize: 16,
    fontWeight: '500',
  },
  selectorPlaceholder: {
    color: '#9CA3AF',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  pickerModal: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '100%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  sexPickerModal: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '100%',
    maxWidth: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
  },
  dddList: {
    maxHeight: 400,
  },
  dddOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dddOptionSelected: {
    backgroundColor: '#FEF2F2',
  },
  dddOptionCode: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E73645',
    minWidth: 50,
  },
  dddOptionInfo: {
    flex: 1,
    marginLeft: 12,
  },
  dddOptionCity: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.light.text,
  },
  dddOptionState: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  sexOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  sexOptionSelected: {
    backgroundColor: '#E73645',
  },
  sexOptionText: {
    fontSize: 18,
    fontWeight: '500',
    color: Colors.light.text,
    marginLeft: 16,
    flex: 1,
  },
  sexOptionTextSelected: {
    color: '#fff',
  },
  resultBox: {
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 10,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  resultTitle: {
    fontWeight: '700',
    marginBottom: 6,
    color: Colors.light.text,
  },
  resultText: {
    color: '#6B7280',
  },
  smallRow: {
    paddingVertical: 6,
  },
  ctaButtonOutline: {
    marginLeft: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E73645',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaTextOutline: {
    color: '#E73645',
    marginLeft: 8,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderColor: '#F3F4F6',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
  },
  modalBody: {
    padding: 16,
    flex: 1,
  },
  stepTitle: {
    fontWeight: '700',
    fontSize: 16,
    marginBottom: 12,
    color: Colors.light.text,
  },
  typeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  typeCard: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#FFF',
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  typeText: {
    fontWeight: '600',
    color: Colors.light.text,
  },
  listItem: {
    padding: 12,
    backgroundColor: '#FFF',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  listItemSelected: {
    borderColor: '#E73645',
    backgroundColor: '#FFF8F8',
  },
  datePill: {
    padding: 10,
    backgroundColor: '#FFF',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E73645',
    marginRight: 8,
  },
  datePillSelected: {
    borderColor: '#E73645',
    borderWidth: 2,
    backgroundColor: '#FFF0F0',
  },
  rowInline: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  yesNoRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
    flexWrap: 'nowrap',
    justifyContent: 'space-between',
  },
  yesNoButton: {
    flex: 1,
    minWidth: 120,
    marginRight: 8,
  },
  smallPill: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: '#E73645',
  },
  smallPillSelected: {
    backgroundColor: '#FFF0F0',
    borderColor: '#E73645',
    borderWidth: 2,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderColor: '#F3F4F6',
  },
  footerBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  footerBtnPrimary: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: '#E73645',
  },
  searchColumn: {
    flexDirection: 'column',
    width: '100%',
    marginBottom: 12,
  },
  fullButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E73645',
  },
  fullButtonPrimary: {
    backgroundColor: '#E73645',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  fullButtonOutline: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E73645',
  },
  fullButtonOutlineText: {
    color: '#E73645',
    fontWeight: '600',
  },
  postoButton: {
    backgroundColor: '#E73645',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  postoButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 8,
  },
  typeColumn: {
    flexDirection: 'column',
    width: '100%',
    marginTop: 8,
  },
  typeCardPrimary: {
    backgroundColor: '#E73645',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  typeTextPrimary: {
    color: '#FFFFFF',
    fontWeight: '700',
    marginLeft: 8,
  },
  typeCardSelected: {
    opacity: 1,
    backgroundColor: '#34D399',
    shadowColor: '#000',
    shadowOpacity: 0.10,
    shadowRadius: 6,
    elevation: 3,
  },
  preTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
  },
  preTriagemHeader: {
    backgroundColor: '#E73645',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  smallTypeButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    flexBasis: '48%',
    marginBottom: 8,
  },
  smallTypeText: {
    color: Colors.light.text,
    fontWeight: '700',
    fontSize: 16,
  },
  questionText: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
    color: Colors.light.text,
  },
  smallTypeSubtext: {
    marginTop: 6,
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
    textAlign: 'center',
  },
  smallTypeButtonSelected: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    minWidth: 140,
    /* removed shadow for cleaner look per request */
  },
  inputInvalid: {
    borderColor: '#E73645',
    borderWidth: 2,
    backgroundColor: '#FFF0F0',
    shadowColor: '#E73645',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 6,
  },
  questionBlock: {
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  dobOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dobCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 10,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
  dobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  localItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  localInfo: {
    flex: 1,
    paddingRight: 8,
  },
  localActions: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 8,
  },
  mapIconButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    marginBottom: 8,
  },
  searchButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E73645',
    borderRadius: 10,
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 50,
  },
  horarioHeader: {
    backgroundColor: '#E73645',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  horarioHeaderIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  horarioHeaderText: {
    flex: 1,
  },
  horarioTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  horarioSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 16,
  },
  horarioList: {
    marginBottom: 20,
  },
  horarioItem: {
    backgroundColor: 'rgba(231,54,69,0.1)',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  horarioItemAberto: {
    backgroundColor: '#E73645',
  },
  horarioRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  horarioDia: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E73645',
    flex: 1,
  },
  horarioIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#34D399',
    marginRight: 8,
  },
  horarioHoras: {
    fontSize: 15,
    fontWeight: '600',
    color: '#E73645',
  },
  statusBadge: {
    backgroundColor: '#34D399',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  localInfoCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
  },
  localTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 8,
  },
  localEndereco: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 16,
  },
  mapButton: {
    backgroundColor: '#E73645',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
  },
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 8,
  },
  telefoneText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E73645',
    marginLeft: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  phoneButton: {
    backgroundColor: '#34D399',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 6,
  },
  // Estilos para os horários
  horarioButton: {
    flex: 0.48,
    margin: 4,
    padding: 12,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#E73645',
    borderRadius: 12,
    minHeight: 50,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  horarioButtonSelected: {
    backgroundColor: '#E73645',
    borderColor: '#E73645',
  },
  horarioButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E73645',
    marginLeft: 6,
    textAlign: 'center',
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginTop: 8,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginTop: 12,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  // Estilos para verificação
  verificationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  verificationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  verificationLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  verificationValue: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '600',
    marginBottom: 2,
  },
  verificationSubvalue: {
    fontSize: 14,
    color: '#6B7280',
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF3C7',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  warningText: {
    fontSize: 14,
    color: '#92400E',
    lineHeight: 20,
  },
  // Estilos para o botão de informações
  infoButton: {
    backgroundColor: '#10B981',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  infoButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 8,
  },
  // Estilos para as seções de informações
  infoSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  infoSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F9FAFB',
  },
  infoSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E73645',
    flex: 1,
    paddingRight: 8,
  },
  infoSectionContent: {
    padding: 16,
    paddingTop: 8,
    backgroundColor: '#fff',
  },
  infoText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 8,
  },
  // Confirmation Modal Styles
  confirmationOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  confirmationModal: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    width: '100%',
    maxWidth: 350,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  dropletContainer: {
    width: 80,
    height: 100,
    marginBottom: 20,
    position: 'relative',
  },
  dropletBase: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#E73645',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
  },
  dropletTop: {
    position: 'absolute',
    top: -20,
    left: '50%',
    marginLeft: -10,
    width: 20,
    height: 20,
    backgroundColor: '#E73645',
    borderRadius: 10,
    transform: [{ rotate: '45deg' }],
  },
  dropletOutline: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '100%',
    borderWidth: 2,
    borderColor: '#E73645',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    backgroundColor: 'transparent',
  },
  dropletTopOutline: {
    position: 'absolute',
    top: -20,
    left: '50%',
    marginLeft: -10,
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#E73645',
    backgroundColor: 'transparent',
    borderRadius: 10,
    transform: [{ rotate: '45deg' }],
  },
  confirmationTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#E73645',
    marginBottom: 10,
    textAlign: 'center',
  },
  confirmationText: {
    fontSize: 16,
    color: '#374151',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  notificationStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  notificationText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#6B7280',
  },
  confirmationButton: {
    backgroundColor: '#E73645',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 25,
    minWidth: 120,
  },
  confirmationButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  systemUsedText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 10,
    fontWeight: '500',
  },
});