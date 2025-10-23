import { EntitySchema } from "typeorm";

//========================//
//    Model Agendamento    //
//========================//

export const Agendamento = new EntitySchema({
  name: "Agendamento",
  tableName: "agendamentos",
  columns: {
    id: { type: "int", primary: true, generated: true },
    tipoAgendamento: { name: "tipo_agendamento", type: "enum", enum: ["SANGUE_INDIVIDUAL", "CAMPANHA", "CADASTRO_MEDULA_OSSEA"] }, 
    status: { type: "enum", enum: ["AGENDADO", "CONCLUIDO", "CANCELADO"], default: "AGENDADO" }, 
    dataAgendamento: { name: "data_agendamento", type: "datetime" }, 
    protocolo: { type: "varchar", length: 50, nullable: true },
    caminhoAutorizacao: { name: "caminho_autorizacao", type: "text", nullable: true },
    criadoEm: { name: "criado_em", type: "datetime", createDate: true }, 
    atualizadoEm: { name: "atualizado_em", type: "datetime", updateDate: true }, 
  },
  relations: {
    usuario: {
      type: "many-to-one",
      target: "Usuario",
      joinColumn: { name: "id_usuario" },
    },
    posto_coleta: {
      type: "many-to-one",
      target: "PostoColeta", // Verificar se o nome da entidade PostoColeta está correto
      joinColumn: { name: "id_posto_coleta" },
      nullable: true
    },
    campanha: {
      type: "many-to-one",
      target: "Campanha", // Verificar se o nome da entidade Campanha está correto
      joinColumn: { name: "id_campanha" },
      nullable: true
    }
  }
});