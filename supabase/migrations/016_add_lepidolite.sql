-- Add Lepidolite (Lepidolita) as it is a series/group discredited by IMA
INSERT INTO minerals (
  id, mindat_id, name, name_es, chemical_formula,
  hardness_min, hardness_max, crystal_system, mineral_class,
  streak, is_rock, parent_mindat_id
)
SELECT 
  gen_random_uuid(), -105, 'Lepidolite', 'Lepidolita', 'K(Li,Al)3(Al,Si,Rb)4O10(F,OH)2',
  2.5, 3, 'Monoclinic', 'Silicates', 'blanca', false, null
WHERE NOT EXISTS (
  SELECT 1 FROM minerals WHERE mindat_id = -105
);
