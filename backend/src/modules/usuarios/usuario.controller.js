//usuario.controller.js
import { UsuarioService } from "./usuario.service.js";

export class UsuarioController {
  static async register(req, res) {
    try {
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("🎯 [CONTROLLER] Iniciando registro...");
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

      const result = await UsuarioService.register(req.body, req.file);

      console.log("✅ [CONTROLLER] Registro bem-sucedido!");
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

      res.status(201).json(result);
    } catch (err) {
      console.error("❌ [CONTROLLER] Erro no registro:", err.message);
      console.error("Stack:", err.stack);
      res.status(400).json({ msg: err.message });
    }
  }

  static async getAll(_, res) {
    try {
      res.json(await UsuarioService.getAll());
    } catch (err) {
      res.status(500).json({ msg: err.message });
    }
  }

  static async getById(req, res) {
    try {
      res.json(await UsuarioService.getById(req.params.id));
    } catch (err) {
      res.status(404).json({ msg: err.message });
    }
  }

  static async getMeuPerfil(req, res) {
    try {
      const usuario = await UsuarioService.getById(req.user.id);

      if (!usuario) {
        return res.status(404).json({ msg: "Usuário não encontrado" });
      }
      res.json(usuario);
    } catch (err) {
      res.status(500).json({ msg: err.message });
    }
  }

  static async update(req, res) {
    try {
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("🎯 [CONTROLLER] Atualizando usuário...");
      console.log("🆔 ID:", req.params.id);
      console.log("📦 Body recebido:", JSON.stringify(req.body, null, 2));
      console.log("📁 File:", req.file ? req.file.filename : "Sem arquivo");
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

      const result = await UsuarioService.update(req.params.id, req.body, req.file);

      console.log("✅ [CONTROLLER] Atualização bem-sucedida!");
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

      res.json(result);
    } catch (err) {
      console.error("❌ [CONTROLLER] Erro ao atualizar:", err.message);
      console.error("Stack:", err.stack);
      res.status(400).json({ msg: err.message });
    }
  }

  static async delete(req, res) {
    try {
      res.json(await UsuarioService.delete(req.params.id));
    } catch (err) {
      res.status(400).json({ msg: err.message });
    }
  }

  /**
   * Atualiza o token FCM do usuário logado
   * @route PUT /api/usuarios/fcm-token
   */
  static async atualizarFcmToken(req, res) {
    try {
      const { fcm_token } = req.body;
      await UsuarioService.update(req.user.id, { fcm_token });
      res.status(200).json({ msg: "Token de notificação atualizado com sucesso" });
    } catch (err) {
      res.status(400).json({ msg: err.message });
    }
  }
}