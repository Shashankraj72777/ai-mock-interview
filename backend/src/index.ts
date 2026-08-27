// server entry: creates Express app + Socket.IO, starts listening
import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";

import "./config/db";
import "./config/redis";
import authRoutes from "./routes/auth.routes";
import { requireAuth, AuthRequest } from "./middleware/auth.middleware";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);

// protected test route — confirms the JWT middleware works end to end
app.get("/api/me", requireAuth, (req: AuthRequest, res) => {
  res.json({ user: req.user });
});

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "*" },
});

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);
});

const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});