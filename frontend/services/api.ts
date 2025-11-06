import { tokenStorage } from './tokenStorage';

const BASE_URL_PADRAO = "http://10.0.2.2:3334/api"; // URL fixa para Android Emulator

type CustomRequestInit = Omit<RequestInit, 'body'> & {
  body?: BodyInit | null | Record<string, any>;
};

class APIService {
  private baseURL: string;
  private timeout: number;

  constructor(baseURL = BASE_URL_PADRAO) {
    this.baseURL = baseURL;
    this.timeout = 60000; // 60 segundos
    console.log(`[APIService] Inicializado com a URL base: ${this.baseURL}`);
  }

  async fetch(
    endpoint: string,
    options: CustomRequestInit = {},
    isAuthRequired = true
  ): Promise<Response> {
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    const headers = new Headers(options.headers || {});
    let body: BodyInit | null | undefined = undefined;

    if (options.body) {
      if (options.body instanceof FormData || typeof options.body === 'string') {
        body = options.body;
      } else if (typeof options.body === 'object') {
        body = JSON.stringify(options.body);
        if (!headers.has('Content-Type')) {
          headers.set('Content-Type', 'application/json');
        }
      }
    }
    
    if (!headers.has('Accept')) {
      headers.set('Accept', 'application/json');
    }

    if (isAuthRequired) {
      const token = await tokenStorage.getAccessToken();
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
    }
    
    if (options.body instanceof FormData) {
      headers.delete('Content-Type');
    }

    try {
      console.log(`[APIService] Chamando: ${options.method || 'GET'} ${this.baseURL}${endpoint}`);
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...options,
        body,
        signal: controller.signal,
        headers: headers,
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error: any) {
      clearTimeout(timeoutId);
      throw this.handleError(error);
    }
  }

  private handleError(error: any): Error {
    if (error.name === "AbortError") {
      return new Error("Timeout: O servidor demorou para responder");
    }
    if (error.message.includes("Network request failed")) {
       return new Error("Erro de conexão: Verifique sua internet ou se a URL da API está correta.");
    }
    return error;
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.fetch('/', { method: 'GET' }, false); 
      return response.ok;
    } catch (error) {
      console.error("❌ Health check failed:", error);
      return false;
    }
  }
}

export const apiService = new APIService();