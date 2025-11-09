import express from "express";
import { PostoColetaController } from "./postocoleta.controller.js";
import { verifyToken } from "../../middlewares/auth.middleware.js";

const router = express.Router();

// Rota pública (ou para usuários logados)
router.get("/", verifyToken, PostoColetaController.getAll);
router.get("/:id", verifyToken, PostoColetaController.getById);
router.post("/", verifyToken, PostoColetaController.create);
router.patch("/:id", verifyToken, PostoColetaController.update);
router.delete("/:id", verifyToken, PostoColetaController.remove);

export default router;
