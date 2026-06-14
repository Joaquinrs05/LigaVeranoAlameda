-- Añade entrenador_id y foto_url a equipos
-- Añade foto_url a jugadores

ALTER TABLE equipos
  ADD COLUMN IF NOT EXISTS entrenador_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS foto_url      text;

ALTER TABLE jugadores
  ADD COLUMN IF NOT EXISTS foto_url text;
