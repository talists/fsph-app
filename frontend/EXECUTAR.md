# ⚡ Guia de Execução - Feed App Gota a Gota

## 🔧 Pré-requisitos

1. **Backend rodando** em `http://localhost:3000`
2. **Node.js** e **npm** instalados
3. **Expo CLI** instalado globalmente

## 🚀 Como Executar

### 1. Instalar Dependências

```bash
cd frontend
npm install
```

### 2. Configurar IP do Backend

Edite `src/config/api.js` e substitua pelo IP da sua máquina:

```javascript
BASE_URL: "http://SEU_IP:3000/api";
```

### 3. Executar o App

```bash
npx expo start
```

### 4. Abrir no Dispositivo

- **Android**: Escaneie o QR code com o app Expo Go
- **iOS**: Escaneie o QR code com a câmera do iPhone
- **Simulador**: Pressione 'a' (Android) ou 'i' (iOS)

## 📱 Testando o Feed

### Sem Autenticação:

- O feed mostrará tela de "Acesso Restrito"
- Implementar login para funcionalidade completa

### Com Autenticação:

1. Faça login no app
2. Navegue para a aba "Feed"
3. Teste o upload de foto
4. Visualize posts existentes

## 🎯 Features Implementadas

✅ Tela Feed fiel ao Figma
✅ Upload de imagens
✅ Integração com backend
✅ Navegação em abas
✅ Autenticação JWT
✅ Loading states
✅ Tratamento de erros
✅ Pull-to-refresh

## 📂 Estrutura Final

```
frontend/
├── src/
│   ├── screens/Feed.js         # ✅ Tela principal
│   ├── components/             # ✅ PostCard, UploadCard
│   ├── services/api.js         # ✅ Axios configurado
│   ├── contexts/AuthContext.js # ✅ Autenticação
│   └── config/api.js           # ✅ Configurações
├── app/(tabs)/feed.tsx         # ✅ Integração Expo Router
└── README_FEED.md              # ✅ Documentação completa
```

## 🔍 Debug

Para verificar se está funcionando:

1. **Console Logs**: Verifique logs no terminal do Expo
2. **Network**: Use Flipper ou React Native Debugger
3. **Backend**: Confirme que endpoints `/api/feed` respondem
4. **Tokens**: Verifique AsyncStorage no debugger

## 🎨 Layout Figma ✅

- [x] Header rosa com logo
- [x] Card de upload estilizado
- [x] Posts com avatar e imagem
- [x] Menu inferior vermelho
- [x] Cores exatas (#E73645, #FCE4EC, #F5F5F5)
- [x] Tipografia correta
- [x] Espaçamentos precisos

## 📋 Checklist Final

- [x] Feed carrega posts do backend
- [x] Upload funciona com multipart/form-data
- [x] Interface idêntica ao Figma
- [x] Navegação em abas implementada
- [x] Autenticação JWT integrada
- [x] Validações de arquivo
- [x] Error handling completo
- [x] Loading states
- [x] Refresh control

---

🎉 **Tela Feed 100% Funcional e Integrada!**
