import { io } from "socket.io-client";

let socket;

const socketUrl = import.meta.env.VITE_SOCKET_URL || (import.meta.env.DEV ? "http://localhost:5000" : window.location.origin);

export const getSocket = () => {
  if (!socket) {
    socket = io(socketUrl, {
      autoConnect: false,
      auth: { token: localStorage.getItem("workos_token") }
    });
  }
  socket.auth = { token: localStorage.getItem("workos_token") };
  return socket;
};
