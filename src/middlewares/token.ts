import { JWTRequest } from "@/types/jwtrequest";
import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export const jwtMiddleware = async (
  req: JWTRequest,
  res: Response,
  next: NextFunction
) => {
  const token = req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ message: "Acceso denegado" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!);
    req.user = payload;

    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};
