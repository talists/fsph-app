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

export default function DoarScreen() {
  const [cpf, setCpf] = useState('');
  const [loading, setLoading] = useState(false);
  const [doador, setDoador] = useState<any | null>(null);
  const [agendamentos, setAgendamentos] = useState<any[] | null>(null);
    const RED = '#E73645'; // Color for error messages
  const [modalVisible, setModalVisible] = useState(false);
  const [step, setStep] = useState(0); // 0: type,1: donor,2: local,3: date/time,4: confirm
  const [agendamentoType, setAgendamentoType] = useState<'D'|'M'|'C' | null>(null);
  const [formData, setFormData] = useState<any>({
    doador_nome: '',
    doador_dt_nascimento: '',
    doador_email: '',
    doador_cpf: '',
    doador_telefone: '',
    doador_sexo: '',
    id_bloco_doacao: null,
  });
  const [campaignForm, setCampaignForm] = useState<any>({
    organizador_cpf: '',
    organizador_nome: '',
    organizador_dt_nascimento: '',
    organizador_email: '',
    organizador_telefone: '',
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
  const [touchedForm, setTouchedForm] = useState<{[k:string]: boolean}>({});
  const [touchedCampaign, setTouchedCampaign] = useState<{[k:string]: boolean}>({});
  const [dobPickerVisible, setDobPickerVisible] = useState(false);
  const [dobPickerFor, setDobPickerFor] = useState<'donor'|'campaign'|null>(null);
  const [dobTempSelected, setDobTempSelected] = useState<string | null>(null);
  const [dobCalendarCurrent, setDobCalendarCurrent] = useState<string | null>(null);
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [cidades, setCidades] = useState<any[]>([]);
  // Display masks for DOB inputs to avoid cursor jumping while typing
  const [donorDobDisplay, setDonorDobDisplay] = useState<string>('');
  const [campaignDobDisplay, setCampaignDobDisplay] = useState<string>('');

  // Hard-coded locais to show in the locais list
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

  // Configure calendar to Portuguese (pt-BR)
  LocaleConfig.locales['pt-br'] = {
    monthNames: ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'],
    monthNamesShort: ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'],
    dayNames: ['domingo','segunda-feira','terça-feira','quarta-feira','quinta-feira','sexta-feira','sábado'],
    dayNamesShort: ['dom','seg','ter','qua','qui','sex','sáb'],
    today: 'Hoje'
  };

  // Animated feedback for the 'Próximo' button: small slide to the right then back
  const handleNextAnimated = () => {
    try {
      Animated.sequence([
        Animated.timing(nextAnim.current, { toValue: 1, duration: 120, useNativeDriver: true }),
        Animated.timing(nextAnim.current, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    } catch (e) {
      // fallback silent
    }
    // still call the original navigation logic
    handleNext();
  };
  LocaleConfig.defaultLocale = 'pt-br';
  // Start week on Monday
  LocaleConfig.firstDay = 1;
  const [locais, setLocais] = useState<any[]>([]);
  const [blocosDates, setBlocosDates] = useState<any[]>([]);
  const [blocosByDate, setBlocosByDate] = useState<any[]>([]);
  const [selectedCidade, setSelectedCidade] = useState<any>(null);
  const [selectedLocal, setSelectedLocal] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [postosModalVisible, setPostosModalVisible] = useState(false);
  const [localDetailsVisible, setLocalDetailsVisible] = useState(false);
  const [localDetails, setLocalDetails] = useState<any | null>(null);

  
  const scalesRef = useRef<{[k: string]: Animated.Value}>({
    D: new Animated.Value(1),
    C: new Animated.Value(1),
    M: new Animated.Value(1),
  }).current;

  
  const animRef = useRef<{[k: string]: Animated.Value}>({}).current;

  // animation value for footer 'Próximo' slide feedback
  const nextAnim = useRef(new Animated.Value(0));

  // Year list ref and constants for year picker scrolling
  const yearListRef = useRef<any>(null);
  const [yearItemHeight, setYearItemHeight] = useState<number>(0);
  const MIN_YEAR = 1900;

  // When year picker opens, auto-scroll the year list to the selected year
  useEffect(() => {
    if (!showYearPicker) return;
    const currentYear = new Date().getFullYear();
    const selectedYear = dobCalendarCurrent ? parseInt(dobCalendarCurrent.slice(0,4), 10) : currentYear;
    let index = currentYear - selectedYear;
    const maxIndex = currentYear - MIN_YEAR;
    if (index < 0) index = 0;
    if (index > maxIndex) index = maxIndex;
    // Wait a tick for FlatList to render, then scroll. Use measured item height if available.
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

  const groups: {[k:string]: string[]} = {
    primeiraVez: ['primeiraVez_true','primeiraVez_false'],
    pesaMais50: ['pesaMais50_true','pesaMais50_false'],
    tatuagemRecente: ['tatuagemRecente_true','tatuagemRecente_false'],
    sexo: ['sexo_M','sexo_F'],
    gravidaOuAmamentando: ['gravida_true','gravida_false'],
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
    // primeiraVez
    if (preTriagem.primeiraVez !== null) animateGroup('primeiraVez', `primeiraVez_${preTriagem.primeiraVez ? 'true' : 'false'}`);
    if (preTriagem.pesaMais50 !== null) animateGroup('pesaMais50', `pesaMais50_${preTriagem.pesaMais50 ? 'true' : 'false'}`);
    if (preTriagem.tatuagemRecente !== null) animateGroup('tatuagemRecente', `tatuagemRecente_${preTriagem.tatuagemRecente ? 'true' : 'false'}`);
    if (preTriagem.sexo) animateGroup('sexo', `sexo_${preTriagem.sexo}`);
    if (preTriagem.gravidaOuAmamentando !== null) animateGroup('gravidaOuAmamentando', `gravida_${preTriagem.gravidaOuAmamentando ? 'true' : 'false'}`);
  }, [step]);

  const animateSelect = (type: 'D'|'C'|'M') => {
    const v = scalesRef[type];
    if (!v) return;
    Animated.sequence([
      Animated.timing(v, { toValue: 1.06, duration: 140, useNativeDriver: true }),
      Animated.timing(v, { toValue: 1.0, duration: 120, useNativeDriver: true }),
    ]).start();
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
      // fallback do google maps
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
        const res = await apiService.getCidades(1,1,1);
        setCidades(res || []);
      } catch (e) {
        // silent
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
    // reset ephemeral agendamento state so previous choices are not persisted
    setAgendamentoType(null);
    setFormData({
      doador_nome: '',
      doador_dt_nascimento: '',
      doador_email: '',
      doador_cpf: '',
      doador_telefone: '',
      doador_sexo: '',
      id_bloco_doacao: null,
    });
    setCampaignForm({
      organizador_cpf: '',
      organizador_nome: '',
      organizador_dt_nascimento: '',
      organizador_email: '',
      organizador_telefone: '',
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
    setBlocosDates([]);
    setBlocosByDate([]);
    setStep(0);
    setModalVisible(true);
  };

  const closeAgendamentoModal = () => {
    // Reset same ephemeral state when closing
    setAgendamentoType(null);
    setFormData({
      doador_nome: '',
      doador_dt_nascimento: '',
      doador_email: '',
      doador_cpf: '',
      doador_telefone: '',
      doador_sexo: '',
      id_bloco_doacao: null,
    });
    setCampaignForm({
      organizador_cpf: '',
      organizador_nome: '',
      organizador_dt_nascimento: '',
      organizador_email: '',
      organizador_telefone: '',
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
    setBlocosDates([]);
    setBlocosByDate([]);
    setStep(0);
    setModalVisible(false);
  };

  
  const handleNext = async () => {
    // If at step 0, determine next based on selected type
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
      // pré-triagem 
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
      setStep(2);
      setValidationAttempted(false);
      return;
    }

    if (step === 2) {
      // Require full form completion depending on type
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
          'doador_nome','doador_cpf','doador_dt_nascimento','doador_email','doador_telefone','doador_sexo'
        ].filter(k => !(formData as any)[k]);
        if (missing.length) {
          setValidationAttempted(true);
          Alert.alert('Preencha todos os dados do doador antes de continuar');
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
      if (!formData.id_bloco_doacao) {
        setValidationAttempted(true);
        Alert.alert('Selecione um horário');
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
        doador_cpf: formData.doador_cpf,
        doador_telefone: formData.doador_telefone,
        doador_sexo: formData.doador_sexo,
        tipo: agendamentoType,
        id_bloco_doacao: formData.id_bloco_doacao,
        // pré-triagem fields 
        pre_primeira_vez: preTriagem.primeiraVez,
        pre_pesa_mais_50: preTriagem.pesaMais50,
        pre_tatuagem_piercing: preTriagem.tatuagemRecente,
        pre_sexo: preTriagem.sexo,
        pre_gravida_amamentando: preTriagem.gravidaOuAmamentando,
      };
      if (agendamentoType === 'C') {
        
        payload.organizador_cpf = campaignForm.organizador_cpf;
        payload.organizador_nome = campaignForm.organizador_nome;
        payload.organizador_dt_nascimento = campaignForm.organizador_dt_nascimento;
        payload.organizador_email = campaignForm.organizador_email;
        payload.organizador_telefone = campaignForm.organizador_telefone;
        payload.quantidade_doadores = campaignForm.quantidade_doadores;
        const res = await apiService.postMarcarCampanha(payload);
        Alert.alert('Sucesso', JSON.stringify(res));
      } else {
        const res = await apiService.postMarcarAgendamento(payload);
        Alert.alert('Sucesso', JSON.stringify(res));
      }
  closeAgendamentoModal();
      // reset steps
  setStep(0);
    } catch (e: any) {
      Alert.alert('Erro', e.message || 'Falha ao marcar');
    }
  };

  const handleBack = () => {
    // Clear validation highlights when navigating back
    setValidationAttempted(false);
    // For Campaign flow, there is no pré-triagem (step 1).
    // If user is on step 2 (campaign data) and presses back, go to type selection (0).
    if (agendamentoType === 'C' && step === 2) {
      setStep(0);
      return;
    }
    // Otherwise go one step back normally
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

  const openDobPicker = (forType: 'donor'|'campaign') => {
    setDobPickerFor(forType);
    // initialize temp selection with existing value if present
    const existing = forType === 'donor' ? formData.doador_dt_nascimento : campaignForm.organizador_dt_nascimento;
    setDobTempSelected(existing || null);
    // set calendar current view to existing or today
    const cur = existing || new Date().toISOString().slice(0,10);
    setDobCalendarCurrent(cur);
    setShowYearPicker(false);
    setDobPickerVisible(true);
  };

  const onDobSelect = (dateString: string) => {
    if (dobPickerFor === 'donor') {
      setFormData({...formData, doador_dt_nascimento: dateString});
      setTouchedForm({...touchedForm, doador_dt_nascimento: true});
      setDonorDobDisplay(isoToDisplay(dateString));
    } else if (dobPickerFor === 'campaign') {
      setCampaignForm({...campaignForm, organizador_dt_nascimento: dateString});
      setTouchedCampaign({...touchedCampaign, organizador_dt_nascimento: true});
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

  // Helper: accept DD/MM/YYYY or YYYY-MM-DD and return ISO YYYY-MM-DD for storage
  const inputToIso = (text: string) => {
    if (!text) return '';
    const t = text.trim();
    const m = t.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (m) return `${m[3]}-${m[2]}-${m[1]}`;
    const m2 = t.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (m2) return t;
    return t;
  };

  // Mask helper for typing dates: returns DD/MM/YYYY progressively
  const maskDateInput = (text: string) => {
    const digits = (text || '').replace(/\D/g, '').slice(0,8);
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0,2)}/${digits.slice(2)}`;
    return `${digits.slice(0,2)}/${digits.slice(2,4)}/${digits.slice(4,8)}`;
  };

  // Format a calendar-visible month/year from an ISO date (YYYY-MM-DD)
  const formatMonthYear = (iso?: string | null) => {
    const base = iso || new Date().toISOString().slice(0,10);
    const m = String(base).match(/^(\d{4})-(\d{2})-(\d{2})$/);
    const months: string[] = (LocaleConfig.locales['pt-br'] && LocaleConfig.locales['pt-br'].monthNames) || [];
    if (m) {
      const year = m[1];
      const monthIdx = parseInt(m[2], 10) - 1;
      const monthName = months[monthIdx] || '';
      // Capitalize first letter
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
          <TextInput
            placeholder="CPF do doador"
            value={cpf}
            onChangeText={setCpf}
            style={[styles.input, {marginBottom:12}]}
            keyboardType="numeric"
          />

          <Pressable style={[styles.fullButtonOutline]} onPress={handleBuscar}>
            {loading ? (
              <ActivityIndicator color={RED} />
            ) : (
              <View style={{flexDirection:'row', alignItems:'center', justifyContent:'center'}}>
                <Ionicons name="search" size={18} color={RED} />
                <Text style={styles.fullButtonOutlineText}> Buscar</Text>
              </View>
            )}
          </Pressable>

          <Pressable style={[styles.fullButtonPrimary]} onPress={openAgendamentoModal}>
            <View style={{flexDirection:'row', alignItems:'center', justifyContent:'center'}}>
              <Ionicons name="calendar" size={24} color="#fff" />
              <Text style={styles.fullButtonText}> Agendar Doação</Text>
            </View>
          </Pressable>

          <Pressable style={[styles.postoButton, {marginTop:10}]} onPress={async ()=>{
            setPostosModalVisible(true);
            try{
              const res = await apiService.getCidades(1,1,1);
              setCidades(res || []);
              setLocais([]);
              setSelectedCidade(null);
            }catch(e){ Alert.alert('Erro ao carregar postos'); }
          }}>
            <Ionicons name="location" size={18} color="#fff" />
            <Text style={styles.postoButtonText}> Postos de Coleta</Text>
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
      <ScrollView keyboardShouldPersistTaps='handled' contentContainerStyle={{paddingBottom:30}}>
      {step === 0 && (
                <View>
                  <Text style={styles.stepTitle}>Selecione o tipo de doação</Text>
                  <View style={styles.typeColumn}>
                    <AnimatedPressable

          // --- DOB Picker Modal ---
          // (placed after main return to keep JSX tidy; rendered conditionally)

          // NOTE: The Calendar modal is mounted below the main return so it overlays properly.
                      onPress={() => { setAgendamentoType('D'); animateSelect('D'); setFormData({...formData, tipo: 'D'}); }}
                      style={[styles.typeCardPrimary, agendamentoType === 'D' ? styles.typeCardSelected : null, {transform:[{scale: scalesRef['D']}]}]}
                    >
                      <View style={{flexDirection:'row', alignItems:'center', justifyContent:'center'}}>
                        <Ionicons name="person" size={18} color="#fff" />
                        <Text style={styles.typeTextPrimary}> Doação Individual</Text>
                        {agendamentoType === 'D' ? <Ionicons name="checkmark" size={16} color="#fff" style={{marginLeft:8}} /> : null}
                      </View>
                    </AnimatedPressable>

                    <AnimatedPressable
                      onPress={() => { setAgendamentoType('C'); animateSelect('C'); setFormData({...formData, tipo: 'C'}); }}
                      style={[styles.typeCardPrimary, agendamentoType === 'C' ? styles.typeCardSelected : null, {transform:[{scale: scalesRef['C']}]}]}
                    >
                      <View style={{flexDirection:'row', alignItems:'center', justifyContent:'center'}}>
                        <Ionicons name="megaphone" size={18} color="#fff" />
                        <Text style={styles.typeTextPrimary}> Campanha</Text>
                        {agendamentoType === 'C' ? <Ionicons name="checkmark" size={16} color="#fff" style={{marginLeft:8}} /> : null}
                      </View>
                    </AnimatedPressable>

                    <AnimatedPressable
                      onPress={() => { setAgendamentoType('M'); animateSelect('M'); setFormData({...formData, tipo: 'M'}); }}
                      style={[styles.typeCardPrimary, agendamentoType === 'M' ? styles.typeCardSelected : null, {transform:[{scale: scalesRef['M']}]}]}
                    >
                      <View style={{flexDirection:'row', alignItems:'center', justifyContent:'center'}}>
                        <Ionicons name="pulse" size={18} color="#fff" />
                        <Text style={styles.typeTextPrimary}> Cadastro Medula Óssea</Text>
                        {agendamentoType === 'M' ? <Ionicons name="checkmark" size={16} color="#fff" style={{marginLeft:8}} /> : null}
                      </View>
                    </AnimatedPressable>
                  </View>
                </View>
              )}

              {step === 1 && (
                <View>
                  <Text style={styles.preTitle}>Pré‑triagem</Text>

                  <View style={[styles.questionBlock, invalidPre ? {borderColor: RED} : null]}>
                    <Text style={styles.questionText}>1) Primeira vez doando sangue?</Text>
                      <View style={styles.yesNoRow}>
                      {['Sim','Não'].map((opt, idx)=>{
                        const key = `primeiraVez_${opt === 'Sim' ? 'true' : 'false'}`;
                        const selected = (opt === 'Sim' ? preTriagem.primeiraVez === true : preTriagem.primeiraVez === false);
                        const bgColor = selected ? (opt === 'Sim' ? '#34D399' : RED) : '#FFFFFF';
                        const borderColor = selected ? (opt === 'Sim' ? '#34D399' : RED) : RED;
                        const textColor = selected ? '#FFFFFF' : Colors.light.text;
                        return (
                          <AnimatedPressable
                            key={key}
                            onPress={()=>{ setPreTriagem({...preTriagem, primeiraVez: opt === 'Sim'}); animateGroup('primeiraVez', key); }}
                            style={[styles.smallTypeButton, styles.yesNoButton, selected ? styles.smallTypeButtonSelected : null, {transform:[{scale: selected ? 1.08 : 1}], backgroundColor: bgColor, borderRadius:10, borderWidth:2, borderColor}]}
                          >
                            <View style={{flexDirection:'row', alignItems:'center', justifyContent:'center'}}>
                              <Text style={[styles.smallTypeText, {color: textColor}]}>{opt}</Text>
                              {selected ? (opt === 'Não' ? <Ionicons name="close" size={18} color="#fff" style={{marginLeft:8}} /> : <Ionicons name="checkmark" size={18} color="#fff" style={{marginLeft:8}} />) : null}
                            </View>
                          </AnimatedPressable>
                        );
                      })}
                    </View>
                  </View>

                  <View style={[styles.questionBlock, invalidPre ? {borderColor: RED} : null]}>
                    <Text style={styles.questionText}>2) Você pesa mais de 50Kg?</Text>
                      <View style={styles.yesNoRow}>
                      {['Sim','Não'].map((opt)=>{
                        const key = `pesaMais50_${opt === 'Sim' ? 'true' : 'false'}`;
                        const selected = (opt === 'Sim' ? preTriagem.pesaMais50 === true : preTriagem.pesaMais50 === false);
                        const bgColor = selected ? (opt === 'Sim' ? '#34D399' : RED) : '#FFFFFF';
                        const borderColor = selected ? (opt === 'Sim' ? '#34D399' : RED) : RED;
                        const textColor = selected ? '#FFFFFF' : Colors.light.text;
                        return (
                          <AnimatedPressable
                            key={key}
                            onPress={()=>{ setPreTriagem({...preTriagem, pesaMais50: opt === 'Sim'}); animateGroup('pesaMais50', key); }}
                            style={[styles.smallTypeButton, styles.yesNoButton, selected ? styles.smallTypeButtonSelected : null, {transform:[{scale: selected ? 1.08 : 1}], backgroundColor: bgColor, borderRadius:10, borderWidth:2, borderColor}]}
                          >
                            <View style={{flexDirection:'row', alignItems:'center', justifyContent:'center'}}>
                              <Text style={[styles.smallTypeText, {color: textColor}]}>{opt}</Text>
                              {selected ? (opt === 'Não' ? <Ionicons name="close" size={18} color="#fff" style={{marginLeft:8}} /> : <Ionicons name="checkmark" size={18} color="#fff" style={{marginLeft:8}} />) : null}
                            </View>
                          </AnimatedPressable>
                        );
                      })}
                    </View>
                  </View>

                  <View style={[styles.questionBlock, invalidPre ? {borderColor: RED} : null]}>
                    <Text style={styles.questionText}>3) Fez tatuagem/piercing em local não certificado pela ANVISA nos últimos 12 meses?</Text>
                      <View style={styles.yesNoRow}>
                      {['Sim','Não'].map((opt)=>{
                        const key = `tatuagemRecente_${opt === 'Sim' ? 'true' : 'false'}`;
                        const selected = (opt === 'Sim' ? preTriagem.tatuagemRecente === true : preTriagem.tatuagemRecente === false);
                        const bgColor = selected ? (opt === 'Sim' ? '#34D399' : RED) : '#FFFFFF';
                        const borderColor = selected ? (opt === 'Sim' ? '#34D399' : RED) : RED;
                        const textColor = selected ? '#FFFFFF' : Colors.light.text;
                        return (
                          <AnimatedPressable
                            key={key}
                            onPress={()=>{ setPreTriagem({...preTriagem, tatuagemRecente: opt === 'Sim'}); animateGroup('tatuagemRecente', key); }}
                            style={[styles.smallTypeButton, styles.yesNoButton, selected ? styles.smallTypeButtonSelected : null, {transform:[{scale: selected ? 1.08 : 1}], backgroundColor: bgColor, borderRadius:10, borderWidth:2, borderColor}]}
                          >
                            <View style={{flexDirection:'row', alignItems:'center', justifyContent:'center'}}>
                              <Text style={[styles.smallTypeText, {color: textColor}]}>{opt}</Text>
                              {selected ? (opt === 'Não' ? <Ionicons name="close" size={18} color="#fff" style={{marginLeft:8}} /> : <Ionicons name="checkmark" size={18} color="#fff" style={{marginLeft:8}} />) : null}
                            </View>
                          </AnimatedPressable>
                        );
                      })}
                    </View>
                  </View>

                  <View style={[styles.questionBlock, invalidPre ? {borderColor: RED} : null]}>
                    <Text style={styles.questionText}>4) Sexo</Text>
                    <View style={styles.yesNoRow}>
                      {['Masculino','Feminino'].map((opt)=>{
                        const key = `sexo_${opt === 'Masculino' ? 'M' : 'F'}`;
                        const selected = (opt === 'Masculino' ? preTriagem.sexo === 'M' : preTriagem.sexo === 'F');
                        const shortLabel = opt === 'Masculino' ? 'M' : 'F';
                        // Make both Masculino and Feminino show green when selected
                        const bgColor = selected ? '#34D399' : '#FFFFFF';
                        const borderColor = selected ? '#34D399' : RED;
                        const textColor = selected ? '#FFFFFF' : Colors.light.text;
                        return (
                          <AnimatedPressable
                            key={key}
                            onPress={()=>{ setPreTriagem({...preTriagem, sexo: opt === 'Masculino' ? 'M' : 'F', gravidaOuAmamentando: opt === 'Masculino' ? null : preTriagem.gravidaOuAmamentando}); animateGroup('sexo', key); }}
                            style={[styles.smallTypeButton, styles.yesNoButton, selected ? styles.smallTypeButtonSelected : null, {transform:[{scale: selected ? 1.08 : 1}], backgroundColor: bgColor, borderRadius:10, borderWidth:2, borderColor}]}
                          >
                            <View style={{flexDirection:'row', alignItems:'center', justifyContent:'center'}}>
                              <Text style={[styles.smallTypeText, {color: textColor}]}>{shortLabel}</Text>
                              {selected ? <Ionicons name="checkmark" size={18} color="#fff" style={{marginLeft:8}} /> : null}
                            </View>
                            <Text style={styles.smallTypeSubtext}>{opt}</Text>
                          </AnimatedPressable>
                        );
                      })}
                    </View>
                  </View>

                  {preTriagem.sexo === 'F' && (
                      <View style={{marginTop:12}}>
                      <Text style={styles.questionText}>Você está grávida ou amamentando atualmente?</Text>
                      <View style={styles.yesNoRow}>
                        {['Sim','Não'].map((opt)=>{
                          const key = `gravida_${opt === 'Sim' ? 'true' : 'false'}`;
                          const anim = ensureAnim(key);
                          const selected = (opt === 'Sim' ? preTriagem.gravidaOuAmamentando === true : preTriagem.gravidaOuAmamentando === false);
                          // compute colors: default white, selected Sim = green, selected Não = red
                          const bgColor = selected ? (opt === 'Sim' ? '#34D399' : RED) : '#FFFFFF';
                          const borderColor = selected ? (opt === 'Sim' ? '#34D399' : RED) : RED;
                          const textColor = selected ? '#FFFFFF' : Colors.light.text;
                          return (
                            <AnimatedPressable
                              key={key}
                              onPress={()=>{ setPreTriagem({...preTriagem, gravidaOuAmamentando: opt === 'Sim'}); animateGroup('gravidaOuAmamentando', key); }}
                              style={[styles.smallTypeButton, styles.yesNoButton, selected ? styles.smallTypeButtonSelected : null, {transform:[{scale: selected ? 1.08 : 1}], backgroundColor: bgColor, borderRadius:10, borderWidth:2, borderColor}]}
                            >
                              <View style={{flexDirection:'row', alignItems:'center', justifyContent:'center'}}>
                                  <Text style={[styles.smallTypeText, {color: textColor}]}>{opt}</Text>
                                  {selected ? (opt === 'Não' ? <Ionicons name="close" size={18} color="#fff" style={{marginLeft:8}} /> : <Ionicons name="checkmark" size={18} color="#fff" style={{marginLeft:8}} />) : null}
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
                        placeholder="CPF do organizador"
                        style={[styles.input, isInvalid('organizador_cpf','campaign') ? styles.inputInvalid : null]}
                        value={campaignForm.organizador_cpf}
                        onChangeText={(t)=>setCampaignForm({...campaignForm, organizador_cpf: t})}
                        keyboardType="numeric"
                        onBlur={()=>setTouchedCampaign({...touchedCampaign, organizador_cpf: true})}
                      />

                      <Text style={styles.inputLabel}>Nome completo do organizador</Text>
                      <TextInput
                        placeholder="Nome completo"
                        style={[styles.input, isInvalid('organizador_nome','campaign') ? styles.inputInvalid : null]}
                        value={campaignForm.organizador_nome}
                        onChangeText={(t)=>setCampaignForm({...campaignForm, organizador_nome: t})}
                        onBlur={()=>setTouchedCampaign({...touchedCampaign, organizador_nome: true})}
                      />

                      <Text style={styles.inputLabel}>Data de nascimento do organizador</Text>
                      <View style={{flexDirection:'row', alignItems:'center'}}>
                        <TextInput
                            placeholder="DD/MM/YYYY"
                            style={[styles.input, {flex:1}, isInvalid('organizador_dt_nascimento','campaign') ? styles.inputInvalid : null]}
                            value={campaignDobDisplay}
                            onChangeText={(t)=>{
                              const m = maskDateInput(t);
                              setCampaignDobDisplay(m);
                              if (/^\d{2}\/\d{2}\/\d{4}$/.test(m)) {
                                setCampaignForm({...campaignForm, organizador_dt_nascimento: inputToIso(m)});
                              } else {
                                setCampaignForm({...campaignForm, organizador_dt_nascimento: ''});
                              }
                            }}
                            onBlur={()=>setTouchedCampaign({...touchedCampaign, organizador_dt_nascimento: true})}
                          />
                        <Pressable onPress={()=>openDobPicker('campaign')} style={{marginLeft:8, padding:8}}>
                          <Ionicons name="calendar" size={22} color={RED} />
                        </Pressable>
                      </View>

                      <Text style={styles.inputLabel}>E‑mail do organizador</Text>
                      <TextInput
                        placeholder="E-mail"
                        style={[styles.input, isInvalid('organizador_email','campaign') ? styles.inputInvalid : null]}
                        value={campaignForm.organizador_email}
                        onChangeText={(t)=>setCampaignForm({...campaignForm, organizador_email: t})}
                        keyboardType="email-address"
                        onBlur={()=>setTouchedCampaign({...touchedCampaign, organizador_email: true})}
                      />

                      <Text style={styles.inputLabel}>Telefone do organizador</Text>
                      <TextInput
                        placeholder="Telefone"
                        style={[styles.input, isInvalid('organizador_telefone','campaign') ? styles.inputInvalid : null]}
                        value={campaignForm.organizador_telefone}
                        onChangeText={(t)=>setCampaignForm({...campaignForm, organizador_telefone: t})}
                        keyboardType="phone-pad"
                        onBlur={()=>setTouchedCampaign({...touchedCampaign, organizador_telefone: true})}
                      />

                      <Text style={styles.inputLabel}>Quantidade de doadores</Text>
                      <TextInput
                        placeholder="Quantidade de doadores"
                        style={[styles.input, isInvalid('quantidade_doadores','campaign') ? styles.inputInvalid : null]}
                        value={campaignForm.quantidade_doadores}
                        onChangeText={(t)=>setCampaignForm({...campaignForm, quantidade_doadores: t})}
                        keyboardType="numeric"
                        onBlur={()=>setTouchedCampaign({...touchedCampaign, quantidade_doadores: true})}
                      />
                    </View>
                  ) : (
                    <View>
                      <Text style={styles.inputLabel}>Nome completo</Text>
                      <TextInput
                        placeholder="Nome"
                        style={[styles.input, isInvalid('doador_nome','donor') ? styles.inputInvalid : null]}
                        value={formData.doador_nome}
                        onChangeText={(t)=>setFormData({...formData, doador_nome: t})}
                        onBlur={()=>setTouchedForm({...touchedForm, doador_nome: true})}
                      />

                      <Text style={styles.inputLabel}>CPF</Text>
                      <TextInput
                        placeholder="CPF"
                        style={[styles.input, isInvalid('doador_cpf','donor') ? styles.inputInvalid : null]}
                        value={formData.doador_cpf}
                        onChangeText={(t)=>setFormData({...formData, doador_cpf: t})}
                        keyboardType="numeric"
                        onBlur={()=>setTouchedForm({...touchedForm, doador_cpf: true})}
                      />

                      <Text style={styles.inputLabel}>Data de nascimento</Text>
                      <View style={{flexDirection:'row', alignItems:'center'}}>
                        <TextInput
                          placeholder="DD/MM/YYYY"
                          style={[styles.input, {flex:1}, isInvalid('doador_dt_nascimento','donor') ? styles.inputInvalid : null]}
                          value={donorDobDisplay}
                          onChangeText={(t)=>{
                            const m = maskDateInput(t);
                            setDonorDobDisplay(m);
                            if (/^\d{2}\/\d{2}\/\d{4}$/.test(m)) {
                              setFormData({...formData, doador_dt_nascimento: inputToIso(m)});
                            } else {
                              setFormData({...formData, doador_dt_nascimento: ''});
                            }
                          }}
                          onBlur={()=>setTouchedForm({...touchedForm, doador_dt_nascimento: true})}
                        />
                        <Pressable onPress={()=>openDobPicker('donor')} style={{marginLeft:8, padding:8}}>
                          <Ionicons name="calendar" size={22} color={RED} />
                        </Pressable>
                      </View>

                      <Text style={styles.inputLabel}>E‑mail</Text>
                      <TextInput
                        placeholder="E-mail"
                        style={[styles.input, isInvalid('doador_email','donor') ? styles.inputInvalid : null]}
                        value={formData.doador_email}
                        onChangeText={(t)=>setFormData({...formData, doador_email: t})}
                        keyboardType="email-address"
                        onBlur={()=>setTouchedForm({...touchedForm, doador_email: true})}
                      />

                      <Text style={styles.inputLabel}>Telefone</Text>
                      <TextInput
                        placeholder="Telefone"
                        style={[styles.input, isInvalid('doador_telefone','donor') ? styles.inputInvalid : null]}
                        value={formData.doador_telefone}
                        onChangeText={(t)=>setFormData({...formData, doador_telefone: t})}
                        keyboardType="phone-pad"
                        onBlur={()=>setTouchedForm({...touchedForm, doador_telefone: true})}
                      />

                      <Text style={styles.inputLabel}>Sexo (M/F)</Text>
                      <TextInput
                        placeholder="Sexo (M/F)"
                        style={[styles.input, isInvalid('doador_sexo','donor') ? styles.inputInvalid : null]}
                        value={formData.doador_sexo}
                        onChangeText={(t)=>setFormData({...formData, doador_sexo: t})}
                        onBlur={()=>setTouchedForm({...touchedForm, doador_sexo: true})}
                      />
                    </View>
                  )}
                </View>
              )}

              {step === 3 && (
                <View>
                  <Text style={styles.stepTitle}>Escolha o local</Text>
                  <Text style={{marginBottom:8}}>Cidades</Text>
                  <FlatList
                    data={locais}
                    keyExtractor={(item:any)=>String(item.id || item.cd_local || JSON.stringify(item))}
                    renderItem={({item}) => (
                      <View style={[styles.listItem, selectedLocal && selectedLocal.id === item.id ? styles.listItemSelected : null]}>
                        <View style={styles.localItemRow}>
                          <View style={styles.localInfo}>
                            <Text style={{fontWeight:'700'}}>{item.nome || item.descricao || item.endereco || JSON.stringify(item)}</Text>
                            {item.endereco ? <Text style={{color:'#6B7280', marginTop:4}}>{item.endereco}</Text> : null}
                            {item.horario ? <Text style={{color:'#6B7280', marginTop:4, fontSize:12}}>{item.horario}</Text> : null}
                            {item.agendamento ? <Text style={{color:'#6B7280', marginTop:4, fontSize:12}}>{item.agendamento}</Text> : null}
                          </View>
                          <View style={styles.localActions}>
                            <Pressable onPress={async ()=>{
                              try{
                                if (item.latitude && item.longitude) {
                                  const coords = `${item.latitude},${item.longitude}`;
                                  if (Platform.OS === 'ios') await openAppleMaps(item);
                                  else await openGoogleMaps(item);
                                } else {
                                  openMapOptions(item);
                                }
                              } catch(e){ openMapOptions(item); }
                            }} style={styles.mapIconButton}>
                              <Ionicons name="map" size={20} color={RED} />
                            </Pressable>
                            <Pressable style={[styles.smallPill]} onPress={async ()=>{
                              // select this local for scheduling and fetch blocos/datas
                              setSelectedLocal(item);
                              try{
                                const res = await apiService.getBlocoAllDate(item.id || item.cd_local || item.codigo, 1,1,1);
                                setBlocosDates(res || []);
                              }catch(e){Alert.alert('Erro ao buscar datas')}
                            }}>
                              <Text style={{fontWeight:'700'}}>Selecionar</Text>
                            </Pressable>
                          </View>
                        </View>
                      </View>
                    )}
                    style={{maxHeight:150}}
                  />

                  <Text style={{marginBottom:8}}>Locais</Text>
                  <FlatList
                    data={locais}
                    keyExtractor={(item:any)=>String(item.id || item.cd_local || JSON.stringify(item))}
                    renderItem={({item}) => (
                      <TouchableOpacity style={[styles.listItem, selectedLocal && selectedLocal.id === item.id ? styles.listItemSelected : null]} onPress={async ()=>{
                        // If this is one of our hardcoded postos, open the map directly
                        if (item && item.id && String(item.id).startsWith('posto_')) {
                          try {
                            if (Platform.OS === 'ios') await openAppleMaps(item);
                            else await openGoogleMaps(item);
                          } catch (e) {
                            openMapOptions(item);
                          }
                          return;
                        }
                        // otherwise select and fetch blocos/datas as normal
                        setSelectedLocal(item);
                        try{
                          const res = await apiService.getBlocoAllDate(item.id || item.cd_local || item.codigo, 1,1,1);
                          setBlocosDates(res || []);
                        }catch(e){Alert.alert('Erro ao buscar datas')}
                      }}>
                        <Text>{item.nome || item.descricao || JSON.stringify(item)}</Text>
                      </TouchableOpacity>
                    )}
                    style={{maxHeight:150}}
                  />
                </View>
              )}

              {step === 4 && (
                <View>
                  <Text style={styles.stepTitle}>Escolha data e horário</Text>
                  <Text style={{marginBottom:8}}>Selecione um dia disponível</Text>

                  <Calendar
                    onDayPress={async (day: any) => {
                      const dateStr = day.dateString;
                      setSelectedDate(dateStr);
                      try {
                        const res = await apiService.getBlocoByDate(dateStr, selectedLocal?.id || selectedLocal?.cd_local || selectedLocal?.codigo, 1,1,1);
                        setBlocosByDate(res || []);
                      } catch (e) {
                        Alert.alert('Erro ao buscar horários');
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

                  <Text style={{marginTop:12, marginBottom:8}}>Horários</Text>
                  <FlatList
                    data={blocosByDate}
                    keyExtractor={(item:any, idx:number)=>String(item.id || item.cd_bloco || idx)}
                    renderItem={({item}) => (
                      <TouchableOpacity style={styles.listItem} onPress={()=>{
                        setFormData({...formData, id_bloco_doacao: item.id || item.cd_bloco || item.id_bloco});
                      }}>
                        <Text>{item.hora_inicio ? `${item.hora_inicio} - ${item.hora_fim}` : JSON.stringify(item)}</Text>
                      </TouchableOpacity>
                    )}
                    style={{maxHeight:200}}
                  />
                </View>
              )}

              {step === 5 && (
                <View>
                  <Text style={styles.stepTitle}>Verificação final</Text>
                  <Text>Tipo: {agendamentoType}</Text>
                  <Text>Nome: {formData.doador_nome}</Text>
                  <Text>CPF: {formData.doador_cpf}</Text>
                  <Text>Local: {selectedLocal?.nome || JSON.stringify(selectedLocal)}</Text>
                  <Text>Data: {isoToDisplay(selectedDate)}</Text>
                  <Text>Bloco: {formData.id_bloco_doacao}</Text>
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
                  style={[styles.footerBtnPrimary, {transform: [{ translateX: nextAnim.current.interpolate({ inputRange: [0,1], outputRange: [0, 8] }) }]}]}
                  onPress={handleNextAnimated}
                >
                  <Text style={{color:'#fff'}}>Próximo</Text>
                </AnimatedPressable>
              ) : (
                <Pressable style={[styles.footerBtnPrimary]} onPress={handleConfirm}><Text style={{color:'#fff'}}>Confirmar</Text></Pressable>
              )}
            </View>
          </SafeAreaView>
        </Modal>

        {/* Modal: Postos de Coleta */}
        <Modal visible={postosModalVisible} animationType="slide">
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Postos de Coleta</Text>
              <Pressable onPress={() => { setPostosModalVisible(false); }}>
                <Ionicons name="close" size={24} color={RED} />
              </Pressable>
            </View>
            <View style={styles.modalBody}>
              <Text style={{marginBottom:8}}>Cidades</Text>
              <FlatList
                data={cidades}
                keyExtractor={(item:any)=>String(item.id || item.codigo || JSON.stringify(item))}
                renderItem={({item})=> (
                  <TouchableOpacity style={[styles.listItem, selectedCidade && selectedCidade.id === item.id ? styles.listItemSelected : null]} onPress={async ()=>{
                    setSelectedCidade(item);
                    try{
                      const res = await apiService.getLocal(item.id || item.cd_cidade || item.codigo, 1,1,1);
                      setLocais([...HARDCODED_LOCAIS, ...(res || [])]);
                    }catch(e){ Alert.alert('Erro ao buscar locais'); }
                  }}>
                    <Text>{item.nome || item.cidade || item.descricao || JSON.stringify(item)}</Text>
                  </TouchableOpacity>
                )}
                style={{maxHeight:180, marginBottom:12}}
              />

              <Text style={{marginBottom:8}}>Locais</Text>
              <FlatList
                data={locais}
                keyExtractor={(item:any)=>String(item.id || item.cd_local || JSON.stringify(item))}
                renderItem={({item}) => (
                  <TouchableOpacity
                    style={styles.listItem}
                    onPress={async () => {
                      // If this is one of our hardcoded postos, open the map directly
                      if (item && item.id && String(item.id).startsWith('posto_')) {
                        try {
                          if (Platform.OS === 'ios') await openAppleMaps(item);
                          else await openGoogleMaps(item);
                        } catch (e) {
                          openMapOptions(item);
                        }
                        return;
                      }
                      // for other locais, show map options (or details)
                      openMapOptions(item);
                    }}
                  >
                    <Text style={{fontWeight:'700'}}>{item.nome || item.descricao || item.endereco || JSON.stringify(item)}</Text>
                    <Text style={{color:'#6B7280'}}>{item.bairro || item.cidade || ''}</Text>
                    <View style={{flexDirection:'row', marginTop:8, gap:8}}>
                      <AnimatedPressable style={[styles.smallPill]} onPress={()=>showLocalDetails(item)}>
                        <Text>Detalhes</Text>
                      </AnimatedPressable>
                      <AnimatedPressable style={[styles.smallPill]} onPress={()=>openMapOptions(item)}>
                        <Text>Abrir no mapa</Text>
                      </AnimatedPressable>
                    </View>
                  </TouchableOpacity>
                )}
              />
            </View>
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
                  <Text style={{fontWeight:'700', marginBottom:8}}>{localDetails.nome || localDetails.descricao}</Text>
                  <Text style={{marginBottom:6}}>{localDetails.endereco || localDetails.rua || ''}</Text>
                  <Text style={{marginBottom:6}}>{localDetails.bairro || ''} {localDetails.cidade ? `- ${localDetails.cidade}` : ''}</Text>
                  {localDetails.telefone ? <Text style={{marginBottom:6}}>Tel: {localDetails.telefone}</Text> : null}
                  {localDetails.horario ? <Text style={{marginBottom:6}}>Horário: {localDetails.horario}</Text> : null}
                  <View style={{flexDirection:'row', gap:8, marginTop:12}}>
                    <Pressable style={[styles.fullButtonOutline]} onPress={()=>openMapOptions(localDetails)}>
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
                  <Pressable onPress={() => setShowYearPicker(s => !s)} style={{flex:1, flexDirection:'row', alignItems:'center', justifyContent:'center', gap:8}}>
                    <Text style={styles.modalTitle}>{formatMonthYear(dobCalendarCurrent || new Date().toISOString().slice(0,10))}</Text>
                    <Ionicons name={showYearPicker ? 'chevron-up' : 'chevron-down'} size={18} color={RED} />
                  </Pressable>
                  <Pressable onPress={() => { setDobPickerVisible(false); setDobPickerFor(null); }}>
                    <Ionicons name="close" size={22} color={RED} />
                  </Pressable>
                </View>
                <View style={{paddingVertical:8}}>
                  {/**
                   * Build a marked map for today and the temporary selection.
                   * We'll render days with a custom dayComponent so we can color weekends red.
                   */}
                  {(() => {
                    // Build markings. If the user has a temporary selection (dobTempSelected),
                    // only show that as the active selection so the calendar highlights a single date.
                    const marked: any = {};
                    const cur = dobPickerFor === 'donor' ? formData.doador_dt_nascimento : campaignForm.organizador_dt_nascimento;
                    const today = new Date().toISOString().slice(0,10);
                    if (dobTempSelected) {
                      // when user is previewing a selection, mark only the temp selection
                      marked[dobTempSelected] = { type: 'temp' };
                    } else {
                      // otherwise, show saved value and today's mark (if different)
                      if (cur) marked[cur] = { type: 'saved' };
                      if (!cur || cur !== today) marked[today] = { type: 'today' };
                    }

                    // custom weekday labels (hide default day names and render our own so we can color dom & sáb)
                    const weekdayShort = LocaleConfig.locales['pt-br'].dayNamesShort || ['dom','seg','ter','qua','qui','sex','sáb'];
                    const fd = typeof LocaleConfig.firstDay === 'number' ? LocaleConfig.firstDay : 0;
                    // rotate labels so they align with calendar's firstDay
                    const labels = weekdayShort.slice(fd).concat(weekdayShort.slice(0, fd));
                    return (
                      <>
                        <View style={{flexDirection:'row', justifyContent:'space-between', paddingHorizontal:8, marginBottom:6}}>
                          {labels.map((d: string, i: number) => {
                            // keep all weekday labels in the regular text color (no red)
                            return (
                              <Text key={`${d}-${i}`} style={{width:38, textAlign:'center', color: Colors.light.text, fontWeight: '700'}}>{d}</Text>
                            );
                          })}
                        </View>
                        {showYearPicker ? (
                          (() => {
                            const currentYear = new Date().getFullYear();
                            const years: number[] = [];
                            for (let y = currentYear; y >= 1900; y--) years.push(y);
                            const selectedYear = dobCalendarCurrent ? parseInt(dobCalendarCurrent.slice(0,4), 10) : currentYear;
                            return (
                              <View style={styles.dobYearList}>
                                  <FlatList
                                    ref={yearListRef}
                                    data={years}
                                    keyExtractor={(y) => String(y)}
                                    getItemLayout={(_, index) => ({length: yearItemHeight || 40, offset: (yearItemHeight || 40) * index, index})}
                                    initialNumToRender={12}
                                    renderItem={({item}) => {
                                    const isSel = item === selectedYear;
                                    return (
                                      <Pressable onPress={() => {
                                        // keep month/day from current view or today
                                        const base = dobCalendarCurrent || new Date().toISOString().slice(0,10);
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
                                    style={{maxHeight:220}}
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
                            if (!date || !date.dateString) return (<View style={{width:38,height:38}} />);
                            const ds = date.dateString;
                            const mark = marked[ds];
                            const isWeekend = [0,6].includes(new Date(ds).getDay());
                            const DayWrap: any = Pressable;
                            // Render marked days (today / temp / saved)
                            if (mark && (mark.type === 'today' || mark.type === 'temp' || mark.type === 'saved')) {
                              const isTodayMark = mark.type === 'today';
                              const bg = isTodayMark ? '#10B981' : RED; // green for today, red for temp/saved
                              return (
                                <DayWrap onPress={() => setDobTempSelected(ds)} style={{width:38,height:38,justifyContent:'center',alignItems:'center',borderRadius:19,backgroundColor:bg}}>
                                  <Text style={{color:'#fff',fontWeight:'700'}}>{date.day}</Text>
                                </DayWrap>
                              );
                            }
                            // weekends: render with regular text color (no red)
                            if (isWeekend) {
                              return (
                                <DayWrap onPress={() => setDobTempSelected(ds)} style={{width:38,height:38,justifyContent:'center',alignItems:'center'}}>
                                  <Text style={{color: Colors.light.text}}>{date.day}</Text>
                                </DayWrap>
                              );
                            }
                            // default
                            return (
                              <DayWrap onPress={() => setDobTempSelected(ds)} style={{width:38,height:38,justifyContent:'center',alignItems:'center'}}>
                                <Text style={{color: Colors.light.text}}>{date.day}</Text>
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
                <View style={{flexDirection:'row', justifyContent:'flex-end', marginTop:10}}>
                  <Pressable onPress={() => { setDobPickerVisible(false); setDobPickerFor(null); setDobTempSelected(null); }} style={[styles.footerBtn, {marginRight:8}]}> 
                    <Text>Cancelar</Text>
                  </Pressable>
                  <Pressable disabled={!dobTempSelected} onPress={() => { if (dobTempSelected) onDobSelect(dobTempSelected); }} style={[styles.footerBtnPrimary, {opacity: dobTempSelected ? 1 : 0.5}]}> 
                    <Text style={{color:'#fff'}}>Confirmar</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </Modal>
        ) : null}
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
    color: Colors.light.text,
    textAlign: 'center',
    marginBottom: 12,
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
});