// services/googleAuthNative.ts
import {
  GoogleSignin,
  User as GoogleUser,
  statusCodes,
} from "@react-native-google-signin/google-signin";

const WEB_CLIENT_ID =
  "896137778307-sffk5v7bt1cu1qcktrmu255l5f3t2hn1.apps.googleusercontent.com";

const IOS_CLIENT_ID =
  "896137778307-p0laedr2hc2cojn3lrtjfd3ri5tef2u7.apps.googleusercontent.com";

// Configuração do Google SignIn
GoogleSignin.configure({
  webClientId: WEB_CLIENT_ID,
  iosClientId: IOS_CLIENT_ID,
  offlineAccess: true,
  scopes: ["profile", "email"],
});

export interface NativeSignInResult {
  idToken: string;
  user: GoogleUser;
}

export const signInWithGoogleNative = async (): Promise<NativeSignInResult> => {
  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

    const response = await GoogleSignin.signIn();

    if (!response.data?.idToken) {
      throw new Error("ID Token não recebido do Google");
    }

    if (!response.data?.user) {
      throw new Error("Dados do usuário não recebidos do Google");
    }

    return {
      idToken: response.data.idToken,
      user: response.data.user,
    } as any;
  } catch (error: any) {
    console.error("❌ Erro no Sign-In Nativo:", error);

    if (error.code === statusCodes.SIGN_IN_CANCELLED) {
      throw new Error("Login cancelado pelo usuário");
    } else if (error.code === statusCodes.IN_PROGRESS) {
      throw new Error("Login já em andamento");
    } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      throw new Error("Google Play Services não disponível");
    }

    throw error;
  }
};

export const signOutFromGoogle = async (): Promise<void> => {
  try {
    await GoogleSignin.signOut();
    console.log("✅ Logout do Google realizado");
  } catch (error) {
    console.error("❌ Erro ao fazer logout do Google:", error);
  }
};

// ✔️ Maneira correta de verificar se está logado
export const isSignedIn = async (): Promise<boolean> => {
  try {
    const user = await GoogleSignin.getCurrentUser();
    return user != null;
  } catch (error) {
    console.error("Não está logado", error);
    return false;
  }
};

// ✔️ Maneira correta de obter o usuário atual
export const getCurrentUser = async (): Promise<GoogleUser | null> => {
  try {
    const user = await GoogleSignin.getCurrentUser();
    return user;
  } catch (error) {
    console.error("❌ Erro ao obter usuário atual:", error);
    return null;
  }
};
