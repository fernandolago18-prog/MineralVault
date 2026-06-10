-- ============================================================
-- MineralVault — PEGAR ESTO EN: Supabase Dashboard > SQL Editor
-- Arregla búsqueda (ILIKE substring) + limpia hardness=0
-- ============================================================

-- 1. Habilitar extensión trigrama (para ILIKE rápido con índice)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. Limpiar hardness = 0 → NULL (ningún mineral tiene dureza 0)
UPDATE public.minerals
   SET hardness_min = NULL,
       hardness_max = NULL
 WHERE hardness_min = 0
    OR hardness_max = 0;

-- 3. Limpiar density = 0 → NULL
UPDATE public.minerals
   SET density_min = NULL,
       density_max = NULL
 WHERE density_min = 0
    OR density_max = 0;

-- 4. Índices trigrama para búsqueda ILIKE eficiente
DROP INDEX IF EXISTS idx_minerals_name_trgm;
DROP INDEX IF EXISTS idx_minerals_name_es_trgm;
CREATE INDEX idx_minerals_name_trgm    ON public.minerals USING gin(name    gin_trgm_ops);
CREATE INDEX idx_minerals_name_es_trgm ON public.minerals USING gin(name_es gin_trgm_ops);

-- 5. Nueva función search_minerals con ILIKE (búsqueda parcial funciona)
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
  WITH matched_parents AS (
    SELECT DISTINCT m.id
    FROM public.minerals m
    WHERE
      -- Búsqueda ILIKE: soporta parciales, sin importar idioma ni acentos
      (
        q = ''
        OR m.name    ILIKE '%' || q || '%'
        OR m.name_es ILIKE '%' || q || '%'
        OR EXISTS (
          SELECT 1 FROM public.minerals v
          WHERE v.parent_mindat_id = m.mindat_id
            AND (v.name ILIKE '%' || q || '%' OR v.name_es ILIKE '%' || q || '%')
        )
      )
      -- Filtros
      AND (filter_class  IS NULL OR m.mineral_class  ILIKE filter_class)
      AND (filter_system IS NULL OR m.crystal_system ILIKE filter_system)
      AND (hardness_min_v IS NULL OR (m.hardness_max IS NOT NULL AND m.hardness_max > 0 AND m.hardness_max >= hardness_min_v))
      AND (hardness_max_v IS NULL OR (m.hardness_min IS NOT NULL AND m.hardness_min > 0 AND m.hardness_min <= hardness_max_v))
      -- Solo raíces (sin padre)
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
    -- Segundo: minerales con más datos antes
    (
      CASE WHEN m.description      IS NOT NULL              THEN 3 ELSE 0 END +
      CASE WHEN m.chemical_formula IS NOT NULL              THEN 2 ELSE 0 END +
      CASE WHEN m.hardness_min     IS NOT NULL AND m.hardness_min > 0 THEN 2 ELSE 0 END +
      CASE WHEN m.crystal_system   IS NOT NULL              THEN 1 ELSE 0 END +
      CASE WHEN m.color            IS NOT NULL              THEN 1 ELSE 0 END +
      CASE WHEN m.mineral_class    IS NOT NULL              THEN 1 ELSE 0 END
    ) DESC,
    -- Tercero: alfabético
    m.name ASC
  LIMIT page_size OFFSET page_offset;
END;
$$;

-- 6. Test rápido de verificación
SELECT 'quartz parcial' AS test, COUNT(*) AS resultados
  FROM search_minerals('quar', NULL, NULL, NULL, NULL, 10, 0)
UNION ALL
SELECT 'malachite parcial', COUNT(*)
  FROM search_minerals('mala', NULL, NULL, NULL, NULL, 10, 0)
UNION ALL
SELECT 'sin query (carga inicial)', COUNT(*)
  FROM search_minerals(NULL, NULL, NULL, NULL, NULL, 24, 0);
