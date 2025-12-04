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

    // Para FormData, definir explicitamente o Content-Type
    if (config.data instanceof FormData) {
      config.headers["Content-Type"] = "multipart/form-data";
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Variável para controlar requisições de refresh em andamento
let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: any) => void }> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token || "");
    }
  });
  isRefreshing = false;
  failedQueue = [];
};

apiService.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Se um refresh está em andamento, aguarda a fila
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiService(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Tenta renovar o token
        const refreshToken = await tokenStorage.getRefreshToken();
        if (!refreshToken) {
          console.warn("[API] ⚠️ Sem refresh token - limpando tokens e redirecionando para login");
          await tokenStorage.clearTokens();
          processQueue(new Error("Sem refresh token"), null);
          return Promise.reject(new Error("Sessão expirada. Faça login novamente."));
        }

        console.log("[API] 🔄 Tentando renovar token...");
        const response = await axios.post(`${BASE_URL}/auth/refresh-token`, {
          refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data;
        await tokenStorage.saveTokens(accessToken, newRefreshToken);

        apiService.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;

        console.log("[API] ✅ Token renovado com sucesso");
        processQueue(null, accessToken);
        return apiService(originalRequest);
      } catch (err) {
        console.error("[API] ❌ Falha ao renovar token", err);
        processQueue(err);
        // Se falhar a renovação, faz logout
        await tokenStorage.clearTokens();
        // Redireciona para login (pode ser implementado via context/event)
        return Promise.reject(err);
      }
    }

    if (error.response) {
      const errorData = error.response.data as any;
      console.error(
        `[API] ❌ Erro ${error.response.status}: ${JSON.stringify(errorData)}`
      );

      // Extrai a mensagem de erro da resposta
      const errorMsg = errorData?.msg || errorData?.message || errorData?.error;
      if (errorMsg) {
        return Promise.reject(new Error(errorMsg));
      }
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
