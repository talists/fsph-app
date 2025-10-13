// src/modules/usuario/usuario.schemas.js
import { z } from "zod";

const senhaSchema = z.string()
  .min(8, "A senha deve ter no mínimo 8 caracteres")
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, 
         "A senha precisa conter letra maiúscula, minúscula, número e símbolo especial.");

export const registerSchema = z.object({
  body: z.object({
    nome: z.string({ required_error: "O nome é obrigatório." }).min(3, "O nome precisa ter no mínimo 3 caracteres."),
    email: z.string({ required_error: "O e-mail é obrigatório." }).email("Formato de e-mail inválido."),
    cpf: z.string({ required_error: "O CPF é obrigatório." }),

    senha: senhaSchema,
    
    confirmacaoSenha: z.string({ required_error: "A confirmação de senha é obrigatória." }),
  })
}).refine((data) => data.body.senha === data.body.confirmacaoSenha, {
  message: "As senha e sua confirmação não são iguais.",
  path: ["confirmacaoSenha"],
});

export const loginSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: "O e-mail é obrigatório." })
      .email("Formato de e-mail inválido."),
    senha: z
      .string({ required_error: "A senha é obrigatória." })
      .min(1, "A senha não pode estar em branco."),
  }),
});

export const updateUsuarioSchema = z.object({
  body: z.object({
    nome: z.string().min(3, "O nome precisa ter no mínimo 3 caracteres.").optional(),
    email: z.string().email("Formato de e-mail inválido.").optional(),
    cpf: z.string().min(11, "O CPF deve ter no mínimo 11 dígitos.").optional(),
    numero_telefone: z.string().min(10, "O telefone deve ter no mínimo 10 dígitos.").optional(),
    //adicionar outros dados que o usuário possa atualizar em seu perfil
  })
});