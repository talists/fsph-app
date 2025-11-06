import { apiService } from './api';
import type { User } from '../contexts/AuthContext'; 

// --- Tipos de Resposta da API do Feed ---

/**
 * Define a estrutura de um único Post, vindo da API.
 * Corresponde ao que o backend envia.
 */
export interface Post {
  id: number;
  legenda: string;
  url_imagem: string;
  criado_em: string;
  
  usuario: Pick<User, 'id' | 'nome' | 'url_foto_perfil'>;
}

/**
 * Define a resposta completa da API de feed (com paginação)
 * Corresponde ao objeto que o 'FeedService' do backend retorna.
 */
export interface FeedResponse {
  totalPosts: number;
  currentPage: number;
  totalPages: number;
  posts: Post[];
}

/**
 * O FeedService é responsável por todas as chamadas de API
 * relacionadas ao módulo de feed.
 */
class FeedService {
  /**
   * Busca uma página de posts do feed.
   * Requer autenticação.
   */
  async getFeedPosts(page = 1, limit = 20): Promise<FeedResponse> {
    try {
      const response = await apiService.fetch(
        `/feed?page=${page}&limit=${limit}`,
        { method: 'GET' },
        true // true = esta rota requer autenticação
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.msg || "Erro ao carregar o feed");
      }

      return response.json() as Promise<FeedResponse>;
    } catch (error: any) {
      console.error("❌ Erro em getFeedPosts:", error);
      throw error;
    }
  }

  /**
   * Cria um novo post.
   * Lida com multipart/form-data.
   * Requer autenticação.
   */
  async createPost(data: FormData): Promise<Post> {
    try {
      const response = await apiService.fetch(
        '/feed',
        {
          method: 'POST',
          body: data,
        },
        true 
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.msg || "Erro ao criar post");
      }

      return response.json() as Promise<Post>;
    } catch (error: any) {
      console.error("❌ Erro em createPost:", error);
      throw error;
    }
  }

  /**
   * Busca os posts de um utilizador específico (o utilizador autenticado).
   * Requer autenticação.
   */
  async getMeusPosts(): Promise<Post[]> {
    try {
      const response = await apiService.fetch(
        '/feed/usuario', // O backend já sabe quem é o utilizador pelo token
        { method: 'GET' },
        true // true = esta rota requer autenticação
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.msg || "Erro ao carregar os seus posts");
      }

      // O backend aqui retorna um array de Post, não um FeedResponse
      return response.json() as Promise<Post[]>;
    } catch (error: any) {
      console.error("❌ Erro em getMeusPosts:", error);
      throw error;
    }
  }
}

// Exporta uma instância única do serviço
export const feedService = new FeedService();

