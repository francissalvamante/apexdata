"use client";

import { useSession } from "@/hooks/useSession";
import { SessionDetailsApiResponse } from "@/lib/telemetry-types";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import TelemetryCharts from "@/components/telemetry/charts/TelemetryCharts";

const SessionDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const { loadSessionDetails, loading, error } = useSession();
  const [sessionData, setSessionData] =
    useState<SessionDetailsApiResponse | null>(null);

  const sessionId = params.id as string;

  useEffect(() => {
    if (sessionId) {
      loadSessionDetails(sessionId).then(setSessionData);
    }
  }, [sessionId, loadSessionDetails]);

  const formatTime = (timeMs?: number) => {
    if (!timeMs) return "N/A";
    const totalSeconds = timeMs / 1000;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = (totalSeconds % 60).toFixed(3);
    return `${minutes}:${seconds.padStart(6, "0")}`;
  };

  const formatDuration = (session: { endedAt?: Date | null; createdAt: Date | string }) => {
    if (!session.endedAt) return "In Progress";
    const duration =
      (typeof session.endedAt === 'string' ? new Date(session.endedAt) : session.endedAt).getTime() -
      (typeof session.createdAt === 'string' ? new Date(session.createdAt) : session.createdAt).getTime();
    const totalSeconds = Math.floor(duration / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-gray-400">Loading session details...</p>
        </div>
      </div>
    );
  }

  if (error || !sessionData) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-red-400">Failed to load session details</p>
          <p className="text-gray-500 mt-2">{error}</p>
          <button
            onClick={() => router.back()}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const { session, laps, telemetryData } = sessionData;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.back()}
            className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded"
          >
            ← Back
          </button>
          <h1 className="text-3xl font-bold text-white">📊 {session.name}</h1>
        </div>
        <div className="text-sm text-gray-400">
          {telemetryData.length} data points
        </div>
      </div>

      {/* Session Info */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4">
          Session Information
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="text-gray-400">Player</div>
            <div className="text-white font-medium">{session.playerName}</div>
          </div>
          <div>
            <div className="text-gray-400">Track</div>
            <div className="text-white font-medium">
              {session.track || "Unknown"}
            </div>
          </div>
          <div>
            <div className="text-gray-400">Car</div>
            <div className="text-white font-medium">
              {session.car || "Unknown"}
            </div>
          </div>
          <div>
            <div className="text-gray-400">Session Type</div>
            <div className="text-white font-medium">
              {session.sessionType || "Custom"}
            </div>
          </div>
          <div>
            <div className="text-gray-400">Duration</div>
            <div className="text-white font-medium">
              {formatDuration(session)}
            </div>
          </div>
          <div>
            <div className="text-gray-400">Total Laps</div>
            <div className="text-white font-medium">{session.totalLaps}</div>
          </div>
          <div>
            <div className="text-gray-400">Date</div>
            <div className="text-white font-medium">
              {new Date(session.createdAt).toLocaleDateString()}
            </div>
          </div>
          <div>
            <div className="text-gray-400">Time</div>
            <div className="text-white font-medium">
              {new Date(session.createdAt).toLocaleTimeString()}
            </div>
          </div>
        </div>
      </div>

      {/* Lap Times */}
      {laps.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Lap Times</h2>
          <div className="space-y-2">
            {laps.map((lap) => (
              <div
                key={lap.id}
                className="flex justify-between items-center py-2 border-b border-gray-700 last:border-b-0"
              >
                <div className="flex items-center space-x-4">
                  <span className="text-white font-medium">
                    Lap {lap.lapNumber}
                  </span>
                  {!lap.isValid && (
                    <span className="text-red-400 text-sm">INVALID</span>
                  )}
                </div>
                <div className="text-white font-mono">
                  {formatTime(lap.lapTimeMs)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Telemetry Charts */}
      {telemetryData.length > 0 ? (
        <TelemetryCharts telemetryData={telemetryData} />
      ) : (
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="text-center py-12">
            <p className="text-gray-400">
              No telemetry data available for this session
            </p>
            <p className="text-gray-500 mt-2">
              Make sure you&apos;re recording during flying laps to capture telemetry
              data.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SessionDetailPage;
