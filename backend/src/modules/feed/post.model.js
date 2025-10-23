// src/modules/feed/post.model.js
import { EntitySchema } from "typeorm";

export const Post = new EntitySchema({
  name: "Post",
  tableName: "postagens",
  columns: {
    id: { type: "int", primary: true, generated: true },
    url_imagem: { type: "text", nullable: false }, //o upload da imagem sera obrigatório
    legenda: { type: "text", nullable: true },
    criado_em: { type: "datetime", createDate: true },
  },
  relations: {
    usuario: { 
      type: "many-to-one", 
      target: "Usuario", 
      joinColumn: { name: "id_usuario" },
    }
  }
});
