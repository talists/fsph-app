// services/googleAuthNative.ts (Corrigido para Tipagem)
import {
  GoogleSignin,
  User as GoogleUser,
} from "@react-native-google-signin/google-signin";

// Use o ID de Cliente WEB, pois o SDK nativo faz o mapeamento para Android/iOS internamente
const WEB_CLIENT_ID =
  "896137778307-v0gvr801j42k4ua42o71jbv9jkkqnvit.apps.googleusercontent.com";

GoogleSignin.configure({
  webClientId: WEB_CLIENT_ID,
  offlineAccess: true,
});

// ⬇️ Definindo uma interface de retorno clara ⬇️
export interface NativeSignInResult {
  idToken: string;
  user: GoogleUser;
}

export const signInWithGoogleNative = async (): Promise<NativeSignInResult> => {
  try {
    await GoogleSignin.hasPlayServices();

    // 1. Inicia o fluxo de login nativo
    const signInResponse = await GoogleSignin.signIn();

    // 2. ⬇️ CORREÇÃO: Acessa as propriedades diretamente com a certeza de que existem ⬇️
    //    Usamos 'as any' para contornar o erro de tipagem na importação da biblioteca
    const idToken = (signInResponse as any).idToken;
    const user = (signInResponse as any).user;

    if (!idToken || !user) {
      throw new Error("Dados de usuário ou ID Token não recebidos do Google.");
    }

    // O retorno agora corresponde à interface NativeSignInResult
    return { idToken, user };
  } catch (error) {
    console.error("❌ Erro no Sign-In Nativo:", error);
    throw error;
  }
};
