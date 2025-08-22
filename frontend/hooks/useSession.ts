"use client";

import {
  Session,
  SessionsApiResponse,
  SessionDetailsApiResponse,
  TelemetryStatus,
  ApiResponse,
} from "@/lib/telemetry-types";
import { BACKEND_CONFIG } from "@/lib/config";
import { useCallback, useEffect, useState } from "react";

interface UseSessionReturn {
  // Session management
  sessions: Session[];
  currentSession: Session | null;
  isRecording: boolean;
  isInFlyingLap: boolean;
  currentLap: number | null;
  totalLaps: number;

  // API methods
  startSession: (
    name: string,
    playerName: string,
    options?: {
      track?: string;
      car?: string;
      sessionType?: string;
    }
  ) => Promise<void>;
  endSession: () => Promise<void>;
  loadSessions: () => Promise<void>;
  loadSessionDetails: (
    sessionId: string
  ) => Promise<SessionDetailsApiResponse | null>;

  // Status
  loading: boolean;
  error: string | null;
  telemetryStatus: TelemetryStatus | null;
}

export const useSession = (): UseSessionReturn => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [telemetryStatus, setTelemetryStatus] =
    useState<TelemetryStatus | null>(null);

  // Load telemetry status to get current session info
  const loadTelemetryStatus = useCallback(async () => {
    try {
      const response = await fetch(
        `${BACKEND_CONFIG.API_BASE}/telemetry/status`
      );
      const data: TelemetryStatus = await response.json();
      setTelemetryStatus(data);

      // Update current session based on status
      if (data.session.hasActiveSession && data.session.currentSessionName) {
        setCurrentSession({
          id: "current", // We don't have the actual ID from status
          name: data.session.currentSessionName,
          totalLaps: data.session.totalLaps,
          isActive: true,
          createdAt: new Date(), // Placeholder
        } as Session);
      } else {
        setCurrentSession(null);
      }
    } catch (err) {
      console.error("Failed to load telemetry status:", err);
      setError("Failed to load telemetry status");
    }
  }, []);

  // Start a new recording session
  const startSession = useCallback(
    async (
      name: string,
      playerName: string,
      options: {
        track?: string;
        car?: string;
        sessionType?: string;
      } = {}
    ) => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `${BACKEND_CONFIG.API_BASE}/session/start`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              sessionName: name,
              playerName: playerName,
              ...options,
            }),
          }
        );

        const data: ApiResponse = await response.json();

        if (!data.success) {
          throw new Error(data.error || "Failed to start session");
        }

        // Reload status to get updated session info
        await loadTelemetryStatus();
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to start session";
        setError(errorMessage);
        console.error("Failed to start session:", err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [loadTelemetryStatus]
  );

  // End the current recording session
  const endSession = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${BACKEND_CONFIG.API_BASE}/session/end`, {
        method: "POST",
      });

      const data: ApiResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to end session");
      }

      // Reload sessions and status
      await Promise.all([loadSessions(), loadTelemetryStatus()]);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to end session";
      setError(errorMessage);
      console.error("Failed to end session:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadTelemetryStatus]);

  // Load all sessions for history page
  const loadSessions = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${BACKEND_CONFIG.API_BASE}/sessions`);
      const data: SessionsApiResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to load sessions");
      }

      // Convert date strings back to Date objects
      const sessionsWithDates = data.sessions.map((session) => ({
        ...session,
        createdAt: new Date(session.createdAt),
        endedAt: session.endedAt ? new Date(session.endedAt) : undefined,
      }));

      setSessions(sessionsWithDates);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load sessions";
      setError(errorMessage);
      console.error("Failed to load sessions:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load session details with telemetry data
  const loadSessionDetails = useCallback(
    async (sessionId: string): Promise<SessionDetailsApiResponse | null> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `${BACKEND_CONFIG.API_BASE}/sessions/${sessionId}`
        );
        const data: SessionDetailsApiResponse = await response.json();

        if (!data.success) {
          throw new Error(data.error || "Failed to load session details");
        }

        // Convert date strings back to Date objects
        const sessionWithDates = {
          ...data.session,
          createdAt: new Date(data.session.createdAt),
          endedAt: data.session.endedAt
            ? new Date(data.session.endedAt)
            : undefined,
        };

        const lapsWithDates = data.laps.map((lap) => ({
          ...lap,
          createdAt: new Date(lap.createdAt),
        }));

        return {
          ...data,
          session: sessionWithDates,
          laps: lapsWithDates,
        };
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to load session details";
        setError(errorMessage);
        console.error("Failed to load session details:", err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Load initial data and status
  useEffect(() => {
    loadSessions();
    loadTelemetryStatus();

    // Poll telemetry status every 5 seconds to keep session info updated
    const interval = setInterval(loadTelemetryStatus, 5000);
    return () => clearInterval(interval);
  }, [loadSessions, loadTelemetryStatus]);

  return {
    // Session data
    sessions,
    currentSession,
    isRecording: telemetryStatus?.session.hasActiveSession || false,
    isInFlyingLap: telemetryStatus?.session.isInFlyingLap || false,
    currentLap: telemetryStatus?.session.currentLap || 0,
    totalLaps: telemetryStatus?.session.totalLaps || 0,

    // API methods
    startSession,
    endSession,
    loadSessions,
    loadSessionDetails,

    // Status
    loading,
    error,
    telemetryStatus,
  };
};
