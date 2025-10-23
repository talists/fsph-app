// src/modules/auth/oauth.service.js (NOVA VERSÃO)

import { OAuth2Client } from "google-auth-library"; // NOVA IMPORTAÇÃO
import jwt from "jsonwebtoken";
import  AppDataSource  from "../../config/data-source.js";
import { Usuario } from "../usuarios/usuario.model.js";

// Inicializa o cliente do Google com o ID do seu app, que deve estar no .env
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const usuarioRepo = AppDataSource.getRepository(Usuario);
const JWT_SECRET = process.env.JWT_SECRET || "segredo_super_secreto";

export const OAuthService = {

  // MÉTODO REESCRITO
  async getUserFromProvider(provider, idToken) {
    if (provider === "google") {
      // 1. Verifica a autenticidade do id_token usando a biblioteca do Google
      const ticket = await client.verifyIdToken({
          idToken: idToken,
          audience: process.env.GOOGLE_CLIENT_ID, // Garante que o token foi emitido para o seu app
      });

      // 2. Se a verificação for bem-sucedida, o payload contém as informações do usuário
      const payload = ticket.getPayload();

      // 3. Mapeia os dados do Google para o formato do seu banco de dados
      return {
        id_google: payload.sub, // 'sub' é o ID único do usuário no Google
        nome: payload.name,
        email: payload.email,
        url_foto_perfil: payload.picture,
      };
    }
    // Mantém a lógica para provedores não suportados
    throw new Error("Provider não suportado");
  },

  // ESTE MÉTODO CONTINUA O MESMO - ESTÁ PERFEITO
  async createOrUpdateUser(userData) {
    // Procura por ID do Google ou por e-mail (para vincular contas)
    let user = await usuarioRepo.findOne({
      where: [{ id_google: userData.id_google }, { email: userData.email }],
    });

    if (user) {
      // Se o usuário já existe, atualiza os dados (ex: nome ou foto)
      Object.assign(user, userData);
      return await usuarioRepo.save(user);
    }

    // Se não existe, cria um novo
    const novo = usuarioRepo.create(userData);
    return await usuarioRepo.save(novo);
  },

  // ESTE MÉTODO CONTINUA O MESMO - ESTÁ PERFEITO
  async generateJWT(user) {
    return jwt.sign(
      { id: user.id, tipo: user.tipo || "DOADOR" },
      JWT_SECRET,
      { expiresIn: "8h" }
    );
  },
};