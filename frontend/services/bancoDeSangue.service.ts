// services/bancodesangue.service.ts
import { apiService } from "./api";
import { isAxiosError } from "axios";

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

export interface TransformedBloodStock {
  tipo: string;
  nivel: string;
  status: "Crítico" | "Alerta" | "Ideal";
}
// ----------------------------------------------

type BloodStockItem = BloodStockAPIResponse["data"][number];

class BancoDeSangueService {
  async getBloodStock(): Promise<TransformedBloodStock[]> {
    try {
      console.log(`🩸 A buscar estoque de sangue...`);

      const response = await apiService.get<BloodStockAPIResponse>(
        "/bancodesangue/estoque",
        {
          isAuthRequired: false,
        }
      );

      const apiData = response.data;
      console.log("📊 Resposta da API do Estoque:", apiData);

      if (apiData.err !== 0) {
        throw new Error("A API de estoque devolveu um erro interno.");
      }

      // 4. Adiciona o tipo 'BloodStockItem' ao 'item' do map
      const transformedData: TransformedBloodStock[] = apiData.data.map(
        (item: BloodStockItem) => {
          const bloodType = `${item.grupoabo}${
            item.fatorrh === "P" ? "+" : "-"
          }`;
          const nivel =
            item.quantidade?.toString() || item.percentual?.toString() || "0";

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
        }
      );

      console.log("✅ Dados do estoque transformados:", transformedData);
      return transformedData;
    } catch (error: any) {
      console.error("❌ Erro ao buscar estoque de sangue:", error);

      if (isAxiosError(error) && error.response) {
        const errorData = error.response.data as { msg?: string };
        throw new Error(errorData?.msg || `HTTP ${error.response.status}`);
      }

      throw error;
    }
  }
}

export const bancoDeSangueService = new BancoDeSangueService();
