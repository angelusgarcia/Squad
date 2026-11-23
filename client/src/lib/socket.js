import { io } from 'socket.io-client';
import { getToken } from './api.js';

// Conexão Socket.io
let socket = null;

export function connectSocket() {
  if (socket) return socket;
  socket = io({ auth: { token: getToken() } });
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
