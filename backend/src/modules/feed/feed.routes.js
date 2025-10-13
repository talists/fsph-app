import express from "express";
import { FeedController } from "./feed.controller.js";
import { verifyToken } from "../../middlewares/auth.middleware.js";
import { upload } from "../../config/upload.js";

const router = express.Router();

//========================//
//        Feed Routes     //
//========================//
router.post("/", verifyToken, upload.single("url_imagem"), FeedController.createPost);
router.get("/", verifyToken, FeedController.getFeedPosts);
router.get("/usuario", verifyToken, FeedController.getPostsByUsuario);
router.patch("/:id", verifyToken, FeedController.updatePost);
router.delete("/:id", verifyToken, FeedController.deletePost);

export default router;
