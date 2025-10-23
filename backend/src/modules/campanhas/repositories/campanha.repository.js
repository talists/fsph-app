//campanha.repository.js
import  AppDataSource  from "../../../config/data-source.js";
import { Campanha } from "../campanha.model.js";

const campanhaRepo = AppDataSource.getRepository(Campanha);

export class CampanhaRepository {
  static async findAll() {
    return await campanhaRepo.find({ relations: ["organizador"] });
  }

  static async findById(id) {
    return await campanhaRepo.findOne({ where: { id }, relations: ["organizador"] });
  }

  static async findByUsuarioId(usuarioId) {
    return await campanhaRepo.find({ where: { organizador: { id: usuarioId } }, relations: ["organizador"] });
  }

  static async update(id, data) { 
    await campanhaRepo.update(id, data);
    return this.findById(id); // Retorna a campanha atualizada
  }

  static async save(campanha) {
    return await campanhaRepo.save(campanha);
  }

  static async delete(id) {
    return await campanhaRepo.delete(id);
  }
}
