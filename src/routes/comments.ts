import { createComment } from "@/controllers/comments.controller";
import { jwtMiddleware } from "@/middlewares/token";
import { Router } from "express";

const router = Router();

// GET /comments
// router.get("/:postId/comments", () => {});

// POST /comments
router.post("/:postId/comments", jwtMiddleware, createComment);

export default router;
