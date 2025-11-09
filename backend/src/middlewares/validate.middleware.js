import { ZodError } from "zod";

/**
 * Middleware que valida o 'req.body' contra um schema Zod.
 * @param schema O schema Zod a ser validado.
 */
export const validateBody = (schema) => async (req, res, next) => {
  try {
    await schema.parseAsync(req.body);
    return next();
  } catch (error) {
    if (error instanceof ZodError) {
      const errors = error.errors.map((e) => ({
        campo: e.path.join("."),
        mensagem: e.message,
      }));
      return res.status(400).json({
        msg: "Erro de validação nos dados enviados.",
        errors: errors,
      });
    }
    // Se for outro tipo de erro
    return res.status(500).json({ msg: "Erro interno no servidor." });
  }
};
