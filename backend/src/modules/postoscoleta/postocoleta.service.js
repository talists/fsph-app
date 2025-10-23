import { PostoColetaRepository } from "./repositories/postocoleta.repository.js";
import { redisClient } from "../../config/redis.js";

export class PostoColetaService {
  static async create(data) {
    const novoPosto = await PostoColetaRepository.create(data);
    await redisClient.del("postoscoleta_all");
    return novoPosto;
  }

  static async getAll() {
    const cacheKey = "postoscoleta_all";
    const cached = await redisClient.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    const postos = await PostoColetaRepository.findAll();
    await redisClient.set(cacheKey, JSON.stringify(postos), { EX: 3600 });

    return postos;
  }

  static async getById(id) {
    // Para um item específico, podemos buscar diretamente do banco
    // ou implementar um cache individual se necessário.
    return await PostoColetaRepository.findById(id);
  }

  static async update(id, data) {
    const postoAtualizado = await PostoColetaRepository.update(id, data);
    // Invalida o cache quando um posto é atualizado
    await redisClient.del("postoscoleta_all");
    return postoAtualizado;
  }

  static async remove(id) {
    await PostoColetaRepository.delete(id);
    // Invalida o cache quando um posto é removido
    await redisClient.del("postoscoleta_all");
    return { msg: "Posto de coleta removido com sucesso" };
  }
}