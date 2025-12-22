-- Update existing teacher auth records to use simple base64 encoding
UPDATE teacher_auth 
SET password_hash = encode('password123'::bytea, 'base64') 
WHERE username IN ('Dame', 'Julius');