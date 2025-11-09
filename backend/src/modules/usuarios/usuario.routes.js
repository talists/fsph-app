import express from "express";
import { UsuarioController } from "./usuario.controller.js";
import { verifyToken } from "../../middlewares/auth.middleware.js";
import { upload } from "../../config/upload.js";

// 1. Importa o middleware 'validateBody' (o nome correto que definimos)
import { validateBody } from "../../middlewares/validate.middleware.js";

// 2. Importa os schemas (que são "planos" e corretos)
import {
  registerSchema,
  updateUsuarioSchema,
} from "./validations/usuario.schemas.js";

const router = express.Router();

//========================//
//     Usuario Routes     //
//========================//

router.post(
  "/register",
  upload.single("url_foto_perfil"),
  validateBody(registerSchema),
  UsuarioController.register
);

router.get("/", verifyToken, UsuarioController.getAll);
router.get("/meu-perfil", verifyToken, UsuarioController.getMeuPerfil);
router.get("/:id", verifyToken, UsuarioController.getById);

// 4. Usa o 'validateBody' também para a atualização
router.patch(
  "/:id",
  verifyToken,
  upload.single("url_foto_perfil"),
  validateBody(updateUsuarioSchema),
  UsuarioController.update
);

router.delete("/:id", verifyToken, UsuarioController.delete);

// 5. Rota de FCM token (correta)
router.patch("/fcm-token", verifyToken, UsuarioController.atualizarFcmToken);

export default router;
