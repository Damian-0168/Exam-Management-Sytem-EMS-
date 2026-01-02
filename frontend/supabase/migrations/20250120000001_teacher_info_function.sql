"-- Create function to get teacher information
CREATE OR REPLACE FUNCTION get_teacher_info(_teacher_id UUID)
RETURNS JSON AS $$
DECLARE
  teacher_info JSON;
BEGIN
  SELECT json_build_object(
    'id', auth.users.id,
    'name', COALESCE(auth.users.raw_user_meta_data->>'name', split_part(auth.users.email, '@', 1)),
    'email', auth.users.email
  ) INTO teacher_info
  FROM auth.users
  WHERE auth.users.id = _teacher_id;
  
  RETURN COALESCE(teacher_info, json_build_object('id', _teacher_id, 'name', 'Unknown', 'email', ''));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
"