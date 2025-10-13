// src/modules/doacoes/repositories/doacao.repository.js

import AppDataSource from "../../../config/data-source.js";
import { Doacao } from "../doacao.model.js";

const doacaoRepo = AppDataSource.getRepository(Doacao);

export class DoacaoRepository {
  static async create(data) {
    const novaDoacao = doacaoRepo.create(data);
    return await doacaoRepo.save(novaDoacao);
  }

  static async findAll() {
    return await doacaoRepo.find({
      relations: ["usuario", "posto_coleta"],
    });
  }
  
  static async findById(id) {
    return await doacaoRepo.findOne({
      where: { id },
      relations: ["usuario", "posto_coleta"],
    });
  }

  static async findByUsuarioId(usuarioId) {
    return await doacaoRepo.find({
      where: { usuario: { id: usuarioId } },
      relations: ["posto_coleta"], // Não precisa carregar o próprio usuário
      order: { data_doacao: "DESC" },
    });
  }

  static async delete(id) {
    return await doacaoRepo.delete(id);
  }
}