-- ============================================================
-- Migración: 027_secure_google_tokens.sql
-- Ejecutar en: Supabase Dashboard > SQL Editor o mediante CLI
-- Separa el token de refresco de Google a una tabla privada
-- sin accesos directos desde PostgREST (cliente API)
-- ============================================================

-- 1. Crear la tabla de tokens seguros
CREATE TABLE IF NOT EXISTS public.user_google_tokens (
  user_id       UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  refresh_token TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Migrar los tokens existentes de user_profiles a la nueva tabla
INSERT INTO public.user_google_tokens (user_id, refresh_token, created_at, updated_at)
SELECT id, google_refresh_token, created_at, updated_at
FROM public.user_profiles
WHERE google_refresh_token IS NOT NULL
ON CONFLICT (user_id) DO UPDATE
SET refresh_token = EXCLUDED.refresh_token,
    updated_at    = EXCLUDED.updated_at;

-- 3. Habilitar RLS en la nueva tabla de tokens
ALTER TABLE public.user_google_tokens ENABLE ROW LEVEL SECURITY;

-- Nota: NO creamos ninguna política (SELECT, INSERT, UPDATE, DELETE) para
-- los roles 'authenticated' o 'anon'. Esto hace que la tabla sea inaccesible
-- a través del cliente Supabase del frontend. Solo la cuenta service_role
-- (servidor) podrá consultar y modificar estos registros.

-- 4. Eliminar la columna expuesta de user_profiles
ALTER TABLE public.user_profiles
  DROP COLUMN IF EXISTS google_refresh_token;
