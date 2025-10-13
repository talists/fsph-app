// src/modules/doacoes/doacao.model.js

import { EntitySchema } from "typeorm";

export const Doacao = new EntitySchema({
  name: "Doacao",
  tableName: "doacoes",
  columns: {
    id: {
      type: "int",
      primary: true,
      generated: true,
    },
    data_doacao: {
      type: "date",
    },
    tipo_doacao: {
      type: "varchar",
      length: 50,
      default: "Sangue Total",
    },
    criado_em: {
      type: "datetime",
      createDate: true,
    },
  },
  relations: {
    usuario: {
      type: "many-to-one",
      target: "Usuario",
      joinColumn: {
        name: "id_usuario",
      },
      onDelete: "CASCADE", // Se o usuário for deletado, suas doações também são.
    },
    posto_coleta: {
      type: "many-to-one",
      target: "PostoColeta",
      joinColumn: {
        name: "id_posto_coleta",
      },
      nullable: true,
    },
  },
});