import express from "express";
import { PostoColetaController } from "./postocoleta.controller.js";
import { verifyToken } from "../../middlewares/auth.middleware.js";
// Faltamos criar um middleware 'verifyAdmin' para proteger rotas administrativas

const router = express.Router();

// Rota pública (ou para usuários logados) para listar os postos
router.get("/", verifyToken, PostoColetaController.getAll);
router.get("/:id", verifyToken, PostoColetaController.getById);

// Rotas protegidas apenas para administradores
router.post("/", verifyToken, /* verifyAdmin, */ PostoColetaController.create);
router.patch("/:id", verifyToken, /* verifyAdmin, */ PostoColetaController.update);
router.delete("/:id", verifyToken, /* verifyAdmin, */ PostoColetaController.remove);

export default router;