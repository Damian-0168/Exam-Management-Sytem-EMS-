-- Rename date_of_birth to registration_date in students table
ALTER TABLE public.students 
RENAME COLUMN date_of_birth TO registration_date;

-- Create template_data table for storing template download codes and information
CREATE TABLE public.template_data (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type text NOT NULL, -- e.g., 'student_import', 'exam_template', etc.
  template_code text NOT NULL UNIQUE,
  sample_data jsonb NOT NULL,
  filename text NOT NULL,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on template_data table
ALTER TABLE public.template_data ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (since this is for template data)
CREATE POLICY "Allow all on template_data" 
ON public.template_data 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Insert sample template data for student import
INSERT INTO public.template_data (type, template_code, sample_data, filename, description) VALUES 
('student_import', 'STU_TEMPLATE_001', 
'[
  {
    "name": "John Doe",
    "registrationDate": "2024-01-15",
    "class": "Form 1",
    "section": "A",
    "rollNumber": "001",
    "guardian": "Jane Doe",
    "guardianContact": "+1234567890"
  },
  {
    "name": "Mary Smith",
    "registrationDate": "2024-03-22",
    "class": "Form 1",
    "section": "B",
    "rollNumber": "002",
    "guardian": "John Smith",
    "guardianContact": "+1234567891"
  }
]'::jsonb,
'student_template.xlsx',
'Template for importing student data via Excel');

-- Add trigger for updated_at
CREATE TRIGGER update_template_data_updated_at
    BEFORE UPDATE ON public.template_data
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();