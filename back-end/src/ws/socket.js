import { Server } from 'socket.io';

const io = new Server(process.env.WS_PORT, {
  cors: {
    origin: '*'
  }
});

console.log('WebSocket running on port 3001');

export default io;
