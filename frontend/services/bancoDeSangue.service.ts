import { apiService } from './api';

// --- Tipos de Resposta da API (Interfaces) ---

/**
 * Define a estrutura da resposta JSON vinda do backend
 * (rota /bancodesangue/estoque)
 */
export interface BloodStockAPIResponse {
  err: number;
  data: {
    grupoabo: string;
    fatorrh: "P" | "N";
    situacao: "Critico" | "Alerta" | "Normal";
    quantidade?: number;
    percentual?: number;
  }[];
}

/**
 * Define o formato dos dados transformados que a nossa UI (ecrã) espera.
 */
export interface TransformedBloodStock {
  tipo: string;
  nivel: string;
  status: "Crítico" | "Alerta" | "Ideal";
}

/**
 * O BancoDeSangueService é responsável por todas as chamadas de API
 * relacionadas ao módulo de banco de sangue.
 */
class BancoDeSangueService {
  /**
   * Busca o estoque de sangue atual da API.
   * Esta rota é pública (não requer autenticação).
   */
  async getBloodStock(): Promise<TransformedBloodStock[]> {
    try {
      console.log(`🩸 A buscar estoque de sangue...`);
      
      // 1. Chama o nosso cliente de API centralizado
      const response = await apiService.fetch(
        '/bancodesangue/estoque', 
        { method: 'GET' },
        false // false = esta rota NÃO requer autenticação
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.msg || `HTTP ${response.status}`);
      }

      const apiData: BloodStockAPIResponse = await response.json();
      console.log("📊 Resposta da API do Estoque:", apiData);

      if (apiData.err !== 0) {
        throw new Error("A API de estoque devolveu um erro interno.");
      }

      // 2. Transforma os dados da API para o formato que a UI precisa
      // (Esta é a lógica que estava no seu api.ts antigo)
      const transformedData: TransformedBloodStock[] = apiData.data.map((item) => {
        const bloodType = `${item.grupoabo}${item.fatorrh === "P" ? "+" : "-"}`;
        // O 'nivel' pode ser a quantidade ou o percentual, dependendo da API
        const nivel = item.quantidade?.toString() || item.percentual?.toString() || "0";
        
        let status: "Crítico" | "Alerta" | "Ideal";
        switch (item.situacao) {
          case "Critico":
            status = "Crítico";
            break;
          case "Alerta":
            status = "Alerta";
            break;
          default:
            status = "Ideal";
        }

        return { tipo: bloodType, nivel: nivel, status: status };
      });

      console.log("✅ Dados do estoque transformados:", transformedData);
      return transformedData;

    } catch (error: any) {
      console.error("❌ Erro ao buscar estoque de sangue:", error);
      // Relança o erro para que o ecrã (index.tsx) possa apanhá-lo e mostrar ao utilizador
      throw error;
    }
  }
}

// Exporta uma instância única (singleton) do serviço
export const bancoDeSangueService = new BancoDeSangueService();
