// src/modules/auth/auth.controller.js
import { AuthService } from "./auth.service.js";

export const AuthController = {

  // Login tradicional (email/senha)
  login: async (req, res) => {
    try {
      const { email, senha } = req.body;
      const { accessToken, refreshToken, usuario } = await AuthService.login(email, senha);
      res.status(200).json({ accessToken, refreshToken, usuario });
    } catch (err) {
      res.status(401).json({ msg: err.message });
    }
  },

  // Esquecer a senha
  esqueciSenha: async (req, res) => {
    try {
      const { email } = req.body;
      const result = await AuthService.esqueciSenha(email);
      res.status(200).json(result);
    } catch (err) {
      res.status(500).json({ msg: err.message });
    }
  },

  // Refresh Token
  refreshToken: async (req, res) => {
    try {
      const { refreshToken } = req.body;
      const result = await AuthService.refreshToken(refreshToken);
      res.status(200).json(result);
    } catch (err) {
      res.status(401).json({ msg: err.message });
    }
  },

  // Logout - invalida o token (via Redis)
  logout: async (req, res) => {
    try {
      await AuthService.logout(req.user.id);
      res.status(200).json({ msg: "Logout realizado com sucesso" });
    } catch (err) {
      res.status(500).json({ msg: err.message });
    }
  },

  // Alteração de senha do usuário logado
  alterarSenha: async (req, res) => {
    try {
      const { senhaAtual, novaSenha } = req.body;
      await AuthService.alterarSenha(req.user.id, senhaAtual, novaSenha);
      res.status(200).json({ msg: "Senha alterada com sucesso" });
    } catch (err) {
      res.status(400).json({ msg: err.message });
    }
  },
};
