"use client";

import { ConnectionStatus } from "@/components/telemetry/connection/ConnectionStatus";
import { SessionControls } from "@/components/telemetry/session/SessionControls";
import { useTelemetry } from "@/hooks/useTelemetry";

const LiveTelemetryPage = () => {
  const {
    telemetryData,
    lapData,
    connectionStatus,
    isConnected,
    connect,
    disconnect,
  } = useTelemetry();

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold text-white">🏎️ F1 Live Telemetry</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Connection Status */}
        <div className="lg:col-span-2">
          <ConnectionStatus
            status={connectionStatus}
            onConnect={connect}
            onDisconnect={disconnect}
          />
        </div>

        {/* Session Controls */}
        <div>
          <SessionControls />
        </div>
      </div>

      {isConnected && telemetryData ? (
        <div className="space-y-6">
          {/* Core Telemetry Data */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-800 p-4 rounded-lg">
              <h3 className="text-sm text-gray-400">Speed</h3>
              <p className="text-2xl font-bold text-white">
                {telemetryData.speed} KPH
              </p>
            </div>

            <div className="bg-gray-800 p-4 rounded-lg">
              <h3 className="text-sm text-gray-400">RPM</h3>
              <p className="text-2xl font-bold text-white">{telemetryData.engineRPM}</p>
            </div>

            <div className="bg-gray-800 p-4 rounded-lg">
              <h3 className="text-sm text-gray-400">Gear</h3>
              <p className="text-2xl font-bold text-white">
                {telemetryData.gear === 0
                  ? "N"
                  : telemetryData.gear === -1
                  ? "R"
                  : telemetryData.gear}
              </p>
            </div>

            <div className="bg-gray-800 p-4 rounded-lg">
              <h3 className="text-sm text-gray-400">DRS</h3>
              <p className="text-2xl font-bold text-white">
                {telemetryData.drs ? "✅" : "❌"}
              </p>
            </div>
          </div>

          {/* Temperature Monitoring */}
          {telemetryData.brakesTemperature && telemetryData.tyresSurfaceTemperature && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Brake Temperatures */}
              <div className="bg-gray-800 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-white mb-3">🔥 Brake Temperatures</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-center">
                    <div className="text-gray-400">FL</div>
                    <div className="text-white font-bold">{telemetryData.brakesTemperature[2]}°C</div>
                  </div>
                  <div className="text-center">
                    <div className="text-gray-400">FR</div>
                    <div className="text-white font-bold">{telemetryData.brakesTemperature[3]}°C</div>
                  </div>
                  <div className="text-center">
                    <div className="text-gray-400">RL</div>
                    <div className="text-white font-bold">{telemetryData.brakesTemperature[0]}°C</div>
                  </div>
                  <div className="text-center">
                    <div className="text-gray-400">RR</div>
                    <div className="text-white font-bold">{telemetryData.brakesTemperature[1]}°C</div>
                  </div>
                </div>
              </div>

              {/* Tyre Surface Temperatures */}
              <div className="bg-gray-800 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-white mb-3">🏎️ Tyre Surface Temperatures</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-center">
                    <div className="text-gray-400">FL</div>
                    <div className="text-white font-bold">{telemetryData.tyresSurfaceTemperature[2]}°C</div>
                  </div>
                  <div className="text-center">
                    <div className="text-gray-400">FR</div>
                    <div className="text-white font-bold">{telemetryData.tyresSurfaceTemperature[3]}°C</div>
                  </div>
                  <div className="text-center">
                    <div className="text-gray-400">RL</div>
                    <div className="text-white font-bold">{telemetryData.tyresSurfaceTemperature[0]}°C</div>
                  </div>
                  <div className="text-center">
                    <div className="text-gray-400">RR</div>
                    <div className="text-white font-bold">{telemetryData.tyresSurfaceTemperature[1]}°C</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Engine Temperature */}
          {telemetryData.engineTemperature && (
            <div className="bg-gray-800 p-4 rounded-lg w-fit">
              <h3 className="text-sm text-gray-400">Engine Temperature</h3>
              <p className="text-xl font-bold text-white">{telemetryData.engineTemperature}°C</p>
            </div>
          )}

          {/* Lap Information */}
          {lapData && (
            <div className="bg-gray-800 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-white mb-3">📊 Lap Information</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-gray-400">Current Lap</div>
                  <div className="text-white font-bold">{lapData.currentLapNum}</div>
                </div>
                <div>
                  <div className="text-gray-400">Position</div>
                  <div className="text-white font-bold">{lapData.carPosition}</div>
                </div>
                <div>
                  <div className="text-gray-400">Current Lap Time</div>
                  <div className="text-white font-bold">
                    {lapData.currentLapTimeInMS > 0 
                      ? `${(lapData.currentLapTimeInMS / 1000).toFixed(3)}s`
                      : "--:--"}
                  </div>
                </div>
                <div>
                  <div className="text-gray-400">Driver Status</div>
                  <div className={`font-bold ${
                    lapData.driverStatus === 2 ? "text-green-400" : "text-yellow-400"
                  }`}>
                    {lapData.driverStatus === 0 ? "In Garage" :
                     lapData.driverStatus === 1 ? "Flying Lap" :
                     lapData.driverStatus === 2 ? "In Lap" :
                     lapData.driverStatus === 3 ? "Out Lap" :
                     lapData.driverStatus === 4 ? "On Track" : "Unknown"}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-400">
            Connect to backend to view live telemetry data and start recording sessions
          </p>
        </div>
      )}
    </div>
  );
};

export default LiveTelemetryPage;
