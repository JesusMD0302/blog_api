import { Request, Response } from "express";
import { prisma } from "@/utils/prisma";
import * as yup from "yup";
import {
  createPostSchema,
  updateImagesSchema,
  updatePostSchema,
} from "@/schemas/post";
import path from "path";
import fs from "fs";
import { JWTRequest } from "@/types/jwtrequest";

interface CustomRequest extends JWTRequest {
  files: Express.Multer.File[];
}

const IMAGEURL = "http://localhost:3000/public/images/";

export const postPost = async (req: Request, res: Response) => {
  try {
    const request = req as CustomRequest;

    const userId = request.user!.id;

    const { title, content } = request.body;

    await createPostSchema.validate(
      {
        title,
        content,
        images: request.files?.map((file) => ({
          mimetype: file.mimetype,
          size: file.size,
        })),
      },
      { abortEarly: false }
    );

    const savedImages: string[] = [];

    request.files?.forEach((file) => {
      const relativePath = `${Date.now()}_${file.originalname}`;
      const filePath = path.join(
        __dirname,
        "..",
        "..",
        "uploads",
        relativePath
      );

      fs.writeFileSync(filePath, file.buffer);
      savedImages.push(`${IMAGEURL}${relativePath}`);
    });

    const post = await prisma.post.create({
      data: {
        title,
        content,
        authorId: userId,
        images: {
          createMany: {
            data: savedImages.map((image) => ({ url: image })),
          },
        },
      },
      include: {
        images: {
          select: {
            url: true,
            id: true,
          },
        },
      },
    });

    res.json(post);
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

export const getPosts = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId as string | undefined;

    const posts = await prisma.post.findMany({
      where: userId ? { authorId: userId } : {},
      include: {
        images: {
          select: {
            url: true,
            id: true,
          },
        },
        comments: {
          select: {
            id: true,
            content: true,
            author: {
              select: {
                username: true,
              },
            },
            createdAt: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        author: {
          select: {
            username: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json(posts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getPost = async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;

    if (!postId) {
      return res.status(400).json({ message: "El id del post es necesario" });
    }

    const post = await prisma.post.findUnique({
      where: {
        id: postId,
      },
      include: {
        images: {
          select: {
            url: true,
            id: true,
          },
        },
      },
    });

    if (!post) {
      return res.status(404).json({ message: "No se encontro el post" });
    }

    res.json(post);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const putPost = async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;

    if (!postId) {
      return res.status(400).json({ message: "El id del post es necesario" });
    }

    await updatePostSchema.validate(req.body, { abortEarly: false });

    const { title, content } = req.body;

    const postExists = await prisma.post.findUnique({
      where: {
        id: postId,
      },
    });

    if (!postExists) {
      return res.status(404).json({ message: "No se encontro el post" });
    }

    const post = await prisma.post.update({
      where: {
        id: postId,
      },
      data: {
        title,
        content,
      },
      include: {
        images: {
          select: {
            url: true,
            id: true,
          },
        },
      },
    });

    res.json(post);
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

export const deletePost = async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;

    if (!postId) {
      return res.status(400).json({ message: "El id del post es necesario" });
    }

    const postExists = await prisma.post.findUnique({
      where: {
        id: postId,
      },
    });

    if (!postExists) {
      return res.status(404).json({ message: "No se encontro el post" });
    }

    const images = await prisma.images.findMany({
      where: {
        postId,
      },
    });

    images.forEach((image) => {
      const relativePath = image.url.split("/").pop() ?? "";

      if (relativePath) {
        fs.unlinkSync(
          path.join(__dirname, "..", "..", "uploads", relativePath)
        );
      }
    });

    await prisma.images.deleteMany({
      where: {
        postId,
      },
    });

    await prisma.comments.deleteMany({
      where: {
        postId,
      },
    });

    await prisma.post.delete({
      where: {
        id: postId,
      },
    });

    res.json({ message: "Post eliminado" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Images controllers

export const addPostImages = async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;

    if (!postId) {
      return res.status(400).json({ message: "El id del post es necesario" });
    }

    const postExists = await prisma.post.findUnique({
      where: {
        id: postId,
      },
    });

    if (!postExists) {
      return res.status(404).json({ message: "No se encontro el post" });
    }

    const request = req as CustomRequest;

    await updateImagesSchema.validate(
      {
        images: request.files?.map((file) => ({
          mimetype: file.mimetype,
          size: file.size,
        })),
      },
      { abortEarly: false }
    );

    const savedImages: string[] = [];

    request.files?.forEach((file) => {
      const relativePath = `${Date.now()}_${file.originalname}`;
      const filePath = path.join(
        __dirname,
        "..",
        "..",
        "uploads",
        relativePath
      );

      fs.writeFileSync(filePath, file.buffer);
      savedImages.push(`${IMAGEURL}${relativePath}`);
    });

    const images = await prisma.images.createMany({
      data: savedImages.map((image) => ({
        url: image,
        postId,
      })),
    });

    res.json({ message: `${images.count} imagenes agregadas` });
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

export const deletePostImage = async (req: Request, res: Response) => {
  try {
    const { postId, imageId } = req.params;

    if (!postId || !imageId) {
      return res
        .status(400)
        .json({ message: "El id del post y la imagen son necesarios" });
    }

    const postExists = await prisma.post.findUnique({
      where: {
        id: postId,
      },
    });

    if (!postExists) {
      return res.status(404).json({ message: "No se encontro el post" });
    }

    const imageExists = await prisma.images.findUnique({
      where: {
        id: imageId,
      },
    });

    if (!imageExists) {
      return res.status(404).json({ message: "No se encontro la imagen" });
    }

    const image = await prisma.images.delete({
      where: {
        id: imageId,
      },
    });

    const relativePath = image.url.split("/").pop() ?? "";

    if (relativePath) {
      fs.unlinkSync(path.join(__dirname, "..", "..", "uploads", relativePath));
    }

    res.json({ message: "Imagen eliminada" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
