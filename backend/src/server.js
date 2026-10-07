import 'dotenv/config';
import { createServer } from 'http';
import app from './app.js';
import { initSockets } from './sockets/index.js';
import { Server } from 'socket.io';

const PORT = process.env.PORT || 5000;
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true },
});

app.set('io', io);
global.io = io;
initSockets(io);

httpServer.listen(PORT, () => {
  console.log(`ProjectMarket DBU API listening on http://localhost:${PORT}`);
});
