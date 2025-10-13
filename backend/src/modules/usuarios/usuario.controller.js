//usuario.controller.js
import { UsuarioService } from "./usuario.service.js";

export class UsuarioController {
  static async register(req, res) {
    try { 
      const result = await UsuarioService.register(req.body, req.file); 
      res.status(201).json(result); 
    }
    catch (err) { 
      res.status(400).json({ msg: err.message }); 
    }
  }

  static async login(req, res) {
    try { 
      const result = await UsuarioService.login(req.body.email, req.body.password); 
      res.json(result); 
    }
    catch (err) { 
      res.status(400).json({ msg: err.message }); 
    }
  }

  static async loginWithGoogle(req, res) {
    try {
      const { token: googleToken } = req.body; // O frontend riá enviar o token do Google no corpo da requisição pro back
      const result = await UsuarioService.loginWithGoogle(googleToken);
      res.json(result);
    } catch (err) {
      res.status(401).json({ msg: err.message }); 
    }
  }

  static async getAll(_, res) {
    try { 
      res.json(await UsuarioService.getAll()); 
    }
    catch (err) { 
      res.status(500).json({ msg: err.message }); 
    }
  }

  static async getById(req, res) {
    try { 
      res.json(await UsuarioService.getById(req.params.id)); 
    }
    catch (err) { 
      res.status(404).json({ msg: err.message }); 
    }
  }

  static async update(req, res) {
    try { 
      res.json(await UsuarioService.update(req.params.id, req.body, req.file)); 
    }
    catch (err) { 
      res.status(400).json({ msg: err.message }); 
    }
  }

  static async delete(req, res) {
    try { 
      res.json(await UsuarioService.delete(req.params.id)); 
    }
    catch (err) { 
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
            // A lógica foi movida para o service!
            await UsuarioService.update(req.user.id, { fcm_token });
            res.status(200).json({ msg: "Token de notificação atualizado com sucesso" });
        } catch (err) {
            res.status(400).json({ msg: err.message });
        }
    }
}
