-- Add unique constraints that are missing
ALTER TABLE public.subjects 
ADD CONSTRAINT subjects_code_unique 
UNIQUE (code);

ALTER TABLE public.teachers 
ADD CONSTRAINT teachers_email_unique 
UNIQUE (email);

-- Add missing triggers for updated_at columns
CREATE TRIGGER update_students_updated_at
    BEFORE UPDATE ON public.students
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_scores_updated_at
    BEFORE UPDATE ON public.scores
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_teacher_auth_updated_at
    BEFORE UPDATE ON public.teacher_auth
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();