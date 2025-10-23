//campanha.model.js
import { EntitySchema } from "typeorm";
import { Usuario } from "../usuarios/usuario.model.js";

export const Campanha = new EntitySchema({
  name: "Campanha",
  tableName: "campanhas",
  columns: {
    id: { type: "int", primary: true, primaryGenerated: true },
    nome: { type: "varchar", length: 255 },
    descricao: { type: "text", nullable: true },
    local_campanha: { type: "text", nullable: true },
    data_inicio: { type: "datetime" },
    data_fim: { type: "datetime" },
    criado_em: { type: "datetime", createDate: true },
  },
  relations: {
    organizador: {
      type: "many-to-one",
      target: "Usuario",
      joinColumn: { name: "id_usuario_organizador" },
    }
  }
});
