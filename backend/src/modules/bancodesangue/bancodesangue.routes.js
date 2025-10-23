import express from "express";
import { BancoDeSangueController } from "./bancodesangue.controller.js";

const router = express.Router();

router.get("/estoque", BancoDeSangueController.getEstoque);

export default router;
