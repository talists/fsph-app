// frontend/contexts/AuthContext.tsx (MODIFICADO)
import React, { createContext, useContext, useState, useEffect } from "react";
import { tokenStorage } from "../services/tokenStorage";
import {
  authService,
  AuthResponse,
  GoogleAuthResponse,
  RegisterResponse,
  User,
} from "../services/auth.service";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { signInWithGoogleNative } from "../config/googleAuthNative";

interface AuthContextData {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, senha: string) => Promise<void>;
  signInWithGoogle: (idToken: string) => Promise<void>;
  register: (data: FormData) => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

const USER_DATA_KEY = "userData";

/**
 * O AuthProvider gere todo o estado de autenticação.
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Lógica de arranque da app
  useEffect(() => {
    async function loadStorageData() {
      try {
        const accessToken = await tokenStorage.getAccessToken();
        const userDataString = await AsyncStorage.getItem(USER_DATA_KEY);

        if (!accessToken || !userDataString) {
          throw new Error("Não há token ou dados do usuário.");
        }

        setUser(JSON.parse(userDataString));

        // 2. Tenta validar o token e buscar dados frescos do perfil
        try {
          const perfilAtualizado = await authService.getMeuPerfil();
          setUser(perfilAtualizado);
          await AsyncStorage.setItem(
            USER_DATA_KEY,
            JSON.stringify(perfilAtualizado)
          );
        } catch (validateError) {
          // 3. Falha na validação (token expirado?): Tenta dar refresh
          console.warn(
            "Token de acesso inválido, a tentar atualizar:",
            validateError
          );
          const refreshToken = await tokenStorage.getRefreshToken();
          if (!refreshToken) {
            throw new Error("Sem refresh token, a deslogar.");
          }

          const { accessToken: newAccessToken } =
            await authService.refreshToken(refreshToken);

          await tokenStorage.saveTokens(newAccessToken, refreshToken);

          // 4. Tenta buscar o perfil DE NOVO com o novo token
          const perfilAtualizado = await authService.getMeuPerfil();
          setUser(perfilAtualizado);
          await AsyncStorage.setItem(
            USER_DATA_KEY,
            JSON.stringify(perfilAtualizado)
          );
        }
      } catch (e: any) {
        // 5. Qualquer falha na cadeia (sem token, refresh falhou, etc.) resulta num sign-out.
        console.error("Falha ao carregar sessão, a deslogar:", e.message);
        await signOutInternal();
      } finally {
        setIsLoading(false);
      }
    }
    loadStorageData();
  }, []);

  /**
   * Pede permissão e regista o token de notificação push (FCM) do utilizador no backend.
   * (FUNÇÃO MODIFICADA)
   */
  const registerForPushNotifications = async () => {
    try {
      console.log("A iniciar registo de token push...");

      const token = await authService.getExpoPushToken();

      if (!token) {
        console.warn(
          "Não foi possível obter o token push. O registo será ignorado."
        );
        return;
      }

      // 2. Envia o token para o backend
      await authService.updateFcmToken(token);
      console.log("✅ Token push registado no backend com sucesso!");
    } catch (error) {
      console.error("❌ Erro no processo de registo do token push:", error);
    }
  };

  /**
   * Função centralizada para lidar com o sucesso da autenticação
   * (Sem alteração)
   */
  const handleAuthSuccess = async (
    authData: AuthResponse | GoogleAuthResponse | RegisterResponse
  ) => {
    const userData = authData.usuario;
    let accessToken: string;
    let refreshToken: string | undefined;

    if ("accessToken" in authData) {
      accessToken = authData.accessToken;
      refreshToken = authData.refreshToken;
    } else {
      accessToken = authData.token;
    }

    setUser(userData);
    await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
    await tokenStorage.saveTokens(accessToken, refreshToken);

    // Esta chamada agora aciona a lógica correta
    await registerForPushNotifications();
  };

  /**
   * Função de Login
   * (Sem alteração)
   */
  const signIn = async (email: string, senha: string) => {
    const authData = await authService.login(email, senha);
    await handleAuthSuccess(authData);
  };

  /**
   * Função de Login com Google (nome corrigido)
   * (Sem alteração)
   */
  const signInWithGoogle = async () => {
    try {
      // 1. Chama o fluxo nativo
      const result = await signInWithGoogleNative();

      // 2. Envia o idToken para o seu backend para validação e obtenção do JWT
      const authData = await authService.loginWithGoogle(result.idToken);

      // 3. Atualiza o estado
      await handleAuthSuccess(authData);
    } catch (err) {
      console.error("ERRO FINAL SIGN-IN NATIVO:", err);
      // ... (tratamento de erro)
      throw err;
    }
  };

  /**
   * Função de Registo
   * (Sem alteração)
   */
  const register = async (data: FormData) => {
    const authData = await authService.register(data);
    await handleAuthSuccess(authData);
  };

  /**
   * Função de Logout interna (para evitar loops no useEffect)
   * (Sem alteração)
   */
  const signOutInternal = async () => {
    setUser(null);
    await tokenStorage.clearTokens();
    await AsyncStorage.removeItem(USER_DATA_KEY);
  };

  /**
   * Função de Logout
   * (Sem alteração)
   */
  const signOut = async () => {
    try {
      await authService.logout();
      console.log("Sessão invalidada no backend.");
    } catch (error) {
      console.error(
        "Erro ao fazer logout no backend (a deslogar localmente)...",
        error
      );
    }
    await signOutInternal();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        signIn,
        signInWithGoogle,
        register,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook customizado para aceder facilmente ao AuthContext
 * (Sem alteração)
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
}
