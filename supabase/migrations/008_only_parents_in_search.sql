-- ============================================================
-- MineralVault — Migración 008: Retornar solo especies principales en búsqueda y agrupar variedades
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- ============================================================

DROP FUNCTION IF EXISTS public.search_minerals(text, text, text, numeric, numeric, integer, integer);

CREATE OR REPLACE FUNCTION public.search_minerals(
  search_query    TEXT    DEFAULT NULL,
  filter_class    TEXT    DEFAULT NULL,
  filter_system   TEXT    DEFAULT NULL,
  hardness_min_v  NUMERIC DEFAULT NULL,
  hardness_max_v  NUMERIC DEFAULT NULL,
  page_size       INTEGER DEFAULT 24,
  page_offset     INTEGER DEFAULT 0
)
RETURNS TABLE (
  id               UUID,
  mindat_id        INTEGER,
  name             TEXT,
  name_es          TEXT,
  chemical_formula TEXT,
  hardness_min     NUMERIC,
  hardness_max     NUMERIC,
  density_min      NUMERIC,
  density_max      NUMERIC,
  streak           TEXT,
  color            TEXT[],
  crystal_system   TEXT,
  crystal_habits   TEXT[],
  mineral_class    TEXT,
  thumbnail_url    TEXT,
  model_3d_config  JSONB,
  parent_mindat_id INTEGER,
  total_count      BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  q TEXT;
BEGIN
  q := LOWER(TRIM(COALESCE(search_query, '')));

  RETURN QUERY
  WITH matched_minerals AS (
    -- Si el mineral es una variedad, devolvemos el id de su especie principal (padre).
    -- Si es una especie principal (padre), devolvemos su propio id.
    -- Esto garantiza que las variedades no aparezcan como tarjetas duplicadas en el catálogo.
    SELECT DISTINCT COALESCE(p.id, m.id) AS id
    FROM public.minerals m
    LEFT JOIN public.minerals p ON m.parent_mindat_id = p.mindat_id
    WHERE
      -- Búsqueda ILIKE: busca en el propio mineral (sea especie o variedad)
      (
        q = ''
        OR m.name    ILIKE '%' || q || '%'
        OR m.name_es ILIKE '%' || q || '%'
      )
      -- Filtros aplicados sobre las propiedades (con herencia en el filtrado)
      AND (
        filter_class IS NULL 
        OR COALESCE(m.mineral_class, p.mineral_class) ILIKE filter_class
      )
      AND (
        filter_system IS NULL 
        OR COALESCE(m.crystal_system, p.crystal_system) ILIKE filter_system
      )
      AND (
        hardness_min_v IS NULL 
        OR COALESCE(m.hardness_max, p.hardness_max) >= hardness_min_v
      )
      AND (
        hardness_max_v IS NULL 
        OR COALESCE(m.hardness_min, p.hardness_min) <= hardness_max_v
      )
  )
  SELECT
    m.id,
    m.mindat_id,
    m.name,
    m.name_es,
    m.chemical_formula,
    m.hardness_min,
    m.hardness_max,
    m.density_min,
    m.density_max,
    m.streak,
    m.color,
    m.crystal_system,
    m.crystal_habits,
    m.mineral_class,
    m.thumbnail_url,
    m.model_3d_config,
    m.parent_mindat_id,
    COUNT(*) OVER() AS total_count
  FROM public.minerals m
  INNER JOIN matched_minerals mm ON m.id = mm.id
  ORDER BY
    -- Primero: relevancia de coincidencia
    CASE
      WHEN q = ''                                THEN 0
      WHEN LOWER(m.name)    = q                  THEN 0   -- exacto
      WHEN LOWER(m.name)    LIKE q || '%'        THEN 1   -- empieza por
      WHEN LOWER(m.name_es) = q                  THEN 1
      WHEN LOWER(m.name_es) LIKE q || '%'        THEN 2
      ELSE                                            3   -- contiene
    END ASC,
    -- Segundo: minerales con más datos
    (
      CASE WHEN m.description IS NOT NULL THEN 3 ELSE 0 END +
      CASE WHEN m.chemical_formula IS NOT NULL THEN 2 ELSE 0 END +
      CASE WHEN m.hardness_min IS NOT NULL THEN 2 ELSE 0 END
    ) DESC,
    m.name ASC
  LIMIT page_size OFFSET page_offset;
END;
$$;
