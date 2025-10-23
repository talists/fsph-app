// src/modules/doacoes/doacao.routes.js

import express from "express";
import { DoacaoController } from "./doacao.controller.js";
import { verifyToken } from "../../middlewares/auth.middleware.js";

const router = express.Router();

// Adiciona um novo registro de doação (protegido, talvez para admins)
router.post("/", verifyToken, DoacaoController.create);

// Lista todas as doações (protegido, talvez para admins)
router.get("/", verifyToken, DoacaoController.getAll);

// Lista o histórico de doações do usuário logado
router.get("/meu-historico", verifyToken, DoacaoController.getByUsuario);

// Deleta um registro de doação (protegido, talvez para admins)
router.delete("/:id", verifyToken, DoacaoController.remove);

export default router;