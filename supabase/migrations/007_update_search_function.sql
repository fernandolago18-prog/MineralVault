-- ============================================================
-- MineralVault — Migración 007: Buscar variantes directamente y heredar propiedades
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
    SELECT DISTINCT m.id
    FROM public.minerals m
    LEFT JOIN public.minerals p ON m.parent_mindat_id = p.mindat_id
    WHERE
      -- Búsqueda ILIKE: busca en el propio mineral
      (
        q = ''
        OR m.name    ILIKE '%' || q || '%'
        OR m.name_es ILIKE '%' || q || '%'
        -- O si es un padre, busca también en sus variedades
        OR (
          m.parent_mindat_id IS NULL
          AND EXISTS (
            SELECT 1 FROM public.minerals v
            WHERE v.parent_mindat_id = m.mindat_id
              AND (v.name ILIKE '%' || q || '%' OR v.name_es ILIKE '%' || q || '%')
          )
        )
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
      -- Condición: Si no hay consulta, solo mostramos las especies principales (raíces).
      -- Si hay consulta, mostramos tanto especies principales como variedades independientes que coincidan.
      AND (q <> '' OR m.parent_mindat_id IS NULL)
  )
  SELECT
    m.id,
    m.mindat_id,
    m.name,
    m.name_es,
    COALESCE(m.chemical_formula, p.chemical_formula) AS chemical_formula,
    COALESCE(m.hardness_min, p.hardness_min) AS hardness_min,
    COALESCE(m.hardness_max, p.hardness_max) AS hardness_max,
    COALESCE(m.density_min, p.density_min) AS density_min,
    COALESCE(m.density_max, p.density_max) AS density_max,
    COALESCE(m.streak, p.streak) AS streak,
    COALESCE(m.color, p.color) AS color,
    COALESCE(m.crystal_system, p.crystal_system) AS crystal_system,
    COALESCE(m.crystal_habits, p.crystal_habits) AS crystal_habits,
    COALESCE(m.mineral_class, p.mineral_class) AS mineral_class,
    COALESCE(m.thumbnail_url, p.thumbnail_url) AS thumbnail_url,
    -- model_3d_config: heredar si es amorfo/defecto
    CASE 
      WHEN m.model_3d_config IS NULL OR m.model_3d_config = '{}'::jsonb OR (m.model_3d_config->>'system' = 'Amorphous' AND (m.model_3d_config->'params'->>'a' = '1' OR m.model_3d_config->'params' IS NULL)) THEN
        p.model_3d_config
      ELSE 
        m.model_3d_config
    END AS model_3d_config,
    m.parent_mindat_id,
    COUNT(*) OVER() AS total_count
  FROM public.minerals m
  INNER JOIN matched_minerals mm ON m.id = mm.id
  LEFT JOIN public.minerals p ON m.parent_mindat_id = p.mindat_id
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
      CASE WHEN COALESCE(m.description, p.description) IS NOT NULL THEN 3 ELSE 0 END +
      CASE WHEN COALESCE(m.chemical_formula, p.chemical_formula) IS NOT NULL THEN 2 ELSE 0 END +
      CASE WHEN COALESCE(m.hardness_min, p.hardness_min) IS NOT NULL THEN 2 ELSE 0 END
    ) DESC,
    m.name ASC
  LIMIT page_size OFFSET page_offset;
END;
$$;


-- ============================================================
-- ENRIQUECIMIENTO DE HÁBITOS DE CRISTALIZACIÓN COMUNES
-- ============================================================

-- Cuarzo (Quartz) - ID 3337: Agregar hábitos clásicos
UPDATE public.minerals
   SET crystal_habits = ARRAY['Prismatic', 'Rhombohedral', 'Tabular']
 WHERE mindat_id = 3337;

-- Fluorita (Fluorite) - ID 1576: Agregar hábitos cúbicos, octaédricos y dodecaédricos
UPDATE public.minerals
   SET crystal_habits = ARRAY['Cubic', 'Octahedral', 'Dodecahedral']
 WHERE mindat_id = 1576;

-- Calcita (Calcite) - ID 859: Agregar hábitos rhomboédricos, escalenoédricos y prismáticos
UPDATE public.minerals
   SET crystal_habits = ARRAY['Rhombohedral', 'Scalenohedral', 'Prismatic']
 WHERE mindat_id = 859;

-- Corindón (Corundum) - ID 1136: Agregar hábitos piramidales, prismáticos y tabulares
UPDATE public.minerals
   SET crystal_habits = ARRAY['Pyramidal', 'Prismatic', 'Tabular']
 WHERE mindat_id = 1136;
