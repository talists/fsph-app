// src/modules/usuarios/usuario.model.js
import { EntitySchema } from "typeorm";

export const Usuario = new EntitySchema({
  name: "Usuario",
  tableName: "usuarios",
  columns: {
    id: { type: "int", primary: true, generated: true },
    id_google: { type: "varchar", length: 255, unique: true, nullable: true },
    nome: { type: "varchar", length: 255 },
    cpf: { type: "varchar", length: 14, unique: true, nullable: true },
    sexo: { type: "enum", enum: ['M', 'F'], nullable: true },
    fcm_token: { type: "text", nullable: true },
    refresh_token: { type: "text", nullable: true },
    email: { type: "varchar", length: 255, unique: true },
    numero_telefone: { type: "varchar", length: 20, nullable: true },
    data_nascimento: { type: "date", nullable: true },
    tipo_sanguineo: { type: "varchar", length: 5, nullable: true },
    cidade: { type: "varchar", length: 100, nullable: true },
    estado: { type: "varchar", length: 2, nullable: true },
    url_foto_perfil: { type: "text", nullable: true },
    esta_apto_para_doar: { type: "boolean", default: true },
    data_ultima_doacao: { type: "date", nullable: true },
    senha: { type: "varchar", length: 255, nullable: true },
    criado_em: { type: "datetime", createDate: true },
    atualizado_em: { type: "datetime", updateDate: true },
  },
  relations: {
    agendamentos: {
      type: "one-to-many",
      target: "Agendamento",
      inverseSide: "usuario",
    },
    campanhas: {
      type: "one-to-many",
      target: "Campanha",
      inverseSide: "organizador",
    },
    doacoes: {
      type: "one-to-many",
      target: "Doacao",
      inverseSide: "usuario",
    },
    respostas_pre_triagem: {
      type: "one-to-many",
      target: "RespostasPreTriagem",
      inverseSide: "usuario",
    },
    postagens: {
      type: "one-to-many",
      target: "Post",
      inverseSide: "usuario",
    },
    notificacoes: {
      type: "one-to-many",
      target: "Notificacao",
      inverseSide: "usuario",
    },
  },
});
