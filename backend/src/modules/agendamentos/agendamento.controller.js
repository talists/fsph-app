// src/modules/agendamento/agendamento.controller.js
import { AgendamentoService } from "./agendamento.service.js";
import { PreTriagemService } from "../pretriagem/pretriagem.service.js";

export const AgendamentoController = {
  getById: async (req, res) => {
    try {
      const ag = await AgendamentoService.getById(req.params.id);
      if (!ag)
        return res.status(404).json({ msg: "Agendamento não encontrado" });
      res.json(ag);
    } catch (err) {
      res.status(500).json({ msg: err.message });
    }
  },

  getAll: async (_, res) => {
    try {
      res.json(await AgendamentoService.getAll());
    } catch (err) {
      res.status(500).json({ msg: err.message });
    }
  },

  getByUsuario: async (req, res) => {
    try {
      res.json(await AgendamentoService.getByUsuario(req.user.id));
    } catch (err) {
      res.status(500).json({ msg: err.message });
    }
  },

  update: async (req, res) => {
    try {
      res.json(await AgendamentoService.update(req.params.id, req.body));
    } catch (err) {
      res.status(400).json({ msg: err.message });
    }
  },

  remove: async (req, res) => {
    try {
      res.json(await AgendamentoService.remove(req.params.id));
    } catch (err) {
      res.status(400).json({ msg: err.message });
    }
  },

  // pre-triagem
  getPerguntasPreTriagem: async (_, res) => {
    try {
      res.json(await PreTriagemService.getPerguntas());
    } catch (err) {
      res.status(500).json({ msg: err.message });
    }
  },

  // FSPH

  getInfoDoadorFSPH: async (req, res) => {
    try {
      res.json(await AgendamentoService.getInfoDoadorFSPH(req.params.cpf));
    } catch (err) {
      res.status(500).json({ msg: err.message });
    }
  },

  getAgendamentosFSPH: async (req, res) => {
    try {
      res.json(await AgendamentoService.getAgendamentosFSPH(req.params.cpf));
    } catch (err) {
      res.status(500).json({ msg: err.message });
    }
  },

  marcarAgendamento: async (req, res) => {
    try {
      // Verificação de pré-triagem é opcional, não bloqueia o agendamento
      const payload = { ...req.body, usuario: { id: req.user.id } };
      const result = await AgendamentoService.marcarAgendamento(
        payload,
        req.file
      );
      res.status(201).json(result);
    } catch (err) {
      res.status(400).json({ msg: err.message });
    }
  },

  listarCidades: async (req, res) => {
    try {
      res.json(
        await AgendamentoService.listarCidades(
          req.params.perm_individual,
          req.params.perm_medula,
          req.params.perm_campanha
        )
      );
    } catch (err) {
      res.status(500).json({ msg: err.message });
    }
  },

  listarLocais: async (req, res) => {
    try {
      res.json(
        await AgendamentoService.listarLocais(
          req.params.id_cidade,
          req.params.perm_individual,
          req.params.perm_medula,
          req.params.perm_campanha
        )
      );
    } catch (err) {
      res.status(500).json({ msg: err.message });
    }
  },

  listarBlocosByLocal: async (req, res) => {
    try {
      res.json(
        await AgendamentoService.listarBlocosByLocal(
          req.params.id_local,
          req.params.perm_individual,
          req.params.perm_medula,
          req.params.perm_campanha
        )
      );
    } catch (err) {
      res.status(500).json({ msg: err.message });
    }
  },

  listarBlocosByDate: async (req, res) => {
    try {
      res.json(
        await AgendamentoService.listarBlocosByDate(
          req.params.dateSelected,
          req.params.id_local,
          req.params.perm_individual,
          req.params.perm_medula,
          req.params.perm_campanha
        )
      );
    } catch (err) {
      res.status(500).json({ msg: err.message });
    }
  },

  desmarcarAgendamentoFSPH: async (req, res) => {
    try {
      const result = await AgendamentoService.desmarcarAgendamentoFSPH(req.params.protocolo);
      res.json(result);
    } catch (err) {
      res.status(400).json({ msg: err.message });
    }
  },
};
