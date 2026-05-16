import http from "http";
import { Server as SocketIO } from "socket.io";
import app from "./app";
import { logger } from "./lib/logger";
import { setIo as postsSetIo } from "./routes/posts";
import { setIo as commentsSetIo } from "./routes/comments";
import { setIo as analyticsSetIo, setOnlineCount } from "./routes/analytics";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error("PORT environment variable is required but was not provided.");
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const server = http.createServer(app);

const io = new SocketIO(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
  path: "/api/socket.io",
});

// Share io with routes
postsSetIo(io);
commentsSetIo(io);
analyticsSetIo(io);

// Track online connections
let onlineCount = 0;

io.on("connection", (socket) => {
  onlineCount++;
  setOnlineCount(onlineCount);
  io.emit("online_count", { count: onlineCount });

  socket.on("disconnect", () => {
    onlineCount = Math.max(0, onlineCount - 1);
    setOnlineCount(onlineCount);
    io.emit("online_count", { count: onlineCount });
  });
});

server.listen(port, (err?: Error) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }
  logger.info({ port }, "Server listening with Socket.IO");
});
