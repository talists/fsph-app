# 🩸 Gota a Gota - FSPH/HEMOSE App

Aplicativo mobile para doadores de sangue do Hemocentro de Sergipe (HEMOSE), desenvolvido em parceria com a Fundação de Saúde Parreiras Horta (FSPH).

## 📱 Sobre o Projeto

O **Gota a Gota** é um aplicativo que conecta doadores de sangue ao HEMOSE, permitindo:
- Visualizar níveis de estoque de sangue em tempo real
- Agendar doações de sangue
- Acompanhar histórico de doações
- Receber notificações sobre campanhas e alertas de estoque crítico
- Participar de campanhas de doação
- Acessar carteirinha digital de doador

---

## 🚀 Tecnologias Utilizadas

### Frontend (Mobile)
- **React Native** com **Expo** (SDK 52)
- **TypeScript**
- **Expo Router** - Navegação baseada em arquivos
- **NativeWind** - Tailwind CSS para React Native
- **React Native Reanimated** - Animações fluidas
- **Expo Notifications** - Notificações locais e push
- **AsyncStorage** - Armazenamento local

### Backend
- **Node.js** com **Express**
- **TypeORM** - ORM para banco de dados
- **MySQL 8.0** - Banco de dados relacional
- **Redis** - Cache e sessões
- **Firebase Admin SDK** - Notificações push (FCM)
- **Cloudflare R2** - Armazenamento de imagens
- **Docker** - Containerização

### Integrações Externas
- **API HEMOSE** (`api.fsph.se.gov.br`) - Agendamentos e dados de doadores
- **API Estoque FSPH** - Níveis de estoque de sangue em tempo real
- **Google OAuth 2.0** - Login social

---

## 📦 Estrutura do Projeto

```
fsph-app/
├── frontend/                    # Aplicativo React Native
│   ├── app/                     # Telas (Expo Router)
│   │   ├── (tabs)/              # Telas principais com navegação por abas
│   │   │   ├── index.tsx        # Home - Estoque de sangue
│   │   │   ├── doar.tsx         # Agendamento de doação
│   │   │   ├── feed.tsx         # Feed de notícias
│   │   │   └── explore.tsx      # Mapa e campanhas
│   │   ├── login.tsx            # Tela de login
│   │   ├── register.tsx         # Tela de cadastro
│   │   ├── profile.tsx          # Perfil do usuário
│   │   ├── meus-agendamentos.tsx # Lista de agendamentos
│   │   ├── notifications.tsx    # Central de notificações
│   │   └── faq.tsx              # Perguntas frequentes
│   ├── components/              # Componentes reutilizáveis
│   │   ├── DonorCard.tsx        # Carteirinha do doador
│   │   ├── DonationHistory.tsx  # Histórico de doações
│   │   └── DonationCharts.tsx   # Gráficos de doações
│   ├── services/                # Serviços de API
│   │   ├── api.ts               # Cliente HTTP (Axios)
│   │   ├── auth.service.ts      # Autenticação
│   │   ├── agendamento.service.ts # Agendamentos HEMOSE
│   │   ├── doacao.service.ts    # Histórico de doações
│   │   └── notificacao.service.ts # Notificações
│   └── contexts/
│       └── AuthContext.tsx      # Contexto de autenticação
│
├── backend/                     # API Node.js
│   ├── src/
│   │   ├── modules/             # Módulos da aplicação
│   │   │   ├── auth/            # Autenticação (JWT + OAuth)
│   │   │   ├── usuarios/        # Gestão de usuários
│   │   │   ├── agendamentos/    # Proxy API HEMOSE
│   │   │   ├── doacoes/         # Histórico de doações
│   │   │   ├── bancodesangue/   # Estoque de sangue
│   │   │   ├── campanhas/       # Campanhas de doação
│   │   │   ├── feed/            # Posts e notícias
│   │   │   └── notificacoes/    # Push notifications
│   │   ├── jobs/                # Cron jobs
│   │   │   ├── estoque-cron.js  # Atualização de estoque
│   │   │   └── reativacao-doadores-cron.js
│   │   └── config/
│   │       ├── data-source.js   # Configuração TypeORM
│   │       ├── redis.js         # Configuração Redis
│   │       └── firebase.js      # Firebase Admin
│   └── docker-compose.yml       # Containers Docker
```

---

## ⚙️ Configuração do Ambiente

### Pré-requisitos
- Node.js 18+
- Docker e Docker Compose
- Expo CLI (`npm install -g expo-cli`)
- Android Studio (para emulador) ou dispositivo físico

### 1. Clone o repositório
```bash
git clone https://github.com/talists/fsph-app.git
cd fsph-app
```

### 2. Configure o Backend

```bash
cd backend

# Crie o arquivo .env baseado no exemplo
cp .env.example .env

# Configure as variáveis de ambiente:
# - DATABASE_URL
# - REDIS_URL
# - JWT_SECRET
# - CLOUDFLARE_* (para upload de imagens)
# - FIREBASE_* (para push notifications)

# Inicie os containers
docker compose up -d

# O backend estará disponível em http://localhost:3334/api
```

### 3. Configure o Frontend

```bash
cd frontend

# Instale as dependências
npm install

# Crie o arquivo .env
echo "EXPO_PUBLIC_API_URL=http://SEU_IP_LOCAL:3334/api" > .env

# Inicie o Expo
npx expo start
```

### 4. Execute no dispositivo
- **Emulador Android**: Pressione `a` no terminal
- **Dispositivo físico**: Escaneie o QR Code com o app Expo Go

---

## 🎯 Funcionalidades Implementadas

### ✅ Autenticação
- [x] Login com email/senha
- [x] Login com Google OAuth
- [x] Cadastro de novos usuários
- [x] JWT com refresh token
- [x] Persistência de sessão

### ✅ Perfil do Usuário
- [x] Visualização e edição de dados
- [x] Upload de foto de perfil
- [x] Carteirinha digital do doador
- [x] Alteração de senha

### ✅ Agendamento de Doações
- [x] Integração com API HEMOSE
- [x] Seleção de cidade, local, data e horário
- [x] Visualização de agendamentos ativos
- [x] Cancelamento de agendamentos
- [x] Cache com Redis para performance

### ✅ Estoque de Sangue
- [x] Visualização em tempo real (API FSPH)
- [x] Indicadores visuais (Crítico/Alerta/Ideal)
- [x] Atualização automática a cada 30 minutos

### ✅ Notificações
- [x] Central de notificações in-app
- [x] Notificações locais de alerta de estoque
- [x] Lembretes de agendamento
- [x] Notificações de campanhas

### ✅ Feed de Notícias
- [x] Posts com imagens
- [x] Sistema de likes
- [x] Compartilhamento

### ✅ Campanhas (Falta API OFICIAL)
- [x] Listagem de campanhas ativas
- [x] Detalhes e participação

### ✅ FAQ
- [x] Perguntas frequentes sobre doação
- [x] Informações sobre elegibilidade

---

## 👥 Equipe

Desenvolvido por estudantes da Universidade Tiradente (UNIT) em parceria com a FSPH/HEMOSE.

UI/UX: Laiza, Lauro, Larissa

Front - React Native: Emily, Bernardo, João, Larissa, Lauro 

Back - Node.js: Talita, Erick, Lauro, Larissa

BD - MySQL: Laiza, Talita, William, Larissa

---
