import fs from 'fs';
import http from 'http';
import https from 'https';
import path from 'path';
import app from './app';
import { initWebSocket } from './ws/broadcaster';

const PORT  = Number(process.env.PORT ?? 3000);
const HOST  = process.env.HOST ?? '0.0.0.0';
const USE_HTTPS = process.env.HTTPS === 'true';

let server: http.Server | https.Server;

if (USE_HTTPS) {
  const certPath = path.resolve(process.cwd(), process.env.TLS_CERT ?? './certs/cert.pem');
  const keyPath  = path.resolve(process.cwd(), process.env.TLS_KEY  ?? './certs/key.pem');

  if (!fs.existsSync(certPath) || !fs.existsSync(keyPath)) {
    console.error('❌  TLS cert/key not found. Run:  node scripts/gen-cert.mjs');
    process.exit(1);
  }

  const sslOptions = {
    cert: fs.readFileSync(certPath),
    key:  fs.readFileSync(keyPath),
  };

  server = https.createServer(sslOptions, app);
  console.log('🔒  HTTPS mode enabled');
} else {
  server = http.createServer(app);
  console.log('⚠️   HTTP mode (no TLS) — set HTTPS=true in .env for secure connections');
}

initWebSocket(server);

server.listen(PORT, HOST, () => {
  const proto = USE_HTTPS ? 'https' : 'http';
  const wsProto = USE_HTTPS ? 'wss' : 'ws';
  console.log(`\nVOLT VYBE API  →  ${proto}://${HOST}:${PORT}`);
  console.log(`  REST    GET  ${proto}://${HOST}:${PORT}/api/items`);
  console.log(`  GraphQL POST ${proto}://${HOST}:${PORT}/graphql`);
  console.log(`  WS           ${wsProto}://${HOST}:${PORT}/ws`);
  console.log(`\n  LAN clients: replace ${HOST} with your machine's LAN IP`);
});
