import { apiService } from "./api";

// --- DEFINIÇÃO DOS TIPOS ---
export interface User {
  id: number;
  nome: string;
  email: string;
  tipo_sanguineo?: string;
  url_foto_perfil?: string;
}

/**
 * Resposta da rota de Login (/auth/login)
 */
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  usuario: User;
}

/**
 * Resposta da rota de Registo (/usuarios/register)
 */
export interface RegisterResponse {
  token: string;
  usuario: User;
}

/**
 * Resposta da rota de Login com Google (/oauth/login)
 */
export interface GoogleAuthResponse {
  accessToken: string;
  refreshToken: string;
  usuario: User;
}

/**
 * O AuthService é responsável por todas as chamadas de API
 * relacionadas a autenticação.
 */
class AuthService {
  /**
   * Regista um novo utilizador.
   */
  async register(data: FormData): Promise<RegisterResponse> {
    const response = await apiService.fetch(
      "/usuarios/register",
      {
        method: "POST",
        body: data,
      },
      false
    );

    if (!response.ok) {
      const errorData = await response.json();
      if (errorData.errors && Array.isArray(errorData.errors)) {
        throw new Error(errorData.errors[0].message);
      }
      throw new Error(errorData.msg || "Erro ao registar");
    }
    return response.json() as Promise<RegisterResponse>;
  }

  /**
   * Autentica um utilizador com email e senha.
   */
  async login(email: string, senha: string): Promise<AuthResponse> {
    const response = await apiService.fetch(
      "/auth/login",
      {
        method: "POST",
        body: { email, senha },
      },
      false
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.msg || "Email ou senha inválidos");
    }
    return response.json() as Promise<AuthResponse>;
  }

  /**
   * Autentica um utilizador com o id_token do Google.
   */
  async loginWithGoogle(idToken: string): Promise<GoogleAuthResponse> {
    const response = await apiService.fetch(
      "/oauth/login",
      {
        method: "POST",
        body: { provider: "google", id_token: idToken },
      },
      false
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.msg || "Erro ao fazer login com o Google");
    }
    return response.json() as Promise<GoogleAuthResponse>;
  }

  /**
   * Atualiza o FCM Token do utilizador no backend.
   */
  async updateFcmToken(fcmToken: string): Promise<void> {
    const response = await apiService.fetch(
      "/usuarios/fcm-token",
      {
        method: "PATCH",
        body: { fcm_token: fcmToken },
      },
      true
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.msg || "Erro ao atualizar token de notificação"
      );
    }
  }

  /**
   * Busca os dados do perfil do utilizador autenticado.
   */
  async getMeuPerfil(): Promise<User> {
    const response = await apiService.fetch(
      "/usuarios/meu-perfil",
      { method: "GET" },
      true
    );
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.msg || "Erro ao buscar perfil");
    }
    return response.json() as Promise<User>;
  }

  /**
   * Busca um novo accessToken usando um refreshToken.
   */
  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    const response = await apiService.fetch(
      "/auth/refresh-token",
      {
        method: "POST",
        body: { refreshToken },
      },
      false
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.msg || "Sessão expirada");
    }
    return response.json() as Promise<{ accessToken: string }>;
  }

  /**
   * Informa o backend que o utilizador fez logout.
   */
  async logout(): Promise<void> {
    try {
      await apiService.fetch("/auth/logout", { method: "POST" }, true);
    } catch (error) {
      console.error("Erro ao notificar backend sobre logout:", error);
    }
  }
}

// Exporta uma instância única (singleton) do serviço
export const authService = new AuthService();
