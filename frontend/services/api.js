import axios from "axios";
import { Platform } from "react-native";

// Use o IP da sua máquina em desenvolvimento se estiver usando Expo Go.
// O endereço da API pode vir de uma variável de ambiente.
const API_URL =
  process.env.EXPO_PUBLIC_API_URL || "http://localhost:3333/api";

const api = axios.create({
  baseURL: API_URL,
});

/**
 * Envia o token de autenticação do Google para o backend para login ou registro.
 * @param {string} idToken O token JWT recebido do Google.
 * @returns {Promise<Object>} A resposta da API, contendo o token JWT do app e os dados do usuário.
 */
export const loginWithGoogle = async (idToken) => {
  try {
    const response = await api.post("/oauth/login", {
      provider: "google",
      id_token: idToken,
    });
    return response.data;
  } catch (error) {
    console.error("Erro ao fazer login com Google no backend:", error.response?.data || error.message);
    throw error;
  }
};

export default api;
