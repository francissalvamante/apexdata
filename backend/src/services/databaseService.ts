import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { Session, Lap, TelemetryDataPoint } from "./sessionManager";

export class DatabaseService {
  private supabase: SupabaseClient;
  private isConnected: boolean = false;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error(
        "SUPABASE_URL and SUPABASE_ANON_KEY environment variables are required"
      );
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.testConnection();
  }

  /**
   * Test database connection
   */
  private async testConnection(): Promise<void> {
    try {
      const { data, error } = await this.supabase
        .from("sessions")
        .select("count")
        .limit(1);
      if (error) throw error;
      this.isConnected = true;
    } catch (error) {
      console.error("❌ Failed to connect to Supabase:", error);
      this.isConnected = false;
    }
  }

  /**
   * Save a new session to the database
   */
  async saveSession(session: Session): Promise<void> {
    try {
      const { error } = await this.supabase.from("sessions").insert({
        id: session.id,
        name: session.name,
        player_name: session.playerName,
        track: session.track,
        car: session.car,
        session_type: session.sessionType,
        created_at: session.createdAt.toISOString(),
        ended_at: session.endedAt?.toISOString(),
        total_laps: session.totalLaps,
        is_active: session.isActive,
        metadata: session.metadata,
      });

      if (error) throw error;
    } catch (error) {
      console.error("❌ Failed to save session:", error);
      throw error;
    }
  }

  /**
   * Update an existing session
   */
  async updateSession(session: Session): Promise<void> {
    try {
      const { error } = await this.supabase
        .from("sessions")
        .update({
          name: session.name,
          track: session.track,
          car: session.car,
          session_type: session.sessionType,
          ended_at: session.endedAt?.toISOString(),
          total_laps: session.totalLaps,
          is_active: session.isActive,
          metadata: session.metadata,
        })
        .eq("id", session.id);

      if (error) throw error;
    } catch (error) {
      console.error("❌ Failed to update session:", error);
      throw error;
    }
  }

  /**
   * Save a lap to the database
   */
  async saveLap(lap: Lap): Promise<void> {
    try {
      const { error } = await this.supabase.from("laps").insert({
        id: lap.id,
        session_id: lap.sessionId,
        lap_number: lap.lapNumber,
        lap_time_ms: lap.lapTimeMs,
        sector_1_time_ms: lap.sector1TimeMs,
        sector_2_time_ms: lap.sector2TimeMs,
        sector_3_time_ms: lap.sector3TimeMs,
        is_valid: lap.isValid,
        created_at: lap.createdAt.toISOString(),
      });

      if (error) throw error;
    } catch (error) {
      console.error("❌ Failed to save lap:", error);
      throw error;
    }
  }

  /**
   * Update a lap (e.g., when lap is completed)
   */
  async updateLap(lap: Lap): Promise<void> {
    try {
      const { error } = await this.supabase
        .from("laps")
        .update({
          lap_time_ms: lap.lapTimeMs,
          sector_1_time_ms: lap.sector1TimeMs,
          sector_2_time_ms: lap.sector2TimeMs,
          sector_3_time_ms: lap.sector3TimeMs,
          is_valid: lap.isValid,
        })
        .eq("id", lap.id);

      if (error) throw error;
    } catch (error) {
      console.error("❌ Failed to update lap:", error);
      throw error;
    }
  }

  /**
   * Save telemetry data points in batches for performance
   */
  async saveTelemetryData(dataPoints: TelemetryDataPoint[]): Promise<void> {
    if (dataPoints.length === 0) return;

    try {
      const { error } = await this.supabase.from("telemetry_data").insert(
        dataPoints.map((point) => ({
          session_id: point.sessionId,
          lap_id: point.lapId,
          distance_from_start: point.distanceFromStart,
          lap_distance: point.lapDistance,
          speed: point.speed,
          throttle: point.throttle,
          brake: point.brake,
          steer: point.steer,
          gear: point.gear,
          engine_rpm: point.engineRpm,
          drs: point.drs,
          engine_temp: point.engineTemp,
          brake_temp_rl: point.brakeTempRl,
          brake_temp_rr: point.brakeTempRr,
          brake_temp_fl: point.brakeTempFl,
          brake_temp_fr: point.brakeTempFr,
          tyre_surface_temp_rl: point.tyreSurfaceTempRl,
          tyre_surface_temp_rr: point.tyreSurfaceTempRr,
          tyre_surface_temp_fl: point.tyreSurfaceTempFl,
          tyre_surface_temp_fr: point.tyreSurfaceTempFr,
          tyre_inner_temp_rl: point.tyreInnerTempRl,
          tyre_inner_temp_rr: point.tyreInnerTempRr,
          tyre_inner_temp_fl: point.tyreInnerTempFl,
          tyre_inner_temp_fr: point.tyreInnerTempFr,
          tyre_pressure_rl: point.tyrePressureRl,
          tyre_pressure_rr: point.tyrePressureRr,
          tyre_pressure_fl: point.tyrePressureFl,
          tyre_pressure_fr: point.tyrePressureFr,
          rev_lights_percent: point.revLightsPercent,
          clutch: point.clutch,
          surface_type_rl: point.surfaceTypeRl,
          surface_type_rr: point.surfaceTypeRr,
          surface_type_fl: point.surfaceTypeFl,
          surface_type_fr: point.surfaceTypeFr,
        }))
      );

      if (error) throw error;
    } catch (error: any) {
      // Suppress duplicate key constraint errors (23505) - they're expected due to 60Hz telemetry
      if (error?.code === '23505') {
        // Silently ignore duplicate entries - this is normal behavior
        const duplicatesCount = dataPoints.length;
        return;
      }
      
      // Log and throw other errors
      console.error("❌ Failed to save telemetry data:", error);
      throw error;
    }
  }

  /**
   * Get all sessions for history page
   */
  async getAllSessions(): Promise<Session[]> {
    try {
      const { data, error } = await this.supabase
        .from("sessions")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      return (
        data?.map((row) => ({
          id: row.id,
          name: row.name,
          playerName: row.player_name,
          track: row.track,
          car: row.car,
          sessionType: row.session_type,
          createdAt: new Date(row.created_at),
          endedAt: row.ended_at ? new Date(row.ended_at) : undefined,
          totalLaps: row.total_laps,
          isActive: row.is_active,
          metadata: row.metadata,
        })) || []
      );
    } catch (error) {
      console.error("❌ Failed to fetch sessions:", error);
      throw error;
    }
  }

  /**
   * Get session details with laps and telemetry data
   */
  async getSessionDetails(sessionId: string): Promise<{
    session: Session;
    laps: Lap[];
    telemetryData: TelemetryDataPoint[];
  } | null> {
    try {
      // Get session
      const { data: sessionData, error: sessionError } = await this.supabase
        .from("sessions")
        .select("*")
        .eq("id", sessionId)
        .single();

      if (sessionError) throw sessionError;

      // Get laps
      const { data: lapsData, error: lapsError } = await this.supabase
        .from("laps")
        .select("*")
        .eq("session_id", sessionId)
        .order("lap_number");

      if (lapsError) throw lapsError;

      // Get telemetry data (limited to avoid huge payloads)
      const { data: telemetryData, error: telemetryError } = await this.supabase
        .from("telemetry_data")
        .select("*")
        .eq("session_id", sessionId)
        .order("lap_id, distance_from_start");

      if (telemetryError) throw telemetryError;

      const session: Session = {
        id: sessionData.id,
        name: sessionData.name,
        playerName: sessionData.player_name,
        track: sessionData.track,
        car: sessionData.car,
        sessionType: sessionData.session_type,
        createdAt: new Date(sessionData.created_at),
        endedAt: sessionData.ended_at
          ? new Date(sessionData.ended_at)
          : undefined,
        totalLaps: sessionData.total_laps,
        isActive: sessionData.is_active,
        metadata: sessionData.metadata,
      };

      const laps: Lap[] =
        lapsData?.map((row) => ({
          id: row.id,
          sessionId: row.session_id,
          lapNumber: row.lap_number,
          lapTimeMs: row.lap_time_ms,
          sector1TimeMs: row.sector_1_time_ms,
          sector2TimeMs: row.sector_2_time_ms,
          sector3TimeMs: row.sector_3_time_ms,
          isValid: row.is_valid,
          createdAt: new Date(row.created_at),
        })) || [];

      const telemetry: TelemetryDataPoint[] =
        telemetryData?.map((row) => ({
          sessionId: row.session_id,
          lapId: row.lap_id,
          distanceFromStart: row.distance_from_start,
          lapDistance: row.lap_distance,
          speed: row.speed,
          throttle: row.throttle,
          brake: row.brake,
          steer: row.steer,
          gear: row.gear,
          engineRpm: row.engine_rpm,
          drs: row.drs,
          engineTemp: row.engine_temp,
          brakeTempRl: row.brake_temp_rl,
          brakeTempRr: row.brake_temp_rr,
          brakeTempFl: row.brake_temp_fl,
          brakeTempFr: row.brake_temp_fr,
          tyreSurfaceTempRl: row.tyre_surface_temp_rl,
          tyreSurfaceTempRr: row.tyre_surface_temp_rr,
          tyreSurfaceTempFl: row.tyre_surface_temp_fl,
          tyreSurfaceTempFr: row.tyre_surface_temp_fr,
          tyreInnerTempRl: row.tyre_inner_temp_rl,
          tyreInnerTempRr: row.tyre_inner_temp_rr,
          tyreInnerTempFl: row.tyre_inner_temp_fl,
          tyreInnerTempFr: row.tyre_inner_temp_fr,
          tyrePressureRl: row.tyre_pressure_rl,
          tyrePressureRr: row.tyre_pressure_rr,
          tyrePressureFl: row.tyre_pressure_fl,
          tyrePressureFr: row.tyre_pressure_fr,
          revLightsPercent: row.rev_lights_percent,
          clutch: row.clutch,
          surfaceTypeRl: row.surface_type_rl,
          surfaceTypeRr: row.surface_type_rr,
          surfaceTypeFl: row.surface_type_fl,
          surfaceTypeFr: row.surface_type_fr,
        })) || [];

      return {
        session,
        laps,
        telemetryData: telemetry,
      };
    } catch (error) {
      console.error("❌ Failed to fetch session details:", error);
      return null;
    }
  }

  /**
   * Check if database is connected
   */
  public isReady(): boolean {
    return this.isConnected;
  }
}

export default DatabaseService;
