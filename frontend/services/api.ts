import axios, { type AxiosError } from "axios";
import { Platform } from "react-native";
import { tokenStorage } from "./tokenStorage";

// Define as URLs para cada ambiente
// Android Emulator usa 10.0.2.2 para acessar o localhost da máquina
// Web e iOS usam localhost ou o IP da máquina
const API_URL_ANDROID = "http://10.0.2.2:3334/api";
const API_URL_WEB_IOS = "http://localhost:3334/api";

// Escolhe a URL correta dinamicamente baseado na plataforma onde o app está rodando
const BASE_URL = Platform.OS === "android" ? API_URL_ANDROID : API_URL_WEB_IOS;

console.log(
  `[APIService] Inicializado no modo ${Platform.OS} com URL: ${BASE_URL}`
);

// Cria a instância do Axios
const apiService = axios.create({
  baseURL: BASE_URL,
  timeout: 60000, // 60 segundos de timeout
  headers: {
    Accept: "application/json",
  },
});

// ============================================================
// Interceptor de Requisição: Injeta o Token JWT
// ============================================================
apiService.interceptors.request.use(
  async (config) => {
    // @ts-ignore - Permite passar a flag isAuthRequired na chamada
    const isAuthRequired = config.isAuthRequired ?? true;

    if (isAuthRequired) {
      const token = await tokenStorage.getAccessToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ============================================================
// Interceptor de Resposta: Tratamento Global de Erros
// ============================================================
apiService.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Tratamento de Timeout
    if (error.code === "ECONNABORTED" || error.message.includes("timeout")) {
      return Promise.reject(
        new Error("Timeout: O servidor demorou muito para responder.")
      );
    }

    // Tratamento de Erro de Conexão (Network Error)
    if (
      error.message === "Network Error" ||
      error.message.includes("Network request failed")
    ) {
      return Promise.reject(
        new Error(
          "Erro de conexão: Verifique se o servidor backend está rodando e se a URL está correta."
        )
      );
    }

    // Retorna o erro original para ser tratado no try/catch dos services
    return Promise.reject(error);
  }
);

/**
 * Função simples para verificar se a API está online
 */
export const healthCheck = async (): Promise<boolean> => {
  try {
    // @ts-ignore
    await apiService.get("/", { isAuthRequired: false });
    return true;
  } catch (error) {
    console.error("❌ Health check failed:", error);
    return false;
  }
};

export { apiService };
