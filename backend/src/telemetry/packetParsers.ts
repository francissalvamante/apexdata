import {
  CarTelemetryData,
  LapData,
  PacketCarTelemetryData,
  PacketHeader,
  PacketLapData,
} from "../types/telemetry";

export class TelemetryParser {
  public static parseCarTelemetryPacket(
    buffer: Buffer,
    header: PacketHeader
  ): PacketCarTelemetryData {
    // Check expected size based on F1 25 specification: 1352 bytes total
    const expectedSize = 1352;
    if (buffer.length < expectedSize) {
      console.warn(
        `Buffer size mismatch: ${buffer.length} bytes, expected ${expectedSize} bytes`
      );
    }

    let offset = 29; // Skip header
    const carTelemetryData: CarTelemetryData[] = [];

    // Parse telemetry for all 22 cars
    // CarTelemetryData size: 2+4+4+4+1+1+2+1+1+2+8+4+4+2+16+4 = 60 bytes per car
    const carTelemetryDataSize = 60;

    for (let i = 0; i < 22; i++) {
      // Check if we have enough bytes remaining for this car
      if (offset + carTelemetryDataSize > buffer.length) {
        console.warn(
          `Not enough data for car ${i}: offset ${offset}, buffer length ${buffer.length}`
        );
        break;
      }

      carTelemetryData.push(this.parseCarTelemetryData(buffer, offset));
      offset += carTelemetryDataSize; // Each car telemetry data is 60 bytes
    }

    // Safely read additional packet data
    let mfdPanelIndex = 0;
    let mfdPanelIndexSecondaryPlayer = 0;
    let suggestedGear = 0;

    if (offset < buffer.length) {
      mfdPanelIndex = buffer.readUInt8(offset);
      offset += 1;
    }

    if (offset < buffer.length) {
      mfdPanelIndexSecondaryPlayer = buffer.readUInt8(offset);
      offset += 1;
    }

    if (offset < buffer.length) {
      suggestedGear = buffer.readInt8(offset);
    }


    return {
      header,
      carTelemetryData,
      mfdPanelIndex,
      mfdPanelIndexSecondaryPlayer,
      suggestedGear,
    };
  }

  private static parseCarTelemetryData(
    buffer: Buffer,
    offset: number
  ): CarTelemetryData {
    const startOffset = offset;

    // Ensure we have enough bytes for a complete car telemetry entry (60 bytes)
    if (offset + 60 > buffer.length) {
      throw new Error(
        `Not enough data for car telemetry: need 60 bytes, have ${
          buffer.length - offset
        } bytes remaining`
      );
    }

    const speed = buffer.readUInt16LE(offset);
    offset += 2;

    const throttle = buffer.readFloatLE(offset);
    offset += 4;

    const steer = buffer.readFloatLE(offset);
    offset += 4;

    const brake = buffer.readFloatLE(offset);
    offset += 4;

    const clutch = buffer.readUInt8(offset);
    offset += 1;

    const gear = buffer.readInt8(offset);
    offset += 1;

    const engineRPM = buffer.readUInt16LE(offset);
    offset += 2;

    const drs = buffer.readUInt8(offset);
    offset += 1;

    const revLightsPercent = buffer.readUInt8(offset);
    offset += 1;

    const revLightsBitValue = buffer.readUInt16LE(offset);
    offset += 2;

    // Parse brake temperatures (4 wheels)
    const brakesTemperature: number[] = [];
    for (let i = 0; i < 4; i++) {
      brakesTemperature.push(buffer.readUInt16LE(offset));
      offset += 2;
    }

    // Parse tyre surface temperatures (4 wheels)
    const tyresSurfaceTemperature: number[] = [];
    for (let i = 0; i < 4; i++) {
      tyresSurfaceTemperature.push(buffer.readUInt8(offset));
      offset += 1;
    }

    // Parse tyre inner temperatures (4 wheels)
    const tyresInnerTemperature: number[] = [];
    for (let i = 0; i < 4; i++) {
      tyresInnerTemperature.push(buffer.readUInt8(offset));
      offset += 1;
    }

    const engineTemperature = buffer.readUInt16LE(offset);
    offset += 2;

    // Parse tyre pressures (4 wheels)
    const tyresPressure: number[] = [];
    for (let i = 0; i < 4; i++) {
      tyresPressure.push(buffer.readFloatLE(offset));
      offset += 4;
    }

    // Parse surface types (4 wheels)
    const surfaceType: number[] = [];
    for (let i = 0; i < 4; i++) {
      surfaceType.push(buffer.readUInt8(offset));
      offset += 1;
    }

    return {
      speed,
      throttle,
      steer,
      brake,
      clutch,
      gear,
      engineRPM,
      drs,
      revLightsPercent,
      revLightsBitValue,
      brakesTemperature,
      tyresSurfaceTemperature,
      tyresInnerTemperature,
      engineTemperature,
      tyresPressure,
      surfaceType,
    };
  }

  public static parseLapDataPacket(
    buffer: Buffer,
    header: PacketHeader
  ): PacketLapData {
    // Check expected size based on F1 25 specification: 1285 bytes total
    const expectedSize = 1285;
    if (buffer.length < expectedSize) {
      console.warn(
        `Buffer size mismatch: ${buffer.length} bytes, expected ${expectedSize} bytes`
      );
    }

    let offset = 29; // Skip header
    const lapData: LapData[] = [];

    // LapData size calculation: 4+4+2+1+2+1+2+1+2+1+4+4+4+1+1+1+1+1+1+1+1+1+1+1+1+1+1+1+2+2+1+4+1 = 57 bytes per car
    const lapDataSize = 57;

    for (let i = 0; i < 22; i++) {
      if (offset + lapDataSize > buffer.length) {
        console.warn(
          `Not enough data for lap data car ${i}: offset ${offset}, buffer length ${buffer.length}`
        );
        break;
      }

      lapData.push(this.parseLapData(buffer, offset));
      offset += lapDataSize;
    }

    const timeTrialPBCarIdx = buffer.readUInt8(offset);
    offset += 1;

    const timeTrialRivalCarIdx = buffer.readUInt8(offset);

    return {
      header,
      lapData,
      timeTrialPBCarIdx,
      timeTrialRivalCarIdx,
    };
  }

  private static parseLapData(buffer: Buffer, offset: number): LapData {
    const lastLapTimeInMS = buffer.readUInt32LE(offset);
    offset += 4;
    const currentLapTimeInMS = buffer.readUInt32LE(offset);
    offset += 4;

    const sector1TimeMSPart = buffer.readUInt16LE(offset);
    offset += 2;
    const sector1TimeMinutesPart = buffer.readUInt8(offset);
    offset += 1;

    const sector2TimeMSPart = buffer.readUInt16LE(offset);
    offset += 2;
    const sector2TimeMinutesPart = buffer.readUInt8(offset);
    offset += 1;

    const deltaToCarInFrontMSPart = buffer.readUInt16LE(offset);
    offset += 2;
    const deltaToCarInFrontMinutesPart = buffer.readUInt8(offset);
    offset += 1;

    const deltaToRaceLeaderMSPart = buffer.readUInt16LE(offset);
    offset += 2;
    const deltaToRaceLeaderMinutesPart = buffer.readUInt8(offset);
    offset += 1;

    const lapDistance = buffer.readFloatLE(offset);
    offset += 4;
    const totalDistance = buffer.readFloatLE(offset);
    offset += 4;
    const safetyCarDelta = buffer.readFloatLE(offset);
    offset += 4;

    const carPosition = buffer.readUInt8(offset);
    offset += 1;
    const currentLapNum = buffer.readUInt8(offset);
    offset += 1;
    const pitStatus = buffer.readUInt8(offset);
    offset += 1;
    const numPitStops = buffer.readUInt8(offset);
    offset += 1;
    const sector = buffer.readUInt8(offset);
    offset += 1;
    const currentLapInvalid = buffer.readUInt8(offset);
    offset += 1;
    const penalties = buffer.readUInt8(offset);
    offset += 1;
    const totalWarnings = buffer.readUInt8(offset);
    offset += 1;
    const cornerCuttingWarnings = buffer.readUInt8(offset);
    offset += 1;
    const numUnservedDriveThroughPens = buffer.readUInt8(offset);
    offset += 1;
    const numUnservedStopGoPens = buffer.readUInt8(offset);
    offset += 1;
    const gridPosition = buffer.readUInt8(offset);
    offset += 1;
    const driverStatus = buffer.readUInt8(offset);
    offset += 1;
    const resultStatus = buffer.readUInt8(offset);
    offset += 1;
    const pitLaneTimerActive = buffer.readUInt8(offset);
    offset += 1;

    const pitLaneTimeInLaneInMS = buffer.readUInt16LE(offset);
    offset += 2;
    const pitStopTimerInMS = buffer.readUInt16LE(offset);
    offset += 2;
    const pitStopShouldServePen = buffer.readUInt8(offset);
    offset += 1;

    const speedTrapFastestSpeed = buffer.readFloatLE(offset);
    offset += 4;
    const speedTrapFastestLap = buffer.readUInt8(offset);
    offset += 1;

    return {
      lastLapTimeInMS,
      currentLapTimeInMS,
      sector1TimeMSPart,
      sector1TimeMinutesPart,
      sector2TimeMSPart,
      sector2TimeMinutesPart,
      deltaToCarInFrontMSPart,
      deltaToCarInFrontMinutesPart,
      deltaToRaceLeaderMSPart,
      deltaToRaceLeaderMinutesPart,
      lapDistance,
      totalDistance,
      safetyCarDelta,
      carPosition,
      currentLapNum,
      pitStatus,
      numPitStops,
      sector,
      currentLapInvalid,
      penalties,
      totalWarnings,
      cornerCuttingWarnings,
      numUnservedDriveThroughPens,
      numUnservedStopGoPens,
      gridPosition,
      driverStatus,
      resultStatus,
      pitLaneTimerActive,
      pitLaneTimeInLaneInMS,
      pitStopTimerInMS,
      pitStopShouldServePen,
      speedTrapFastestSpeed,
      speedTrapFastestLap,
    };
  }
}
