// src/modules/doacoes/doacao.controller.js

import { DoacaoService } from "./doacao.service.js";

export class DoacaoController {
  static async create(req, res) {
    try {
      const { id_usuario, id_posto_coleta, data_doacao } = req.body;
      const data = {
        usuario: { id: id_usuario },
        posto_coleta: { id: id_posto_coleta },
        data_doacao,
      };

      const doacao = await DoacaoService.create(data);
      res.status(201).json(doacao);
    } catch (err) {
      res.status(400).json({ msg: err.message });
    }
  }

  static async getAll(_, res) {
    try {
      const doacoes = await DoacaoService.getAll();
      res.status(200).json(doacoes);
    } catch (err) {
      res.status(500).json({ msg: err.message });
    }
  }

  static async getByUsuario(req, res) {
    try {
      // Pega o ID do usuário logado (via token)
      const doacoes = await DoacaoService.getByUsuario(req.user.id);
      res.status(200).json(doacoes);
    } catch (err) {
      res.status(500).json({ msg: err.message });
    }
  }

  static async remove(req, res) {
    try {
      await DoacaoService.remove(req.params.id);
      res.status(200).json({ msg: "Registro de doação removido com sucesso" });
    } catch (err) {
      res.status(400).json({ msg: err.message });
    }
  }
}