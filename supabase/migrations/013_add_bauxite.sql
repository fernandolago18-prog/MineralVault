-- Add Bauxite if it doesn't exist
INSERT INTO minerals (
  id, mindat_id, name, name_es, chemical_formula,
  hardness_min, hardness_max, crystal_system, mineral_class,
  streak, is_rock
)
SELECT 
  gen_random_uuid(), 575, 'Bauxite', 'Bauxita', 'Roca sedimentaria (mezcla de óxidos de aluminio)',
  1, 3, 'Amorphous', 'Roca Sedimentaria', 'blanca a rojiza', true
WHERE NOT EXISTS (
  SELECT 1 FROM minerals WHERE name_es ILIKE '%bauxita%' OR mindat_id = 575
);
