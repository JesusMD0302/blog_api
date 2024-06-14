import { Request, Response } from "express";
import { prisma } from "@/utils/prisma";
import * as yup from "yup";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { loginSchema, registerSchema } from "@/schemas/user";

export const login = async (req: Request, res: Response) => {
  try {
    await loginSchema.validate(req.body, { abortEarly: false });

    const { email, password } = req.body;
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        errors: [{ field: "password", message: "Contraseña incorrecta" }],
      });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email },
      process.env.JWT_SECRET!
    );

    res.json({
      user: { id: user.id, username: user.username, email: user.email, token },
    });
  } catch (error) {
    // Manejar errores de validación de Yup
    if (error instanceof yup.ValidationError) {
      const errors = error.inner.map((e: any) => ({
        field: e.path,
        message: e.message,
      }));
      return res.status(400).json({ errors });
    }
    // Manejar otros errores
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const register = async (req: Request, res: Response) => {
  try {
    await registerSchema.validate(req.body, { abortEarly: false });

    const { email, password, username } = req.body;
    const newUserName = `@${username}`;

    const userByEmail = await prisma.user.findUnique({
      where: { email },
    });

    if (userByEmail) {
      return res
        .status(400)
        .json({ message: "Ya existe un usuario registrado con ese email" });
    }

    const userByUsername = await prisma.user.findUnique({
      where: { username: newUserName },
    });

    if (userByUsername) {
      return res.status(400).json({
        message: "Ese nombre de usuario ya está en uso, intenta con otro",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: { email, password: hashedPassword, username: newUserName },
      select: {
        id: true,
        email: true,
        username: true,
      },
    });

    res.json({ user: newUser });
  } catch (error) {
    if (error instanceof yup.ValidationError) {
      const errors = error.inner.map((e: any) => ({
        field: e.path,
        message: e.message,
      }));
      return res.status(400).json({ errors });
    }

    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
