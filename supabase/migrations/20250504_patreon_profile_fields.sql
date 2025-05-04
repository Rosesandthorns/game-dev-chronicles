
-- Add Patreon-related fields to the profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS patreon_id TEXT,
ADD COLUMN IF NOT EXISTS patreon_connected BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS patreon_token TEXT,
ADD COLUMN IF NOT EXISTS patreon_refresh_token TEXT;

-- Create an index on the patreon_id column for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_patreon_id ON public.profiles(patreon_id);
