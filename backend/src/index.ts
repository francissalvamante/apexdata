import dotenv from "dotenv";
import Fastify from "fastify";
import cors from "@fastify/cors";
import websocket from "@fastify/websocket";
import { TelemetryWebSocketServer } from "./websocket/telemetryWebSocket";

dotenv.config();

const fastify = Fastify({
  logger: true,
});

const telemetryServer = new TelemetryWebSocketServer();

const start = async (): Promise<void> => {
  try {
    await fastify.register(cors, {
      origin: ["http://localhost:3000"],
      credentials: true,
    });

    await fastify.register(websocket);

    telemetryServer.registerWebSocketRoutes(fastify);

    fastify.get("/health", async (request, reply) => {
      return {
        status: "OK!",
        timestamp: new Date().toISOString(),
        telemetry: {
          connectedClients: telemetryServer.getConnectedClientsCount(),
        },
      };
    });

    const port = parseInt(process.env.PORT || "3001");
    await fastify.listen({ port, host: "0.0.0.0" });

    console.log(`🚀 Server running on http://localhost:${port}`);
    console.log(`📡 WebSocket available at ws://localhost:${port}/telemetry`);
    console.log(`🏎️  F1 Telemetry API ready`);

    // Auto-start telemetry UDP listener
    await telemetryServer.startTelemetry()
  } catch (error) {
    fastify.log.error(error);
    process.exit(1);
  }
};

start();
