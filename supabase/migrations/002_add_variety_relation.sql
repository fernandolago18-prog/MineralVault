-- ============================================================
-- MineralVault — Migración: Relación de Variedades de Minerales
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. Agregar columna para el ID del mineral padre (referencia flexible)
ALTER TABLE public.minerals
ADD COLUMN IF NOT EXISTS parent_mindat_id INTEGER;

-- 2. Crear índice para mejorar el rendimiento de consultas por relación
CREATE INDEX IF NOT EXISTS idx_minerals_parent_mindat_id ON public.minerals(parent_mindat_id);

-- 3. Actualizar la función de búsqueda avanzada (search_minerals)
DROP FUNCTION IF EXISTS public.search_minerals(text, text, text, numeric, numeric, integer, integer);

CREATE OR REPLACE FUNCTION public.search_minerals(
  search_query    TEXT DEFAULT NULL,
  filter_class    TEXT DEFAULT NULL,
  filter_system   TEXT DEFAULT NULL,
  hardness_min_v  NUMERIC DEFAULT NULL,
  hardness_max_v  NUMERIC DEFAULT NULL,
  page_size       INTEGER DEFAULT 24,
  page_offset     INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID, mindat_id INTEGER, name TEXT, name_es TEXT,
  chemical_formula TEXT, hardness_min NUMERIC, hardness_max NUMERIC,
  density_min NUMERIC, density_max NUMERIC, streak TEXT,
  color TEXT[], crystal_system TEXT, crystal_habits TEXT[],
  mineral_class TEXT, thumbnail_url TEXT, model_3d_config JSONB,
  parent_mindat_id INTEGER,
  total_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH matched_parents AS (
    SELECT DISTINCT m.id
    FROM public.minerals m
    WHERE
      -- Búsqueda de coincidencia textual (en el padre o en alguna de sus variedades)
      (
        search_query IS NULL 
        OR to_tsvector('english', m.name || ' ' || COALESCE(m.name_es, '')) @@ plainto_tsquery('english', search_query)
        OR EXISTS (
          SELECT 1 
          FROM public.minerals v 
          WHERE v.parent_mindat_id = m.mindat_id 
            AND to_tsvector('english', v.name || ' ' || COALESCE(v.name_es, '')) @@ plainto_tsquery('english', search_query)
        )
      )
      -- Filtros aplicados sobre el mineral padre
      AND (filter_class IS NULL OR m.mineral_class ILIKE filter_class)
      AND (filter_system IS NULL OR m.crystal_system ILIKE filter_system)
      AND (hardness_min_v IS NULL OR m.hardness_max >= hardness_min_v)
      AND (hardness_max_v IS NULL OR m.hardness_min <= hardness_max_v)
      -- Solo mostrar minerales padres a nivel superior
      AND m.parent_mindat_id IS NULL
  )
  SELECT
    m.id, m.mindat_id, m.name, m.name_es, m.chemical_formula,
    m.hardness_min, m.hardness_max, m.density_min, m.density_max,
    m.streak, m.color, m.crystal_system, m.crystal_habits,
    m.mineral_class, m.thumbnail_url, m.model_3d_config,
    m.parent_mindat_id,
    COUNT(*) OVER() AS total_count
  FROM public.minerals m
  INNER JOIN matched_parents mp ON m.id = mp.id
  ORDER BY m.name ASC
  LIMIT page_size OFFSET page_offset;
END;
$$;
