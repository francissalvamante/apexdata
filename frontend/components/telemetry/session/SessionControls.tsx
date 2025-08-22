"use client";

import { useSession } from "@/hooks/useSession";
import { useState } from "react";

interface SessionControlsProps {
  className?: string;
}

export const SessionControls = ({ className = "" }: SessionControlsProps) => {
  const {
    isRecording,
    currentSession,
    isInFlyingLap,
    currentLap,
    totalLaps,
    startSession,
    endSession,
    loading,
    error,
    telemetryStatus,
  } = useSession();

  const [showStartForm, setShowStartForm] = useState(false);
  const [sessionName, setSessionName] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [track, setTrack] = useState("");
  const [car, setCar] = useState("");
  const [sessionType, setSessionType] = useState("practice");

  const handleStartSession = async () => {
    if (!sessionName.trim()) {
      alert("Please enter a session name");
      return;
    }

    try {
      await startSession(sessionName, playerName, {
        track: track || undefined,
        car: car || undefined,
        sessionType,
      });

      // Reset form
      setSessionName("");
      setTrack("");
      setCar("");
      setSessionType("practice");
      setShowStartForm(false);
    } catch (err) {
      // Error is already handled in useSession hook
    }
  };

  const handleEndSession = async () => {
    if (
      window.confirm(
        "Are you sure you want to end the current recording session?"
      )
    ) {
      try {
        await endSession();
      } catch (err) {
        // Error is already handled in useSession hook
      }
    }
  };

  const getDriverStatusText = () => {
    if (!telemetryStatus) return "Unknown";

    if (isInFlyingLap) return "Flying Lap";
    return "Out of Flying Lap";
  };

  const getDriverStatusColor = () => {
    if (!telemetryStatus) return "text-gray-400";

    if (isInFlyingLap) return "text-green-400";
    return "text-yellow-400";
  };

  return (
    <div className={`bg-gray-800 rounded-lg p-6 ${className}`}>
      <h2 className="text-xl font-bold text-white mb-4">
        📊 Session Recording
      </h2>

      {error && (
        <div className="mb-4 p-3 bg-red-900 border border-red-700 rounded text-red-200">
          {error}
        </div>
      )}

      {/* Current Session Status */}
      {isRecording && currentSession ? (
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-red-400 font-semibold">
              Recording in Progress
            </span>
          </div>

          <div className="bg-gray-700 rounded p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-400">Session:</span>
              <span className="text-white font-medium">
                {currentSession.name}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-400">Total Laps:</span>
              <span className="text-white">{totalLaps}</span>
            </div>

            {currentLap && (
              <div className="flex justify-between">
                <span className="text-gray-400">Current Lap:</span>
                <span className="text-white">{currentLap}</span>
              </div>
            )}

            <div className="flex justify-between">
              <span className="text-gray-400">Driver Status:</span>
              <span className={getDriverStatusColor()}>
                {getDriverStatusText()}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-400">Database:</span>
              <span
                className={
                  telemetryStatus?.database.isConnected
                    ? "text-green-400"
                    : "text-red-400"
                }
              >
                {telemetryStatus?.database.isConnected
                  ? "Connected"
                  : "Disconnected"}
              </span>
            </div>
          </div>

          <button
            onClick={handleEndSession}
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white px-4 py-2 rounded font-medium transition-colors"
          >
            {loading ? "Ending..." : "End Session"}
          </button>
        </div>
      ) : (
        /* Start Session Form */
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
            <span className="text-gray-400">Not Recording</span>
          </div>

          {!showStartForm ? (
            <button
              onClick={() => setShowStartForm(true)}
              className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-medium transition-colors"
            >
              Start New Session
            </button>
          ) : (
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Session Name (required)"
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
              />

              <input
                type="text"
                placeholder="Player Name (required)"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
              />

              <input
                type="text"
                placeholder="Track (optional)"
                value={track}
                onChange={(e) => setTrack(e.target.value)}
                className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
              />

              <input
                type="text"
                placeholder="Car (optional)"
                value={car}
                onChange={(e) => setCar(e.target.value)}
                className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
              />

              <select
                value={sessionType}
                onChange={(e) => setSessionType(e.target.value)}
                className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
              >
                <option value="practice">Practice</option>
                <option value="qualifying">Qualifying</option>
                <option value="race">Race</option>
                <option value="custom">Custom</option>
              </select>

              <div className="flex space-x-2">
                <button
                  onClick={handleStartSession}
                  disabled={loading || !sessionName.trim()}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-4 py-2 rounded font-medium transition-colors"
                >
                  {loading ? "Starting..." : "Start Recording"}
                </button>

                <button
                  onClick={() => setShowStartForm(false)}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
