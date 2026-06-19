-- ============================================================
-- Migración: 026_multi_specimen.sql
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- Permite múltiples ejemplares del mismo mineral por usuario
-- ============================================================

-- 1. Eliminar la restricción UNIQUE(user_id, mineral_id)
ALTER TABLE public.user_collection
  DROP CONSTRAINT IF EXISTS user_collection_user_id_mineral_id_key;

-- 2. Añadir columna specimen_label para identificar/etiquetar ejemplares individuales
ALTER TABLE public.user_collection
  ADD COLUMN IF NOT EXISTS specimen_label TEXT;

-- 3. Crear índice para acelerar búsquedas agrupadas por usuario y mineral
CREATE INDEX IF NOT EXISTS idx_collection_user_mineral
  ON public.user_collection(user_id, mineral_id, created_at DESC);
