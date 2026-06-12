-- ============================================================
-- MineralVault — Migración 009: Agregar campo is_rock y filtro por tipo
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. Agregar columna is_rock a la tabla minerals (si no existe)
ALTER TABLE public.minerals ADD COLUMN IF NOT EXISTS is_rock BOOLEAN DEFAULT FALSE;

-- 2. Marcar geomateriales que son rocas en la base de datos basados en nombres/palabras clave
UPDATE public.minerals
SET is_rock = TRUE
WHERE 
  name ILIKE '%rock%' OR name_es ILIKE '%roca%'
  OR name ILIKE '%granite%' OR name_es ILIKE '%granito%'
  OR name ILIKE '%basalt%' OR name_es ILIKE '%basalto%'
  OR name ILIKE '%obsidian%' OR name_es ILIKE '%obsidiana%'
  OR name ILIKE '%coal%' OR name_es ILIKE '%carbón%'
  OR name ILIKE '%limestone%' OR name_es ILIKE '%caliza%'
  OR name ILIKE '%sandstone%' OR name_es ILIKE '%arenisca%'
  OR name ILIKE '%marble%' OR name_es ILIKE '%mármol%'
  OR name ILIKE '%slate%' OR name_es ILIKE '%pizarra%'
  OR name ILIKE '%gneiss%' OR name_es ILIKE '%gneis%'
  OR name ILIKE '%schist%' OR name_es ILIKE '%esquisto%'
  OR name ILIKE '%rhyolite%' OR name_es ILIKE '%riolita%'
  OR name ILIKE '%andesite%' OR name_es ILIKE '%andesita%'
  OR name ILIKE '%diorite%' OR name_es ILIKE '%diorita%'
  OR name ILIKE '%gabbro%' OR name_es ILIKE '%gabro%'
  OR name ILIKE '%pumice%' OR name_es ILIKE '%pumita%'
  OR name ILIKE '%tuff%' OR name_es ILIKE '%toba%'
  OR name ILIKE '%shale%' OR name_es ILIKE '%lutita%'
  OR name ILIKE '%clay%' OR name_es ILIKE '%arcilla%'
  OR name ILIKE '%conglomerado%' OR name_es ILIKE '%brecha%'
  OR name ILIKE '%sienita%' OR name ILIKE '%syenite%'
  OR name ILIKE '%peridotite%' OR name_es ILIKE '%peridotita%'
  OR name ILIKE '%serpentinite%' OR name_es ILIKE '%serpentinita%'
  OR name ILIKE '%quartzite%' OR name_es ILIKE '%cuarcita%'
  OR name ILIKE '%amphibolite%' OR name_es ILIKE '%anfibolita%'
  OR name ILIKE '%flint%' OR name_es ILIKE '%pedernal%'
  OR name ILIKE '%chert%'
  OR name ILIKE '%chalk%' OR name_es ILIKE '%tiza%'
  OR name ILIKE '%lapis lazuli%' OR name_es ILIKE '%lapislázuli%';

-- 3. Crear índice para optimizar filtrado por tipo
CREATE INDEX IF NOT EXISTS idx_minerals_is_rock ON public.minerals(is_rock);

-- 4. Re-crear función search_minerals incluyendo el campo is_rock y parámetro filter_type
DROP FUNCTION IF EXISTS public.search_minerals(text, text, text, numeric, numeric, integer, integer);
DROP FUNCTION IF EXISTS public.search_minerals(text, text, text, numeric, numeric, integer, integer, text);

CREATE OR REPLACE FUNCTION public.search_minerals(
  search_query    TEXT    DEFAULT NULL,
  filter_class    TEXT    DEFAULT NULL,
  filter_system   TEXT    DEFAULT NULL,
  hardness_min_v  NUMERIC DEFAULT NULL,
  hardness_max_v  NUMERIC DEFAULT NULL,
  page_size       INTEGER DEFAULT 24,
  page_offset     INTEGER DEFAULT 0,
  filter_type     TEXT    DEFAULT NULL  -- 'mineral', 'rock' o NULL para ambos
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
  is_rock          BOOLEAN,
  total_count      BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  q TEXT;
  t TEXT;
BEGIN
  q := LOWER(TRIM(COALESCE(search_query, '')));
  t := LOWER(TRIM(COALESCE(filter_type, '')));

  RETURN QUERY
  WITH matched_minerals AS (
    -- Si el mineral es una variedad, devolvemos el id de su especie principal (padre).
    -- Si es una especie principal (padre), devolvemos su propio id.
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
      -- Filtro por tipo: 'mineral' o 'rock' (con herencia)
      AND (
        t = ''
        OR (t = 'rock' AND COALESCE(m.is_rock, p.is_rock, FALSE) = TRUE)
        OR (t = 'mineral' AND COALESCE(m.is_rock, p.is_rock, FALSE) = FALSE)
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
    m.is_rock,
    COUNT(*) OVER() AS total_count
  FROM public.minerals m
  INNER JOIN matched_minerals mm ON m.id = mm.id
  ORDER BY
    -- Primero: relevancia de coincidencia
    CASE
      WHEN q = ''                                THEN 0
      WHEN LOWER(m.name)    = q                  THEN 0
      WHEN LOWER(m.name)    LIKE q || '%'        THEN 1
      WHEN LOWER(m.name_es) = q                  THEN 1
      WHEN LOWER(m.name_es) LIKE q || '%'        THEN 2
      ELSE                                            3
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
