//notificacoes.routes.js
import express from "express";
import { NotificacoesController } from "./notificacoes.controller.js";
import { verifyToken } from "../../middlewares/auth.middleware.js";

const router = express.Router();

// ADICIONADO 'verifyToken' em todas as rotas
router.post("/usuario", verifyToken, NotificacoesController.enviarParaUsuario);
router.post("/grupo", verifyToken, NotificacoesController.enviarParaGrupo);
router.post("/geral", verifyToken, NotificacoesController.enviarGeral);

export default router;