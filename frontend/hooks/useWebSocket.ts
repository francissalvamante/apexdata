import { ConnectionStatus, WebSocketMessage } from "@/lib/telemetry-types";
import { useCallback, useEffect, useRef, useState } from "react";

interface UseWebSocketReturn {
  connectionStatus: ConnectionStatus;
  lastMessage: WebSocketMessage | null;
  sendMessage: (message: any) => void;
  connect: () => void;
  disconnect: () => void;
}

export const useWebSocket = (url: string): UseWebSocketReturn => {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(
    ConnectionStatus.DISCONNECTED
  );
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);

  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeoutId = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) return;

    setConnectionStatus(ConnectionStatus.CONNECTING);

    try {
      ws.current = new WebSocket(url);

      ws.current.onopen = () => {
        console.log("✅ WebSocket connected to F1 telemetry backend");
        setConnectionStatus(ConnectionStatus.CONNECTED);
        reconnectAttempts.current = 0;
      };

      ws.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          setLastMessage(message);

          if (message.type === "telemetry") {
            console.log(
              `🏎️ Telemetry: ${message.data.speed} KPH, ${message.data.engineRPM} RPM, Gear ${message.data.gear}`
            );
          } else if (message.type === "lapData") {
            console.log(
              `⏱️ Lap Data: Position ${message.data.carPosition}, Lap: ${message.data.currentLapNum}`
            );
          }
        } catch (error) {
          console.error("❌ Error parsing WebSocket message:", error);
        }
      };

      ws.current.onclose = (event) => {
        console.log("🔌 WebSocket disconnected:", event.reason);
        setConnectionStatus(ConnectionStatus.DISCONNECTED);

        if (reconnectAttempts.current < maxReconnectAttempts) {
          const timeout = Math.min(
            1000 * Math.pow(2, reconnectAttempts.current),
            30000
          );
          console.log(
            `🔄️ Reconnecting in ${timeout}ms... (attempt ${
              reconnectAttempts.current + 1
            }/${maxReconnectAttempts})`
          );

          reconnectTimeoutId.current = setTimeout(() => {
            reconnectAttempts.current++;
            connect();
          }, timeout);
        }
      };

      ws.current.onerror = (error) => {
        console.error("❌ WebSocket error:", error);
        setConnectionStatus(ConnectionStatus.ERROR);
      };
    } catch (error) {
      console.error("❌ Failed to create WebSocket connection:", error);
      setConnectionStatus(ConnectionStatus.ERROR);
    }
  }, [url]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutId.current) {
      clearTimeout(reconnectTimeoutId.current);
      reconnectTimeoutId.current = null;
    }

    if (ws.current) {
      ws.current.close();
      ws.current = null;
    }

    setConnectionStatus(ConnectionStatus.DISCONNECTED);
    reconnectAttempts.current = 0;
  }, []);

  const sendMessage = useCallback((message: any) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    } else {
      console.warn("⚠️ WebSocket not connected. Cannot send message");
    }
  }, []);

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    connectionStatus,
    lastMessage,
    sendMessage,
    connect,
    disconnect,
  };
};
