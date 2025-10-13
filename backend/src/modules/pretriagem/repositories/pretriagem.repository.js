// src/modules/pretriagem/pretriagem.repository.js
import   AppDataSource   from "../../../config/data-source.js";
import { RespostasPreTriagem } from "../pretriagem.model.js";

const preTriagemRepo = AppDataSource.getRepository(RespostasPreTriagem);

export class PreTriagemRepository {
  static async save(resposta) {
    return await preTriagemRepo.save(resposta);
  }

  static async findByUsuario(idUsuario) {
    return await preTriagemRepo.find({
      where: {
        usuario: { id: idUsuario },
      },
      order: { criado_em: "DESC" },
    });
  }
}