import { EntitySchema } from "typeorm";

export const PostoColeta = new EntitySchema({
  name: "PostoColeta",
  tableName: "postos_coleta",
  columns: {
    id: {
      type: "int",
      primary: true,
      generated: true,
    },
    nome: {
      type: "varchar",
      length: 255,
    },
    cidade: {
      type: "varchar",
      length: 100,
    },
    endereco: {
      type: "text",
    },
    telefone: {
      type: "varchar",
      length: 20,
      nullable: true,
    },
    horario_funcionamento: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    esta_ativo: {
      type: "boolean",
      default: true,
    },
  },
});