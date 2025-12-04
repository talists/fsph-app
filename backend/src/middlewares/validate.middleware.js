import { ZodError } from "zod";

/**
 * Middleware que valida o 'req.body' contra um schema Zod.
 * @param schema O schema Zod a ser validado.
 */
export const validateBody = (schema) => async (req, res, next) => {
  try {
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🔍 [VALIDATE] Validando body...");
    console.log("📦 Body recebido:", JSON.stringify(req.body, null, 2));
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    // Garante que req.body existe antes de validar
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        msg: "Nenhum dado foi enviado no corpo da requisição.",
      });
    }

    await schema.parseAsync(req.body);

    console.log("✅ [VALIDATE] Validação bem-sucedida!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    return next();
  } catch (error) {
    if (error instanceof ZodError && error.errors && Array.isArray(error.errors)) {
      console.error("❌ [VALIDATE] Erro de validação Zod:");
      console.error("Erros:", JSON.stringify(error.errors, null, 2));

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
    console.error("❌ [VALIDATE] Erro interno:", error);
    return res.status(500).json({ msg: "Erro interno no servidor." });
  }
};
