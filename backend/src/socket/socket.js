import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { User } from "../models/User.js";

let ioInstance = null;

export const initSocket = (io) => {
  ioInstance = io;

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next();
      const payload = jwt.verify(token, env.jwtSecret);
      const user = await User.findById(payload.sub).select("_id");
      if (user) socket.userId = String(user._id);
      return next();
    } catch (_error) {
      return next();
    }
  });

  io.on("connection", (socket) => {
    if (socket.userId) socket.join(`user:${socket.userId}`);

    socket.on("project:join", (projectId) => {
      if (projectId) socket.join(`project:${projectId}`);
    });

    socket.on("project:leave", (projectId) => {
      if (projectId) socket.leave(`project:${projectId}`);
    });
  });
};

export const emitProjectEvent = (projectId, event, payload) => {
  if (!ioInstance || !projectId) return;
  ioInstance.to(`project:${projectId}`).emit(event, payload);
};

export const emitUserEvent = (userId, event, payload) => {
  if (!ioInstance || !userId) return;
  ioInstance.to(`user:${userId}`).emit(event, payload);
};
