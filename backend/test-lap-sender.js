const dgram = require('dgram');

const client = dgram.createSocket('udp4');

// Create F1 25 compliant lap data packet
// Expected size: 1285 bytes (Header: 29 + LapData: 22*57 + Additional: 2)
const packetSize = 1285;
const buffer = Buffer.alloc(packetSize);
let offset = 0;

console.log(`Creating F1 25 compliant lap data packet of ${packetSize} bytes...`);

// Write packet header (29 bytes) - matches official F1 25 specification
buffer.writeUInt16LE(2025, offset); offset += 2;  // m_packetFormat
buffer.writeUInt8(25, offset); offset += 1;       // m_gameYear  
buffer.writeUInt8(1, offset); offset += 1;        // m_gameMajorVersion
buffer.writeUInt8(0, offset); offset += 1;        // m_gameMinorVersion
buffer.writeUInt8(1, offset); offset += 1;        // m_packetVersion
buffer.writeUInt8(2, offset); offset += 1;        // m_packetId (2 = LAP_DATA)
buffer.writeBigUInt64LE(BigInt(12345), offset); offset += 8; // m_sessionUID
buffer.writeFloatLE(60.5, offset); offset += 4;   // m_sessionTime
buffer.writeUInt32LE(100, offset); offset += 4;   // m_frameIdentifier
buffer.writeUInt32LE(100, offset); offset += 4;   // m_overallFrameIdentifier
buffer.writeUInt8(0, offset); offset += 1;        // m_playerCarIndex (player is car 0)
buffer.writeUInt8(255, offset); offset += 1;      // m_secondaryPlayerCarIndex

console.log(`Header written, offset now: ${offset}`);

// Write lap data for 22 cars (57 bytes each based on official LapData struct)
for (let car = 0; car < 22; car++) {
  const carStartOffset = offset;
  
  // LapData structure (57 bytes per car)
  buffer.writeUInt32LE(car === 0 ? 85000 : 90000, offset); offset += 4;  // m_lastLapTimeInMS
  buffer.writeUInt32LE(car === 0 ? 25500 : 30000, offset); offset += 4;  // m_currentLapTimeInMS
  buffer.writeUInt16LE(car === 0 ? 28500 : 30000, offset); offset += 2;  // m_sector1TimeMSPart
  buffer.writeUInt8(0, offset); offset += 1;       // m_sector1TimeMinutesPart
  buffer.writeUInt16LE(0, offset); offset += 2;    // m_sector2TimeMSPart
  buffer.writeUInt8(0, offset); offset += 1;       // m_sector2TimeMinutesPart
  buffer.writeUInt16LE(0, offset); offset += 2;    // m_deltaToCarInFrontMSPart
  buffer.writeUInt8(0, offset); offset += 1;       // m_deltaToCarInFrontMinutesPart
  buffer.writeUInt16LE(0, offset); offset += 2;    // m_deltaToRaceLeaderMSPart
  buffer.writeUInt8(0, offset); offset += 1;       // m_deltaToRaceLeaderMinutesPart
  buffer.writeFloatLE(car === 0 ? 1250.5 : 1100.0, offset); offset += 4;  // m_lapDistance
  buffer.writeFloatLE(car === 0 ? 75000.0 : 70000.0, offset); offset += 4; // m_totalDistance
  buffer.writeFloatLE(0.0, offset); offset += 4;   // m_safetyCarDelta
  buffer.writeUInt8(car + 1, offset); offset += 1; // m_carPosition
  buffer.writeUInt8(car === 0 ? 3 : 1, offset); offset += 1;  // m_currentLapNum
  buffer.writeUInt8(0, offset); offset += 1;       // m_pitStatus
  buffer.writeUInt8(0, offset); offset += 1;       // m_numPitStops
  buffer.writeUInt8(1, offset); offset += 1;       // m_sector (sector 2)
  buffer.writeUInt8(0, offset); offset += 1;       // m_currentLapInvalid
  buffer.writeUInt8(0, offset); offset += 1;       // m_penalties
  buffer.writeUInt8(0, offset); offset += 1;       // m_totalWarnings
  buffer.writeUInt8(0, offset); offset += 1;       // m_cornerCuttingWarnings
  buffer.writeUInt8(0, offset); offset += 1;       // m_numUnservedDriveThroughPens
  buffer.writeUInt8(0, offset); offset += 1;       // m_numUnservedStopGoPens
  buffer.writeUInt8(car + 1, offset); offset += 1; // m_gridPosition
  buffer.writeUInt8(car === 0 ? 1 : 4, offset); offset += 1;  // m_driverStatus (1 = flying lap for player)
  buffer.writeUInt8(2, offset); offset += 1;       // m_resultStatus (2 = active)
  buffer.writeUInt8(0, offset); offset += 1;       // m_pitLaneTimerActive
  buffer.writeUInt16LE(0, offset); offset += 2;    // m_pitLaneTimeInLaneInMS
  buffer.writeUInt16LE(0, offset); offset += 2;    // m_pitStopTimerInMS
  buffer.writeUInt8(0, offset); offset += 1;       // m_pitStopShouldServePen
  buffer.writeFloatLE(car === 0 ? 280.5 : 260.0, offset); offset += 4;  // m_speedTrapFastestSpeed
  buffer.writeUInt8(car === 0 ? 1 : 255, offset); offset += 1; // m_speedTrapFastestLap
  
  // Add additional bytes to reach 57 bytes per car
  buffer.writeUInt8(0, offset); offset += 1; // padding
  buffer.writeUInt8(0, offset); offset += 1; // padding  
  buffer.writeUInt8(0, offset); offset += 1; // padding
  buffer.writeUInt8(0, offset); offset += 1; // padding
  buffer.writeUInt8(0, offset); offset += 1; // padding
  buffer.writeUInt8(0, offset); offset += 1; // padding
  buffer.writeUInt8(0, offset); offset += 1; // padding
  
  const carBytes = offset - carStartOffset;
  if (car === 0) {
    console.log(`Car ${car} lap data: ${carBytes} bytes (expected 57)`);
  }
}

// Write additional packet data (2 bytes)
buffer.writeUInt8(0, offset); offset += 1;        // m_timeTrialPBCarIdx
buffer.writeUInt8(0, offset); offset += 1;        // m_timeTrialRivalCarIdx

console.log(`Final packet size: ${offset} bytes (expected: ${packetSize})`);

if (offset !== packetSize) {
  console.error(`❌ Size mismatch! Generated ${offset} bytes, expected ${packetSize}`);
  process.exit(1);
}

console.log('✅ Packet size matches F1 25 specification');
console.log('Sending F1 25 compliant lap data packet to port 20777...');

client.send(buffer, 20777, 'localhost', (err) => {
  if (err) {
    console.error('Error:', err);
  } else {
    console.log('✅ F1 25 compliant lap data packet sent successfully!');
    console.log('Player lap data: Lap 3, 1250.5m distance, flying lap (driverStatus=1)');
    console.log('Check your server logs for proper lap data parsing...');
  }
  client.close();
});