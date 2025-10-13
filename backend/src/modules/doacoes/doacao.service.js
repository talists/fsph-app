// src/modules/doacoes/doacao.service.js

import { DoacaoRepository } from "./repositories/doacoes.repository.js";
import { UsuarioRepository } from "../usuarios/repositories/usuario.repository.js";
import { redisClient } from "../../config/redis.js";

export class DoacaoService {
  static async create(data) {

    const novaDoacao = await DoacaoRepository.create(data);

    // 2. (INTEGRAÇÃO) Atualiza a data da última doação no perfil do usuário
    if (novaDoacao.usuario?.id) {
      await UsuarioRepository.update(novaDoacao.usuario.id, {
        data_ultima_doacao: novaDoacao.data_doacao,
        // Opcional: Você pode definir o usuário como inapto para doar por um período
        esta_apto_para_doar: false, 
      });

      await redisClient.del(`usuario_${novaDoacao.usuario.id}`);
    }

    return novaDoacao;
  }

  static async getAll() {
    return await DoacaoRepository.findAll();
  }
  
  static async getById(id) {
    return await DoacaoRepository.findById(id);
  }

  static async getByUsuario(usuarioId) {
    return await DoacaoRepository.findByUsuarioId(usuarioId);
  }

  static async remove(id) {
    return await DoacaoRepository.remove(id);
  }
}