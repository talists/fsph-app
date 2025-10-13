// =======================================================================
// 1. INICIALIZAÇÃO E IMPORTS ESSENCIAIS
// =======================================================================

// Carrega as variáveis de ambiente do arquivo .env o mais cedo possível
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors"; // Para permitir requisições de outros domínios (seu frontend)
import helmet from "helmet"; 
import AppDataSource from "./src/config/data-source.js";
import "./src/config/redis.js";
import "./src/config/firebase.js";
import "./src/jobs/estoque-cron.js";
import "./src/jobs/reativacao-doadores-cron.js";

// Importando as routes de cada módulo
import usuarioRoutes from "./src/modules/usuarios/usuario.routes.js";
import authRoutes from "./src/modules/auth/auth.routes.js";
import oauthRoutes from "./src/modules/auth/oauth.routes.js";
import pretriagemRoutes from "./src/modules/pretriagem/pretriagem.routes.js";
import bancoDeSangueRoutes from "./src/modules/bancodesangue/bancodesangue.routes.js";
import notificacoesRoutes from "./src/modules/notificacoes/notificacoes.routes.js";
import agendamentoRoutes from "./src/modules/agendamentos/agendamento.routes.js";
import feedRoutes from "./src/modules/feed/feed.routes.js";
import campanhaRoutes from "./src/modules/campanhas/campanha.routes.js";
import doacaoRoutes from "./src/modules/doacoes/doacao.routes.js";
import postoColetaRoutes from "./src/modules/postoscoleta/postocoleta.routes.js";


// =======================================================================
// 2. CONFIGURAÇÃO DO EXPRESS
// =======================================================================

const app = express();

// Middlewares essenciais
app.use(cors()); // Habilita o CORS para todas as rotas
app.use(helmet()); // Adiciona cabeçalhos de segurança
app.use(express.json()); // Habilita o parsing de JSON no corpo das requisições

// =======================================================================
// 3. REGISTRO DAS ROTAS DA API
// =======================================================================

// Monta cada roteador de módulo em um caminho base da API
app.use("/api/usuarios", usuarioRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/oauth", oauthRoutes);
app.use("/api/pretriagem", pretriagemRoutes);
app.use("/api/bancodesangue", bancoDeSangueRoutes);
app.use("/api/notificacoes", notificacoesRoutes);
app.use("/api/agendamentos", agendamentoRoutes);
app.use("/api/feed", feedRoutes);
app.use("/api/campanhas", campanhaRoutes);
app.use("/api/doacoes", doacaoRoutes);
app.use("/api/postoscoleta", postoColetaRoutes);

// Rota de "health check" para verificar se a API está no ar
app.get("/api", (_, res) => {
  res.json({ message: "API Gota a Gota está funcionando!" });
});

// =======================================================================
// 4. INICIALIZAÇÃO DO SERVIDOR
// =======================================================================

const PORT = process.env.PORT || 3333;

// Inicializa a conexão com o banco de dados ANTES de iniciar o servidor Express
AppDataSource.initialize()
  .then(() => {
    console.log("✅ Conexão com o banco de dados estabelecida com sucesso.");

    // Inicia o servidor Express para ouvir as requisições
    app.listen(PORT, () => {
      console.log(`✅ O Servidor rodando na porta: ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("❌ Erro ao conectar com o banco de dados:", error);
  });