import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";

WebBrowser.maybeCompleteAuthSession();

// Configuração do Google OAuth para Expo
// IMPORTANTE: Substitua pelo seu Client ID real do Google Cloud Console
// Este é um exemplo - você precisa configurar um projeto no Google Cloud Console
const GOOGLE_CLIENT_ID =
  "419445008906-jmbevfpdbu7s2iveqki47hgb6n8jtaso.apps.googleusercontent.com";

// Configure o Google Sign-In para Expo
export const configureGoogleSignIn = () => {
  // Para Expo Go, não precisamos de configuração prévia
  console.log("Google Sign-In configurado para Expo");
};

// Função para fazer login com Google usando AuthSession (compatível com Expo Go)
export const signInWithGoogle = async () => {
  try {
    // URI local para desenvolvimento que o Google aceita
    const redirectUri = "http://localhost:19006/auth";

    console.log("Redirect URI:", redirectUri);

    const request = new AuthSession.AuthRequest({
      clientId: GOOGLE_CLIENT_ID,
      scopes: ["openid", "profile", "email"],
      redirectUri,
      responseType: AuthSession.ResponseType.Code,
      extraParams: {},
    });

    const discovery = await AuthSession.fetchDiscoveryAsync(
      "https://accounts.google.com"
    );

    const result = await request.promptAsync(discovery);

    if (result.type === "success") {
      // Aqui você pode trocar o código por um token de acesso
      const { code } = result.params;

      // Para este exemplo, vamos simular um usuário logado
      const mockUser = {
        id: "123456789",
        name: "Usuário de Teste",
        email: "usuario@teste.com",
        photo: "https://via.placeholder.com/150",
      };

      return { success: true, user: mockUser };
    } else {
      return { success: false, error: "Login cancelado pelo usuário" };
    }
  } catch (error) {
    console.error("Erro no login com Google:", error);

    // Tratamento específico para erros de OAuth
    const errorMessage = (error as any)?.message || "";

    if (
      errorMessage.includes("invalid_request") ||
      errorMessage.includes("redirect_uri")
    ) {
      return {
        success: false,
        error:
          "Erro de configuração OAuth. Verifique o arquivo URGENTE_GOOGLE_OAUTH_FIX.md para instruções detalhadas.",
      };
    }

    if (errorMessage.includes("Authorization Error")) {
      return {
        success: false,
        error:
          "URI de redirecionamento não autorizado. Configure no Google Cloud Console conforme instruções no arquivo URGENTE_GOOGLE_OAUTH_FIX.md.",
      };
    }

    return {
      success: false,
      error: `Erro no login com Google: ${errorMessage || "Erro desconhecido"}`,
    };
  }
};

// Função para fazer logout
export const signOutFromGoogle = async () => {
  try {
    // Para AuthSession, não há logout específico
    // Você pode limpar o cache do WebBrowser se necessário
    await WebBrowser.dismissBrowser();
    return { success: true };
  } catch (error) {
    console.error("Erro no logout:", error);
    return { success: false, error: "Erro no logout" };
  }
};

// Função para obter usuário atual
export const getCurrentUser = async () => {
  try {
    // Para este exemplo, retornamos null (usuário não logado)
    return null;
  } catch (error) {
    console.error("Erro ao obter usuário atual:", error);
    return null;
  }
};
