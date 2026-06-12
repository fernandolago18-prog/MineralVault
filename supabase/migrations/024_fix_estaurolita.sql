-- Fix Staurolite Spanish name (was incorrectly stored as Staurolita)
UPDATE minerals
SET name_es = 'Estaurolita'
WHERE mindat_id = 3753;
