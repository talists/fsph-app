// src/modules/pretriagem/pretriagem.controller.js
import { PreTriagemService } from "./pretriagem.service.js";

export class PreTriagemController { 
  static async getPerguntas(req, res) {
    try {
      const perguntas = await PreTriagemService.getPerguntas();
      res.json(perguntas);
    } catch (err) {
      res.status(500).json({ msg: err.message });
    }
  }

  static async salvarRespostas(req, res) {
    try {
      const resultado = await PreTriagemService.salvarRespostas(req.user.id, req.body.respostas);
      res.status(201).json(resultado);
    } catch (err) {
      res.status(400).json({ msg: err.message });
    }
  }

  static async historico(req, res) {
    try {

      const historico = await PreTriagemService.historico(req.user.id);
      res.json(historico);
    } catch (err) {
      res.status(500).json({ msg: err.message });
    }
  }
}
