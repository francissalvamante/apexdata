"use client";

import {
  CarTelemetryData,
  ConnectionStatus,
  LapData,
  LapDataMessage,
  TelemetryMessage,
} from "@/lib/telemetry-types";
import { BACKEND_CONFIG } from "@/lib/config";
import { useEffect, useState } from "react";
import { useWebSocket } from "./useWebSocket";

interface UseTelemetryReturn {
  telemetryData: CarTelemetryData | null;
  lapData: LapData | null;
  connectionStatus: ConnectionStatus;
  playerCarIndex: number;
  suggestedGear: number;
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
}


export const useTelemetry = (): UseTelemetryReturn => {
  const [telemetryData, setTelemetryData] = useState<CarTelemetryData | null>(
    null
  );
  const [lapData, setLapData] = useState<LapData | null>(null);
  const [playerCarIndex, setPlayerCarIndex] = useState<number>(0);
  const [suggestedGear, setSuggestedGear] = useState<number>(0);

  const { connectionStatus, lastMessage, connect, disconnect } =
    useWebSocket(BACKEND_CONFIG.WEBSOCKET_URL);

  useEffect(() => {
    if (!lastMessage) return;

    switch (lastMessage.type) {
      case "connected":
        break;
      case "telemetry":
        const telemetryMsg = lastMessage as TelemetryMessage;
        setTelemetryData(telemetryMsg.data);
        setPlayerCarIndex(telemetryMsg.playerCarIndex);
        setSuggestedGear(telemetryMsg.suggestedGear);
        break;
      case "lapData":
        const lapDataMsg = lastMessage as LapDataMessage;
        setLapData(lapDataMsg.data);
        setPlayerCarIndex(lapDataMsg.playerCarIndex);
        break;
    }
  }, [lastMessage]);

  const isConnected = connectionStatus === ConnectionStatus.CONNECTED;

  return {
    telemetryData,
    lapData,
    connectionStatus,
    playerCarIndex,
    suggestedGear,
    isConnected,
    connect,
    disconnect,
  };
};
