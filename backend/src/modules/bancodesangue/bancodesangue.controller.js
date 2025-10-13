import { BancoDeSangueService } from "./bancodesangue.service.js";

export const BancoDeSangueController = {
  getEstoque: async (req, res) => {
    try {
      const data = await BancoDeSangueService.getEstoqueAtual();
      res.json(data);
    } catch (err) {
      res.status(500).json({ msg: "Erro ao obter estoque", error: err.message });
    }
  }
};
