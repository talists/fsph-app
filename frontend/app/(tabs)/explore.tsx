import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

interface BenefitItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  isExpanded?: boolean;
}

interface BenefitSection {
  id: string;
  title: string;
  items: BenefitItem[];
  isExpanded?: boolean;
}

const BENEFIT_SECTIONS: BenefitSection[] = [
  {
    id: "geral",
    title: "Doe Sangue, Salve Vidas e Ganhe Benefícios!",
    items: [
      {
        id: "isencao_concursos",
        title: "Isenção em Concursos Públicos",
        description:
          "Esta se preparando para concursos? Quem doa sangue com frequência pode ficar isento da taxa de iscrição em concursos públicos estaduais(Lei nº 4087/1999). Basta apresentar uma certidão do Hemose!",
        icon: "document-text",
      },
      {
        id: "atendimento_prioritario",
        title: "Atendimento Prioritário",
        description:
          "Doadores regulares têm direito a atendimento prioritário em bancos, repartições públicas e estabelecimentos privados - assm como idosos, gestantes e pessoas com deficiência (Lei nº 14.626/2023)",
        icon: "people",
      },
    ],
  },
  {
    id: "saude",
    title: "Benefícios para sua Saúde",
    items: [
      {
        id: "deteccao_doencas",
        title: "Detecção de doenças precocemente",
        description:
          "Todo sangue doado é testado, o que permite ao doador ter um controle sobre doenças como HIV, hepatites e outras ISTs - com total sigilo e responsabilidade.",
        icon: "medical",
      },
      {
        id: "lanchinho",
        title: "Lanchinho e repouso merecido",
        description:
          "Após doar, você recebe um lanche reforçado e um tempo de descanso para repor as energias e se sentir ainda melhor — um mimo!",
        icon: "cafe",
      },
    ],
  },
  {
    id: "medula_ossea",
    title: "Seja Doador de Medula Óssea e Ganhe Muito Mais que Benefícios!",
    items: [
      {
        id: "licenca_remunerada",
        title: "Licença remunerada de 30 dias",
        description:
          "Se for chamado para doar, você tem direito a 30 dias de afastamento do trabalho com salário garantido e sem descontos.",
        icon: "calendar",
      },
      {
        id: "isencao_concursos_medula",
        title: "Isenção em concursos públicos",
        description:
          "Doador de medula tem isenção da taxa de inscrição em concursos públicos federais, estaduais e municipais, garantido na legislação local.",
        icon: "document-text",
      },
    ],
  },
  {
    id: "financeiros",
    title: "Benefícios Financeiros e Sociais",
    items: [
      {
        id: "meia_entrada",
        title: "Meia-entrada em eventos culturais e esportivos",
        description:
          "Doador de medula tem direito à meia-entrada em eventos culturais, teatrais e esportivos em vários tipos.",
        icon: "ticket",
      },
      {
        id: "cobertura_gastos",
        title: "Cobertura dos gastos com deslocamento",
        description:
          "O transporte até o local da doação (ida e volta) é totalmente custeado — você não terá nenhum gasto para salvar uma vida.",
        icon: "car",
      },
      {
        id: "atendimento_prioritario_medula",
        title: "Atendimento prioritário",
        description:
          "Doadores têm atendimento preferencial em bancos, cartórios e serviços públicos.",
        icon: "people",
      },
    ],
  },
  {
    id: "saude_medula",
    title: "Benefícios em Saúde",
    items: [
      {
        id: "checkup_completo",
        title: "Check-up completo gratuito",
        description:
          "Antes da doação, você passa por uma avaliação médica rigorosa, com exames completos — tudo gratuitamente. Isso pode detectar qualquer doença e te permite cuidar da sua própria saúde.",
        icon: "fitness",
      },
    ],
  },
];

export default function BenefitsScreen() {
  const [expandedSections, setExpandedSections] = useState<{
    [key: string]: boolean;
  }>({
    geral: true, // Primeira seção expandida por padrão
  });
  const [expandedItems, setExpandedItems] = useState<{
    [key: string]: boolean;
  }>({});

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  const toggleItem = (itemId: string) => {
    setExpandedItems((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#E73645" barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Benefícios</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Intro Text */}
        <View style={styles.introContainer}>
          <Text style={styles.introTitle}>
            Doe Sangue, Salve Vidas e Ganhe Benefícios!
          </Text>
          <Text style={styles.introText}>
            Você sabia que, além de salvar até quatro vidas com uma única
            doação, doar sangue em Sergipe também oferece vantagens especiais
            para você?
          </Text>
        </View>

        {/* Benefits Sections */}
        {BENEFIT_SECTIONS.map((section) => (
          <View key={section.id} style={styles.sectionContainer}>
            <TouchableOpacity
              style={styles.sectionHeader}
              onPress={() => toggleSection(section.id)}
              activeOpacity={0.7}
            >
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <Ionicons
                name={expandedSections[section.id] ? "remove" : "add"}
                size={24}
                color="#E73645"
              />
            </TouchableOpacity>

            {expandedSections[section.id] && (
              <View style={styles.sectionContent}>
                {section.items.map((item) => (
                  <View key={item.id} style={styles.benefitItem}>
                    <TouchableOpacity
                      style={[
                        styles.benefitHeader,
                        expandedItems[item.id] && styles.benefitHeaderExpanded,
                      ]}
                      onPress={() => toggleItem(item.id)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.benefitTitleContainer}>
                        <Ionicons
                          name={item.icon as any}
                          size={20}
                          color="#E73645"
                          style={styles.benefitIcon}
                        />
                        <Text style={styles.benefitTitle}>{item.title}</Text>
                      </View>
                      <Ionicons
                        name={expandedItems[item.id] ? "remove" : "add"}
                        size={20}
                        color="#E73645"
                      />
                    </TouchableOpacity>

                    {expandedItems[item.id] && (
                      <View style={styles.benefitDescription}>
                        <Text style={styles.benefitDescriptionText}>
                          {item.description}
                        </Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}

        {/* How to prove benefits */}
        <View style={styles.proofContainer}>
          <Text style={styles.proofTitle}>Como comprovar os benefícios?</Text>
          <Text style={styles.proofText}>
            Apresente a certidão de doador disponível gratuitamente no site
            oficial do HEMOSE ou aqui no app — entre para a lista de doadores e
            tenha acesso aos seus benefícios comprovantes no centro de doação.
          </Text>
        </View>

        {/* CTA */}
        <View style={styles.ctaContainer}>
          <Text style={styles.ctaTitle}>
            Para aproveitar os direitos como isenção em concursos, é só
            solicitar um atestado de doação no HEMOSE!
          </Text>
          <Text style={styles.ctaSubtitle}>
            HEMOSE ou aqui no app — entre para a lista de doadores e tenha
            acesso aos seus direitos!
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E73645",
  },
  header: {
    backgroundColor: "#E73645",
    paddingHorizontal: 20,
    paddingVertical: 16,
    alignItems: "center",
  },
  headerTitle: {
    color: "white",
    fontSize: 20,
    fontWeight: "700",
  },
  content: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  introContainer: {
    padding: 20,
    backgroundColor: "white",
    marginBottom: 1,
  },
  introTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 8,
  },
  introText: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
  },
  sectionContainer: {
    backgroundColor: "white",
    marginBottom: 1,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#FEF3F2",
    borderLeftWidth: 4,
    borderLeftColor: "#E73645",
  },
  sectionTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: "#B91C1C",
    marginRight: 12,
  },
  sectionContent: {
    paddingVertical: 8,
  },
  benefitItem: {
    marginHorizontal: 20,
    marginVertical: 4,
    backgroundColor: "#FAFAFA",
    borderRadius: 8,
    overflow: "hidden",
  },
  benefitHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  benefitHeaderExpanded: {
    backgroundColor: "#F3F4F6",
  },
  benefitTitleContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  benefitIcon: {
    marginRight: 12,
  },
  benefitTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: "#1F2937",
  },
  benefitDescription: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  benefitDescriptionText: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
    marginTop: 12,
  },
  proofContainer: {
    padding: 20,
    backgroundColor: "white",
    marginTop: 16,
    marginBottom: 1,
  },
  proofTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 8,
  },
  proofText: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
  },
  ctaContainer: {
    padding: 20,
    backgroundColor: "#FEF3F2",
    marginBottom: 20,
    borderRadius: 12,
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  ctaTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#B91C1C",
    marginBottom: 8,
    textAlign: "center",
  },
  ctaSubtitle: {
    fontSize: 14,
    color: "#DC2626",
    textAlign: "center",
    lineHeight: 20,
  },
});
