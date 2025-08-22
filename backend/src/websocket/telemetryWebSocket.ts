import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { WebSocket } from "ws";
import { TelemetryUDPListener } from "../telemetry/udpListener";
import { TelemetryParser } from "../telemetry/packetParsers";
import { PacketHeader, CarTelemetryData, LapData } from "../types/telemetry";
import SessionManager, { TelemetryDataPoint } from "../services/sessionManager";
import DatabaseService from "../services/databaseService";

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
  action: "start" | "stop" | "startSession" | "endSession";
  sessionName?: string;
  playerName: string;
  track?: string;
  car?: string;
  sessionType?: string;
}

interface TelemetryStatus {
  udp: {
    port: number;
    isListening: boolean;
  };
  connectedClients: number;
  playerCarIndex: number;
  session: {
    hasActiveSession: boolean;
    currentSessionName: string | null;
    currentLap: number | null;
    isInFlyingLap: boolean;
    totalLaps: number;
  };
  database: {
    isConnected: boolean;
  };
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
  private sessionManager: SessionManager;
  private databaseService: DatabaseService;
  private telemetryBuffer: TelemetryDataPoint[] = [];
  private readonly BATCH_SIZE = 20; // Reduced batch size to prevent database timeouts

  constructor() {
    this.udpListener = new TelemetryUDPListener();
    this.sessionManager = new SessionManager();
    this.databaseService = new DatabaseService();
    this.setupUDPHandlers();
    this.setupSessionHandlers();
  }

  private setupUDPHandlers(): void {
    // Store both telemetry and lap data for session processing
    let latestTelemetryData: CarTelemetryData | null = null;
    let latestLapData: LapData | null = null;
    let latestHeader: PacketHeader | null = null;

    // Handle telemetry data (60Hz)
    this.udpListener.on("telemetry", (buffer: Buffer, header: PacketHeader) => {
      try {
        const telemetryData = TelemetryParser.parseCarTelemetryPacket(
          buffer,
          header
        );

        // Update player car index from header
        this.playerCarIndex = header.playerCarIndex;
        const playerData = telemetryData.carTelemetryData[this.playerCarIndex];
        // Store for session processing
        latestTelemetryData = playerData;
        latestHeader = header;

        // Send live telemetry data to connected clients (limited data for performance)
        const message: TelemetryMessage = {
          type: "telemetry",
          timestamp: Date.now(),
          playerCarIndex: this.playerCarIndex,
          data: {
            speed: playerData.speed,
            gear: playerData.gear,
            engineRPM: playerData.engineRPM,
            drs: playerData.drs,
            brakesTemperature: playerData.brakesTemperature,
            tyresSurfaceTemperature: playerData.tyresSurfaceTemperature,
            engineTemperature: playerData.engineTemperature,
          } as CarTelemetryData,
          suggestedGear: telemetryData.suggestedGear,
        };

        this.broadcastToClients(message);

        // Process for session storage if we have both telemetry and lap data
        if (latestTelemetryData && latestLapData && latestHeader) {
          this.sessionManager.processTelemetryData(
            latestTelemetryData,
            latestLapData,
            latestHeader
          );
        }
      } catch (error) {
        console.error("Error parsing telemetry packet:", error);
      }
    });

    // Handle lap data
    this.udpListener.on("lapData", (buffer: Buffer, header: PacketHeader) => {
      try {
        const lapData = TelemetryParser.parseLapDataPacket(buffer, header);
        const playerLapData = lapData.lapData[this.playerCarIndex];

        // Store for session processing
        latestLapData = playerLapData;

        // Send limited lap data to clients for status updates
        const message: LapDataMessage = {
          type: "lapData",
          timestamp: Date.now(),
          playerCarIndex: this.playerCarIndex,
          data: {
            currentLapNum: playerLapData.currentLapNum,
            carPosition: playerLapData.carPosition,
            currentLapTimeInMS: playerLapData.currentLapTimeInMS,
            driverStatus: playerLapData.driverStatus,
            pitStatus: playerLapData.pitStatus,
          } as LapData,
        };

        this.broadcastToClients(message);

        // Process for session storage if we have both telemetry and lap data
        if (latestTelemetryData && latestLapData && latestHeader) {
          this.sessionManager.processTelemetryData(
            latestTelemetryData,
            latestLapData,
            latestHeader
          );
        }
      } catch (error) {
        console.error("Error parsing lap data packet:", error);
      }
    });

    // Handle UDP listener events
    this.udpListener.on(
      "listening",
      (address: { address: string; port: number }) => {
      }
    );

    this.udpListener.on("error", (error: Error) => {
      console.error("UDP Listener error:", error);
    });
  }

  private setupSessionHandlers(): void {
    // Handle session events from SessionManager
    this.sessionManager.on("sessionStarted", async (session) => {
      try {
        await this.databaseService.saveSession(session);
      } catch (error) {
        console.error("❌ Failed to save session to database:", error);
      }
    });

    this.sessionManager.on("sessionEnded", async (session) => {
      try {
        await this.databaseService.updateSession(session);
        // Flush any remaining telemetry data
        await this.flushTelemetryBuffer();
      } catch (error) {
        console.error("❌ Failed to update session in database:", error);
      }
    });

    this.sessionManager.on("lapStarted", async (lap) => {
      try {
        await this.databaseService.saveLap(lap);
      } catch (error) {
        console.error("❌ Failed to save started lap to database:", error);
      }
    });

    this.sessionManager.on("lapCompleted", async (lap) => {
      try {
        await this.databaseService.updateLap(lap);
        
        // Flush telemetry buffer so completed lap data is immediately available
        // Add small delay to ensure database transaction is fully committed
        await new Promise(resolve => setTimeout(resolve, 100));
        await this.flushTelemetryBufferWithRetry(lap.lapNumber);
      } catch (error) {
        console.error("❌ Failed to update completed lap in database:", error);
      }
    });

    this.sessionManager.on("telemetryStored", async (dataPoint) => {
      // Buffer telemetry data and flush in batches for performance
      this.telemetryBuffer.push(dataPoint);

      if (this.telemetryBuffer.length >= this.BATCH_SIZE) {
        await this.flushTelemetryBuffer();
      }
    });

    this.sessionManager.on("error", (error) => {
      console.error("SessionManager error:", error);
    });
  }

  private async flushTelemetryBuffer(): Promise<void> {
    if (this.telemetryBuffer.length === 0) return;

    try {
      // Process in smaller chunks to prevent timeouts
      await this.flushTelemetryInChunks([...this.telemetryBuffer]);
      this.telemetryBuffer.length = 0; // Clear buffer
    } catch (error) {
      console.error("❌ Failed to flush telemetry buffer:", error);
    }
  }

  private async flushTelemetryInChunks(dataPoints: TelemetryDataPoint[], chunkSize = 10): Promise<void> {
    const totalPoints = dataPoints.length;

    for (let i = 0; i < dataPoints.length; i += chunkSize) {
      const chunk = dataPoints.slice(i, i + chunkSize);
      const chunkNumber = Math.floor(i / chunkSize) + 1;
      const totalChunks = Math.ceil(dataPoints.length / chunkSize);
      
      try {
        await this.databaseService.saveTelemetryData(chunk);
      } catch (error: any) {
        console.error(`❌ Failed to save chunk ${chunkNumber}/${totalChunks}:`, error);
        
        // If it's a timeout (524) or connection error, log and continue with next chunk
        if (error?.code === 'ECONNRESET' || error?.message?.includes('timeout') || error?.message?.includes('524')) {
          continue;
        }
        
        // For other errors, still try to continue
      }
      
      // Small delay between chunks to prevent overwhelming the database
      if (i + chunkSize < dataPoints.length) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }
    
  }

  private async flushTelemetryBufferWithRetry(lapNumber: number, maxRetries = 3): Promise<void> {
    if (this.telemetryBuffer.length === 0) return;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.databaseService.saveTelemetryData([...this.telemetryBuffer]);
        this.telemetryBuffer.length = 0; // Clear buffer
        return;
      } catch (error: any) {
        // If it's a duplicate key error (23505), the database service will handle it gracefully
        if (error?.code === '23505') {
          // Duplicate entries are now handled in databaseService, no need to log as error
          this.telemetryBuffer.length = 0; // Clear buffer since duplicates are handled
          return;
        }
        
        console.error(`❌ Failed to flush telemetry buffer (attempt ${attempt}/${maxRetries}):`, error);
        
        // If it's a foreign key constraint error and we have retries left, wait and try again
        if (error?.code === '23503' && attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 200));
        } else if (attempt === maxRetries) {
          console.error(`💥 Failed to flush telemetry buffer after ${maxRetries} attempts for lap ${lapNumber}`);
          // Clear buffer to prevent memory buildup on permanent failures
          this.telemetryBuffer.length = 0;
        }
      }
    }
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
            this.connectedClients.delete(socket);
          });

          // Handle client messages (optional)
          socket.on("message", (message: Buffer) => {
            try {
              const data: ClientMessage = JSON.parse(message.toString());

              // Handle client requests
              if (data.action === "start") {
                this.startTelemetry().catch(console.error);
              } else if (data.action === "stop") {
                this.stopTelemetry().catch(console.error);
              } else if (data.action === "startSession") {
                if (data.sessionName) {
                  this.sessionManager
                    .startSession(data.sessionName, data.playerName, {
                      track: data.track,
                      car: data.car,
                      sessionType: data.sessionType,
                    })
                    .catch(console.error);
                }
              } else if (data.action === "endSession") {
                this.sessionManager.endSession().catch(console.error);
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
        const sessionStatus = this.sessionManager.getSessionStatus();

        return {
          udp: udpStats,
          connectedClients: this.connectedClients.size,
          playerCarIndex: this.playerCarIndex,
          session: {
            hasActiveSession: sessionStatus.hasActiveSession,
            currentSessionName: sessionStatus.currentSession?.name || null,
            currentLap: sessionStatus.currentLap?.lapNumber || null,
            isInFlyingLap: sessionStatus.isInFlyingLap,
            totalLaps: sessionStatus.currentSession?.totalLaps || 0,
          },
          database: {
            isConnected: this.databaseService.isReady(),
          },
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

    // REST endpoint to start a recording session
    fastifyServer.post(
      "/api/session/start",
      async (
        request: FastifyRequest<{
          Body: {
            sessionName: string;
            playerName: string;
            track?: string;
            car?: string;
            sessionType?: string;
          };
        }>,
        reply: FastifyReply
      ): Promise<ApiResponse> => {
        try {
          const { sessionName, playerName, track, car, sessionType } =
            request.body;

          if (!sessionName) {
            reply.code(400);
            return {
              message: "Session name is required",
              success: false,
              error: "Missing sessionName in request body",
            };
          }

          await this.sessionManager.startSession(sessionName, playerName, {
            track,
            car,
            sessionType,
          });

          return {
            message: `Recording session "${sessionName}" started`,
            success: true,
          };
        } catch (error) {
          reply.code(500);
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
          return {
            message: "Failed to start recording session",
            success: false,
            error: errorMessage,
          };
        }
      }
    );

    // REST endpoint to end current recording session
    fastifyServer.post(
      "/api/session/end",
      async (
        request: FastifyRequest,
        reply: FastifyReply
      ): Promise<ApiResponse> => {
        try {
          const session = await this.sessionManager.endSession();

          if (!session) {
            reply.code(400);
            return {
              message: "No active session to end",
              success: false,
              error: "No active recording session found",
            };
          }

          return {
            message: `Recording session "${session.name}" ended with ${session.totalLaps} laps`,
            success: true,
          };
        } catch (error) {
          reply.code(500);
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
          return {
            message: "Failed to end recording session",
            success: false,
            error: errorMessage,
          };
        }
      }
    );

    // REST endpoint to get all sessions (for history page)
    fastifyServer.get(
      "/api/sessions",
      async (request: FastifyRequest, reply: FastifyReply) => {
        try {
          const sessions = await this.databaseService.getAllSessions();
          return { sessions, success: true };
        } catch (error) {
          reply.code(500);
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
          return {
            message: "Failed to fetch sessions",
            success: false,
            error: errorMessage,
            sessions: [],
          };
        }
      }
    );

    // REST endpoint to get session details with telemetry data
    fastifyServer.get(
      "/api/sessions/:sessionId",
      async (
        request: FastifyRequest<{
          Params: { sessionId: string };
        }>,
        reply: FastifyReply
      ) => {
        try {
          const { sessionId } = request.params;
          const sessionDetails = await this.databaseService.getSessionDetails(
            sessionId
          );

          if (!sessionDetails) {
            reply.code(404);
            return {
              message: "Session not found",
              success: false,
              error: `Session with ID ${sessionId} not found`,
            };
          }

          return {
            ...sessionDetails,
            success: true,
          };
        } catch (error) {
          reply.code(500);
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
          return {
            message: "Failed to fetch session details",
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
