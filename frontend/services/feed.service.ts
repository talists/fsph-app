// services/feed.service.ts
import { apiService } from "./api"; // Importa a instância do Axios
import { isAxiosError } from "axios"; // Importa o type guard
import type { User } from "../services/auth.service";

// --- Tipos de Resposta da API do Feed ---
// (As suas interfaces permanecem idênticas)
export interface Post {
  id: number;
  legenda: string;
  url_imagem: string;
  criado_em: string;
  usuario: Pick<User, "id" | "nome" | "url_foto_perfil">;
}

export interface FeedResponse {
  totalPosts: number;
  currentPage: number;
  totalPages: number;
  posts: Post[];
}
// ----------------------------------------------

/**
 * O FeedService é responsável por todas as chamadas de API
 * relacionadas ao módulo de feed.
 */
class FeedService {
  /**
   * Busca uma página de posts do feed.
   * Requer autenticação (o padrão do nosso apiService)
   */
  async getFeedPosts(page = 1, limit = 20): Promise<FeedResponse> {
    try {
      // MUDANÇA: Usamos .get() e passamos os query params
      // de forma estruturada usando o 'params'
      const response = await apiService.get<FeedResponse>(
        "/feed",
        {
          params: { page, limit }, // O Axios transforma isto em ?page=1&limit=20
        }
        // Não é preciso passar 'isAuthRequired: true', pois é o padrão
      );

      // MUDANÇA: Os dados já vêm em 'response.data'
      return response.data;
    } catch (error: any) {
      console.error("❌ Erro em getFeedPosts:", error);

      // MUDANÇA: Tratamento de erro do Axios
      if (isAxiosError(error) && error.response) {
        const errorData = error.response.data as { msg?: string };
        throw new Error(errorData?.msg || "Erro ao carregar o feed");
      }
      throw error;
    }
  }

  /**
   * Cria um novo post.
   * Lida com multipart/form-data.
   * Requer autenticação (o padrão).
   */
  async createPost(data: FormData): Promise<Post> {
    try {
      // MUDANÇA: Usamos .post() e passamos o FormData diretamente.
      // O Axios irá definir o 'Content-Type: multipart/form-data'
      const response = await apiService.post<Post>(
        "/feed",
        data // O FormData vai direto no corpo
      );

      return response.data;
    } catch (error: any) {
      console.error("❌ Erro em createPost:", error);

      if (isAxiosError(error) && error.response) {
        const errorData = error.response.data as { msg?: string };
        throw new Error(errorData?.msg || "Erro ao criar post");
      }
      throw error;
    }
  }

  /**
   * Busca os posts de um utilizador específico (o utilizador autenticado).
   * Requer autenticação (o padrão).
   */
  async getMeusPosts(): Promise<Post[]> {
    try {
      // MUDANÇA: Usamos .get()
      const response = await apiService.get<Post[]>("/feed/usuario");

      return response.data;
    } catch (error: any) {
      console.error("❌ Erro em getMeusPosts:", error);

      if (isAxiosError(error) && error.response) {
        const errorData = error.response.data as { msg?: string };
        throw new Error(errorData?.msg || "Erro ao carregar os seus posts");
      }
      throw error;
    }
  }
}

// Exporta uma instância única do serviço
export const feedService = new FeedService();
