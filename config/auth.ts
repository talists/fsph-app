// Configuração de exemplo para Google OAuth
// Substitua pelos seus valores reais do Google Cloud Console

export const GOOGLE_OAUTH_CONFIG = {
  // Substitua pelo seu Client ID do Google Cloud Console
  clientId: '419445008906-jmbevfpdbu7s2iveqki47hgb6n8jtaso.apps.googleusercontent.com',
  
  // Scopes necessários para o login
  scopes: ['openid', 'profile', 'email'],
  
  // URLs para desenvolvimento e produção
  redirectUris: {
    development: 'https://auth.expo.io/@joaovitorms0/fsph-test',
    production: 'your-production-redirect-uri'
  }
};

// Exemplo de como usar no login.tsx:
/*
import { GOOGLE_OAUTH_CONFIG } from '../config/auth';

const handleGoogleLogin = async () => {
  try {
    const redirectUri = AuthSession.makeRedirectUri({});
    
    const request = new AuthSession.AuthRequest({
      clientId: GOOGLE_OAUTH_CONFIG.clientId,
      scopes: GOOGLE_OAUTH_CONFIG.scopes,
      redirectUri,
      responseType: AuthSession.ResponseType.Code,
    });

    const result = await request.promptAsync({
      authorizationEndpoint: 'https://accounts.google.com/oauth/authorize',
    });

    if (result.type === 'success') {
      console.log('Login realizado com sucesso:', result);
      router.push('/(tabs)');
    }
  } catch (error) {
    Alert.alert('Erro', 'Erro ao fazer login com Google');
  }
};
*/