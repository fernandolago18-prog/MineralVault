-- Update Biotite's parent to Muscovite (mindat_id: 2815) as requested
UPDATE minerals
SET parent_mindat_id = 2815
WHERE mindat_id = -107; -- Biotite ID
