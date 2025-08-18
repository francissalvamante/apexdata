const dgram = require('dgram');

const client = dgram.createSocket('udp4');

// Create F1 25 compliant telemetry packet based on official specification
// Expected size: 1352 bytes (Header: 29 + CarTelemetryData: 22*60 + Additional: 3)
const packetSize = 1352;
const buffer = Buffer.alloc(packetSize);
let offset = 0;

console.log(`Creating F1 25 compliant telemetry packet of ${packetSize} bytes...`);

// Write packet header (29 bytes) - matches official F1 25 specification
buffer.writeUInt16LE(2025, offset); offset += 2;  // m_packetFormat
buffer.writeUInt8(25, offset); offset += 1;       // m_gameYear  
buffer.writeUInt8(1, offset); offset += 1;        // m_gameMajorVersion
buffer.writeUInt8(0, offset); offset += 1;        // m_gameMinorVersion
buffer.writeUInt8(1, offset); offset += 1;        // m_packetVersion
buffer.writeUInt8(6, offset); offset += 1;        // m_packetId (6 = CAR_TELEMETRY)
buffer.writeBigUInt64LE(BigInt(12345), offset); offset += 8; // m_sessionUID
buffer.writeFloatLE(60.5, offset); offset += 4;   // m_sessionTime
buffer.writeUInt32LE(100, offset); offset += 4;   // m_frameIdentifier
buffer.writeUInt32LE(100, offset); offset += 4;   // m_overallFrameIdentifier
buffer.writeUInt8(0, offset); offset += 1;        // m_playerCarIndex (player is car 0)
buffer.writeUInt8(255, offset); offset += 1;      // m_secondaryPlayerCarIndex

console.log(`Header written, offset now: ${offset}`);

// Write telemetry data for 22 cars (60 bytes each based on official CarTelemetryData struct)
for (let car = 0; car < 22; car++) {
  const carStartOffset = offset;
  
  // CarTelemetryData structure (60 bytes per car)
  buffer.writeUInt16LE(car === 0 ? 220 : 180, offset); offset += 2;  // m_speed (KPH)
  buffer.writeFloatLE(car === 0 ? 0.9 : 0.7, offset); offset += 4;   // m_throttle
  buffer.writeFloatLE(0.1, offset); offset += 4;   // m_steer
  buffer.writeFloatLE(0.0, offset); offset += 4;   // m_brake
  buffer.writeUInt8(0, offset); offset += 1;       // m_clutch
  buffer.writeInt8(car === 0 ? 7 : 5, offset); offset += 1;  // m_gear
  buffer.writeUInt16LE(car === 0 ? 9000 : 7500, offset); offset += 2; // m_engineRPM
  buffer.writeUInt8(1, offset); offset += 1;       // m_drs
  buffer.writeUInt8(80, offset); offset += 1;      // m_revLightsPercent
  buffer.writeUInt16LE(0b1111000000000000, offset); offset += 2; // m_revLightsBitValue
  
  // m_brakesTemperature[4] (4 wheels × 2 bytes = 8 bytes)
  for (let wheel = 0; wheel < 4; wheel++) {
    buffer.writeUInt16LE(380 + wheel * 15, offset); offset += 2;
  }
  
  // m_tyresSurfaceTemperature[4] (4 wheels × 1 byte = 4 bytes)
  for (let wheel = 0; wheel < 4; wheel++) {
    buffer.writeUInt8(95 + wheel * 3, offset); offset += 1;
  }
  
  // m_tyresInnerTemperature[4] (4 wheels × 1 byte = 4 bytes)
  for (let wheel = 0; wheel < 4; wheel++) {
    buffer.writeUInt8(100 + wheel * 3, offset); offset += 1;
  }
  
  buffer.writeUInt16LE(105, offset); offset += 2;   // m_engineTemperature
  
  // m_tyresPressure[4] (4 wheels × 4 bytes = 16 bytes)
  for (let wheel = 0; wheel < 4; wheel++) {
    buffer.writeFloatLE(24.0 + wheel * 0.2, offset); offset += 4;
  }
  
  // m_surfaceType[4] (4 wheels × 1 byte = 4 bytes)
  for (let wheel = 0; wheel < 4; wheel++) {
    buffer.writeUInt8(0, offset); offset += 1; // 0 = tarmac
  }
  
  const carBytes = offset - carStartOffset;
  if (car === 0) {
    console.log(`Car ${car} telemetry: ${carBytes} bytes (expected 60)`);
  }
}

// Write additional packet data (3 bytes)
buffer.writeUInt8(1, offset); offset += 1;        // m_mfdPanelIndex
buffer.writeUInt8(255, offset); offset += 1;      // m_mfdPanelIndexSecondaryPlayer  
buffer.writeInt8(7, offset); offset += 1;         // m_suggestedGear

console.log(`Final packet size: ${offset} bytes (expected: ${packetSize})`);

if (offset !== packetSize) {
  console.error(`❌ Size mismatch! Generated ${offset} bytes, expected ${packetSize}`);
  process.exit(1);
}

console.log('✅ Packet size matches F1 25 specification');
console.log('Sending F1 25 compliant telemetry packet to port 20777...');

client.send(buffer, 20777, 'localhost', (err) => {
  if (err) {
    console.error('Error:', err);
  } else {
    console.log('✅ F1 25 compliant telemetry packet sent successfully!');
    console.log('Player car data: 220 KPH, 9000 RPM, gear 7, DRS enabled');
    console.log('Check your server logs for proper telemetry parsing...');
  }
  client.close();
});