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

## 🔌 API Endpoints

### Autenticação
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/auth/login` | Login com email/senha |
| POST | `/auth/register` | Cadastro de usuário |
| POST | `/auth/google` | Login com Google |
| POST | `/auth/refresh-token` | Renovar token JWT |

### Usuários
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/usuarios/meu-perfil` | Dados do usuário logado |
| PATCH | `/usuarios/meu-perfil` | Atualizar perfil |
| POST | `/usuarios/meu-perfil/foto` | Upload foto de perfil |
| PATCH | `/usuarios/fcm-token` | Atualizar token FCM |

### Agendamentos (Proxy HEMOSE)
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/agendamentos/apiagendamento/doador/getinfo/:cpf` | Info do doador |
| GET | `/agendamentos/apiagendamento/doador/agendamentos/:cpf` | Agendamentos ativos |
| GET | `/agendamentos/apiagendamento/cidades/:perm/:perm/:perm` | Listar cidades |
| GET | `/agendamentos/apiagendamento/local/:cidade/:perm/:perm/:perm` | Listar locais |
| GET | `/agendamentos/apiagendamento/blocoagendamento/listarByDate/:data/:local/:perm/:perm/:perm` | Horários disponíveis |
| POST | `/agendamentos/apiagendamento/agendamento/marcar` | Marcar agendamento |
| DELETE | `/agendamentos/apiagendamento/agendamento/desmarcar/:protocolo` | Cancelar agendamento |

### Banco de Sangue
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/bancodesangue/estoque` | Níveis de estoque atuais |

### Doações
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/doacoes/meu-historico` | Histórico do usuário |

### Feed
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/feed` | Lista de posts |
| POST | `/feed` | Criar post (admin) |

### Notificações
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/notificacoes` | Notificações do usuário |
| PATCH | `/notificacoes/:id/lida` | Marcar como lida |

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

### ✅ Campanhas
- [x] Listagem de campanhas ativas
- [x] Detalhes e participação

### ✅ FAQ
- [x] Perguntas frequentes sobre doação
- [x] Informações sobre elegibilidade

---

## 🔧 Variáveis de Ambiente

### Backend (.env)
```env
# Banco de Dados
DB_HOST=localhost
DB_PORT=3307
DB_USER=root
DB_PASSWORD=sua_senha
DB_NAME=fsph_db

# Redis
REDIS_HOST=localhost
REDIS_PORT=6380

# JWT
JWT_SECRET=sua_chave_secreta
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=30d

# Cloudflare R2
CLOUDFLARE_ACCOUNT_ID=seu_account_id
CLOUDFLARE_ACCESS_KEY_ID=sua_access_key
CLOUDFLARE_SECRET_ACCESS_KEY=sua_secret_key
CLOUDFLARE_BUCKET_NAME=seu_bucket
CLOUDFLARE_PUBLIC_URL=https://seu-bucket.r2.dev

# Firebase (Push Notifications)
FIREBASE_PROJECT_ID=seu_projeto
FIREBASE_PRIVATE_KEY=sua_chave_privada
FIREBASE_CLIENT_EMAIL=seu_email
```

### Frontend (.env)
```env
EXPO_PUBLIC_API_URL=http://SEU_IP:3334/api
EXPO_PUBLIC_API_TIMEOUT=30000
```

---

## 👥 Equipe

Desenvolvido por estudantes do IFS (Instituto Federal de Sergipe) em parceria com a FSPH/HEMOSE.

---

## 📄 Licença

Este projeto é propriedade da **Fundação de Saúde Parreiras Horta (FSPH)** e do **Hemocentro de Sergipe (HEMOSE)**.

---

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request
