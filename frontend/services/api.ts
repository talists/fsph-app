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
   * HEMOSE specific endpoints (prefix: https://api.fsph.se.gov.br)
   * These mirror the backend routes you provided and are kept separate
   * from the main `baseURL` used elsewhere in the app.
   */
  private hemonseBase() {
    return "https://api.fsph.se.gov.br";
  }

  async getDoadorInfo(cpf: string): Promise<any> {
    const url = `${this.hemonseBase()}/apiagendamento/doador/getinfo/${encodeURIComponent(
      cpf
    )}`;
    const res = await this.fetchWithTimeout(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  async getDoadorAgendamentos(cpf: string): Promise<any> {
    const url = `${this.hemonseBase()}/apiagendamento/doador/agendamentos/${encodeURIComponent(
      cpf
    )}`;
    const res = await this.fetchWithTimeout(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  async getCidades(perm_individual = 1, perm_medula = 1, perm_campanha = 1): Promise<any> {
    const url = `${this.hemonseBase()}/apiagendamento/cidades/${perm_individual}/${perm_medula}/${perm_campanha}`;
    const res = await this.fetchWithTimeout(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  async getLocal(id_cidade: string | number, perm_individual = 1, perm_medula = 1, perm_campanha = 1): Promise<any> {
    const url = `${this.hemonseBase()}/apiagendamento/local/${id_cidade}/${perm_individual}/${perm_medula}/${perm_campanha}`;
    const res = await this.fetchWithTimeout(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  async getBlocoAllDate(id_local: string | number, perm_individual = 1, perm_medula = 1, perm_campanha = 1): Promise<any> {
    const url = `${this.hemonseBase()}/apiagendamento/blocoagendamento/listarAllDate/${id_local}/${perm_individual}/${perm_medula}/${perm_campanha}`;
    const res = await this.fetchWithTimeout(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  async getBlocoByDate(dateSelected: string, id_local: string | number, perm_individual = 1, perm_medula = 1, perm_campanha = 1): Promise<any> {
    const url = `${this.hemonseBase()}/apiagendamento/blocoagendamento/listarByDate/${encodeURIComponent(
      dateSelected
    )}/${id_local}/${perm_individual}/${perm_medula}/${perm_campanha}`;
    const res = await this.fetchWithTimeout(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  async postMarcarAgendamento(payload: Record<string, any>): Promise<any> {
    const url = `${this.hemonseBase()}/apiagendamento/agendamento/marcar`;
    // The backend expects form-data with possible file upload; accept either FormData or JSON
    const options: RequestInit = {};
    if (payload instanceof FormData) {
      options.method = 'POST';
      options.body = payload as any;
      // fetchWithTimeout will set JSON headers; avoid overwriting for FormData
      (options.headers as any) = {};
    } else {
      options.method = 'POST';
      options.body = JSON.stringify(payload);
    }

    const res = await this.fetchWithTimeout(url, options);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  async postMarcarCampanha(payload: Record<string, any>): Promise<any> {
    const url = `${this.hemonseBase()}/apiagendamento/campanha/marcar`;
    const options: RequestInit = {
      method: 'POST',
      body: payload instanceof FormData ? (payload as any) : JSON.stringify(payload),
    };
    if (payload instanceof FormData) {
      (options.headers as any) = {};
    }
    const res = await this.fetchWithTimeout(url, options);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  async patchEditarAgendamento(payload: Record<string, any>): Promise<any> {
    const url = `${this.hemonseBase()}/apiagendamento/agendamento/editar`;
    const options: RequestInit = {};
    if (payload instanceof FormData) {
      options.method = 'PATCH';
      options.body = payload as any;
      (options.headers as any) = {};
    } else {
      options.method = 'PATCH';
      options.body = JSON.stringify(payload);
    }
    const res = await this.fetchWithTimeout(url, options);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  async deleteDesmarcar(protocolo: string | number): Promise<any> {
    const url = `${this.hemonseBase()}/apiagendamento/agendamento/desmarcar/${encodeURIComponent(
      protocolo
    )}`;
    const res = await this.fetchWithTimeout(url, { method: 'DELETE' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
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