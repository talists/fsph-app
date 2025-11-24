// services/api.ts
import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { tokenStorage } from "./tokenStorage";

// ============================================================
// CONFIGURAÇÃO ANDROID STUDIO
// ============================================================

const BASE_URL = `http://10.0.2.2:3334/api`;

console.log(`[APIService] 🤖 Modo Emulador ativado: ${BASE_URL}`);

const apiService = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    Accept: "application/json",
  },
});

// ============================================================
// Interceptors (Igual ao anterior, com correção de Tipagem)
// ============================================================
apiService.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const isAuthRequired = (config as any).isAuthRequired ?? true;

    console.log(`[API] 📤 ${config.method?.toUpperCase()} ${config.url}`);

    if (isAuthRequired) {
      const token = await tokenStorage.getAccessToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    if (config.data instanceof FormData) {
      config.headers["Content-Type"] = "multipart/form-data";
    }

    return config;
  },
  (error) => Promise.reject(error)
);

apiService.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response) {
      console.error(
        `[API] ❌ Erro ${error.response.status}: ${JSON.stringify(
          error.response.data
        )}`
      );
    } else if (error.request) {
      console.error(`[API] ❌ Falha de Conexão em: ${BASE_URL}`);
      return Promise.reject(
        new Error(
          "O Emulador não conseguiu conectar no Docker.\n\n" +
            "1. Verifique se o Docker está rodando (docker ps).\n" +
            "2. Tente acessar http://localhost:3334/api no navegador do PC."
        )
      );
    }
    return Promise.reject(error);
  }
);

export const healthCheck = async (): Promise<boolean> => {
  try {
    await apiService.get("/", { isAuthRequired: false, timeout: 5000 } as any);
    console.log(`[API] 🏥 Health check OK`);
    return true;
  } catch (error) {
    console.error(`[API] ❌ Health check FALHOU.`);
    return false;
  }
};

export { apiService, BASE_URL };
