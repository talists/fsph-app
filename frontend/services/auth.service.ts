// services/auth.service.ts
import { apiService } from "./api"; // Importa a instância do Axios
import { isAxiosError } from "axios"; // Importa o type guard do Axios
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { Platform } from "react-native";

// --- DEFINIÇÃO DOS TIPOS ---
export interface User {
  id: number;
  nome: string;
  email: string;
  tipo_sanguineo?: string;
  url_foto_perfil?: string;
  cpf?: string;
  data_nascimento?: string;
  sexo?: "M" | "F";
  data_ultima_doacao?: string;
  numero_telefone?: string;
  cidade?: string;
  estado?: string;
  esta_apto_para_doar?: boolean;
}
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  usuario: User;
}
export interface RegisterResponse {
  token: string;
  usuario: User;
}
export interface GoogleAuthResponse {
  accessToken: string;
  refreshToken: string;
  usuario: User;
}

// =================== ALTERAÇÃO AQUI ===================
// Corrigido para usar as propriedades modernas do NotificationBehavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true, // Substitui 'shouldShowAlert'
    shouldShowList: true, // Adiciona à lista de notificações
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});
// ======================================================

/**
 * O AuthService é responsável por todas as chamadas de API
 * relacionadas a autenticação.
 */
class AuthService {
  /**
   * Regista um novo utilizador.
   */
  async register(data: FormData): Promise<RegisterResponse> {
    try {
      const response = await apiService.post<RegisterResponse>(
        "/usuarios/register",
        data,
        { isAuthRequired: false }
      );
      return response.data;
    } catch (error: any) {
      if (isAxiosError(error) && error.response) {
        const errorData = error.response.data as {
          msg?: string;
          errors?: { message: string }[];
        };
        if (errorData.errors && Array.isArray(errorData.errors)) {
          throw new Error(errorData.errors[0].message);
        }
        throw new Error(errorData?.msg || "Erro ao registar");
      }
      throw error;
    }
  }

  /**
   * Autentica um utilizador com email e senha.
   */
  async login(email: string, senha: string): Promise<AuthResponse> {
    try {
      const response = await apiService.post<AuthResponse>(
        "/auth/login",
        { email, senha },
        { isAuthRequired: false } //
      );
      return response.data;
    } catch (error: any) {
      if (isAxiosError(error) && error.response) {
        const errorData = error.response.data as { msg?: string };
        throw new Error(errorData?.msg || "Email ou senha inválidos");
      }
      throw error;
    }
  }

  /**
   * Autentica um utilizador com o id_token do Google.
   */
  async loginWithGoogle(idToken: string): Promise<GoogleAuthResponse> {
    try {
      const response = await apiService.post<GoogleAuthResponse>(
        "/oauth/login",
        { provider: "google", id_token: idToken },
        { isAuthRequired: false } //
      );
      return response.data;
    } catch (error: any) {
      if (isAxiosError(error) && error.response) {
        const errorData = error.response.data as { msg?: string };
        throw new Error(errorData?.msg || "Erro ao fazer login com o Google");
      }
      throw error;
    }
  }

  /**
   * Pede permissão e obtém o Expo Push Token do dispositivo.
   * @returns O token, ou null se não for possível obter.
   */
  async getExpoPushToken(): Promise<string | null> {
    let token;

    if (!Device.isDevice) {
      console.warn("Notificações Push só funcionam em dispositivos físicos.");
      return null;
    }

    // 1. Pede permissão
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.error("Falha ao obter permissão para notificações!");
      // Você pode querer mostrar um alerta para o usuário aqui
      return null;
    }

    // 2. Obtém o Token
    try {
      // Garante que o projectId está sendo pego do app.json
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      if (!projectId) {
        console.error("projectId do Expo não encontrado no app.json");
        return null;
      }

      token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
      console.log("Expo Push Token obtido:", token);
    } catch (e) {
      console.error("Erro ao obter o token:", e);
      return null;
    }

    // 3. Configura canal (Android)
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF23237C", // Cor vermelha do hemocentro
      });
    }
    return token;
  }

  /**
   * Atualiza o FCM Token do utilizador no backend.
   * (Este método já existe e está perfeito)
   */
  async updateFcmToken(fcmToken: string): Promise<void> {
    try {
      await apiService.patch("/usuarios/fcm-token", { fcm_token: fcmToken });
    } catch (error: any) {
      if (isAxiosError(error) && error.response) {
        const errorData = error.response.data as { msg?: string };
        throw new Error(
          errorData?.msg || "Erro ao atualizar token de notificação"
        );
      }
      throw error;
    }
  }

  /**
   * Busca os dados do perfil do utilizador autenticado.
   */
  async getMeuPerfil(): Promise<User> {
    try {
      const response = await apiService.get<User>("/usuarios/meu-perfil");
      return response.data;
    } catch (error: any) {
      if (isAxiosError(error) && error.response) {
        const errorData = error.response.data as { msg?: string };
        throw new Error(errorData?.msg || "Erro ao buscar perfil");
      }
      throw error;
    }
  }

  /**
   * Busca um novo accessToken usando um refreshToken.
   */
  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      const response = await apiService.post<{ accessToken: string }>(
        "/auth/refresh-token",
        { refreshToken },
        { isAuthRequired: false } //
      );
      return response.data;
    } catch (error: any) {
      if (isAxiosError(error) && error.response) {
        const errorData = error.response.data as { msg?: string };
        throw new Error(errorData?.msg || "Sessão expirada");
      }
      throw error;
    }
  }

  /**
   * Informa o backend que o utilizador fez logout.
   */
  async logout(): Promise<void> {
    try {
      await apiService.post("/auth/logout");
    } catch (error) {
      console.error("Erro ao notificar backend sobre logout:", error);
    }
  }
}

export const authService = new AuthService();
