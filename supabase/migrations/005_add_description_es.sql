-- ============================================================
-- MineralVault — PEGAR ESTO EN: Supabase Dashboard > SQL Editor
-- Añade columna para descripción en español
-- ============================================================

ALTER TABLE public.minerals ADD COLUMN IF NOT EXISTS description_es TEXT;
