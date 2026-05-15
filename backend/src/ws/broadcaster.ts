import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { URL } from 'url';
import { userStore } from '../store/userStore';
import { chatStore } from '../chat/chatStore';
import { logStore } from '../store/logStore';

let wss: WebSocketServer | null = null;

export function initWebSocket(server: Server): void {
  wss = new WebSocketServer({ server });
  wss.on('connection', async (ws, req) => {
    const url = new URL(req.url ?? '/', 'http://localhost');

    if (url.pathname !== '/ws' && url.pathname !== '/ws/chat') {
      ws.close();
      return;
    }

    if (url.pathname === '/ws/chat') {
      const roomId = url.searchParams.get('roomId') ?? 'global';
      const userId = url.searchParams.get('userId') ?? '';
      const user = await userStore.getById(userId);

      if (!user) {
        ws.close();
        return;
      }

      (ws as any).roomId = roomId;
      (ws as any).kind = 'chat';
      (ws as any).userId = user.id;
      (ws as any).username = user.username;

      const history = await chatStore.getMessages(roomId, 50);
      ws.send(JSON.stringify({ type: 'CHAT_HISTORY', roomId, messages: history }));

      ws.on('message', async (buffer) => {
        try {
          const payload = JSON.parse(String(buffer));
          if (payload.type !== 'CHAT_MESSAGE') return;
          if (typeof payload.text !== 'string' || payload.text.trim().length === 0) return;

          const message = await chatStore.addMessage({
            roomId,
            userId: user.id,
            username: user.username,
            text: payload.text.trim(),
            createdAt: new Date().toISOString(),
          });

          await logStore.logAction({
            userId: user.id,
            roleCode: user.roleCode,
            action: 'CHAT_MESSAGE',
            actionInfo: `Room ${roomId}: ${message.text.slice(0, 80)}`,
          });

          wss?.clients.forEach((client) => {
            if (client.readyState !== WebSocket.OPEN) return;
            if ((client as any).kind !== 'chat') return;
            if ((client as any).roomId !== roomId) return;
            client.send(JSON.stringify({ type: 'CHAT_MESSAGE', message }));
          });
        } catch {
          // ignore malformed chat messages
        }
      });
    }

    ws.on('error', console.error);
  });
}

export function broadcast(data: unknown): void {
  if (!wss) return;
  const message = JSON.stringify(data);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}
