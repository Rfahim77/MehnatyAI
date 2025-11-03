import { WebSocketServer, WebSocket } from "ws";
import { Server as HTTPServer } from "http";
import { randomUUID } from "crypto";

interface WSClient {
  id: string;
  sessionId: string;
  ws: WebSocket;
}

interface WSMessage {
  type: "join" | "leave" | "resume_update" | "cursor_move" | "ping";
  sessionId?: string;
  data?: any;
  clientId?: string;
}

export class CollaborativeEditingServer {
  private wss: WebSocketServer;
  private clients: Map<string, WSClient> = new Map();
  private sessions: Map<string, Set<string>> = new Map();

  constructor(server: HTTPServer) {
    this.wss = new WebSocketServer({ server, path: "/ws/collaborate" });
    this.setupWSServer();
  }

  private setupWSServer() {
    this.wss.on("connection", (ws: WebSocket) => {
      const clientId = randomUUID();
      console.log(`[WS] New client connected: ${clientId}`);

      ws.on("message", (data: Buffer) => {
        try {
          const message: WSMessage = JSON.parse(data.toString());
          this.handleMessage(clientId, ws, message);
        } catch (error) {
          console.error("[WS] Invalid message:", error);
        }
      });

      ws.on("close", () => {
        this.handleDisconnect(clientId);
      });

      ws.on("error", (error) => {
        console.error(`[WS] Client ${clientId} error:`, error);
        this.handleDisconnect(clientId);
      });
    });
  }

  private handleMessage(clientId: string, ws: WebSocket, message: WSMessage) {
    const client = this.clients.get(clientId);
    
    switch (message.type) {
      case "join":
        if (message.sessionId) {
          this.handleJoin(clientId, ws, message.sessionId);
        }
        break;

      case "resume_update":
        if (message.sessionId && message.data) {
          if (client && client.sessionId === message.sessionId) {
            this.broadcastToSession(message.sessionId, {
              type: "resume_update",
              data: message.data,
              clientId
            }, clientId);
          } else {
            console.warn(`[WS] Client ${clientId} attempted to update session ${message.sessionId} but is in ${client?.sessionId}`);
          }
        }
        break;

      case "cursor_move":
        if (message.sessionId && message.data) {
          if (client && client.sessionId === message.sessionId) {
            this.broadcastToSession(message.sessionId, {
              type: "cursor_move",
              data: message.data,
              clientId
            }, clientId);
          }
        }
        break;

      case "ping":
        this.sendToClient(clientId, { type: "pong" });
        break;

      case "leave":
        this.handleDisconnect(clientId);
        break;
    }
  }

  private handleJoin(clientId: string, ws: WebSocket, sessionId: string) {
    const existingClient = this.clients.get(clientId);
    
    if (existingClient && existingClient.sessionId !== sessionId) {
      const oldSessionId = existingClient.sessionId;
      if (this.sessions.has(oldSessionId)) {
        this.sessions.get(oldSessionId)!.delete(clientId);
        if (this.sessions.get(oldSessionId)!.size === 0) {
          this.sessions.delete(oldSessionId);
        } else {
          this.broadcastToSession(oldSessionId, {
            type: "user_left",
            clientId,
            collaborators: this.sessions.get(oldSessionId)!.size
          });
        }
      }
    }
    
    const client: WSClient = { id: clientId, sessionId, ws };
    this.clients.set(clientId, client);

    if (!this.sessions.has(sessionId)) {
      this.sessions.set(sessionId, new Set());
    }
    this.sessions.get(sessionId)!.add(clientId);

    console.log(`[WS] Client ${clientId} joined session ${sessionId}`);
    
    this.sendToClient(clientId, {
      type: "joined",
      sessionId,
      clientId,
      collaborators: this.sessions.get(sessionId)!.size
    });

    this.broadcastToSession(sessionId, {
      type: "user_joined",
      clientId,
      collaborators: this.sessions.get(sessionId)!.size
    }, clientId);
  }

  private handleDisconnect(clientId: string) {
    const client = this.clients.get(clientId);
    if (!client) return;

    const sessionId = client.sessionId;
    this.clients.delete(clientId);

    if (this.sessions.has(sessionId)) {
      this.sessions.get(sessionId)!.delete(clientId);
      
      if (this.sessions.get(sessionId)!.size === 0) {
        this.sessions.delete(sessionId);
      } else {
        this.broadcastToSession(sessionId, {
          type: "user_left",
          clientId,
          collaborators: this.sessions.get(sessionId)!.size
        });
      }
    }

    console.log(`[WS] Client ${clientId} disconnected from session ${sessionId}`);
  }

  private broadcastToSession(sessionId: string, message: any, excludeClientId?: string) {
    const sessionClients = this.sessions.get(sessionId);
    if (!sessionClients) return;

    sessionClients.forEach(id => {
      if (id !== excludeClientId) {
        this.sendToClient(id, message);
      }
    });
  }

  private sendToClient(clientId: string, message: any) {
    const client = this.clients.get(clientId);
    if (client && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(message));
    }
  }

  public getSessionCollaborators(sessionId: string): number {
    return this.sessions.get(sessionId)?.size || 0;
  }
}
