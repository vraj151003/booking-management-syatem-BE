-- Fix null role names before running migration
UPDATE role SET name = 'ADMIN' WHERE name IS NULL AND id = 1;
UPDATE role SET name = 'THEATER_OWNER' WHERE name IS NULL AND id = 2;
UPDATE role SET name = 'CUSTOMER' WHERE name IS NULL AND id = 3;
-- If there are any other null roles, set them to DEFAULT
UPDATE role SET name = 'DEFAULT' WHERE name IS NULL;
