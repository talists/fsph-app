// src/modules/notificacoes/notificacoes.service.js

import admin from "../../config/firebase.js";
import { UsuarioRepository } from "../usuarios/repositories/usuario.repository.js";

export class NotificacoesService {
  /**
   * Método genérico e performático para enviar notificações em massa.
   */
  static async enviarNotificacoes(tokens, titulo, corpo, data = {}) {
    const validTokens = tokens.filter(t => t);
    if (validTokens.length === 0) {
      console.warn("Nenhum token válido fornecido para notificação.");
      return;
    }

    const message = {
      notification: { title: titulo, body: corpo },
      tokens: validTokens,
      data,
    };

    try {
      const response = await admin.messaging().sendEachForMulticast(message);
      console.log(`📢 Notificações enviadas: ${response.successCount}/${validTokens.length}`);
      if (response.failureCount > 0) {
        // Lógica para tratar tokens inválidos (ex: remover do DB no futuro)
      }
    } catch (err) {
      console.error("❌ Erro ao enviar notificações em massa:", err.message);
    }
  }

  /**
   * Usado pelo Controller para enviar uma notificação manual para um ID de usuário.
   */
  static async enviarParaUsuarioPorId(idUsuario, titulo, corpo) {
    const usuario = await UsuarioRepository.findById(idUsuario);
    if (!usuario || !usuario.fcm_token) {
      throw Object.assign(new Error("Usuário não encontrado ou não possui token de notificação"), { statusCode: 404 });
    }
    await this.enviarNotificacoes([usuario.fcm_token], titulo, corpo);
  }

  /**
   * Usado pelo Controller para enviar uma notificação manual para um grupo sanguíneo.
   */
  static async enviarParaGrupoSanguineo({ grupoABO, fatorRH, situacao }) {
    const tipo = `${grupoABO}${fatorRH === "P" ? "+" : "-"}`;
    const usuarios = await UsuarioRepository.findByTiposSanguineosComFcmToken([tipo]);

    if (usuarios.length === 0) {
      throw Object.assign(new Error("Nenhum usuário encontrado com esse tipo sanguíneo"), { statusCode: 404 });
    }

    const titulo = "🚨 Banco de Sangue em Alerta!";
    const corpo = `O estoque de sangue ${tipo} está em nível ${situacao}. Sua doação pode salvar vidas!`;
    const tokens = usuarios.map(u => u.fcm_token);

    await this.enviarNotificacoes(tokens, titulo, corpo, { tipo_sanguineo: tipo });
  }

  /**
   * Usado pelo BancoDeSangueService para o alerta automático.
   */
  static async alertarDoadoresPorTipo(usuarios, grupoCritico) {
    const { grupoabo, fatorrh, situacao } = grupoCritico;
    const tipoSanguineo = `${grupoabo}${fatorrh === 'P' ? '+' : '-'}`;

    const titulo = "Sua ajuda é necessária! ❤️";
    const corpo = `O estoque de sangue do tipo ${tipoSanguineo} está em nível ${situacao}. Sua doação pode salvar vidas!`;
    const tokens = usuarios.map(u => u.fcm_token);

    await this.enviarNotificacoes(tokens, titulo, corpo, { tipo_sanguineo: tipoSanguineo });
  }
}