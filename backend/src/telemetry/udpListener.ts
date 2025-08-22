import { EventEmitter } from "events";
import * as dgram from "dgram";
import { PacketHeader, PacketType } from "../types/telemetry";

export class TelemetryUDPListener extends EventEmitter {
  private socket: dgram.Socket;
  private port: number;
  private isListening: boolean = false;

  constructor(port: number = 20777) {
    super();
    this.port = port;
    this.socket = dgram.createSocket("udp4");
    this.setupSocketHandlers();
  }

  private setupSocketHandlers(): void {
    // When we receive a UDP packet
    this.socket.on("message", (buffer: Buffer, rinfo) => {
      try {
        // Parse the packet header first to determine packet type
        const header = this.parsePacketHeader(buffer);
        
        // Emit different events based on packet type
        switch (header.packetId) {
          case PacketType.CAR_TELEMETRY:
            this.emit("telemetry", buffer, header);
            break;
          case PacketType.LAP_DATA:
            this.emit("lapData", buffer, header);
            break;
          case PacketType.SESSION:
            this.emit("session", buffer, header);
            break;
          case PacketType.PARTICIPANTS:
            this.emit("participants", buffer, header);
            break;
          case PacketType.MOTION:
            this.emit("motion", buffer, header);
            break;
          case PacketType.EVENT:
            this.emit("event", buffer, header);
            break;
          case PacketType.CAR_SETUPS:
            this.emit("carSetups", buffer, header);
            break;
          case PacketType.CAR_STATUS:
            this.emit("carStatus", buffer, header);
            break;
          case PacketType.TIME_TRIAL:
            this.emit("timeTrial", buffer, header);
            break;
          case PacketType.LAP_POSITIONS:
            this.emit("lapPositions", buffer, header);
            break;
          default:
            this.emit("unknownPacket", buffer, header);
        }
      } catch (error) {
        console.error("Error parsing UDP packet:", error);
        this.emit("error", error);
      }
    });

    // When socket starts listening
    this.socket.on("listening", () => {
      const address = this.socket.address();
      this.isListening = true;
      this.emit("listening", address);
    });

    // Handle socket errors
    this.socket.on("error", (error) => {
      console.error("UDP Socket error:", error);
      this.emit("error", error);
    });

    // When socket closes
    this.socket.on("close", () => {
      this.isListening = false;
      this.emit("close");
    });
  };

  private parsePacketHeader(buffer: Buffer): PacketHeader {
    let offset = 0;

    const packetFormat = buffer.readUInt16LE(offset);
    offset += 2;

    const gameYear = buffer.readUInt8(offset);
    offset += 1;

    const gameMajorVersion = buffer.readUInt8(offset);
    offset += 1;

    const gameMinorVersion = buffer.readUInt8(offset);
    offset += 1;

    const packetVersion = buffer.readUInt8(offset);
    offset += 1;

    const packetId = buffer.readUInt8(offset);
    offset += 1;

    const sessionUID = buffer.readBigUInt64LE(offset);
    offset += 8;

    const sessionTime = buffer.readFloatLE(offset);
    offset += 4;

    const frameIdentifier = buffer.readUInt32LE(offset);
    offset += 4;

    const overallFrameIdentifier = buffer.readUInt32LE(offset);
    offset += 4;

    const playerCarIndex = buffer.readUInt8(offset);
    offset += 1;

    const secondaryPlayerCarIndex = buffer.readUInt8(offset);

    return {
      packetFormat,
      gameYear,
      gameMajorVersion,
      gameMinorVersion,
      packetVersion,
      packetId,
      sessionUID,
      sessionTime,
      frameIdentifier,
      overallFrameIdentifier,
      playerCarIndex,
      secondaryPlayerCarIndex,
    };
  }

  public start(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isListening) {
        resolve();
        return;
      }

      this.socket.once("listening", () => resolve());
      this.socket.once("error", (error) => reject(error));

      try {
        this.socket.bind(this.port);
      } catch (error) {
        reject(error);
      }
    });
  }

  public stop(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.isListening) {
        resolve();
        return;
      }

      this.socket.once("close", () => resolve());
      this.socket.close();
    });
  }

  public getStats(): { port: number; isListening: boolean } {
    return {
      port: this.port,
      isListening: this.isListening,
    };
  }
}
