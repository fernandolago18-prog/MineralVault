-- Add Mica (Group)
INSERT INTO minerals (
  id, mindat_id, name, name_es, chemical_formula,
  hardness_min, hardness_max, crystal_system, mineral_class,
  streak, is_rock, parent_mindat_id
)
SELECT 
  gen_random_uuid(), -106, 'Mica Group', 'Mica', 'Silicatos hidratados de aluminio',
  2, 3, 'Monoclinic', 'Silicates', 'blanca a incolora', false, null
WHERE NOT EXISTS (
  SELECT 1 FROM minerals WHERE mindat_id = -106
);

-- Add Biotite as a variety of Mica
INSERT INTO minerals (
  id, mindat_id, name, name_es, chemical_formula,
  hardness_min, hardness_max, crystal_system, mineral_class,
  streak, is_rock, parent_mindat_id
)
SELECT 
  gen_random_uuid(), -107, 'Biotite', 'Biotita', 'K(Mg,Fe)3(AlSi3O10)(F,OH)2',
  2.5, 3, 'Monoclinic', 'Silicates', 'blanca a gris', false, -106
WHERE NOT EXISTS (
  SELECT 1 FROM minerals WHERE mindat_id = -107
);
