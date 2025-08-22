-- Migration Script: Add Unique Constraint back to telemetry_data table
-- Execute this in your Supabase SQL Editor
-- Date: 2025-08-21

-- First, remove any duplicate records that might exist
-- Keep only the first occurrence of each (lap_id, distance_from_start) combination
DELETE FROM telemetry_data
WHERE id NOT IN (
    SELECT DISTINCT ON (lap_id, distance_from_start) id
    FROM telemetry_data
    ORDER BY lap_id, distance_from_start, created_at ASC
);

-- Add the unique constraint back
ALTER TABLE telemetry_data 
ADD CONSTRAINT telemetry_data_lap_id_distance_from_start_key 
UNIQUE (lap_id, distance_from_start);

-- Update table comment
COMMENT ON TABLE telemetry_data IS 'F1 telemetry data stored every meter during flying laps. Unique constraint prevents duplicate distance entries per lap.';