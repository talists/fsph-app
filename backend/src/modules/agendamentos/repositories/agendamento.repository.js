// src/modules/agendamento/agendamento.repository.js
import AppDataSource from "../../../config/data-source.js";
import { Agendamento } from "../agendamento.model.js";

const repo = AppDataSource.getRepository(Agendamento);

export class AgendamentoRepository {
  static async create(data) {
    return await repo.save(repo.create(data));
  }

  static async findAll() {
    return await repo.find({
      relations: ["usuario"],
    });
  }

  static async findById(id) {
    return await repo.findOne({
      where: { id },
      relations: ["usuario", "posto_coleta", "campanha"],
    });
  }

  static async findByUsuarioId(usuarioId) {
    return await repo.find({
      where: { usuario: { id: usuarioId } },
      order: { dataAgendamento: "DESC" },
      relations: ["posto_coleta", "campanha"],
    });
  }

  static async update(id, data) {
    await repo.update(id, data);

    return this.findById(id);
  }

  static async remove(id) {
    return await repo.delete(id);
  }
}
