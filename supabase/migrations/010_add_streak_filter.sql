-- Migration to update search_minerals RPC to accept filter_streak

-- 1. Eliminar la versión anterior (con 8 argumentos) para evitar el error de ambigüedad
DROP FUNCTION IF EXISTS search_minerals(text, text, text, numeric, numeric, integer, integer, text);

-- 2. Crear la nueva versión (con 9 argumentos)
CREATE OR REPLACE FUNCTION search_minerals(
  search_query text DEFAULT NULL,
  filter_class text DEFAULT NULL,
  filter_system text DEFAULT NULL,
  hardness_min_v numeric DEFAULT NULL,
  hardness_max_v numeric DEFAULT NULL,
  page_size int DEFAULT 20,
  page_offset int DEFAULT 0,
  filter_type text DEFAULT '',
  filter_streak text DEFAULT '' 
)
RETURNS TABLE (
  id uuid,
  mindat_id int,
  name text,
  name_es text,
  chemical_formula text,
  hardness_min numeric,
  hardness_max numeric,
  crystal_system text,
  mineral_class text,
  thumbnail_url text,
  streak text,
  parent_mindat_id int,
  is_rock boolean,
  total_count bigint
) 
LANGUAGE plpgsql
AS $$
DECLARE
  q text;
  t text;
  s text;
BEGIN
  -- Normalizar parámetros
  q := COALESCE(TRIM(search_query), '');
  t := COALESCE(TRIM(filter_type), '');
  s := COALESCE(TRIM(filter_streak), '');

  RETURN QUERY
  WITH filtered AS (
    SELECT m.*, p.is_rock as p_is_rock, p.streak as p_streak
    FROM minerals m
    LEFT JOIN minerals p ON m.parent_mindat_id = p.mindat_id
    WHERE 
      -- Búsqueda por texto ILIKE
      (
        q = '' 
        OR m.name ILIKE '%' || q || '%' 
        OR m.name_es ILIKE '%' || q || '%'
        OR m.chemical_formula ILIKE '%' || q || '%'
        OR m.mineral_class ILIKE '%' || q || '%'
        OR m.crystal_system ILIKE '%' || q || '%'
      )
      AND (filter_class IS NULL OR m.mineral_class = filter_class)
      AND (filter_system IS NULL OR m.crystal_system = filter_system)
      AND (hardness_min_v IS NULL OR m.hardness_max >= hardness_min_v)
      AND (hardness_max_v IS NULL OR m.hardness_min <= hardness_max_v)
      AND (
        t = ''
        OR (t = 'rock' AND COALESCE(m.is_rock, p.is_rock, FALSE) = TRUE)
        OR (t = 'mineral' AND COALESCE(m.is_rock, p.is_rock, FALSE) = FALSE)
      )
      AND (
        s = ''
        OR COALESCE(m.streak, p.streak, '') ILIKE '%' || s || '%'
      )
  )
  SELECT 
    f.id,
    f.mindat_id,
    f.name,
    f.name_es,
    f.chemical_formula,
    f.hardness_min,
    f.hardness_max,
    f.crystal_system,
    f.mineral_class,
    f.thumbnail_url,
    f.streak,
    f.parent_mindat_id,
    f.is_rock,
    (SELECT count(*) FROM filtered) AS total_count
  FROM filtered f
  ORDER BY 
    CASE WHEN f.thumbnail_url IS NOT NULL THEN 0 ELSE 1 END,
    f.name ASC
  LIMIT page_size
  OFFSET page_offset;
END;
$$;
