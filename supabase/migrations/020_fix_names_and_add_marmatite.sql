-- Fix Skutterudite Spanish name (was incorrectly stored as Nikelskutterudita)
UPDATE minerals
SET name_es = 'Skutterudita'
WHERE mindat_id = 3682;

-- Fix Orthoclase Spanish name to include "Ortosa" so it's searchable
UPDATE minerals
SET name_es = 'Ortoclasa (Ortosa)'
WHERE mindat_id = 3026;

-- Add Marmatite as a variety of Sphalerite (mindat_id: 3727)
INSERT INTO minerals (
  id, mindat_id, name, name_es, chemical_formula,
  hardness_min, hardness_max, crystal_system, mineral_class,
  streak, is_rock, parent_mindat_id
)
SELECT 
  gen_random_uuid(), -109, 'Marmatite', 'Marmatita', '(Zn,Fe)S',
  3.5, 4, 'Isometric', 'Sulfides', 'parda rojiza', false, 3727
WHERE NOT EXISTS (
  SELECT 1 FROM minerals WHERE mindat_id = -109
);
