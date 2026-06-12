-- Migration to optimize search_minerals performance

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
  q_unaccent text;
  t text;
  s text;
BEGIN
  q := COALESCE(TRIM(search_query), '');
  q_unaccent := unaccent(q);
  t := COALESCE(TRIM(filter_type), '');
  s := COALESCE(TRIM(filter_streak), '');

  RETURN QUERY
  WITH matched AS (
    SELECT m.mindat_id, m.parent_mindat_id
    FROM minerals m
    LEFT JOIN minerals p ON m.parent_mindat_id = p.mindat_id
    WHERE 
      (
        q = '' 
        OR m.name ILIKE '%' || q || '%' 
        OR unaccent(m.name_es) ILIKE '%' || q_unaccent || '%'
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
  ),
  representative_ids AS (
    SELECT DISTINCT COALESCE(m.parent_mindat_id, m.mindat_id) as rep_mindat_id
    FROM matched m
  ),
  filtered AS (
    SELECT rep.*
    FROM minerals rep
    JOIN representative_ids r ON rep.mindat_id = r.rep_mindat_id
  )
  SELECT 
    f.id, f.mindat_id, f.name, f.name_es, f.chemical_formula,
    f.hardness_min, f.hardness_max, f.crystal_system, f.mineral_class,
    f.thumbnail_url, f.streak, f.parent_mindat_id, f.is_rock,
    (SELECT count(*) FROM filtered) AS total_count
  FROM filtered f
  ORDER BY 
    CASE WHEN f.thumbnail_url IS NOT NULL THEN 0 ELSE 1 END,
    f.name ASC
  LIMIT page_size
  OFFSET page_offset;
END;
$$;
