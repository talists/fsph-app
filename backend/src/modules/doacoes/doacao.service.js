// src/modules/doacoes/doacao.service.js

import { DoacaoRepository } from "./repositories/doacoes.repository.js";
import { UsuarioRepository } from "../usuarios/repositories/usuario.repository.js";
import { redisClient } from "../../config/redis.js";

export class DoacaoService {
  static async create(data) {
    const novaDoacao = await DoacaoRepository.create(data);

    if (novaDoacao.usuario?.id) {
      const usuario = await UsuarioRepository.findById(novaDoacao.usuario.id);
      if (!usuario) throw new Error("Usuário não encontrado");

      const sexo = usuario.sexo?.toLowerCase();

      let diasDeEspera;
      let mensagemAptidao;

      //  Define intervalo de acordo com o sexo informado
      if (sexo === "masculino") {
        diasDeEspera = 60;
        mensagemAptidao = "Homens devem aguardar 60 dias entre as doações.";
      } else if (sexo === "feminino") {
        diasDeEspera = 90;
        mensagemAptidao = "Mulheres devem aguardar 90 dias entre as doações.";
      } else {
        // Caso o campo "sexo" não esteja preenchido ou tenha outro valor
        diasDeEspera = 75; // valor médio apenas como recomendação
        mensagemAptidao = "Recomendamos um intervalo de cerca de 75 dias entre doações até que o perfil esteja completo.";
      }

      // Calcula data da próxima doação
      const dataProximaDoacao = new Date(novaDoacao.data_doacao);
      dataProximaDoacao.setDate(dataProximaDoacao.getDate() + diasDeEspera);

      // Atualiza perfil do usuário
      await UsuarioRepository.update(usuario.id, {
        data_ultima_doacao: novaDoacao.data_doacao,
        data_proxima_doacao: dataProximaDoacao,
        esta_apto_para_doar: false,
      });

      // Limpa cache
      await redisClient.del(`usuario_${usuario.id}`);

      // Salva no Redis o tempo até a reativação automática (opcional)
      await redisClient.set(
        `reliberacao_usuario_${usuario.id}`,
        JSON.stringify({ data_proxima_doacao: dataProximaDoacao }),
        { EX: diasDeEspera * 24 * 60 * 60 }
      );

      // Retorna a nova doação com uma mensagem amigável
      return {
        ...novaDoacao,
        mensagem: `Doação registrada com sucesso. ${mensagemAptidao}`,
        proxima_data: dataProximaDoacao,
      };
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

  static async verificarAptidao(usuarioId) {
    const usuario = await UsuarioRepository.findById(usuarioId);
    if (!usuario) throw new Error("Usuário não encontrado");

    const hoje = new Date();
    const proxima = new Date(usuario.data_proxima_doacao);

    if (!usuario.data_proxima_doacao || hoje >= proxima) {
      await UsuarioRepository.update(usuarioId, { esta_apto_para_doar: true });
      await redisClient.del(`usuario_${usuarioId}`);
      return { apto: true, mensagem: "Usuário já pode doar novamente." };
    }

    const diasRestantes = Math.ceil((proxima - hoje) / (1000 * 60 * 60 * 24));
    return { apto: false, mensagem: `Faltam ${diasRestantes} dias para a próxima doação.` };
  }
}