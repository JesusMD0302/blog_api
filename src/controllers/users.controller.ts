import { Request, Response } from "express";
import { prisma } from "@/utils/prisma";
import * as yup from "yup";
import { updateUserSchema } from "@/schemas/user";
import { JWTRequest } from "@/types/jwtrequest";

export const getUserByUsername = async (req: Request, res: Response) => {
  try {
    const { username } = req.params;

    if (!username) {
      return res
        .status(400)
        .json({ message: "El nombre de usuario es necesario" });
    }

    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        email: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateUser = async (req: JWTRequest, res: Response) => {
  try {
    const userId = req.user.id;

    if (!userId) {
      return res
        .status(400)
        .json({ message: "El id del usuario es necesario" });
    }

    await updateUserSchema.validate(req.body, { abortEarly: false });

    const { username } = req.body;

    const userExists = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!userExists) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    const userByUsername = await prisma.user.findUnique({
      where: { username: `@${username}` },
    });

    if (userByUsername?.id == userId) {
      return res.status(400).json({
        errors: [
          {
            field: "username",
            message: "Ya tienes ese nombre de usuario",
          },
        ],
      });
    }

    if (userByUsername) {
      return res.status(400).json({
        errors: [
          {
            field: "username",
            message:
              "Ya existe un usuario registrado con ese nombre de usuario",
          },
        ],
      });
    }

    const newUserName = `@${username}`;

    const user = await prisma.user.update({
      where: { id: userId },
      data: { username: newUserName },
    });

    res.json(user);
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
