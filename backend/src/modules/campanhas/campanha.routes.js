// src/modules/campanhas/campanha.routes.js

import express from "express";
import { CampanhaController } from "./campanha.controller.js";
import { verifyToken } from "../../middlewares/auth.middleware.js";

const router = express.Router();


router.get("/", verifyToken, CampanhaController.getAll);
router.post("/", verifyToken, CampanhaController.create);
router.get("/:id", verifyToken, CampanhaController.getById);
router.patch("/:id", verifyToken, CampanhaController.update);
router.delete("/:id", verifyToken, CampanhaController.remove);
// Rota para um usuário listar suas próprias campanhas
router.get("/minhas-campanhas", verifyToken, CampanhaController.getByUsuario);

export default router;