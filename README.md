# FSPH Hemose App

Este é um aplicativo React Native criado com Expo que implementa as telas de carregamento, login e cadastro para o sistema FSPH Hemose.

## Tecnologias Utilizadas

- **React Native** com **Expo**
- **TypeScript**
- **Expo Router** para navegação
- **Expo Auth Session** para OAuth
- **NativeWind** para styling (Tailwind CSS)
- **React Native Reanimated** para animações
- **Expo Vector Icons** para ícones

## Como Executar

1. **Instalar dependências:**
   ```bash
   npm install
   ```

2. **Iniciar o servidor de desenvolvimento:**
   ```bash
   npm start
   ```

3. **Executar no dispositivo:**
   - Escaneie o QR code com o Expo Go (Android) ou Camera (iOS)
   - Ou pressione `a` para Android, `i` para iOS, `w` para web

## Configuração do Google OAuth

Para habilitar o login com Google, você precisa:

### 1. Configurar no Google Cloud Console

1. Acesse o [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione um existente
3. Ative a API do Google+ ou Google Identity
4. Vá para "Credenciais" > "Criar credenciais" > "ID do cliente OAuth 2.0"
5. Configure as URLs de redirecionamento:
   - Para desenvolvimento: `https://auth.expo.io/@your-username/your-app-slug`
   - Para produção: configure conforme sua necessidade

### 2. Atualizar o código

No arquivo `app/login.tsx`, substitua o método `handleGoogleLogin` por:
```typescript
const handleGoogleLogin = async () => {
  try {
    const redirectUri = AuthSession.makeRedirectUri({});
    
    const request = new AuthSession.AuthRequest({
      clientId: 'SEU_GOOGLE_CLIENT_ID.googleusercontent.com', // Substitua aqui
      scopes: ['openid', 'profile', 'email'],
      redirectUri,
      responseType: AuthSession.ResponseType.Code,
    });

    const result = await request.promptAsync({
      authorizationEndpoint: 'https://accounts.google.com/oauth/authorize',
    });

    if (result.type === 'success') {
      // Processar o resultado do login
      console.log('Login realizado com sucesso:', result);
      router.push('/(tabs)');
    }
  } catch (error) {
    Alert.alert('Erro', 'Erro ao fazer login com Google');
  }
};
```

## Estrutura do Projeto

```
app/
├── _layout.tsx          # Layout principal da aplicação
├── index.tsx            # Redirecionamento para splash1
├── splash1.tsx          # Primeira tela de carregamento
├── splash2.tsx          # Segunda tela de carregamento
├── login.tsx            # Tela de login
├── register.tsx         # Tela de cadastro
└── (tabs)/              # Telas principais do app (após login)
    ├── _layout.tsx
    ├── index.tsx
    └── explore.tsx
```

## Fluxo da Aplicação

1. **Inicialização**: `index.tsx` → `splash1.tsx`
2. **Splash 1**: Animação de fade-in → Após 3s vai para `splash2.tsx`
3. **Splash 2**: Animação de slide → Após 3s vai para `login.tsx`
4. **Login**: Usuário pode fazer login ou ir para cadastro
5. **Cadastro**: Usuário pode se cadastrar ou voltar para login
6. **App Principal**: Após login bem-sucedido, vai para `(tabs)`

## Customização

### Cores do Tema
As cores podem ser customizadas no `tailwind.config.js`:
```javascript
theme: {
  extend: {
    colors: {
      primary: {
        500: '#DC5F5F', // Cor principal (vermelho FSPH)
        600: '#C54545',
      },
      background: {
        light: '#F8F4F4', // Fundo claro
        dark: '#2D2D2D',
      }
    }
  },
}
```

## Próximos Passos

1. **Implementar autenticação real** com backend
2. **Configurar Google OAuth** com credenciais reais
3. **Adicionar validações mais robustas**
4. **Implementar recuperação de senha**
5. **Adicionar testes unitários**

## Licença


Este projeto é propriedade da FSPH Hemose.
