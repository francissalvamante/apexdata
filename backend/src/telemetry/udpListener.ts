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
      console.log(`📦 Received UDP packet: ${buffer.length} bytes from ${rinfo.address}:${rinfo.port}`);
      try {
        // Parse the packet header first to determine packet type
        const header = this.parsePacketHeader(buffer);
        console.log(`🔍 Packet ID: ${header.packetId}, Format: ${header.packetFormat}`);
        
        // Emit different events based on packet type
        switch (header.packetId) {
          case PacketType.CAR_TELEMETRY:
            console.log('🏎️  Processing telemetry packet');
            this.emit("telemetry", buffer, header);
            break;
          case PacketType.LAP_DATA:
            console.log('⏱️  Processing lap data packet');
            this.emit("lapData", buffer, header);
            break;
          case PacketType.SESSION:
            console.log('📊 Processing session packet');
            this.emit("session", buffer, header);
            break;
          case PacketType.PARTICIPANTS:
            console.log('👥 Processing participants packet');
            this.emit("participants", buffer, header);
            break;
          case PacketType.MOTION:
            console.log('🌐 Processing motion packet');
            this.emit("motion", buffer, header);
            break;
          case PacketType.EVENT:
            console.log('📣 Processing event packet');
            this.emit("event", buffer, header);
            break;
          case PacketType.CAR_SETUPS:
            console.log('🔧 Processing car setups packet');
            this.emit("carSetups", buffer, header);
            break;
          case PacketType.CAR_STATUS:
            console.log('📋 Processing car status packet');
            this.emit("carStatus", buffer, header);
            break;
          case PacketType.TIME_TRIAL:
            console.log('⏰ Processing time trial packet');
            this.emit("timeTrial", buffer, header);
            break;
          case PacketType.LAP_POSITIONS:
            console.log('🏁 Processing lap positions packet');
            this.emit("lapPositions", buffer, header);
            break;
          default:
            console.log(`❓ Unknown packet type: ${header.packetId}`);
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
      console.log(`🏎️  F1 Telemetry UDP listener started on ${address.address}:${address.port}`);
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
      console.log("UDP socket closed");
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
