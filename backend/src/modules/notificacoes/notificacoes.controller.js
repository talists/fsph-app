// src/modules/notificacoes/notificacoes.controller.js
import { NotificacoesService } from "./notificacoes.service.js";

export class NotificacoesController {
  static async enviarParaUsuario(req, res) {
    try {
      await NotificacoesService.enviarParaUsuarioPorId(req.body.idUsuario, req.body.titulo, req.body.corpo);
      res.status(200).json({ msg: "Notificação enviada com sucesso" });
    } catch (err) {
      res.status(err.statusCode || 500).json({ msg: err.message });
    }
  }

  static async enviarParaGrupo(req, res) {
    try {
      await NotificacoesService.enviarParaGrupoSanguineo(req.body);
      res.status(200).json({ msg: `Notificações enviadas para o grupo` });
    } catch (err) {
      res.status(err.statusCode || 500).json({ msg: err.message });
    }
  }

  static async enviarGeral(req, res) {
    try {
      const { tokens, titulo, corpo } = req.body;
      // O service já tem o método genérico perfeito para isso
      await NotificacoesService.enviarNotificacoes(tokens, titulo, corpo);
      res.status(200).json({ msg: "Notificações gerais enviadas com sucesso" });
    } catch (err) {
      res.status(err.statusCode || 500).json({ msg: err.message });
    }
  }
}