import http from 'http';
import app from './app';
import { initWebSocket } from './ws/broadcaster';

const PORT = process.env.PORT ?? 3000;

const server = http.createServer(app);
initWebSocket(server);

server.listen(PORT, () => {
  console.log(`VOLT VYBE API  →  http://localhost:${PORT}`);
  console.log(`  REST    GET  http://localhost:${PORT}/api/items`);
  console.log(`  GraphQL POST http://localhost:${PORT}/graphql`);
  console.log(`  WS           ws://localhost:${PORT}/ws`);
});
