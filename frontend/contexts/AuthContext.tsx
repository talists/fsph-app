import React, { createContext, useContext, useState, useEffect } from "react";
import { tokenStorage } from "../services/tokenStorage";
import {
  authService,
  AuthResponse,
  GoogleAuthResponse,
  RegisterResponse,
  User,
} from "../services/auth.service";
//import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Define o que o nosso Contexto irá fornecer
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

  useEffect(() => {
    async function loadStorageData() {
      try {
        const accessToken = await tokenStorage.getAccessToken();
        const userDataString = await AsyncStorage.getItem(USER_DATA_KEY);

        if (accessToken && userDataString) {
          setUser(JSON.parse(userDataString));

          authService
            .getMeuPerfil()
            .then((perfilAtualizado) => {
              setUser(perfilAtualizado);
              AsyncStorage.setItem(
                USER_DATA_KEY,
                JSON.stringify(perfilAtualizado)
              );
            })
            .catch(async (error) => {
              console.warn("Token de acesso inválido, a tentar atualizar...");
              try {
                const refreshToken = await tokenStorage.getRefreshToken();
                if (!refreshToken)
                  throw new Error("Sem refresh token, a deslogar.");

                const { accessToken: newAccessToken } =
                  await authService.refreshToken(refreshToken);

                await tokenStorage.saveTokens(newAccessToken, refreshToken);

                const perfilAtualizado = await authService.getMeuPerfil();
                setUser(perfilAtualizado);
                AsyncStorage.setItem(
                  USER_DATA_KEY,
                  JSON.stringify(perfilAtualizado)
                );
              } catch (refreshError) {
                console.error(
                  "Falha ao atualizar token. A deslogar.",
                  refreshError
                );
                await signOutInternal();
              }
            });
        } else {
          // Se não há token ou dados, garante que está deslogado
          await signOutInternal();
        }
      } catch (e) {
        console.error("Erro ao carregar dados de autenticação do storage", e);
        await signOutInternal();
      } finally {
        setIsLoading(false); // Termina o carregamento
      }
    }
    loadStorageData();
  }, []);

  /**
   * Pede permissão e regista o token de notificação push (FCM) do utilizador no backend.
   */
  const registerForPushNotifications = async () => {
    console.log(
      "AVISO: O registo de Notificações Push está desativado no Expo Go."
    );
    return;

    /* // O código abaixo só funcionará numa 'development build'
    try {
      // ... (lógica de permissões) ...
      const token = (await Notifications.getExpoPushTokenAsync()).data;
      if (token) {
        await authService.updateFcmToken(token);
      }
    } catch (error) {
      console.error('❌ Erro ao registar FCM token:', error);
    }
    */
  };

  /**
   * Função centralizada para lidar com o sucesso da autenticação
   */
  const handleAuthSuccess = async (
    authData: AuthResponse | GoogleAuthResponse | RegisterResponse
  ) => {
    const userData = authData.usuario;
    const accessToken =
      (authData as any).accessToken ?? (authData as any).token;
    const refreshToken = (authData as any).refreshToken ?? null;

    setUser(userData);
    await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));

    await tokenStorage.saveTokens(accessToken, refreshToken);

    await registerForPushNotifications();
  };

  /**
   * Função de Login
   */
  const signIn = async (email: string, senha: string) => {
    const authData = await authService.login(email, senha);
    await handleAuthSuccess(authData);
  };

  async function signInWithGoogleAccount(idToken: string) {
    const authData = await authService.loginWithGoogle(idToken);
    await handleAuthSuccess(authData);
  }

  /**
   * Função de Registo
   */
  const register = async (data: FormData) => {
    const authData = await authService.register(data);
    await handleAuthSuccess(authData);
  };

  /**
   * Função de Logout interna (para evitar loops no useEffect)
   */
  const signOutInternal = async () => {
    setUser(null);
    await tokenStorage.clearTokens();
    await AsyncStorage.removeItem(USER_DATA_KEY);
  };

  /**
   * Função de Logout
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
        signInWithGoogle: signInWithGoogleAccount,
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
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
}
