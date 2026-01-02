-- First, let's check and fix the password hashing consistency
-- Update existing teacher auth records to use the correct btoa encoding
UPDATE teacher_auth 
SET password_hash = 'cGFzc3dvcmQxMjM=' 
WHERE username = 'Dame';

UPDATE teacher_auth 
SET password_hash = 'cGFzc3dvcmQxMjM=' 
WHERE username = 'Julius';