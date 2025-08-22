-- Migration Script: Remove Unique Constraint from telemetry_data table
-- Execute this in your Supabase SQL Editor
-- Date: 2025-08-21

-- Remove the unique constraint on (lap_id, distance_from_start)
ALTER TABLE telemetry_data 
DROP CONSTRAINT IF EXISTS telemetry_data_lap_id_distance_from_start_key;

-- Alternative constraint name (in case Supabase named it differently)
ALTER TABLE telemetry_data 
DROP CONSTRAINT IF EXISTS telemetry_data_lap_id_distance_from_start_unique;

-- Verify the constraint was removed (optional check)
-- You can run this to confirm no unique constraints exist on those columns:
-- SELECT conname, contype 
-- FROM pg_constraint 
-- WHERE conrelid = 'telemetry_data'::regclass 
-- AND contype = 'u';

-- Add a comment to document the change
COMMENT ON TABLE telemetry_data IS 'F1 telemetry data stored every meter during flying laps. Multiple data points per distance allowed to handle 60Hz telemetry from F1 25.';