import express from "express";
import { prisma } from "@/utils/prisma";
import auth from "@/routes/auth";
import users from "@/routes/users";
import posts from "@/routes/posts";
import comments from "@/routes/comments";
import path from "path";
import cors from "cors";

const app = express();

app.use(express.json());
app.use(cors());

app.use(
  "/public/images",
  express.static(path.join(__dirname, "..", "uploads"))
);

app.use("/api/auth", auth);
app.use("/api/users", users);
app.use("/api/posts", posts);
app.use("/api/posts", comments);

// Handle 404
app.use((req, res, next) => {
  res.status(404).send("Route not found");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
