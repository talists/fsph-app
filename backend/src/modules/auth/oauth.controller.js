// src/modules/auth/oauth.controller.js
import { OAuthService } from "./oauth.service.js";

export const OAuthController = {
  loginWithProvider: async (req, res) => {
    try {
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("📥 [OAUTH] POST /api/oauth/login");
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("📦 Body recebido:", req.body);

      const { provider, id_token } = req.body;

      if (!provider || !id_token) {
        return res.status(400).json({
          msg: "Provider e id_token são obrigatórios",
        });
      }

      // 1. Valida o token com o provedor (Google)
      const userData = await OAuthService.getUserFromProvider(
        provider,
        id_token
      );

      // 2. Cria ou atualiza o usuário no banco
      const usuario = await OAuthService.createOrUpdateUser(userData);

      // 3. Gera o JWT do nosso sistema
      const accessToken = await OAuthService.generateAccessToken(usuario);
      const refreshToken = usuario.refresh_token; // já salvo

      res.status(200).json({
        accessToken,
        refreshToken,
        usuario: {
          id: usuario.id,
          nome: usuario.nome,
          email: usuario.email,
          tipo_sanguineo: usuario.tipo_sanguineo,
          url_foto_perfil: usuario.url_foto_perfil,
        },
      });
    } catch (err) {
      console.error("❌ [OAUTH] Erro:", err.message);

      if (err.message === "Provider não suportado") {
        return res.status(400).json({ msg: err.message });
      }

      res.status(500).json({
        msg: "Erro no login OAuth",
        error: err.message,
      });
    }
  },
};
