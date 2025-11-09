// services/api.ts
import axios, { type AxiosError } from "axios"; // 1. Use 'type' para importar apenas o tipo
import { tokenStorage } from "./tokenStorage";

const BASE_URL_PADRAO = "http://10.0.2.2:3334/api";

console.log(`[APIService] Inicializado com a URL base: ${BASE_URL_PADRAO}`);

const apiService = axios.create({
  baseURL: BASE_URL_PADRAO,
  timeout: 60000,
  headers: {
    Accept: "application/json",
  },
});

apiService.interceptors.request.use(
  async (config) => {
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

apiService.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.code === "ECONNABORTED" || error.message.includes("timeout")) {
      return Promise.reject(
        new Error("Timeout: O servidor demorou para responder")
      );
    }
    if (
      error.message === "Network Error" ||
      error.message.includes("Network request failed")
    ) {
      return Promise.reject(
        new Error(
          "Erro de conexão: Verifique sua internet ou se a URL da API está correta."
        )
      );
    }

    return Promise.reject(error);
  }
);

export const healthCheck = async (): Promise<boolean> => {
  try {
    await apiService.get("/", { isAuthRequired: false });
    return true;
  } catch (error) {
    console.error("❌ Health check failed:", error);
    return false;
  }
};

export { apiService };
