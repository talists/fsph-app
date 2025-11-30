// src/modules/agendamento/agendamento.routes.js
import express from "express";
import { AgendamentoController } from "./agendamento.controller.js";
import { verifyToken } from "../../middlewares/auth.middleware.js";
import { upload } from "../../config/upload.js";

const router = express.Router();

// CRUD interno
router.get("/", verifyToken, AgendamentoController.getAll);
router.get("/usuario", verifyToken, AgendamentoController.getByUsuario);
router.get("/:id", verifyToken, AgendamentoController.getById);
router.patch("/:id", verifyToken, AgendamentoController.update);
router.delete("/:id", verifyToken, AgendamentoController.remove);

// FSPH (espelhando endpoints)
router.get("/apiagendamento/doador/getinfo/:cpf", verifyToken, AgendamentoController.getInfoDoadorFSPH);
router.get("/apiagendamento/doador/agendamentos/:cpf", verifyToken, AgendamentoController.getAgendamentosFSPH);

router.get("/apiagendamento/cidades/:perm_individual/:perm_medula/:perm_campanha", verifyToken, AgendamentoController.listarCidades);
router.get("/apiagendamento/local/:id_cidade/:perm_individual/:perm_medula/:perm_campanha", verifyToken, AgendamentoController.listarLocais);
router.get("/apiagendamento/blocoagendamento/listarAllDate/:id_local/:perm_individual/:perm_medula/:perm_campanha", verifyToken, AgendamentoController.listarBlocosByLocal);
router.get("/apiagendamento/blocoagendamento/listarByDate/:dateSelected/:id_local/:perm_individual/:perm_medula/:perm_campanha", verifyToken, AgendamentoController.listarBlocosByDate);

router.post("/apiagendamento/agendamento/marcar", verifyToken, upload.single("caminho_autorizacao"), AgendamentoController.marcarAgendamento);
router.patch("/apiagendamento/agendamento/editar", verifyToken, upload.single("caminho_autorizacao"), AgendamentoController.update);
router.delete("/apiagendamento/agendamento/desmarcar/:protocolo", verifyToken, AgendamentoController.desmarcarAgendamentoFSPH);

export default router;
