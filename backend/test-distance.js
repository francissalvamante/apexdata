const dgram = require('dgram');

const client = dgram.createSocket('udp4');

console.log('Testing distance-based telemetry storage...');

async function sendSequentialTelemetry() {
  try {
    // 1. First send lap data to establish we're in a flying lap
    console.log('1. Sending lap data (driverStatus=1, lap=3, distance=1250m)...');
    await sendLapData(1250.0, 3);
    await sleep(100);

    // 2. Send telemetry at distance 1250m
    console.log('2. Sending telemetry at 1250m...');
    await sendTelemetry(220, 9000);
    await sleep(100);

    // 3. Send telemetry at distance 1251m (should trigger storage)
    console.log('3. Sending lap data at 1251m...');
    await sendLapData(1251.0, 3);
    await sleep(100);
    console.log('4. Sending telemetry at 1251m (should store!)...');
    await sendTelemetry(225, 9200);
    await sleep(100);

    // 4. Send telemetry at distance 1252m (should trigger storage)
    console.log('5. Sending lap data at 1252m...');
    await sendLapData(1252.0, 3);
    await sleep(100);
    console.log('6. Sending telemetry at 1252m (should store!)...');
    await sendTelemetry(230, 9400);
    await sleep(100);

    // 5. Send several more to build up data
    for (let i = 1253; i <= 1260; i++) {
      console.log(`Sending data at ${i}m...`);
      await sendLapData(i, 3);
      await sleep(50);
      await sendTelemetry(200 + i, 8000 + (i * 10));
      await sleep(50);
    }
    
    console.log('✅ Sent sequence of telemetry data with increasing distances');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    client.close();
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function sendTelemetry(speed, rpm) {
  return new Promise((resolve, reject) => {
    const packetSize = 1352;
    const buffer = Buffer.alloc(packetSize);
    let offset = 0;

    // Write packet header (29 bytes)
    buffer.writeUInt16LE(2025, offset); offset += 2;  
    buffer.writeUInt8(25, offset); offset += 1;       
    buffer.writeUInt8(1, offset); offset += 1;        
    buffer.writeUInt8(0, offset); offset += 1;        
    buffer.writeUInt8(1, offset); offset += 1;        
    buffer.writeUInt8(6, offset); offset += 1;        // CAR_TELEMETRY
    buffer.writeBigUInt64LE(BigInt(12345), offset); offset += 8; 
    buffer.writeFloatLE(60.5, offset); offset += 4;   
    buffer.writeUInt32LE(100, offset); offset += 4;   
    buffer.writeUInt32LE(100, offset); offset += 4;   
    buffer.writeUInt8(0, offset); offset += 1;        
    buffer.writeUInt8(255, offset); offset += 1;      

    // Write telemetry data for 22 cars (60 bytes each)
    for (let car = 0; car < 22; car++) {
      buffer.writeUInt16LE(car === 0 ? speed : 180, offset); offset += 2;  // speed
      buffer.writeFloatLE(car === 0 ? 0.9 : 0.7, offset); offset += 4;   // throttle
      buffer.writeFloatLE(0.1, offset); offset += 4;   // steer
      buffer.writeFloatLE(0.0, offset); offset += 4;   // brake
      buffer.writeUInt8(0, offset); offset += 1;       // clutch
      buffer.writeInt8(car === 0 ? 7 : 5, offset); offset += 1;  // gear
      buffer.writeUInt16LE(car === 0 ? rpm : 7500, offset); offset += 2; // engineRPM
      buffer.writeUInt8(1, offset); offset += 1;       // drs
      buffer.writeUInt8(80, offset); offset += 1;      // revLightsPercent
      buffer.writeUInt16LE(0b1111000000000000, offset); offset += 2; // revLightsBitValue
      
      // brakes temp (8 bytes)
      for (let wheel = 0; wheel < 4; wheel++) {
        buffer.writeUInt16LE(380 + wheel * 15, offset); offset += 2;
      }
      
      // tyre surface temp (4 bytes)
      for (let wheel = 0; wheel < 4; wheel++) {
        buffer.writeUInt8(95 + wheel * 3, offset); offset += 1;
      }
      
      // tyre inner temp (4 bytes)
      for (let wheel = 0; wheel < 4; wheel++) {
        buffer.writeUInt8(100 + wheel * 3, offset); offset += 1;
      }
      
      buffer.writeUInt16LE(105, offset); offset += 2;   // engineTemperature
      
      // tyre pressure (16 bytes)
      for (let wheel = 0; wheel < 4; wheel++) {
        buffer.writeFloatLE(24.0 + wheel * 0.2, offset); offset += 4;
      }
      
      // surface type (4 bytes)
      for (let wheel = 0; wheel < 4; wheel++) {
        buffer.writeUInt8(0, offset); offset += 1;
      }
    }

    // Write additional packet data (3 bytes)
    buffer.writeUInt8(1, offset); offset += 1;        
    buffer.writeUInt8(255, offset); offset += 1;      
    buffer.writeInt8(7, offset); offset += 1;         

    client.send(buffer, 20777, 'localhost', (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

function sendLapData(lapDistance, lapNum) {
  return new Promise((resolve, reject) => {
    const buffer = Buffer.alloc(1285);
    let offset = 0;

    // Write packet header (29 bytes)
    buffer.writeUInt16LE(2025, offset); offset += 2;  
    buffer.writeUInt8(25, offset); offset += 1;       
    buffer.writeUInt8(1, offset); offset += 1;        
    buffer.writeUInt8(0, offset); offset += 1;        
    buffer.writeUInt8(1, offset); offset += 1;        
    buffer.writeUInt8(2, offset); offset += 1;        // LAP_DATA
    buffer.writeBigUInt64LE(BigInt(12345), offset); offset += 8; 
    buffer.writeFloatLE(60.5, offset); offset += 4;   
    buffer.writeUInt32LE(101, offset); offset += 4;   
    buffer.writeUInt32LE(101, offset); offset += 4;   
    buffer.writeUInt8(0, offset); offset += 1;        
    buffer.writeUInt8(255, offset); offset += 1;      

    // Write the complete first car (player) lap data properly  
    // Car 0 (player) lap data - 57 bytes
    buffer.writeUInt32LE(85000, offset); offset += 4;  // lastLapTimeInMS
    buffer.writeUInt32LE(25500, offset); offset += 4;  // currentLapTimeInMS
    buffer.writeUInt16LE(28500, offset); offset += 2;  // sector1TimeMSPart
    buffer.writeUInt8(0, offset); offset += 1;         // sector1TimeMinutesPart
    buffer.writeUInt16LE(0, offset); offset += 2;      // sector2TimeMSPart
    buffer.writeUInt8(0, offset); offset += 1;         // sector2TimeMinutesPart
    buffer.writeUInt16LE(0, offset); offset += 2;      // deltaToCarInFrontMSPart
    buffer.writeUInt8(0, offset); offset += 1;         // deltaToCarInFrontMinutesPart
    buffer.writeUInt16LE(0, offset); offset += 2;      // deltaToRaceLeaderMSPart
    buffer.writeUInt8(0, offset); offset += 1;         // deltaToRaceLeaderMinutesPart
    buffer.writeFloatLE(lapDistance, offset); offset += 4;  // lapDistance - CRITICAL!
    buffer.writeFloatLE(75000.0, offset); offset += 4; // totalDistance
    buffer.writeFloatLE(0.0, offset); offset += 4;     // safetyCarDelta
    buffer.writeUInt8(1, offset); offset += 1;         // carPosition
    buffer.writeUInt8(lapNum, offset); offset += 1;    // currentLapNum - CRITICAL!
    buffer.writeUInt8(0, offset); offset += 1;         // pitStatus
    buffer.writeUInt8(0, offset); offset += 1;         // numPitStops
    buffer.writeUInt8(1, offset); offset += 1;         // sector
    buffer.writeUInt8(0, offset); offset += 1;         // currentLapInvalid
    buffer.writeUInt8(0, offset); offset += 1;         // penalties
    buffer.writeUInt8(0, offset); offset += 1;         // totalWarnings
    buffer.writeUInt8(0, offset); offset += 1;         // cornerCuttingWarnings
    buffer.writeUInt8(0, offset); offset += 1;         // numUnservedDriveThroughPens
    buffer.writeUInt8(0, offset); offset += 1;         // numUnservedStopGoPens
    buffer.writeUInt8(1, offset); offset += 1;         // gridPosition
    buffer.writeUInt8(1, offset); offset += 1;         // driverStatus = 1 (FLYING LAP) - CRITICAL!
    buffer.writeUInt8(2, offset); offset += 1;         // resultStatus (2 = active)
    buffer.writeUInt8(0, offset); offset += 1;         // pitLaneTimerActive
    buffer.writeUInt16LE(0, offset); offset += 2;      // pitLaneTimeInLaneInMS
    buffer.writeUInt16LE(0, offset); offset += 2;      // pitStopTimerInMS
    buffer.writeUInt8(0, offset); offset += 1;         // pitStopShouldServePen
    buffer.writeFloatLE(280.5, offset); offset += 4;   // speedTrapFastestSpeed
    buffer.writeUInt8(1, offset); offset += 1;         // speedTrapFastestLap
    
    // Fill remaining cars with defaults (21 more cars * 57 bytes each)
    for (let car = 1; car < 22; car++) {
      // Just write 57 bytes of mostly zeros for other cars
      offset += 57;
    }
    
    // Write additional packet data (2 bytes)
    buffer.writeUInt8(0, offset); offset += 1;        // m_timeTrialPBCarIdx
    buffer.writeUInt8(0, offset); offset += 1;        // m_timeTrialRivalCarIdx
    
    client.send(buffer, 20777, 'localhost', (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

sendSequentialTelemetry();