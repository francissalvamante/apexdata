import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { WebSocket } from "ws";
import { TelemetryUDPListener } from "../telemetry/udpListener";
import { TelemetryParser } from "../telemetry/packetParsers";
import { PacketHeader, CarTelemetryData, LapData } from "../types/telemetry";

// Define message types for type safety
interface TelemetryMessage {
  type: "telemetry";
  timestamp: number;
  playerCarIndex: number;
  data: CarTelemetryData;
  suggestedGear: number;
}

interface LapDataMessage {
  type: "lapData";
  timestamp: number;
  playerCarIndex: number;
  data: LapData;
}

interface ConnectedMessage {
  type: "connected";
  message: string;
  timestamp: number;
}

interface ClientMessage {
  action: "start" | "stop";
}

interface TelemetryStatus {
  udp: {
    port: number;
    isListening: boolean;
  };
  connectedClients: number;
  playerCarIndex: number;
}

interface ApiResponse {
  message: string;
  success: boolean;
  error?: string;
}

type WebSocketMessage = TelemetryMessage | LapDataMessage | ConnectedMessage;

export class TelemetryWebSocketServer {
  private udpListener: TelemetryUDPListener;
  private connectedClients: Set<WebSocket> = new Set();
  private playerCarIndex: number = 0;

  constructor() {
    this.udpListener = new TelemetryUDPListener();
    this.setupUDPHandlers();
  }

  private setupUDPHandlers(): void {
    // Handle telemetry data (60Hz)
    this.udpListener.on("telemetry", (buffer: Buffer, header: PacketHeader) => {
      try {
        const telemetryData = TelemetryParser.parseCarTelemetryPacket(
          buffer,
          header
        );

        // Update player car index from header
        this.playerCarIndex = header.playerCarIndex;

        // Send player car data to all connected clients
        const playerData = telemetryData.carTelemetryData[this.playerCarIndex];

        const message: TelemetryMessage = {
          type: "telemetry",
          timestamp: Date.now(),
          playerCarIndex: this.playerCarIndex,
          data: playerData,
          suggestedGear: telemetryData.suggestedGear,
        };

        this.broadcastToClients(message);
      } catch (error) {
        console.error("Error parsing telemetry packet:", error);
      }
    });

    // Handle lap data
    this.udpListener.on("lapData", (buffer: Buffer, header: PacketHeader) => {
      try {
        const lapData = TelemetryParser.parseLapDataPacket(buffer, header);

        // Send player lap data to all connected clients
        const playerLapData = lapData.lapData[this.playerCarIndex];

        const message: LapDataMessage = {
          type: "lapData",
          timestamp: Date.now(),
          playerCarIndex: this.playerCarIndex,
          data: playerLapData,
        };

        this.broadcastToClients(message);
      } catch (error) {
        console.error("Error parsing lap data packet:", error);
      }
    });

    // Handle UDP listener events
    this.udpListener.on(
      "listening",
      (address: { address: string; port: number }) => {
        console.log(`📡 UDP Telemetry listener ready at
  ${address.address}:${address.port}`);
      }
    );

    this.udpListener.on("error", (error: Error) => {
      console.error("UDP Listener error:", error);
    });
  }

  private broadcastToClients(message: WebSocketMessage): void {
    const messageStr = JSON.stringify(message);

    // Send to all connected WebSocket clients
    this.connectedClients.forEach((client) => {
      try {
        if (client.readyState === WebSocket.OPEN) {
          client.send(messageStr);
        }
      } catch (error) {
        console.error("Error sending WebSocket message:", error);
        // Remove dead connections
        this.connectedClients.delete(client);
      }
    });
  }

  public registerWebSocketRoutes(fastifyServer: FastifyInstance): void {
    // WebSocket endpoint for telemetry data
    fastifyServer.register(async (fastifyInstance: FastifyInstance) => {
      fastifyInstance.get(
        "/telemetry",
        { websocket: true },
        (connection: any, req: FastifyRequest) => {
          console.log("🔌 New WebSocket client connected");

          // The connection object IS the socket in newer versions
          const socket = connection.socket || connection;

          // Add client to our set
          this.connectedClients.add(socket);

          // Send connection confirmation
          const welcomeMessage: ConnectedMessage = {
            type: "connected",
            message: "Connected to F1 Telemetry WebSocket",
            timestamp: Date.now(),
          };

          socket.send(JSON.stringify(welcomeMessage));

          // Handle client disconnect
          socket.on("close", () => {
            console.log("🔌 WebSocket client disconnected");
            this.connectedClients.delete(socket);
          });

          // Handle client messages (optional)
          socket.on("message", (message: Buffer) => {
            try {
              const data: ClientMessage = JSON.parse(message.toString());
              console.log("📨 Received from client:", data);

              // Handle client requests (e.g., start/stop telemetry)
              if (data.action === "start") {
                this.startTelemetry().catch(console.error);
              } else if (data.action === "stop") {
                this.stopTelemetry().catch(console.error);
              }
            } catch (error) {
              console.error("Error parsing client message:", error);
            }
          });
        }
      );
    });

    // REST endpoint to get telemetry status
    fastifyServer.get(
      "/api/telemetry/status",
      async (
        request: FastifyRequest,
        reply: FastifyReply
      ): Promise<TelemetryStatus> => {
        const udpStats = this.udpListener.getStats();
        return {
          udp: udpStats,
          connectedClients: this.connectedClients.size,
          playerCarIndex: this.playerCarIndex,
        };
      }
    );

    // REST endpoint to start telemetry
    fastifyServer.post(
      "/api/telemetry/start",
      async (
        request: FastifyRequest,
        reply: FastifyReply
      ): Promise<ApiResponse> => {
        try {
          await this.startTelemetry();
          return { message: "Telemetry started", success: true };
        } catch (error) {
          reply.code(500);
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
          return {
            message: "Failed to start telemetry",
            success: false,
            error: errorMessage,
          };
        }
      }
    );

    // REST endpoint to stop telemetry
    fastifyServer.post(
      "/api/telemetry/stop",
      async (
        request: FastifyRequest,
        reply: FastifyReply
      ): Promise<ApiResponse> => {
        try {
          await this.stopTelemetry();
          return { message: "Telemetry stopped", success: true };
        } catch (error) {
          reply.code(500);
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
          return {
            message: "Failed to stop telemetry",
            success: false,
            error: errorMessage,
          };
        }
      }
    );
  }

  public async startTelemetry(): Promise<void> {
    try {
      await this.udpListener.start();
      console.log("🏁 F1 Telemetry service started");
    } catch (error) {
      console.error("Failed to start telemetry:", error);
      throw error;
    }
  }

  public async stopTelemetry(): Promise<void> {
    try {
      await this.udpListener.stop();
      console.log("🛑 F1 Telemetry service stopped");
    } catch (error) {
      console.error("Failed to stop telemetry:", error);
      throw error;
    }
  }

  public getConnectedClientsCount(): number {
    return this.connectedClients.size;
  }
}
