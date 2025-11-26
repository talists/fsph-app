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
          console.log("✅ [AUTH] Sessão anterior encontrada, validando...");
          setUser(JSON.parse(userDataString));

          authService
            .getMeuPerfil()
            .then((perfilAtualizado) => {
              console.log("✅ [AUTH] Perfil atualizado com sucesso");
              setUser(perfilAtualizado);
              AsyncStorage.setItem(
                USER_DATA_KEY,
                JSON.stringify(perfilAtualizado)
              );
            })
            .catch(async (error) => {
              console.warn("⚠️ [AUTH] Token inválido, tentando refresh...");
              try {
                const refreshToken = await tokenStorage.getRefreshToken();
                if (!refreshToken) {
                  throw new Error("Sem refresh token disponível");
                }

                const { accessToken: newAccessToken } =
                  await authService.refreshToken(refreshToken);

                await tokenStorage.saveTokens(newAccessToken, refreshToken);

                const perfilAtualizado = await authService.getMeuPerfil();
                setUser(perfilAtualizado);
                AsyncStorage.setItem(
                  USER_DATA_KEY,
                  JSON.stringify(perfilAtualizado)
                );

                console.log("✅ [AUTH] Token atualizado com sucesso");
              } catch (refreshError) {
                console.log("ℹ️ [AUTH] Sessão expirada, fazendo logout");
                await signOutInternal();
              }
            });
        } else {
          // ✅ Log amigável quando não há sessão (normal na primeira vez)
          if (__DEV__) {
            console.log("ℹ️ [AUTH] Nenhuma sessão anterior encontrada");
          }
          await signOutInternal();
        }
      } catch (e) {
        console.error("❌ [AUTH] Erro ao carregar sessão:", e);
        await signOutInternal();
      } finally {
        setIsLoading(false);
      }
    }
    loadStorageData();
  }, []);

  const registerForPushNotifications = async () => {
    // Desativado no Expo Go
    if (__DEV__) {
      console.log("ℹ️ [PUSH] Notificações Push desativadas no Expo Go");
    }
    return;
  };

  const handleAuthSuccess = async (
    authData: AuthResponse | GoogleAuthResponse | RegisterResponse
  ) => {
    const userData = authData.usuario;
    const accessToken =
      (authData as any).accessToken ?? (authData as any).token;
    const refreshToken = (authData as any).refreshToken ?? null;

    console.log("✅ [AUTH] Autenticação bem-sucedida:", userData.email);

    setUser(userData);
    await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
    await tokenStorage.saveTokens(accessToken, refreshToken);
    await registerForPushNotifications();
  };

  const signIn = async (email: string, senha: string) => {
    console.log("🔐 [AUTH] Iniciando login...");
    const authData = await authService.login(email, senha);
    await handleAuthSuccess(authData);
  };

  async function signInWithGoogleAccount(idToken: string) {
    console.log("🔐 [AUTH] Iniciando login com Google...");
    const authData = await authService.loginWithGoogle(idToken);
    await handleAuthSuccess(authData);
  }

  const register = async (data: FormData) => {
    console.log("📝 [AUTH] Iniciando registro...");
    const authData = await authService.register(data);
    await handleAuthSuccess(authData);
  };

  const signOutInternal = async () => {
    setUser(null);
    await tokenStorage.clearTokens();
    await AsyncStorage.removeItem(USER_DATA_KEY);
  };

  const signOut = async () => {
    console.log("👋 [AUTH] Fazendo logout...");
    try {
      await authService.logout();
      console.log("✅ [AUTH] Logout concluído");
    } catch (error) {
      console.error("⚠️ [AUTH] Erro ao notificar backend sobre logout");
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

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
}
