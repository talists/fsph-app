import { PostoColetaService } from "./postocoleta.service.js";

export class PostoColetaController {
  static async create(req, res) {
    try {
      const posto = await PostoColetaService.create(req.body);
      res.status(201).json(posto);
    } catch (err) {
      res.status(400).json({ msg: err.message });
    }
  }

  static async getAll(_, res) {
    try {
      const postos = await PostoColetaService.getAll();
      res.status(200).json(postos);
    } catch (err) {
      res.status(500).json({ msg: err.message });
    }
  }

  static async getById(req, res) {
    try {
      const posto = await PostoColetaService.getById(req.params.id);
      if (!posto) {
        return res.status(404).json({ msg: "Posto de coleta não encontrado" });
      }
      res.status(200).json(posto);
    } catch (err) {
      res.status(500).json({ msg: err.message });
    }
  }

  static async update(req, res) {
    try {
      const posto = await PostoColetaService.update(req.params.id, req.body);
      res.status(200).json(posto);
    } catch (err) {
      res.status(400).json({ msg: err.message });
    }
  }

  static async remove(req, res) {
    try {
      const result = await PostoColetaService.remove(req.params.id);
      res.status(200).json(result);
    } catch (err) {
      res.status(400).json({ msg: err.message });
    }
  }
}