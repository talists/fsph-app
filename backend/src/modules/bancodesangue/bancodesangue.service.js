//bancodesangue.service.js
import axios from "axios";
import  { redisClient } from "../../config/redis.js";
import { NotificacoesService } from "../notificacoes/notificacoes.service.js";
import { UsuarioRepository } from "../usuarios/repositories/usuario.repository.js";

const API_BASE_URL = process.env.FSPH_API_URL || "https://api.fsph.se.gov.br/apiinterface";

export class BancoDeSangueService {
  
  static async updateCache(data) {
    await redisClient.set("estoque_banco_sangue", JSON.stringify(data), "EX", 3600);
  }

  static async fetchFromAPI() {
    const { data } = await axios.get(`${API_BASE_URL}/estoque`);
    if (data.err !== 0) throw new Error("Erro ao obter estoque da FSPH");

    await this.updateCache(data);

    const gruposCriticos = data.data.filter(g => ["Critico", "Alerta"].includes(g.situacao));

    if (gruposCriticos.length > 0) {
      console.log("🚨 Grupos com estoque baixo encontrados.");

      const tiposSanguineos = gruposCriticos.map(g => `${g.grupoabo}${g.fatorrh === "P" ? "+" : "-"}`);

      const usuariosParaNotificar = await UsuarioRepository.findByTiposSanguineosComFcmToken(tiposSanguineos);
      
      for (const grupo of gruposCriticos) {
        const tipoAtual = `${grupo.grupoabo}${grupo.fatorrh === "P" ? "+" : "-"}`;
        const usuariosDoTipo = usuariosParaNotificar.filter(u => u.tipo_sanguineo === tipoAtual);

        if (usuariosDoTipo.length > 0) {
          await NotificacoesService.alertarDoadoresPorTipo(usuariosDoTipo, grupo);
        }
      }
    }
    
    return data;
  }
  
  static async getEstoqueAtual() {
    const cache = await redisClient.get("estoque_banco_sangue");
    if (cache) return JSON.parse(cache);
    return await this.fetchFromAPI();
  }
}