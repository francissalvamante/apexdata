-- F1 Telemetry Database Schema for Supabase
-- This schema supports the hybrid session approach with distance-based telemetry storage

-- Sessions table - stores individual recording sessions
CREATE TABLE IF NOT EXISTS sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  player_name TEXT NOT NULL,
  track TEXT,
  car TEXT,
  session_type TEXT, -- 'practice', 'qualifying', 'race', 'custom'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  total_laps INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB -- Additional session info like weather, setup notes, etc.
);

-- Laps table - stores individual completed laps within sessions
CREATE TABLE IF NOT EXISTS laps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  lap_number INTEGER NOT NULL,
  lap_time_ms INTEGER, -- Lap time in milliseconds
  sector_1_time_ms INTEGER,
  sector_2_time_ms INTEGER, 
  sector_3_time_ms INTEGER,
  is_valid BOOLEAN DEFAULT true, -- Invalid if penalties/track limits exceeded
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(session_id, lap_number)
);

-- Telemetry data points - stored every metre during in-lap (driverStatus = 2)
CREATE TABLE IF NOT EXISTS telemetry_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  lap_id UUID REFERENCES laps(id) ON DELETE CASCADE,
  
  -- Position data
  distance_from_start INTEGER NOT NULL, -- Metres from lap start (0-track_length)
  lap_distance REAL, -- Total distance around current lap
  
  -- Core telemetry
  speed INTEGER NOT NULL, -- KPH
  throttle REAL, -- 0.0 to 1.0
  brake REAL, -- 0.0 to 1.0
  steer REAL, -- -1.0 to 1.0
  gear INTEGER, -- -1 (R), 0 (N), 1-8
  engine_rpm INTEGER,
  drs INTEGER, -- 0 = off, 1 = on
  
  -- Temperatures (Celsius)
  engine_temp INTEGER,
  brake_temp_rl INTEGER, -- Rear Left
  brake_temp_rr INTEGER, -- Rear Right  
  brake_temp_fl INTEGER, -- Front Left
  brake_temp_fr INTEGER, -- Front Right
  tyre_surface_temp_rl INTEGER,
  tyre_surface_temp_rr INTEGER,
  tyre_surface_temp_fl INTEGER,
  tyre_surface_temp_fr INTEGER,
  tyre_inner_temp_rl INTEGER,
  tyre_inner_temp_rr INTEGER,
  tyre_inner_temp_fl INTEGER,
  tyre_inner_temp_fr INTEGER,
  
  -- Pressures (PSI)
  tyre_pressure_rl REAL,
  tyre_pressure_rr REAL,
  tyre_pressure_fl REAL,
  tyre_pressure_fr REAL,
  
  -- Additional data
  rev_lights_percent INTEGER,
  clutch INTEGER, -- 0-100
  surface_type_rl INTEGER, -- Surface type codes
  surface_type_rr INTEGER,
  surface_type_fl INTEGER,
  surface_type_fr INTEGER,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique data points per distance per lap
  UNIQUE(lap_id, distance_from_start)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_sessions_active ON sessions(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_laps_session_id ON laps(session_id);
CREATE INDEX IF NOT EXISTS idx_laps_session_lap ON laps(session_id, lap_number);
CREATE INDEX IF NOT EXISTS idx_telemetry_session_id ON telemetry_data(session_id);
CREATE INDEX IF NOT EXISTS idx_telemetry_lap_id ON telemetry_data(lap_id);
CREATE INDEX IF NOT EXISTS idx_telemetry_distance ON telemetry_data(lap_id, distance_from_start);

-- Row Level Security (RLS) policies can be added later if needed for multi-user support

-- View for session statistics
CREATE OR REPLACE VIEW session_stats AS
SELECT 
  s.id,
  s.name,
  s.player_name,
  s.track,
  s.car,
  s.session_type,
  s.created_at,
  s.ended_at,
  s.total_laps,
  s.is_active,
  COUNT(l.id) as completed_laps,
  MIN(l.lap_time_ms) as best_lap_time_ms,
  AVG(l.lap_time_ms) as avg_lap_time_ms,
  COUNT(DISTINCT td.id) as total_data_points
FROM sessions s
LEFT JOIN laps l ON s.id = l.session_id
LEFT JOIN telemetry_data td ON s.id = td.session_id
GROUP BY s.id, s.name, s.player_name, s.track, s.car, s.session_type, s.created_at, s.ended_at, s.total_laps, s.is_active;