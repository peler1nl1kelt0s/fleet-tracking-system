import { Server } from 'socket.io';

let io;

export function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  console.log('✅ Socket.IO initialized');
  return io;
}

export function getIO() {
  if (!io) {
    throw new Error('❌ Socket.IO not initialized');
  }
  return io;
}
