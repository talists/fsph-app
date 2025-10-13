// src/modules/pretriagem/pretriagem.model.js (Nome do arquivo pode mudar)
import { EntitySchema } from "typeorm";

//========================//
//   Model Pré-Triagem    //
//========================//

export const RespostasPreTriagem = new EntitySchema({
  name: "RespostasPreTriagem", 
  tableName: "respostas_pre_triagem",
  columns: {
    id: { type: "int", primary: true, generated: true },
    respostas: { type: "json" }, 
    foi_preliminarmente_aprovado: { type: "boolean" },
    criado_em: { type: "datetime", createDate: true },
  },
  relations: {
    usuario: {
      type: "many-to-one", // Muitas respostas de pré-triagem para UM usuário
      target: "Usuario",
      joinColumn: {
        name: "id_usuario", 
      },
      onDelete: "CASCADE", 
    },
  },
});

