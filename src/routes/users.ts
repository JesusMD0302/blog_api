import { getUserByUsername, updateUser } from "@/controllers/users.controller";
import { jwtMiddleware } from "@/middlewares/token";
import { Router } from "express";

const router = Router();

// GET /users
// router.get("/users/all", () => {});
router.get("/:username", getUserByUsername);

// PUT /users/:userId
router.put("/", jwtMiddleware, updateUser);

export default router;
