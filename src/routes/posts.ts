import {
  addPostImages,
  deletePost,
  deletePostImage,
  getPost,
  getPosts,
  postPost,
  putPost,
} from "@/controllers/posts.controller";
import { Router, RequestHandler } from "express";
import multer from "multer";
import { MulterFilterError } from "@/utils/errors";
import { jwtMiddleware } from "@/middlewares/token";

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 1024 * 1024 * 5,
  },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new MulterFilterError("El archivo debe ser una imagen"));
    }

    cb(null, true);
  },
}).array("images", 5);

const uploadMiddleware: RequestHandler = (req, res, next) => {
  upload(req, res, (error) => {
    if (
      error instanceof multer.MulterError &&
      error.code === "LIMIT_UNEXPECTED_FILE"
    ) {
      return res
        .status(400)
        .json({ errors: [{ field: "images", message: "Máximo 5 imágenes" }] });
    }

    if (error) {
      return res.status(500).json({ message: "Internal server error" });
    }

    next();
  });
};

const router = Router();

// GET /posts
router.get("/all", getPosts);
router.get("/all/:userId", getPosts);
router.get("/:postId", getPost);

// POST /posts/:userId
router.post("/", jwtMiddleware, uploadMiddleware, postPost);

// PUT /posts/:postId
router.put("/:postId", jwtMiddleware, putPost);

// DELETE /posts/:postId
router.delete("/:postId", jwtMiddleware, deletePost);

// Images Requests
// PUT /posts/:postId/images
router.post("/:postId/images", jwtMiddleware, uploadMiddleware, addPostImages);

// DELETE /posts/:postId/images
router.delete("/:postId/images/:imageId", jwtMiddleware, deletePostImage);

export default router;
