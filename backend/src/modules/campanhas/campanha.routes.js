// src/modules/campanhas/campanha.routes.js

import express from "express";
import { CampanhaController } from "./campanha.controller.js";
import { verifyToken } from "../../middlewares/auth.middleware.js";

const router = express.Router();


router.get("/", verifyToken, CampanhaController.getAll);
router.post("/", verifyToken, CampanhaController.create);
// ⚠️ IMPORTANTE: Rotas específicas ANTES de rotas com parâmetro dinâmico /:id
router.get("/minhas-campanhas", verifyToken, CampanhaController.getByUsuario);
router.get("/:id", verifyToken, CampanhaController.getById);
router.patch("/:id", verifyToken, CampanhaController.update);
router.delete("/:id", verifyToken, CampanhaController.remove);

export default router;