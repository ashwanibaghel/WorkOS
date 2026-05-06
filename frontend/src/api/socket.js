import { io } from "socket.io-client";

let socket;

export const getSocket = () => {
  if (!socket) {
    socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:5000", {
      autoConnect: false,
      auth: { token: localStorage.getItem("workos_token") }
    });
  }
  socket.auth = { token: localStorage.getItem("workos_token") };
  return socket;
};
