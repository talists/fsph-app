// src/modules/auth/oauth.routes.js
import express from "express";
import { OAuthController } from "./oauth.controller.js";

const router = express.Router();
router.post("/login", OAuthController.loginWithProvider);
export default router;
