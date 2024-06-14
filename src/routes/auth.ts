import { login, register } from "@/controllers/auth.controller";
import { Router } from "express";

const router = Router();

// POST /auth/login
router.post("/login", login);

// POST /auth/register
router.post("/signup", register);

export default router;
