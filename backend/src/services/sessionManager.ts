import { EventEmitter } from "events";
import { v4 as uuidv4 } from "uuid";
import { CarTelemetryData, LapData, PacketHeader } from "../types/telemetry";

export interface Session {
  id: string;
  name: string;
  playerName: string;
  track?: string;
  car?: string;
  sessionType?: string;
  createdAt: Date;
  endedAt?: Date;
  totalLaps: number;
  isActive: boolean;
  metadata?: Record<string, any>;
}

export interface Lap {
  id: string;
  sessionId: string;
  lapNumber: number;
  lapTimeMs?: number;
  sector1TimeMs?: number;
  sector2TimeMs?: number;
  sector3TimeMs?: number;
  isValid: boolean;
  createdAt: Date;
}

export interface TelemetryDataPoint {
  sessionId: string;
  lapId: string;
  distanceFromStart: number;
  lapDistance: number;
  speed: number;
  throttle: number;
  brake: number;
  steer: number;
  gear: number;
  engineRpm: number;
  drs: number;
  engineTemp: number;
  brakeTempRl: number;
  brakeTempRr: number;
  brakeTempFl: number;
  brakeTempFr: number;
  tyreSurfaceTempRl: number;
  tyreSurfaceTempRr: number;
  tyreSurfaceTempFl: number;
  tyreSurfaceTempFr: number;
  tyreInnerTempRl: number;
  tyreInnerTempRr: number;
  tyreInnerTempFl: number;
  tyreInnerTempFr: number;
  tyrePressureRl: number;
  tyrePressureRr: number;
  tyrePressureFl: number;
  tyrePressureFr: number;
  revLightsPercent: number;
  clutch: number;
  surfaceTypeRl: number;
  surfaceTypeRr: number;
  surfaceTypeFl: number;
  surfaceTypeFr: number;
}

export interface SessionManagerEvents {
  sessionStarted: (session: Session) => void;
  sessionEnded: (session: Session) => void;
  lapStarted: (lap: Lap) => void;
  lapCompleted: (lap: Lap) => void;
  telemetryStored: (dataPoint: TelemetryDataPoint) => void;
  error: (error: Error) => void;
}

declare interface SessionManager {
  on<U extends keyof SessionManagerEvents>(
    event: U,
    listener: SessionManagerEvents[U]
  ): this;
  emit<U extends keyof SessionManagerEvents>(
    event: U,
    ...args: Parameters<SessionManagerEvents[U]>
  ): boolean;
}

class SessionManager extends EventEmitter {
  private currentSession: Session | null = null;
  private currentLap: Lap | null = null;
  private lastLapNumber: number = 0;
  private lastDistance: number = 0;
  private isInFlyingLap: boolean = false;
  private trackLength: number = 0; // Will be determined from telemetry

  // Distance tracking for metre-based storage
  private lastStoredDistance: number = -1;
  private readonly DISTANCE_INTERVAL = 1; // Store data every 1 metre

  constructor() {
    super();
  }

  /**
   * Start a new recording session
   */
  public async startSession(
    name: string,
    playerName: string,
    options: {
      track?: string;
      car?: string;
      sessionType?: string;
      metadata?: Record<string, any>;
    } = {}
  ): Promise<Session> {
    if (this.currentSession?.isActive) {
      throw new Error(
        "A session is already active. End the current session first."
      );
    }

    const session: Session = {
      id: this.generateId(),
      name,
      playerName,
      track: options.track,
      car: options.car,
      sessionType: options.sessionType || "custom",
      createdAt: new Date(),
      totalLaps: 0,
      isActive: true,
      metadata: options.metadata,
    };

    this.currentSession = session;
    this.lastLapNumber = 0;
    this.lastDistance = 0;
    this.isInFlyingLap = false;
    this.lastStoredDistance = -1;

    this.emit("sessionStarted", session);

    return session;
  }

  /**
   * End the current recording session
   */
  public async endSession(): Promise<Session | null> {
    if (!this.currentSession?.isActive) {
      throw new Error("No active session to end.");
    }

    const session = { ...this.currentSession };
    session.endedAt = new Date();
    session.isActive = false;

    this.emit("sessionEnded", session);

    this.currentSession = null;
    this.currentLap = null;
    this.lastLapNumber = 0;
    this.isInFlyingLap = false;

    return session;
  }

  /**
   * Process telemetry data - stores data every metre during flying lap
   */
  public async processTelemetryData(
    telemetryData: CarTelemetryData,
    lapData: LapData,
    header: PacketHeader
  ): Promise<void> {
    if (!this.currentSession?.isActive) {
      return; // No active session
    }

    // Check if we're in a flying lap (driverStatus = 1 means "flying lap")
    const wasInFlyingLap = this.isInFlyingLap;
    this.isInFlyingLap = lapData.driverStatus === 1;

    // Update track length estimate from lap distance
    if (lapData.lapDistance > this.trackLength) {
      this.trackLength = lapData.lapDistance;
    }

    // Handle lap changes
    if (
      lapData.currentLapNum !== this.lastLapNumber &&
      lapData.currentLapNum > 0
    ) {
      await this.handleLapChange(lapData);
    }

    // Only store telemetry data during flying lap
    if (this.isInFlyingLap && this.currentLap) {
      await this.storeTelemetryIfNeeded(telemetryData, lapData);
    }

    this.lastLapNumber = lapData.currentLapNum;
    this.lastDistance = lapData.lapDistance;
  }

  /**
   * Handle lap number changes - create new lap records
   */
  private async handleLapChange(lapData: LapData): Promise<void> {
    if (!this.currentSession) return;

    // Complete previous lap if it exists
    if (this.currentLap && lapData.lastLapTimeInMS > 0) {
      this.currentLap.lapTimeMs = lapData.lastLapTimeInMS;
      this.currentLap.isValid = lapData.currentLapInvalid === 0;

      this.emit("lapCompleted", this.currentLap);

      this.currentSession.totalLaps++;
      
      // Auto-end session after completing one lap
      await this.endSession();
      return; // Exit early - don't start a new lap
    }

    // Start new lap
    const newLap: Lap = {
      id: this.generateId(),
      sessionId: this.currentSession.id,
      lapNumber: lapData.currentLapNum,
      isValid: true,
      createdAt: new Date(),
    };

    this.currentLap = newLap;
    this.lastStoredDistance = -1; // Reset distance tracking for new lap

    
    // Save new lap to database immediately
    this.emit("lapStarted", this.currentLap);
  }

  /**
   * Store telemetry data if we've traveled at least 1 metre since last storage
   */
  private async storeTelemetryIfNeeded(
    telemetryData: CarTelemetryData,
    lapData: LapData
  ): Promise<void> {
    if (!this.currentSession || !this.currentLap) return;

    const currentDistance = Math.floor(lapData.lapDistance);


    // Store data every metre
    if (currentDistance >= this.lastStoredDistance + this.DISTANCE_INTERVAL) {
      const dataPoint: TelemetryDataPoint = {
        sessionId: this.currentSession.id,
        lapId: this.currentLap.id,
        distanceFromStart: currentDistance,
        lapDistance: lapData.lapDistance,
        speed: telemetryData.speed,
        throttle: telemetryData.throttle,
        brake: telemetryData.brake,
        steer: telemetryData.steer,
        gear: telemetryData.gear,
        engineRpm: telemetryData.engineRPM,
        drs: telemetryData.drs,
        engineTemp: telemetryData.engineTemperature,
        brakeTempRl: telemetryData.brakesTemperature[0],
        brakeTempRr: telemetryData.brakesTemperature[1],
        brakeTempFl: telemetryData.brakesTemperature[2],
        brakeTempFr: telemetryData.brakesTemperature[3],
        tyreSurfaceTempRl: telemetryData.tyresSurfaceTemperature[0],
        tyreSurfaceTempRr: telemetryData.tyresSurfaceTemperature[1],
        tyreSurfaceTempFl: telemetryData.tyresSurfaceTemperature[2],
        tyreSurfaceTempFr: telemetryData.tyresSurfaceTemperature[3],
        tyreInnerTempRl: telemetryData.tyresInnerTemperature[0],
        tyreInnerTempRr: telemetryData.tyresInnerTemperature[1],
        tyreInnerTempFl: telemetryData.tyresInnerTemperature[2],
        tyreInnerTempFr: telemetryData.tyresInnerTemperature[3],
        tyrePressureRl: telemetryData.tyresPressure[0],
        tyrePressureRr: telemetryData.tyresPressure[1],
        tyrePressureFl: telemetryData.tyresPressure[2],
        tyrePressureFr: telemetryData.tyresPressure[3],
        revLightsPercent: telemetryData.revLightsPercent,
        clutch: telemetryData.clutch,
        surfaceTypeRl: telemetryData.surfaceType[0],
        surfaceTypeRr: telemetryData.surfaceType[1],
        surfaceTypeFl: telemetryData.surfaceType[2],
        surfaceTypeFr: telemetryData.surfaceType[3],
      };

      this.emit("telemetryStored", dataPoint);
      this.lastStoredDistance = currentDistance;
 
    }
  }

  /**
   * Get current session status
   */
  public getSessionStatus(): {
    hasActiveSession: boolean;
    currentSession: Session | null;
    currentLap: Lap | null;
    isInFlyingLap: boolean;
    trackLength: number;
  } {
    return {
      hasActiveSession: this.currentSession?.isActive || false,
      currentSession: this.currentSession,
      currentLap: this.currentLap,
      isInFlyingLap: this.isInFlyingLap,
      trackLength: this.trackLength,
    };
  }

  /**
   * Generate unique UUID
   */
  private generateId(): string {
    return uuidv4();
  }
}

export default SessionManager;
