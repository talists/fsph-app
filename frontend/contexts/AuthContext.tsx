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
  signOut: () => Promise<void>;
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
    if (__DEV__) {
      console.log("ℹ️ [PUSH] Notificações Push desativadas no Expo Go");
    }
    return;
  };

  const handleAuthSuccess = async (
    authData: AuthResponse | GoogleAuthResponse | RegisterResponse
  ) => {
    let userData = authData.usuario;
    const accessToken =
      (authData as any).accessToken ?? (authData as any).token;
    const refreshToken = (authData as any).refreshToken ?? null;

    // 1. Salva tokens imediatamente para permitir requisições
    await tokenStorage.saveTokens(accessToken, refreshToken);

    // 2. 🔍 VERIFICAÇÃO DE SEGURANÇA:
    // Se o login não trouxe dados cruciais (como CPF ou RG), buscamos o perfil completo.
    // Isso corrige o problema do cartão vazio após o login.
    if (!userData.cpf || !userData.rg || !userData.data_nascimento) {
      try {
        console.log(
          "🔄 [AUTH] Login retornou dados parciais. Buscando perfil completo..."
        );
        // Chama o endpoint /meu-perfil que traz tudo (incluindo doações)
        const perfilCompleto = await authService.getMeuPerfil();

        // Mescla os dados para garantir que temos o objeto mais atual
        userData = { ...userData, ...perfilCompleto };
        console.log("✅ [AUTH] Perfil completo carregado via API extra.");
      } catch (error) {
        console.warn(
          "⚠️ [AUTH] Falha ao buscar detalhes do perfil (usando dados básicos).",
          error
        );
      }
    }

    console.log("✅ [AUTH] Dados finais do usuário:", userData.email);

    // 3. Atualiza estado e storage
    setUser(userData);
    await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
    await registerForPushNotifications();
  };

  const signIn = async (email: string, senha: string) => {
    console.log("🔐 [AUTH] Iniciando login...");
    const authData = await authService.login(email, senha);
    await handleAuthSuccess(authData);
    // ✅ REMOVIDO: router.replace("/") - o _layout.tsx cuida disso
  };

  async function signInWithGoogleAccount(idToken: string) {
    console.log("🔐 [AUTH] Iniciando login com Google...");
    const authData = await authService.loginWithGoogle(idToken);
    await handleAuthSuccess(authData);
    // ✅ REMOVIDO: router.replace("/") - o _layout.tsx cuida disso
  }

  const register = async (data: FormData) => {
    console.log("📝 [AUTH] Iniciando registro...");
    const authData = await authService.register(data);
    await handleAuthSuccess(authData);
    // ✅ REMOVIDO: router.replace("/") - o _layout.tsx cuida disso
  };

  /**
   * Função interna de logout (sem notificar backend)
   * Usada pelo useEffect quando detecta sessão inválida
   */
  const signOutInternal = async () => {
    setUser(null);
    await tokenStorage.clearTokens();
    await AsyncStorage.removeItem(USER_DATA_KEY);
    // ✅ REMOVIDO: router.replace("/login") - o _layout.tsx cuida disso
  };

  /**
   * Função pública de logout (notifica backend)
   * Usada quando o usuário clica em "Sair"
   */
  const signOut = async () => {
    console.log("👋 [AUTH] Fazendo logout...");

    try {
      // Tenta notificar o backend (mas não bloqueia se falhar)
      await authService.logout();
      console.log("✅ [AUTH] Backend notificado sobre logout");
    } catch (error) {
      console.warn(
        "⚠️ [AUTH] Erro ao notificar backend, continuando logout local"
      );
    }

    // Sempre limpa os dados locais, independente do backend
    await signOutInternal();

    console.log("✅ [AUTH] Logout concluído");
    // ✅ REMOVIDO: router.replace("/login") - o _layout.tsx cuida disso
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
