import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';

class WebSocketManager {
  private wss: WebSocketServer | null = null;
  private clients: Set<WebSocket> = new Set();

  public init(server: http.Server): void {
    this.wss = new WebSocketServer({ server, path: '/ws' });

    this.wss.on('connection', (ws: WebSocket) => {
      this.clients.add(ws);

      // Send initial handshake
      ws.send(JSON.stringify({
        type: 'CONNECTED',
        message: 'Connected to Dhaka Tesla Live Stream',
        timestamp: new Date().toISOString()
      }));

      ws.on('close', () => {
        this.clients.delete(ws);
      });

      ws.on('error', (err) => {
        console.error('WebSocket client error:', err);
        this.clients.delete(ws);
      });
    });

    console.log('Dhaka Tesla WebSocket Server initialized on /ws');
  }

  public broadcast(event: { type: string; payload: any }): void {
    const data = JSON.stringify({
      ...event,
      timestamp: new Date().toISOString()
    });

    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    }
  }
}

export const wsService = new WebSocketManager();
