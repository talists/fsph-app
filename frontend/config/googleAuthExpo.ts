import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { atob } from "react-native-quick-base64";

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_CLIENT_ID =
  "896137778307-v0gvr801j42k4ua42o71jbv9jkkqnvit.apps.googleusercontent.com";
const GOOGLE_SCOPES = ["openid", "profile", "email"];

console.log("BUILD 2.0 - USANDO PROXY");

const REDIRECT_URI = AuthSession.makeRedirectUri({
  // Este método gera o URI complexo que o Development Client espera:
  // Ex: exp://192.168.x.x:8081/--/gotaagotafsph
  scheme: "gotaagotafsph",
  // MANTENHA useProxy: false (o padrão), e deixe o Google Cloud Console lidar com a credencial nativa.
});

export interface GoogleSignInResult {
  success: boolean;
  idToken?: string;
  user?: {
    id: string;
    name: string;
    email: string;
    photo?: string;
  };
  error?: string;
}

export const configureGoogleSignIn = () => {
  console.log("🔐 Google Sign-In configurado para Expo (Modo Nativo)");
};

export const signInWithGoogle = async (): Promise<GoogleSignInResult> => {
  await WebBrowser.dismissBrowser();

  if (!GOOGLE_CLIENT_ID) {
    console.error(
      "❌ Erro de Configuração: GOOGLE_CLIENT_ID não está definido."
    );
    return { success: false, error: "Erro de configuração do cliente Google." };
  }

  try {
    console.log("🚀 Iniciando login com Google (Nativo)...");
    console.log("📍 Redirect URI:", REDIRECT_URI);

    const nonce = Math.random().toString(36).substring(2, 15);
    console.log("🔑 Usando Nonce:", nonce);

    const request = new AuthSession.AuthRequest({
      clientId: GOOGLE_CLIENT_ID,
      scopes: GOOGLE_SCOPES,
      redirectUri: REDIRECT_URI,
      responseType: AuthSession.ResponseType.IdToken,
      usePKCE: false,
      extraParams: {
        nonce: nonce,
      },
    });

    const discovery = await AuthSession.fetchDiscoveryAsync(
      "https://accounts.google.com"
    );

    console.log("🔍 Endpoints descobertos. Abrindo navegador...");

    const result = await request.promptAsync(discovery);

    if (result.type === "success") {
      console.log("✅ Login com Google bem-sucedido!");
      const idToken = result.params?.id_token;
      if (!idToken) {
        console.error("❌ id_token não encontrado na resposta");
        return {
          success: false,
          error: "Token de autenticação não recebido",
        };
      }
      const tokenParts = idToken.split(".");
      let userInfo = null;
      if (tokenParts.length === 3) {
        try {
          const payload = JSON.parse(atob(tokenParts[1]));
          userInfo = {
            id: payload.sub,
            name: payload.name || "",
            email: payload.email || "",
            photo: payload.picture || undefined,
          };
          console.log("👤 Informações do usuário extraídas:", userInfo.email);
        } catch (e) {
          console.warn("⚠️ Não foi possível decodificar o token", e);
        }
      }
      return {
        success: true,
        idToken: idToken,
        user: userInfo || undefined,
      };
    }
    if (result.type === "cancel") {
      console.log("ℹ️ Login cancelado pelo usuário");
      return { success: false, error: "Login cancelado" };
    }
    if (result.type === "error") {
      console.error("❌ Erro na autenticação:", result.error);
      return {
        success: false,
        error: result.error?.message || "Erro na autenticação",
      };
    }
    console.warn("⚠️ Login falhou:", result.type);
    return { success: false, error: "Falha na autenticação" };
  } catch (error: any) {
    console.error("❌ Erro no login com Google:", error);
    return {
      success: false,
      error: `Erro ao fazer login: ${error?.message || "Erro desconhecido"}`,
    };
  }
};

export const signOutFromGoogle = async (): Promise<{ success: boolean }> => {
  try {
    await WebBrowser.dismissBrowser();
    console.log("✅ Logout do Google realizado");
    return { success: true };
  } catch (error) {
    console.error("❌ Erro no logout:", error);
    return { success: false };
  }
};

export const getCurrentUser = async () => {
  return null;
};
