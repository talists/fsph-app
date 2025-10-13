//campanha.controller.js
import { CampanhaService } from "./campanha.service.js";

export class CampanhaController {
  static async create(req, res) {
    try {
      const data = { ...req.body, organizador: { id: req.user.id } };
      const campanha = await CampanhaService.create(data);
      res.status(201).json(campanha);
    } catch (err) {
      res.status(400).json({ msg: err.message });
    }
  }

  static async getAll(_, res) {
    try {
      const campanhas = await CampanhaService.getAll();
      res.json(campanhas);
    } catch (err) {
      res.status(500).json({ msg: err.message });
    }
  }

  static async getById(req, res) {
    try {
      const campanha = await CampanhaService.getById(req.params.id);
      if (!campanha) return res.status(404).json({ msg: "Campanha não encontrada" });
      res.json(campanha);
    } catch (err) {
      res.status(500).json({ msg: err.message });
    }
  }

  static async getByUsuario(req, res) {
    try {
      const campanhas = await CampanhaService.getByUsuarioId(req.user.id);
      res.json(campanhas);
    } catch (err) {
      res.status(500).json({ msg: err.message });
    }
  }

  static async update(req, res) {
    try {
      const campanha = await CampanhaService.update(req.params.id, req.body);
      res.json(campanha);
    } catch (err) {
      res.status(400).json({ msg: err.message });
    }
  }

  static async remove(req, res) {
    try {
      const result = await CampanhaService.remove(req.params.id);
      res.json(result);
    } catch (err) {
      res.status(400).json({ msg: err.message });
    }
  }
}
