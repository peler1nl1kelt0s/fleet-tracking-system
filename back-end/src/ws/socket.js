import { Server } from 'socket.io';

let io;

export function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
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
