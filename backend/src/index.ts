import dotenv from "dotenv";

dotenv.config();

import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";

import "./config/db";
import "./config/redis";
import authRoutes from "./routes/auth.routes";
import sessionsRoutes from "./routes/sessions.routes";
import { requireAuth, AuthRequest } from "./middleware/auth.middleware";
import { registerInterviewHandlers } from "./sockets/interview.socket";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/sessions", sessionsRoutes);

app.get("/api/me", requireAuth, (req: AuthRequest, res) => {
  res.json({ user: req.user });
});

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "*",
  },
});

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;

  if (!token) {
    return next(new Error("No token provided."));
  }

  try {
    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as {
      userId: string;
      email: string;
    };

    socket.data.userId = payload.userId;
    socket.data.email = payload.email;

    next();
  } catch {
    next(new Error("Invalid or expired token."));
  }
});

registerInterviewHandlers(io);

const PORT = process.env.PORT || 4000;

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});