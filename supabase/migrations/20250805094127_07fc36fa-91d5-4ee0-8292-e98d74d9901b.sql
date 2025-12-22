-- Add performance indexes that are missing
CREATE INDEX IF NOT EXISTS idx_students_class_section 
ON public.students (class, section);

CREATE INDEX IF NOT EXISTS idx_scores_student_id 
ON public.scores (student_id);

CREATE INDEX IF NOT EXISTS idx_scores_exam_id 
ON public.scores (exam_id);

CREATE INDEX IF NOT EXISTS idx_scores_subject_id 
ON public.scores (subject_id);

CREATE INDEX IF NOT EXISTS idx_teacher_subjects_teacher_id 
ON public.teacher_subjects (teacher_id);

CREATE INDEX IF NOT EXISTS idx_exam_subjects_exam_id 
ON public.exam_subjects (exam_id);

CREATE INDEX IF NOT EXISTS idx_exams_class_section 
ON public.exams (class, section);

CREATE INDEX IF NOT EXISTS idx_exams_status 
ON public.exams (status);

CREATE INDEX IF NOT EXISTS idx_exams_start_date 
ON public.exams (start_date);