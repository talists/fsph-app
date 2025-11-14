import * as SecureStore from "expo-secure-store";

const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";

/**
 * Objeto para gerir o armazenamento seguro dos tokens de autenticação.
 * Usa o SecureStore para garantir que os tokens fiquem encriptados no dispositivo.
 */
export const tokenStorage = {
  /**
   * Guarda os tokens de acesso e de atualização no SecureStore.
   * @param accessToken O token de acesso (curta duração).
   * @param refreshToken O token de atualização (longa duração).
   */
  async saveTokens(accessToken: string, refreshToken?: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
      if (refreshToken) {
        await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
      }
    } catch (error) {
      console.error("Erro ao guardar tokens no SecureStore", error);
      throw new Error("Não foi possível guardar a sessão.");
    }
  },

  /**
   * Obtém o Access Token guardado.
   */
  async getAccessToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
    } catch (error) {
      console.error("Erro ao obter Access Token", error);
      return null;
    }
  },

  /**
   * Obtém o Refresh Token guardado.
   */
  async getRefreshToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    } catch (error) {
      console.error("Erro ao obter Refresh Token", error);
      return null;
    }
  },

  /**
   * Limpa todos os tokens guardados (usado no logout).
   */
  async clearTokens(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    } catch (error) {
      console.error("Erro ao limpar tokens", error);
    }
  },
};
