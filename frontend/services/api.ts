// services/api.ts
/**
 * API Service for Gota a Gota App
 * Handles all API communications with the backend
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

export interface TransformedBloodStock {
  tipo: string;
  nivel: string;
  status: "Crítico" | "Alerta" | "Ideal";
}

class APIService {
  private baseURL: string;
  private timeout: number;

  constructor() {
    this.baseURL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3333/api";
    this.timeout = 10000; // 10 seconds
  }

  /**
   * Generic fetch wrapper with timeout and error handling
   */
  private async fetchWithTimeout(
    url: string,
    options: RequestInit = {}
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Get current blood stock from the API
   */
  async getBloodStock(): Promise<TransformedBloodStock[]> {
    try {
      console.log(`🩸 Fetching blood stock from: ${this.baseURL}/bancodesangue/estoque`);

      const response = await this.fetchWithTimeout(
        `${this.baseURL}/bancodesangue/estoque`
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const apiData: BloodStockAPIResponse = await response.json();
      console.log("📊 API Response:", apiData);

      if (apiData.err !== 0) {
        throw new Error("API returned error in response");
      }

      // Transform API data to app format
      const transformedData: TransformedBloodStock[] = apiData.data.map((item) => {
        const bloodType = `${item.grupoabo}${item.fatorrh === "P" ? "+" : "-"}`;
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

        return {
          tipo: bloodType,
          nivel: nivel,
          status: status,
        };
      });

      console.log("✅ Transformed data:", transformedData);
      return transformedData;

    } catch (error: any) {
      console.error("❌ Error fetching blood stock:", error);
      
      // Rethrow with more descriptive message
      if (error.name === "AbortError") {
        throw new Error("Timeout: Servidor demorou para responder");
      } else if (error.message.includes("HTTP")) {
        throw new Error(`Erro do servidor: ${error.message}`);
      } else if (error.message.includes("fetch")) {
        throw new Error("Erro de conexão. Verifique sua internet.");
      } else {
        throw new Error(error.message || "Erro ao carregar dados");
      }
    }
  }

  /**
   * Health check endpoint
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseURL}`);
      return response.ok;
    } catch (error) {
      console.error("❌ Health check failed:", error);
      return false;
    }
  }

  /**
   * Get API base URL for debugging
   */
  getBaseURL(): string {
    return this.baseURL;
  }
}

// Export singleton instance
export const apiService = new APIService();
export default apiService;