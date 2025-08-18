// F1 25 Packet Header (common to all packets)
export interface PacketHeader {
  packetFormat: number; // 2025
  gameYear: number; // Game year - last two digits
  gameMajorVersion: number; // Game major version
  gameMinorVersion: number; // Game minor version
  packetVersion: number; // Version of this packet type
  packetId: number; // Identifier for the packet type
  sessionUID: bigint; // Unique identifier for the session
  sessionTime: number; // Session timestamp
  frameIdentifier: number; // Identifier for the frame the data was retrieved
  overallFrameIdentifier: number; // Overall identifier for the frame
  playerCarIndex: number; // Index of player's car in the array
  secondaryPlayerCarIndex: number; // Index of secondary player's car
}

// Car Telemetry Data (60Hz)
export interface CarTelemetryData {
  speed: number; // Speed of car in KPH
  throttle: number; // Amount of throttle applied (0.0 to 1.0)
  steer: number; // Steering (-1.0 (full lock left) to 1.0 (fulllock right))
  brake: number; // Amount of brake applied (0.0 to 1.0)
  clutch: number; // Amount of clutch applied (0-100)
  gear: number; // Gear selected (1-8, N=0, R=-1)
  engineRPM: number; // Engine RPM
  drs: number; // 0 = off, 1 = on
  revLightsPercent: number; // Rev lights indicator (percentage)
  revLightsBitValue: number; // Rev lights (bit 0 = leftmost LED, bit 14 = rightmost LED)
  brakesTemperature: number[]; // Brakes temperature (celsius) [RL, RR, FL, FR]
  tyresSurfaceTemperature: number[]; // Tyres surface temperature (celsius) [RL, RR, FL, FR]
  tyresInnerTemperature: number[]; // Tyres inner temperature (celsius) [RL, RR, FL, FR]
  engineTemperature: number; // Engine temperature (celsius)
  tyresPressure: number[]; // Tyres pressure (PSI) [RL, RR, FL, FR]
  surfaceType: number[]; // Driving surface [RL, RR, FL, FR]
}

// Complete Telemetry Packet
export interface PacketCarTelemetryData {
  header: PacketHeader;
  carTelemetryData: CarTelemetryData[]; // 22 cars
  mfdPanelIndex: number; // Index of MFD panel open
  mfdPanelIndexSecondaryPlayer: number; // See above
  suggestedGear: number; // Suggested gear for the player
}

// Lap Data - Updated to match official F1 25 specification
export interface LapData {
  lastLapTimeInMS: number; // Last lap time in milliseconds
  currentLapTimeInMS: number; // Current time around the lap in milliseconds
  sector1TimeMSPart: number; // Sector 1 time milliseconds part
  sector1TimeMinutesPart: number; // Sector 1 whole minute part
  sector2TimeMSPart: number; // Sector 2 time milliseconds part
  sector2TimeMinutesPart: number; // Sector 2 whole minute part
  deltaToCarInFrontMSPart: number; // Time delta to car in front milliseconds part
  deltaToCarInFrontMinutesPart: number; // Time delta to car in front whole minute part
  deltaToRaceLeaderMSPart: number; // Time delta to race leader milliseconds part
  deltaToRaceLeaderMinutesPart: number; // Time delta to race leader whole minute part
  lapDistance: number; // Distance vehicle is around current lap in metres
  totalDistance: number; // Total distance travelled in session in metres
  safetyCarDelta: number; // Delta in seconds for safety car
  carPosition: number; // Car race position
  currentLapNum: number; // Current lap number
  pitStatus: number; // 0 = none, 1 = pitting, 2 = in pit area
  numPitStops: number; // Number of pit stops taken in this race
  sector: number; // 0 = sector1, 1 = sector2, 2 = sector3
  currentLapInvalid: number; // Current lap invalid - 0 = valid, 1 = invalid
  penalties: number; // Accumulated time penalties in seconds to be added
  totalWarnings: number; // Accumulated number of warnings issued
  cornerCuttingWarnings: number; // Accumulated number of corner cutting warnings
  numUnservedDriveThroughPens: number; // Num drive through pens left to serve
  numUnservedStopGoPens: number; // Num stop go pens left to serve
  gridPosition: number; // Grid position the vehicle started the race in
  driverStatus: number; // Status of driver - 0 = in garage, 1 = flying lap, 2 = in lap, 3 = out lap, 4 = on track
  resultStatus: number; // Result status - 0 = invalid, 1 = inactive, 2 = active, 3 = finished, 4 = didnotfinish, 5 = disqualified, 6 = not classified, 7 = retired
  pitLaneTimerActive: number; // Pit lane timing, 0 = inactive, 1 = active
  pitLaneTimeInLaneInMS: number; // If active, the current time spent in the pit lane in ms
  pitStopTimerInMS: number; // Time of the actual pit stop in ms
  pitStopShouldServePen: number; // Whether the car should serve a penalty at this stop
  speedTrapFastestSpeed: number; // Fastest speed through speed trap for this car in kmph
  speedTrapFastestLap: number; // Lap no the fastest speed was achieved, 255 = not set
}

export interface PacketLapData {
  header: PacketHeader;
  lapData: LapData[]; // 22 cars
  timeTrialPBCarIdx: number; // Index of Personal Best car in time trial (255 if invalid)
  timeTrialRivalCarIdx: number; // Index of Rival car in time trial (255 if invalid)
}

// Packet IDs for different types of data - Updated to match F1 25 specification
export enum PacketType {
  MOTION = 0,
  SESSION = 1,
  LAP_DATA = 2,
  EVENT = 3,
  PARTICIPANTS = 4,
  CAR_SETUPS = 5,
  CAR_TELEMETRY = 6,
  CAR_STATUS = 7,
  FINAL_CLASSIFICATION = 8,
  LOBBY_INFO = 9,
  CAR_DAMAGE = 10,
  SESSION_HISTORY = 11,
  TYRE_SETS = 12,
  MOTION_EX = 13,
  TIME_TRIAL = 14,
  LAP_POSITIONS = 15,
}
