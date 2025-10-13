// src/modules/pretriagem/pretriagem.routes.js
import express from "express";
import { PreTriagemController } from "./pretriagem.controller.js";
import { verifyToken } from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/perguntas", verifyToken, PreTriagemController.getPerguntas);
router.post("/respostas", verifyToken, PreTriagemController.salvarRespostas);
router.get("/historico", verifyToken, PreTriagemController.historico);

export default router;
