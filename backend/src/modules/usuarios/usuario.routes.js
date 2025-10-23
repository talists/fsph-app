import express from "express";
import { UsuarioController } from "./usuario.controller.js";
import { verifyToken } from "../../middlewares/auth.middleware.js";
import { upload } from "../../config/upload.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { registerSchema } from "../usuarios/validations/usuario.schemas.js";
import { updateUsuarioSchema } from "./validations/usuario.schemas.js";

const router = express.Router();

//========================//
//     Usuario Routes     //
//========================//
router.post("/register", upload.single("url_foto_perfil"), validate(registerSchema), UsuarioController.register);
router.get("/", verifyToken, UsuarioController.getAll);
router.get("/:id", verifyToken, UsuarioController.getById);
router.patch("/:id", verifyToken, upload.single("url_foto_perfil"), validate(updateUsuarioSchema), UsuarioController.update);
router.delete("/:id", verifyToken, UsuarioController.delete);

// Atualizar token FCM do usuário
router.put("/fcm-token", UsuarioController.atualizarFcmToken);

export default router;

