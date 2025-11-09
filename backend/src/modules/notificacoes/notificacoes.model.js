import { EntitySchema } from "typeorm";

export const Notificacao = new EntitySchema({
  name: "Notificacao",
  tableName: "notificacoes",
  columns: {
    id: {
      type: "int",
      primary: true,
      generated: true,
    },
    mensagem: {
      type: "text",
    },
    tipo_notificacao: {
      type: "enum",
      enum: ["PUSH_APP", "EMAIL", "WHATSAPP"],
    },
    status: {
      type: "enum",
      enum: ["ENVIADO", "FALHOU", "PENDENTE"],
      default: "PENDENTE",
    },
    evento_gatilho: {
      type: "varchar",
      length: 100,
      nullable: true,
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
      onDelete: "CASCADE",
    },
  },
});
