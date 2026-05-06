import http from "http";
import { Server } from "socket.io";
import { app } from "./app.js";
import { connectDb } from "./config/db.js";
import { env } from "./config/env.js";
import { notificationService } from "./services/notificationService.js";
import { initSocket } from "./socket/socket.js";

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: env.clientUrls, credentials: true }
});

initSocket(io);

await connectDb();

server.listen(env.port, () => {
  console.log(`WorkOS API running on port ${env.port}`);
});

setInterval(() => {
  notificationService.overdueScan().catch((error) => {
    console.error("Overdue scan failed", error);
  });
}, 60 * 60 * 1000);
