import { CardHeader, CardTitle } from '@/components/ui/card';
import { SubjectPdfManager } from './SubjectPdfManager';
import { useIsAdmin } from '@/hooks/useUserRole';
import { useTeacherSubjects } from '@/hooks/useTeacherSubjects';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

interface ExamSubject {
  id: string;
  subject_id: string;
  max_marks: number;
  pdf_file_path?: string | null;
  subjects: {
    name: string;
    code: string;
  };
}

interface SubjectPdfUploadManagerProps {
  examName: string;
  examClass: string;
  examSubjects: ExamSubject[];
}

export const SubjectPdfUploadManager = ({
  examName,
  examClass,
  examSubjects
}: SubjectPdfUploadManagerProps) => {
  const isAdmin = useIsAdmin();
  const { data: teacherSubjects, isLoading: loadingTeacherSubjects } = useTeacherSubjects();

  const canEditSubject = (subjectId: string): boolean => {
    if (isAdmin) return true;
    
    if (!teacherSubjects) return false;
    
    return teacherSubjects.some(
      ts => ts.subject_id === subjectId && ts.classes.includes(examClass)
    );
  };

  const visibleSubjects = isAdmin 
    ? examSubjects 
    : examSubjects.filter(es => canEditSubject(es.subject_id));

  if (loadingTeacherSubjects) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (visibleSubjects.length === 0) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          {isAdmin 
            ? 'No subjects added to this exam yet.' 
            : 'You are not assigned to teach any subjects for this exam.'}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <CardHeader className="px-0 pt-0">
        <CardTitle>Subject Exam Papers</CardTitle>
        <p className="text-sm text-muted-foreground">
          {isAdmin 
            ? 'Viewing all subject exam papers. You can upload and manage PDFs for all subjects.' 
            : 'Upload exam papers for subjects you teach.'}
        </p>
      </CardHeader>
      
      <div className="grid gap-4">
        {visibleSubjects.map((examSubject) => (
          <SubjectPdfManager
            key={examSubject.id}
            examSubjectId={examSubject.id}
            subjectName={`${examSubject.subjects.name} (${examSubject.subjects.code})`}
            pdfPath={examSubject.pdf_file_path}
            canEdit={canEditSubject(examSubject.subject_id)}
          />
        ))}
      </div>
    </div>
  );
};
