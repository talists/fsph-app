// src/modules/auth/auth.repository.js
import   AppDataSource   from "../../../config/data-source.js";
import { Usuario } from "../../usuarios/usuario.model.js";

const repo = AppDataSource.getRepository(Usuario);

export class AuthRepository {
  static async findByEmail(email) {
    return await repo.findOne({ where: { email } });
  }

  static async findById(id) {
    return await repo.findOne({ where: { id } });
  }

  static async create(data) {
    const user = repo.create(data);
    return await repo.save(user);
  }

  static async update(id, data) {
    return await repo.update(id, data);
  }

  static async updateSenha(id, novaSenha) {
    return await repo.update(id, { senha: novaSenha });
  }
}
