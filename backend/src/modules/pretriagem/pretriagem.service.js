// src/modules/pretriagem/pretriagem.service.js

import { PreTriagemRepository } from "./repositories/pretriagem.repository.js";
import { UsuarioRepository } from "../usuarios/repositories/usuario.repository.js";
import { redisClient } from "../../config/redis.js";

const PERGUNTAS = [
  { id: 1, pergunta: "Você está se sentindo bem e saudável hoje?", tipo: "sim_nao" },
  { id: 2, pergunta: "Teve febre ou alguma doença infecciosa (gripe, resfriado) nos últimos 15 dias?", tipo: "sim_nao" },
  { id: 3, pergunta: "Está tomando algum medicamento de uso contínuo ou tomou antibióticos nos últimos 15 dias?", tipo: "sim_nao" },
  { id: 4, pergunta: "Você tem mais de 50kg?", tipo: "sim_nao" },
  // ainda faltam adicionar as outras perguntas
];

export class PreTriagemService {
  static async getPerguntas() {
    const cache = await redisClient.get("perguntas_pretriagem");
    if (cache) return JSON.parse(cache);
    
    await redisClient.set("perguntas_pretriagem", JSON.stringify(PERGUNTAS), { EX: 3600 });
    
    return PERGUNTAS;
  }

  static async salvarRespostas(usuarioId, respostas) {
    if (!respostas || respostas.length !== PERGUNTAS.length) {
      throw new Error("Respostas incompletas ou inválidas");
    }

    const regrasDeReprovacao = [
      { perguntaId: 1, respostaReprova: "não" }, // Não está saudável -> Reprova
      { perguntaId: 2, respostaReprova: "sim" }, // Teve febre/infecção -> Reprova
      { perguntaId: 3, respostaReprova: "sim" }, // Toma medicamento -> Reprova (simplificado)
      { perguntaId: 4, respostaReprova: "não" }, // Tem menos de 50kg -> Reprova
    ];

    let aprovado = true;
    for (const regra of regrasDeReprovacao) {
      const respostaDoUsuario = respostas[regra.perguntaId - 1];
      if (respostaDoUsuario === regra.respostaReprova) {
        aprovado = false;
        break; 
      }
    }

    const registroData = {
      usuario: { id: usuarioId },
      respostas,
      foi_preliminarmente_aprovado: aprovado,
    };
    const registro = await PreTriagemRepository.save(registroData);

    await UsuarioRepository.update(usuarioId, { esta_apto_para_doar: aprovado });
    
    await redisClient.del(`usuario_${usuarioId}`);
    await redisClient.del("usuarios_all");

    return registro;
  }

  static async verificarPreTriagem(usuarioId) {

    const cache = await redisClient.get(`usuario_${usuarioId}`);
    if (cache) return JSON.parse(cache).esta_apto_para_doar;

    const usuario = await UsuarioRepository.findById(usuarioId);
    return usuario?.esta_apto_para_doar || false;
  }

  static async historico(usuarioId) {
    return await PreTriagemRepository.findByUsuario(usuarioId);
  }
}