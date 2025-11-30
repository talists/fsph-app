// src/modules/agendamento/agendamento.service.js
import { AgendamentoRepository } from "./repositories/agendamento.repository.js";
import { ExternalAgendamentoRepository } from "./repositories/external-agendamentos.repository.js";
import FormData from "form-data";
import { redisClient } from "../../config/redis.js";
import { uploadToCloudflare } from "../../utils/cloudflare.js";

export class AgendamentoService {

  static async getById(id) {
    const key = `agendamento_${id}`;
    const cached = await redisClient.get(key);
    if (cached) return JSON.parse(cached);
    const agendamento = await AgendamentoRepository.findById(id);
    if (agendamento) await redisClient.set(key, JSON.stringify(agendamento), "EX", 3600);
    return agendamento;
  }

  static async getAll() {
    const key = "agendamentos_all";
    const cached = await redisClient.get(key);
    if (cached) return JSON.parse(cached);
    const agendamentos = await AgendamentoRepository.findAll();
    await redisClient.set(key, JSON.stringify(agendamentos), "EX", 300); // Tempo de cache menor para listas gerais
    return agendamentos;
  }

  static async getByUsuario(usuarioId) {
    const key = `agendamentos_usuario_${usuarioId}`;
    const cached = await redisClient.get(key);
    if (cached) return JSON.parse(cached);
    const agendamentos = await AgendamentoRepository.findByUsuarioId(usuarioId);
    await redisClient.set(key, JSON.stringify(agendamentos), "EX", 3600);
    return agendamentos;
  }

  static async update(id, data) {
    const agendamentoAtualizado = await AgendamentoRepository.update(id, data);
    await redisClient.del(`agendamento_${id}`);
    await redisClient.del("agendamentos_all");

    // CORREÇÃO: Usando o objeto retornado (agAtualizado) que contém as relações carregadas
    if (agendamentoAtualizado?.usuario?.id) {
      await redisClient.del(`agendamentos_usuario_${agendamentoAtualizado.usuario.id}`);
    }
    return agendamentoAtualizado;
  }

  static async remove(id) {
    const agendamento = await AgendamentoRepository.findById(id);
    if (!agendamento) throw new Error("Agendamento não encontrado");

    // CORREÇÃO: Chamando o método correto do repositório
    await AgendamentoRepository.remove(id);

    await redisClient.del(`agendamento_${id}`);
    await redisClient.del("agendamentos_all");

    if (agendamento.usuario?.id) {
      await redisClient.del(`agendamentos_usuario_${agendamento.usuario.id}`);
    }
    return { msg: "Agendamento removido com sucesso" };
  }

  // FSPH wrappers (caching for reads)
  static async getInfoDoadorFSPH(cpf) {
    const key = `fsph_doador_${cpf}`;
    const cached = await redisClient.get(key);
    if (cached) return JSON.parse(cached);
    const data = await ExternalAgendamentoRepository.getInfoDoador(cpf);
    await redisClient.set(key, JSON.stringify(data), "EX", 3600);
    return data;
  }

  static async getAgendamentosFSPH(cpf) {
    const key = `fsph_agendamentos_${cpf}`;
    const cached = await redisClient.get(key);
    if (cached) {
      console.log(`🔍 [AGENDAMENTOS] Cache encontrado para CPF ${cpf}`);
      console.log(`📦 [AGENDAMENTOS] Dados do cache:`, JSON.stringify(JSON.parse(cached), null, 2));
      return JSON.parse(cached);
    }
    console.log(`🔍 [AGENDAMENTOS] Buscando na API HEMOSE para CPF ${cpf}...`);
    const data = await ExternalAgendamentoRepository.getAgendamentosDoador(cpf);
    console.log(`📦 [AGENDAMENTOS] Dados recebidos da HEMOSE:`, JSON.stringify(data, null, 2));
    await redisClient.set(key, JSON.stringify(data), "EX", 3600);
    return data;
  }

  static async listarCidades(perm_individual, perm_medula, perm_campanha) {
    return await ExternalAgendamentoRepository.listarCidades(perm_individual, perm_medula, perm_campanha);
  }

  static async listarLocais(id_cidade, perm_individual, perm_medula, perm_campanha) {
    return await ExternalAgendamentoRepository.listarLocais(id_cidade, perm_individual, perm_medula, perm_campanha);
  }

  static async listarBlocosByLocal(id_local, perm_individual, perm_medula, perm_campanha) {
    return await ExternalAgendamentoRepository.listarBlocosByLocal(id_local, perm_individual, perm_medula, perm_campanha);
  }

  static async listarBlocosByDate(dateSelected, id_local, perm_individual, perm_medula, perm_campanha) {
    return await ExternalAgendamentoRepository.listarBlocosByDate(dateSelected, id_local, perm_individual, perm_medula, perm_campanha);
  }

  static async marcarAgendamento(body, arquivo) {
    // Upload do arquivo se necessário
    if (arquivo) {
      const url = await uploadToCloudflare(arquivo);
      body.caminho_autorizacao = url;
    }

    // Montagem do FormData para a API externa da HEMOSE
    const form = new FormData();
    Object.entries(body).forEach(([k, v]) => {
      if (typeof v === "object") form.append(k, JSON.stringify(v));
      else form.append(k, v ?? "");
    });

    try {
      // Chamada à API externa da HEMOSE (apenas proxy, sem salvar localmente)
      const response = await ExternalAgendamentoRepository.marcarAgendamento(form, form.getHeaders());
      console.log("✅ Agendamento realizado com sucesso na API HEMOSE");
      return response;
    } catch (apiError) {
      // Retorna a mensagem de erro da API HEMOSE para o frontend
      const errorMsg = apiError.response?.data?.msg || apiError.message || "Erro ao marcar agendamento";
      console.error("❌ Erro na API HEMOSE:", errorMsg);
      throw new Error(errorMsg);
    }
  }

  static async desmarcarAgendamentoFSPH(protocolo) {
    try {
      console.log(`🚫 [CANCELAR] Cancelando agendamento com protocolo ${protocolo}...`);
      const response = await ExternalAgendamentoRepository.desmarcarAgendamento(protocolo);
      console.log(`✅ [CANCELAR] Agendamento ${protocolo} cancelado com sucesso`);

      // Limpar cache de agendamentos (todos os CPFs)
      const keys = await redisClient.keys('fsph_agendamentos_*');
      if (keys.length > 0) {
        await Promise.all(keys.map(key => redisClient.del(key)));
        console.log(`🗑️ [CACHE] ${keys.length} caches de agendamentos limpos`);
      }

      return response;
    } catch (apiError) {
      const errorMsg = apiError.response?.data?.msg || apiError.message || "Erro ao cancelar agendamento";
      console.error("❌ Erro ao cancelar na API HEMOSE:", errorMsg);
      throw new Error(errorMsg);
    }
  }
}
