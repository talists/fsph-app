import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_CONFIG } from "../config/api";

// Configuração base da API
const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor para adicionar token automaticamente
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error("Erro ao recuperar token:", error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para lidar com respostas de erro
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expirado ou inválido
      await AsyncStorage.removeItem("userToken");
      // Aqui você pode redirecionar para a tela de login
    }
    return Promise.reject(error);
  }
);

// Serviços do Feed
export const feedAPI = {
  // Buscar posts do feed
  getPosts: async (page = 1, limit = 20) => {
    try {
      const response = await api.get(`/feed?page=${page}&limit=${limit}`);
      return response.data.posts || response.data; // Retorna os posts da resposta
    } catch (error) {
      throw new Error(error.response?.data?.message || "Erro ao carregar feed");
    }
  },

  // Criar novo post
  createPost: async (formData) => {
    try {
      const response = await api.post("/feed", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Erro ao criar post");
    }
  },

  // Buscar posts do usuário
  getUserPosts: async () => {
    try {
      const response = await api.get("/feed/usuario");
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Erro ao carregar posts do usuário"
      );
    }
  },
};

export default api;
