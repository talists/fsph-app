import AppDataSource from "../../../config/data-source.js";
import { PostoColeta } from "../postocoleta.model.js";

const postoColetaRepo = AppDataSource.getRepository(PostoColeta);

export class PostoColetaRepository {
  static async create(data) {
    const novoPosto = postoColetaRepo.create(data);
    return await postoColetaRepo.save(novoPosto);
  }

  static async findAll() {
    // Retorna ordenado por nome
    return await postoColetaRepo.find({
      order: { nome: "ASC" },
    });
  }

  static async findById(id) {
    return await postoColetaRepo.findOneBy({ id });
  }

  static async update(id, data) {
    await postoColetaRepo.update(id, data);
    return this.findById(id);
  }

  static async delete(id) {
    return await postoColetaRepo.delete(id);
  }
}