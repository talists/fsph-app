// src/modules/auth/auth.routes.js
import express from "express";
import { AuthController } from "./auth.controller.js";
import { verifyToken } from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/login", AuthController.login);
router.post("/logout", verifyToken, AuthController.logout);
router.post("/esqueci-senha", AuthController.esqueciSenha);
router.post("/refresh-token", AuthController.refreshToken);
router.patch("/alterar-senha", verifyToken, AuthController.alterarSenha);

export default router;
