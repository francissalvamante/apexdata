"use client";

import { ConnectionStatus as Status } from "@/lib/telemetry-types";

interface ConnectionStatusProps {
  status: Status;
  onConnect: () => void;
  onDisconnect: () => void;
}

export const ConnectionStatus = ({
  status,
  onConnect,
  onDisconnect,
}: ConnectionStatusProps) => {
  const getStatusColor = () => {
    switch (status) {
      case Status.CONNECTED:
        return "text-green-500";
      case Status.CONNECTING:
        return "text-yellow-500";
      case Status.ERROR:
        return "text-red-500";
      default:
        return "text-gray-500";
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case Status.CONNECTED:
        return "🟢";
      case Status.CONNECTING:
        return "🟡";
      case Status.ERROR:
        return "🔴";
      default:
        return "⚪";
    }
  };

  return (
    <div className="flex items-center gap-4 p-4 bg-gray-800 rounded-lg">
      <div className="flex items-center gap-2">
        <span className="text-xl">{getStatusIcon()}</span>
        <span className={`font-semibold ${getStatusColor()}`}>
          {status.toUpperCase()}
        </span>
      </div>

      <div className="flex gap-2">
        {status !== Status.CONNECTED && (
          <button
            onClick={onConnect}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            disabled={status === Status.CONNECTING}
          >
            {status === Status.CONNECTING ? "Connecting..." : "Connect"}
          </button>
        )}

        {status === Status.CONNECTED && (
          <button
            onClick={onDisconnect}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Disconnect
          </button>
        )}
      </div>
    </div>
  );
};
