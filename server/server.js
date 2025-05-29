import express from "express";
import "dotenv/config";
import cors from "cors";
import http from "http";
import { connectDB } from "./lib/db.js";
import userRouter from "./routes/userRoutes.js";
import messageRouter from "./routes/messageRoutes.js";
import { Server } from "socket.io";

// Create Express app and HTTP server
const app = express();
const server = http.createServer(app);

// Initialize socket.io server
export const io = new Server(server, {
  cors: { origin: "*" }
});

// Store online users
export const userSocketMap = {}; // { userId: socketId }

// Socket.io connection handler
io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId;

  if (userId) {
    console.log("User Connected:", userId);
    userSocketMap[userId] = socket.id;
  } else {
    console.warn("User connected without a valid userId");
  }

  // Emit current online users
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  socket.on("disconnect", () => {
    console.log("User Disconnected:", userId);
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

// Middleware
app.use(express.json({ limit: "4mb" }));
app.use(cors());

// Routes
app.use("/api/status", (req, res) => res.send("Server is live"));
app.use("/api/auth", userRouter);
app.use("/api/messages", messageRouter);

// Main server bootstrap (wrapped in async function)
const startServer = async () => {
  try {
    await connectDB();
    const PORT = process.env.PORT || 5000;

    if (process.env.NODE_ENV !== "production") {
      server.listen(PORT, () =>
        console.log(`🚀 Server is running on http://localhost:${PORT}`)
      );
    }
  } catch (err) {
    console.error("❌ Failed to start server:", err.message);
    process.exit(1); // Exit process with failure
  }
};

startServer();

export default server;
