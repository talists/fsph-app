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
   * Check API connectivity
   */
  async checkConnectivity(): Promise<{hemose: boolean, local: boolean}> {
    const results = {hemose: false, local: false};
    
    try {
      const hemonseRes = await this.fetchWithTimeout(`${this.hemonseBase()}/apiagendamento/cidades/1/1/1`);
      results.hemose = hemonseRes.ok;
    } catch (error) {
      console.warn('HEMOSE API não disponível');
    }
    
    try {
      const localRes = await this.fetchWithTimeout(`${this.baseURL}`);
      results.local = localRes.ok;
    } catch (error) {
      console.warn('Backend local não disponível');
    }
    
    return results;
  }

  /**
   * Send notification via local backend (always uses local for reliability)
   */
  async sendNotification(payload: {idUsuario: string, titulo: string, corpo: string}): Promise<any> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseURL}/notificacoes/usuario`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
      
    } catch (error) {
      console.error('❌ Falha ao enviar notificação:', error);
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
    try {
      // Tenta primeiro a API externa do HEMOSE
      const hemonseUrl = `${this.hemonseBase()}/apiagendamento/agendamento/marcar`;
      const options: RequestInit = {};
      
      if (payload instanceof FormData) {
        options.method = 'POST';
        options.body = payload as any;
        (options.headers as any) = {};
      } else {
        options.method = 'POST';
        options.body = JSON.stringify(payload);
      }

      const res = await this.fetchWithTimeout(hemonseUrl, options);
      if (!res.ok) throw new Error(`HEMOSE API HTTP ${res.status}`);
      
      const result = await res.json();
      console.log('✅ Agendamento realizado via API HEMOSE');
      return { ...result, _source: 'hemose' };
      
    } catch (hemonseError) {
      const hemonseMsg = hemonseError instanceof Error ? hemonseError.message : 'Erro desconhecido';
      console.warn('⚠️ Falha na API HEMOSE, tentando backend local:', hemonseMsg);
      
      try {
        // Fallback para o backend local
        const localUrl = `${this.baseURL}/agendamentos/apiagendamento/agendamento/marcar`;
        const localOptions: RequestInit = {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        };

        const localRes = await this.fetchWithTimeout(localUrl, localOptions);
        if (!localRes.ok) throw new Error(`Backend local HTTP ${localRes.status}`);
        
        const localResult = await localRes.json();
        console.log('✅ Agendamento realizado via backend local (fallback)');
        return { ...localResult, _source: 'local' };
        
      } catch (localError) {
        const localMsg = localError instanceof Error ? localError.message : 'Erro desconhecido';
        console.error('❌ Falha em ambos os backends:', localMsg);
        throw new Error(`Falha no agendamento: HEMOSE (${hemonseMsg}), Local (${localMsg})`);
      }
    }
  }

  async postMarcarCampanha(payload: Record<string, any>): Promise<any> {
    try {
      // Tenta primeiro a API externa do HEMOSE
      const hemonseUrl = `${this.hemonseBase()}/apiagendamento/campanha/marcar`;
      const options: RequestInit = {
        method: 'POST',
        body: payload instanceof FormData ? (payload as any) : JSON.stringify(payload),
      };
      
      if (payload instanceof FormData) {
        (options.headers as any) = {};
      }
      
      const res = await this.fetchWithTimeout(hemonseUrl, options);
      if (!res.ok) throw new Error(`HEMOSE API HTTP ${res.status}`);
      
      const result = await res.json();
      console.log('✅ Campanha marcada via API HEMOSE');
      return { ...result, _source: 'hemose' };
      
    } catch (hemonseError) {
      const hemonseMsg = hemonseError instanceof Error ? hemonseError.message : 'Erro desconhecido';
      console.warn('⚠️ Falha na API HEMOSE para campanha, tentando backend local:', hemonseMsg);
      
      try {
        // Fallback para o backend local
        const localUrl = `${this.baseURL}/campanhas`; // Usando rota de campanhas do backend local
        const localOptions: RequestInit = {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        };

        const localRes = await this.fetchWithTimeout(localUrl, localOptions);
        if (!localRes.ok) throw new Error(`Backend local HTTP ${localRes.status}`);
        
        const localResult = await localRes.json();
        console.log('✅ Campanha marcada via backend local (fallback)');
        return { ...localResult, _source: 'local' };
        
      } catch (localError) {
        const localMsg = localError instanceof Error ? localError.message : 'Erro desconhecido';
        console.error('❌ Falha em ambos os backends para campanha:', localMsg);
        throw new Error(`Falha ao marcar campanha: HEMOSE (${hemonseMsg}), Local (${localMsg})`);
      }
    }
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
   * Get user notifications
   */
  async getUserNotifications(userId: string): Promise<any> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseURL}/notificacoes/usuario/${userId}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('❌ Falha ao buscar notificações:', error);
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  async markNotificationAsRead(notificationId: string): Promise<any> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseURL}/notificacoes/${notificationId}/read`, {
        method: 'PATCH',
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('❌ Falha ao marcar notificação como lida:', error);
      throw error;
    }
  }

  /**
   * Get blood stock alerts for specific blood type
   */
  async getBloodStockAlerts(bloodType: string): Promise<any> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseURL}/bancodesangue/alerts/${bloodType}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('❌ Falha ao buscar alertas de estoque:', error);
      throw error;
    }
  }

  /**
   * Get upcoming appointment reminders
   */
  async getAppointmentReminders(userId: string): Promise<any> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseURL}/agendamentos/reminders/${userId}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('❌ Falha ao buscar lembretes de agendamento:', error);
      throw error;
    }
  }

  /**
   * Send blood stock alert to users with specific blood type
   */
  async sendBloodStockAlert(bloodType: string, urgencyLevel: 'critical' | 'alert', message: string): Promise<any> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseURL}/notificacoes/blood-alert`, {
        method: 'POST',
        body: JSON.stringify({
          bloodType,
          urgencyLevel,
          message,
        }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('❌ Falha ao enviar alerta de estoque:', error);
      throw error;
    }
  }

  /**
   * Get user profile with notification preferences
   */
  async getUserProfile(userId: string): Promise<any> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseURL}/usuarios/profile/${userId}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('❌ Falha ao buscar perfil do usuário:', error);
      throw error;
    }
  }

  /**
   * Update user profile and notification preferences
   */
  async updateUserProfile(userId: string, profileData: any): Promise<any> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseURL}/usuarios/profile/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify(profileData),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('❌ Falha ao atualizar perfil:', error);
      throw error;
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