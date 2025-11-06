import { z } from "zod";

// --- Esquema de Senha Reutilizável ---
// Define a REGEX para uma senha forte
const senhaForteRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
const senhaSchema = z.string()
  .min(8, "A senha deve ter no mínimo 8 caracteres")
  .regex(senhaForteRegex, 
         "A senha precisa conter letra maiúscula, minúscula, número e símbolo especial.");

// --- Esquema de Registo ---
// Valida o 'body' da requisição POST /api/usuarios/register
// Este schema é usado pelo middleware 'validateBody'
export const registerSchema = z.object({
  nome: z
    .string({ required_error: "O nome é obrigatório." })
    .min(3, "O nome precisa ter no mínimo 3 caracteres."),
  email: z
    .string({ required_error: "O e-mail é obrigatório." })
    .email("Formato de e-mail inválido."),
  cpf: z
    .string({ required_error: "O CPF é obrigatório." })
    .min(11, "O CPF deve ter no mínimo 11 dígitos."), // Validação básica
    
  // --- CAMPO ADICIONADO ---
  // Valida a data de nascimento que vem do formulário
  data_nascimento: z
    .string({ required_error: "A data de nascimento é obrigatória."})
    .regex(/^\d{4}-\d{2}-\d{2}$/, "O formato da data de nascimento deve ser AAAA-MM-DD."),

  // Valida a senha
  senha: senhaSchema,
  
  // Valida a confirmação da senha
  confirmacaoSenha: z
    .string({ required_error: "A confirmação de senha é obrigatória." }),
  
  // Campos opcionais que também podem vir do FormData
  numero_telefone: z.string().optional(),
  tipo_sanguineo: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().optional(),

})
// Garante que a senha e a confirmação são iguais
.refine((data) => data.senha === data.confirmacaoSenha, {
  message: "As senhas não conferem.",
  path: ["confirmacaoSenha"], // Associa o erro ao campo de confirmação
});


// --- Esquema de Atualização ---
// Valida o 'body' da requisição PATCH /api/usuarios/:id
export const updateUsuarioSchema = z.object({
  nome: z.string().min(3, "O nome precisa ter no mínimo 3 caracteres.").optional(),
  email: z.string().email("Formato de e-mail inválido.").optional(),
  cpf: z.string().min(11, "O CPF deve ter no mínimo 11 dígitos.").optional(),
  numero_telefone: z.string().min(10, "O telefone deve ter no mínimo 10 dígitos.").optional(),
  data_nascimento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "O formato da data deve ser AAAA-MM-DD.").optional(),
  tipo_sanguineo: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().optional(),
  
  // A atualização de senha deve ser feita pela rota /api/auth/alterar-senha
  
}).strict(); // Garante que NENHUM outro campo (como 'senha') seja enviado por esta rota
