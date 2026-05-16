import { io } from "socket.io-client";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

const socket = io({
  path: `${BASE}/api/socket.io`,
  transports: ["websocket", "polling"],
});

export default socket;
