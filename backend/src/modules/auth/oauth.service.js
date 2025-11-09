// src/modules/auth/oauth.service.js

import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import AppDataSource from "../../config/data-source.js";
import { Usuario } from "../usuarios/usuario.model.js";
import { redisClient } from "../../config/redis.js";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const usuarioRepo = AppDataSource.getRepository(Usuario);
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

export const OAuthService = {
  async getUserFromProvider(provider, idToken) {
    if (provider === "google") {
      console.log("🔍 [OAUTH] Verificando token do Google...");

      try {
        const ticket = await client.verifyIdToken({
          idToken: idToken,
          audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();

        console.log("✅ [OAUTH] Token válido! Usuário:", payload.email);

        return {
          id_google: payload.sub,
          nome: payload.name,
          email: payload.email,
          url_foto_perfil: payload.picture,
        };
      } catch (error) {
        console.error("❌ [OAUTH] Erro ao validar token:", error.message);
        throw new Error(`Token do Google inválido: ${error.message}`);
      }
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
      user.refresh_token = await OAuthService.generateRefreshToken(user);
    } else {
      console.log("➕ [OAUTH] Usuário não existe, criando novo...");
      user = usuarioRepo.create(userData);

      await usuarioRepo.save(user);
      user.refresh_token = await OAuthService.generateRefreshToken(user);
    }

    const savedUser = await usuarioRepo.save(user);

    delete savedUser.senha;
    await redisClient.del("usuarios_all");
    await redisClient.set(
      `usuario_${savedUser.id}`,
      JSON.stringify(savedUser),
      { EX: 3600 }
    );

    return savedUser;
  },

  async generateAccessToken(user) {
    const token = jwt.sign(
      { id: user.id, tipo: user.tipo || "DOADOR" },
      JWT_SECRET,
      { expiresIn: "15m" }
    );

    await redisClient.set(`token_usuario_${user.id}`, token, { EX: 60 * 15 });

    return token;
  },

  async generateRefreshToken(user) {
    return jwt.sign({ id: user.id }, JWT_REFRESH_SECRET, { expiresIn: "30d" });
  },
};
