"use client";

import { ConnectionStatus } from "@/components/telemetry/connection/ConnectionStatus";
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

      <ConnectionStatus
        status={connectionStatus}
        onConnect={connect}
        onDisconnect={disconnect}
      ></ConnectionStatus>

      {isConnected && telemetryData && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="text-sm text-gray-400">Speed</h3>
            <p className="text-2xl font-bold text-white">
              {telemetryData.speed} KPH
            </p>
          </div>

          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="text-sm text-gray-400">RPM</h3>
            <p className="text-2xl font-bold">{telemetryData.engineRPM}</p>
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
      )}

      {!isConnected && (
        <div className="text-center py-12">
          <p className="text-gray-400">
            Connect to backend to view live telemetry data
          </p>
        </div>
      )}
    </div>
  );
};

export default LiveTelemetryPage;
