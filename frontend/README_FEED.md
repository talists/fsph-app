# Tela Feed - App Gota a Gota

## 📱 Visão Geral

A tela Feed foi implementada seguindo fielmente o layout do Figma, sendo 100% funcional e integrada ao backend do projeto `Backend-gota-a-gota-fsph`.

## 🚀 Funcionalidades Implementadas

### ✅ Interface Visual (Figma)

- Header com logo "Gota a Gota" (imagem) e ícone de notificação
- Card "Poste uma foto da sua doação" com ícone "+" estilizado
- Lista de posts com avatar, nome do usuário, descrição e imagem
- Menu inferior com navegação em abas
- Cores e espaçamentos exatos do Figma

### ✅ Funcionalidades

- Carregamento automático do feed via API
- Upload de fotos da galeria com validação de tipo e tamanho
- Criação de novos posts com descrição
- Refresh do feed (puxar para baixo)
- Autenticação JWT integrada
- Loading states e tratamento de erros
- Interface responsiva

## 📂 Estrutura de Arquivos Criados

```
frontend/src/
├── screens/
│   ├── Feed.js                 # Tela principal do feed
│   ├── HomeScreen.js           # Tela Home (placeholder)
│   ├── BeneficiosScreen.js     # Tela Benefícios (placeholder)
│   └── DoarScreen.js           # Tela Doar (placeholder)
├── components/
│   ├── PostCard.js             # Componente de post individual
│   └── UploadCard.js           # Componente de upload
├── services/
│   └── api.js                  # Configuração Axios e endpoints
├── contexts/
│   └── AuthContext.js          # Context de autenticação
├── config/
│   └── api.js                  # Configurações da API
└── navigation/
    └── BottomTabs.js           # Navegação em abas

frontend/app/(tabs)/
└── feed.tsx                    # Integração com Expo Router
```

## 🔧 Tecnologias Utilizadas

- **React Native** com JavaScript
- **Expo Router** para navegação
- **Axios** para comunicação com API
- **expo-image-picker** para seleção de imagens
- **@expo/vector-icons** para ícones
- **AsyncStorage** para gerenciar tokens
- **@react-navigation/bottom-tabs** para menu inferior

## 🌐 Integração com Backend

### Endpoints Utilizados:

- `GET /api/feed` - Listar posts do feed
- `POST /api/feed` - Criar novo post (multipart/form-data)
- `GET /api/feed/usuario` - Posts do usuário logado

### Autenticação:

- Token JWT enviado no header `Authorization: Bearer <token>`
- Middleware `verifyToken` no backend
- Context de autenticação no frontend

## ⚙️ Configuração

### 1. Instalar Dependências

```bash
cd frontend
npm install axios expo-image-picker @react-native-async-storage/async-storage
```

### 2. Configurar URL do Backend

Edite o arquivo `src/config/api.js`:

```javascript
export const API_CONFIG = {
  BASE_URL: "http://SEU_IP:3000/api", // Substitua pelo IP do seu backend
  // ...outras configurações
};
```

### 3. Backend Requirements

Certifique-se de que o backend está rodando em `http://localhost:3000` e que os seguintes módulos estão funcionando:

- Módulo Feed (`src/modules/feed/`)
- Middleware de autenticação (`auth.middleware.js`)
- Upload de arquivos (Cloudflare R2)

## 🎨 Estilos Aplicados (Figma)

### Cores:

- **Fundo geral**: `#F5F5F5`
- **Header**: `#FCE4EC` (rosa-claro)
- **Card upload**: `#F8EAEA` (rosa-claro)
- **Cor principal**: `#E73645` (vermelho)
- **Cards**: `#FFFFFF` (branco)

### Tipografia:

- **Nome usuário**: fontSize 14, fontWeight 'bold'
- **Descrição post**: fontSize 13, color '#555'
- **Texto upload**: fontSize 14, color '#333'

### Dimensões:

- **Imagem post**: width '100%', height 180, borderRadius 10
- **Cards**: padding 12, marginBottom 12, borderRadius 12
- **Menu inferior**: height 60, elevation 10

## 📱 Como Usar

1. **Visualizar Feed**: A tela carrega automaticamente os posts do backend
2. **Criar Post**: Toque no card "Poste uma foto..." para abrir o modal
3. **Selecionar Imagem**: Toque na área de seleção e escolha uma foto
4. **Adicionar Descrição**: Digite sobre sua doação
5. **Publicar**: Toque em "Publicar" para enviar
6. **Atualizar**: Puxe a lista para baixo para recarregar

## 🔒 Autenticação

O feed verifica automaticamente se o usuário está logado:

- Se **logado**: Mostra o feed normalmente
- Se **não logado**: Exibe tela de "Acesso Restrito"

Para integrar com seu sistema de login existente, adicione o `AuthProvider` no componente raiz da aplicação.

## 🚨 Validações Implementadas

### Upload de Imagem:

- **Tamanho máximo**: 5MB
- **Tipos permitidos**: JPG, PNG, JPEG
- **Permissões**: Solicita acesso à galeria

### Formulário:

- **Imagem obrigatória**
- **Descrição obrigatória**
- **Limite de caracteres**: 500

## 📊 Features Adicionais

- **Cache Redis**: Backend usa cache para otimizar performance
- **Error Handling**: Tratamento de erros de rede e validação
- **Loading States**: Indicadores visuais durante carregamentos
- **Refresh Control**: Pull-to-refresh nativo
- **Responsive Design**: Layout adapta-se a diferentes tamanhos

## 🎯 Próximos Passos

1. **Integrar autenticação real**: Conectar com o sistema de login existente
2. **Adicionar navegação**: Implementar telas Home, Benefícios e Doar
3. **Push notifications**: Integrar notificações push
4. **Likes e comentários**: Expandir funcionalidades sociais
5. **Paginação**: Implementar infinite scroll

## 🐛 Debugging

### Problemas Comuns:

1. **"Network Error"**: Verifique se o backend está rodando e acessível
2. **"Token inválido"**: Implemente o sistema de login
3. **Upload falha**: Verifique configuração do Cloudflare R2
4. **Imagem não aparece**: Verifique URLs retornadas pelo backend

### Logs Úteis:

```javascript
// Verificar se usuário está logado
console.log("User:", useAuth().user);

// Verificar resposta da API
console.log("Feed response:", feedData);

// Verificar token
AsyncStorage.getItem("userToken").then((token) => console.log("Token:", token));
```

---

**Status**: ✅ Implementação Completa
**Compatibilidade**: React Native 0.81+, Expo SDK 54+
**Backend**: Node.js + Express + TypeORM + Redis
