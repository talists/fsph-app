// src/modules/campanhas/campanha.service.js

import { CampanhaRepository } from "./repositories/campanha.repository.js";
import { redisClient } from "../../config/redis.js";
import { NotificacoesService } from "../notificacoes/notificacoes.service.js";
import { UsuarioRepository } from "../usuarios/repositories/usuario.repository.js";

export class CampanhaService {
  
  static async create(data) {
    const campanha = await CampanhaRepository.save(data);
    
    
    await redisClient.del("campanhas_all");

    try {
      const usuariosComToken = await UsuarioRepository.findAllComFcmToken();
      
      if (usuariosComToken.length > 0) {
        const tokens = usuariosComToken.map(u => u.fcm_token);
        await NotificacoesService.enviarNotificacoes(
          tokens,
          "🩸 Nova Campanha de Doação!",
          `Uma nova campanha chamada "${campanha.nome}" foi criada. Participe!`
        );
      }
    } catch (err) {
      console.error("Falha ao enviar notificação de nova campanha:", err);
    }

    return campanha;
  }

  static async getAll() {
    const cacheKey = "campanhas_all";
    const cached = await redisClient.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const campanhas = await CampanhaRepository.findAll();

    
    await redisClient.set(cacheKey, JSON.stringify(campanhas), { EX: 300 }); // 5 minutos
    
    return campanhas;
  }

  static async getById(id) {
    return await CampanhaRepository.findById(id);
  }

  static async getByUsuarioId(usuarioId) {
    return await CampanhaRepository.findByUsuarioId(usuarioId);
  }

  static async update(id, data) {
    const campanhaAtualizada = await CampanhaRepository.update(id, data);
    
    await redisClient.del("campanhas_all");
    
    return campanhaAtualizada;
  }

  static async remove(id) {
    await CampanhaRepository.delete(id);

    await redisClient.del("campanhas_all");
    
    return { msg: "Campanha deletada" };
  }
}