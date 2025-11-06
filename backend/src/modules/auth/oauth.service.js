// src/modules/auth/oauth.service.js

import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import AppDataSource from "../../config/data-source.js";
import { Usuario } from "../usuarios/usuario.model.js";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const usuarioRepo = AppDataSource.getRepository(Usuario);
const JWT_SECRET = process.env.JWT_SECRET || "segredo_super_secreto";

export const OAuthService = {
  async getUserFromProvider(provider, idToken) {
    if (provider === "google") {
      console.log("🔍 [OAUTH] Verificando token do Google...");

      // 1. Verifica a autenticidade do id_token usando a biblioteca do Google
      const ticket = await client.verifyIdToken({
        idToken: idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      // 2. Se a verificação for bem-sucedida, o payload contém as informações do usuário
      const payload = ticket.getPayload();

      console.log("✅ [OAUTH] Token válido! Usuário:", payload.email);

      // 3. Mapeia os dados do Google para o formato do seu banco de dados
      return {
        id_google: payload.sub,
        nome: payload.name,
        email: payload.email,
        url_foto_perfil: payload.picture,
      };
    }

    throw new Error("Provider não suportado");
  },

  async createOrUpdateUser(userData) {
    console.log("🔍 [OAUTH] Procurando usuário no banco...");

    let user = await usuarioRepo.findOne({
      where: [{ id_google: userData.id_google }, { email: userData.email }],
    });

    if (user) {
      console.log("✅ [OAUTH] Usuário encontrado, atualizando dados...");
      Object.assign(user, userData);
    } else {
      console.log("➕ [OAUTH] Usuário não existe, criando novo...");
      user = usuarioRepo.create(userData);
    }

    // 🔥 GERA refreshToken e salva
    user.refresh_token = await OAuthService.generateRefreshToken(user);

    const savedUser = await usuarioRepo.save(user);

    delete savedUser.senha;
    return savedUser;
  },

  async generateAccessToken(user) {
    return jwt.sign(
      { id: user.id, tipo: user.tipo || "DOADOR" },
      process.env.JWT_SECRET,
      { expiresIn: "15m" } // recomendado
    );
  },

  async generateRefreshToken(user) {
    return jwt.sign({ id: user.id }, process.env.JWT_REFRESH_SECRET, {
      expiresIn: "30d",
    });
  },
};
