-- Update the password hash to use Base64 encoding to match frontend
-- Password 'password123' encoded with btoa() = 'cGFzc3dvcmQxMjM='
UPDATE teacher_auth 
SET password_hash = 'cGFzc3dvcmQxMjM='
WHERE username = 'dame';