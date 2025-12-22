-- Add missing foreign key constraints for better data integrity

-- Add foreign key constraints for scores table
ALTER TABLE public.scores 
ADD CONSTRAINT scores_student_id_fkey 
FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;

ALTER TABLE public.scores 
ADD CONSTRAINT scores_exam_id_fkey 
FOREIGN KEY (exam_id) REFERENCES public.exams(id) ON DELETE CASCADE;

ALTER TABLE public.scores 
ADD CONSTRAINT scores_subject_id_fkey 
FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE CASCADE;

ALTER TABLE public.scores 
ADD CONSTRAINT scores_teacher_id_fkey 
FOREIGN KEY (teacher_id) REFERENCES public.teachers(id) ON DELETE SET NULL;

-- Add foreign key constraints for exam_subjects table
ALTER TABLE public.exam_subjects 
ADD CONSTRAINT exam_subjects_exam_id_fkey 
FOREIGN KEY (exam_id) REFERENCES public.exams(id) ON DELETE CASCADE;

ALTER TABLE public.exam_subjects 
ADD CONSTRAINT exam_subjects_subject_id_fkey 
FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE CASCADE;

-- Add foreign key constraints for teacher_subjects table  
ALTER TABLE public.teacher_subjects 
ADD CONSTRAINT teacher_subjects_teacher_id_fkey 
FOREIGN KEY (teacher_id) REFERENCES public.teachers(id) ON DELETE CASCADE;

ALTER TABLE public.teacher_subjects 
ADD CONSTRAINT teacher_subjects_subject_id_fkey 
FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE CASCADE;

-- Add foreign key constraint for teacher_auth table
ALTER TABLE public.teacher_auth 
ADD CONSTRAINT teacher_auth_teacher_id_fkey 
FOREIGN KEY (teacher_id) REFERENCES public.teachers(id) ON DELETE CASCADE;

-- Add foreign key constraint for exams table created_by field
ALTER TABLE public.exams 
ADD CONSTRAINT exams_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES public.teachers(id) ON DELETE SET NULL;

-- Add triggers for updated_at columns
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

-- Add unique constraints to prevent duplicates
ALTER TABLE public.students 
ADD CONSTRAINT students_roll_number_class_section_unique 
UNIQUE (roll_number, class, section);

ALTER TABLE public.subjects 
ADD CONSTRAINT subjects_code_unique 
UNIQUE (code);

ALTER TABLE public.teachers 
ADD CONSTRAINT teachers_email_unique 
UNIQUE (email);

ALTER TABLE public.teacher_auth 
ADD CONSTRAINT teacher_auth_username_unique 
UNIQUE (username);

ALTER TABLE public.teacher_auth 
ADD CONSTRAINT teacher_auth_teacher_id_unique 
UNIQUE (teacher_id);

-- Add constraint to prevent duplicate teacher-subject assignments
ALTER TABLE public.teacher_subjects 
ADD CONSTRAINT teacher_subjects_teacher_subject_unique 
UNIQUE (teacher_id, subject_id);

-- Add constraint to prevent duplicate exam-subject assignments  
ALTER TABLE public.exam_subjects 
ADD CONSTRAINT exam_subjects_exam_subject_unique 
UNIQUE (exam_id, subject_id);

-- Add constraint to prevent duplicate score entries
ALTER TABLE public.scores 
ADD CONSTRAINT scores_student_exam_subject_unique 
UNIQUE (student_id, exam_id, subject_id);