import { Response } from "express";
import { prisma } from "@/utils/prisma";
import * as yup from "yup";
import { createCommentSchema } from "@/schemas/comments";
import { JWTRequest } from "@/types/jwtrequest";

export const createComment = async (req: JWTRequest, res: Response) => {
  try {
    const { postId } = req.params;

    await createCommentSchema.validate(req.body, { abortEarly: false });

    const userId = req.user?.id;

    const { content } = req.body;

    const postExist = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!postExist) {
      return res.status(404).send("No se encontro el Post");
    }

    const userExist = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!userExist) {
      return res.status(404).send("No se encontro el Usuario");
    }

    const comment = await prisma.comments.create({
      data: {
        content,
        authorId: userId,
        postId: postId,
      },
      select: {
        id: true,
        content: true,
        author: {
          select: {
            id: true,
            username: true,
          },
        },
        createdAt: true,
      },
    });

    res.status(201).send(comment);
  } catch (error) {
    if (error instanceof yup.ValidationError) {
      const errors = error.inner.map((e: any) => ({
        field: e.path,
        message: e.message,
      }));
      return res.status(400).json({ errors });
    }

    console.error(error);
    res.status(500).send("Internal server error");
  }
};
