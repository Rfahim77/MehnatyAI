import { useEffect, useRef, useState, useCallback } from "react";

interface CollaborationMessage {
  type: "joined" | "user_joined" | "user_left" | "resume_update" | "cursor_move" | "pong";
  clientId?: string;
  sessionId?: string;
  collaborators?: number;
  data?: any;
}

interface UseCollaborationOptions {
  sessionId: string;
  onResumeUpdate?: (data: any, clientId: string) => void;
  onCollaboratorsChange?: (count: number) => void;
}

export function useCollaboration({ sessionId, onResumeUpdate, onCollaboratorsChange }: UseCollaborationOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [collaborators, setCollaborators] = useState(0);
  const [clientId, setClientId] = useState<string>("");
  const isUnmountedRef = useRef(false);
  const onResumeUpdateRef = useRef(onResumeUpdate);
  const onCollaboratorsChangeRef = useRef(onCollaboratorsChange);

  useEffect(() => {
    onResumeUpdateRef.current = onResumeUpdate;
    onCollaboratorsChangeRef.current = onCollaboratorsChange;
  }, [onResumeUpdate, onCollaboratorsChange]);

  const connect = useCallback(() => {
    if (isUnmountedRef.current) {
      console.log("[WS] Component unmounted, skipping connection");
      return;
    }
    
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws/collaborate`;
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("[WS] Connected to collaboration server");
      setIsConnected(true);
      
      ws.send(JSON.stringify({
        type: "join",
        sessionId
      }));
    };

    ws.onmessage = (event) => {
      try {
        const message: CollaborationMessage = JSON.parse(event.data);
        
        switch (message.type) {
          case "joined":
            setClientId(message.clientId || "");
            setCollaborators(message.collaborators || 0);
            onCollaboratorsChangeRef.current?.(message.collaborators || 0);
            break;

          case "user_joined":
          case "user_left":
            setCollaborators(message.collaborators || 0);
            onCollaboratorsChangeRef.current?.(message.collaborators || 0);
            break;

          case "resume_update":
            if (message.clientId && message.data) {
              onResumeUpdateRef.current?.(message.data, message.clientId);
            }
            break;
            
          case "cursor_move":
            break;
        }
      } catch (error) {
        console.error("[WS] Message parse error:", error);
      }
    };

    ws.onerror = (error) => {
      console.error("[WS] WebSocket error:", error);
      setIsConnected(false);
    };

    ws.onclose = () => {
      console.log("[WS] Disconnected from collaboration server");
      setIsConnected(false);
      
      if (!isUnmountedRef.current) {
        console.log("[WS] Attempting to reconnect in 3 seconds...");
        reconnectTimerRef.current = setTimeout(() => {
          connect();
        }, 3000);
      }
    };
  }, [sessionId]);

  useEffect(() => {
    isUnmountedRef.current = false;
    connect();
    
    return () => {
      isUnmountedRef.current = true;
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: "leave" }));
        wsRef.current.close();
      }
    };
  }, [connect]);

  const broadcastResumeUpdate = useCallback((data: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: "resume_update",
        sessionId,
        data
      }));
    }
  }, [sessionId]);

  const broadcastCursorMove = useCallback((data: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: "cursor_move",
        sessionId,
        data
      }));
    }
  }, [sessionId]);

  return {
    isConnected,
    collaborators,
    clientId,
    broadcastResumeUpdate,
    broadcastCursorMove
  };
}
